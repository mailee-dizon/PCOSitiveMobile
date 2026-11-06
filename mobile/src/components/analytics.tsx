import { FontAwesome } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SymptomFormSheet } from '@/components/symptoms';
import { Card } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { MS_PER_DAY } from '@/lib/date';
import { deleteSymptoms } from '@/lib/data';
import type { PeriodLog, SymptomLog } from '@/lib/types';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Analytics({
  periodLogs,
  symptomLogs,
  onDeleted,
  onRefreshSymptoms,
}: {
  periodLogs: PeriodLog[];
  symptomLogs: SymptomLog[];
  onDeleted: (id: number) => void;
  onRefreshSymptoms: () => void;
}) {
  const [editing, setEditing] = useState<SymptomLog | null>(null);

  const stats = useMemo(() => {
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const recentLogs = periodLogs
      .filter((l) => l.startDate >= since)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    const recentSymptoms = symptomLogs.filter((l) => new Date(l.created_at) >= since);

    let totalDays = 0;
    for (let i = 1; i < recentLogs.length; i++) {
      totalDays += Math.round(
        (recentLogs[i].startDate.getTime() - recentLogs[i - 1].startDate.getTime()) / MS_PER_DAY,
      );
    }
    const averageCycle = recentLogs.length > 1 ? Math.round(totalDays / (recentLogs.length - 1)) : 0;

    const averagePeriodLength =
      recentLogs.length > 0
        ? Math.round(
            recentLogs.reduce(
              (sum, l) =>
                sum + Math.round((l.endDate.getTime() - l.startDate.getTime()) / MS_PER_DAY) + 1,
              0,
            ) / recentLogs.length,
          )
        : 0;

    const symptomCounts: Record<string, number> = {};
    recentSymptoms.forEach((l) => l.symptoms?.forEach((s) => (symptomCounts[s] = (symptomCounts[s] || 0) + 1)));
    const topSymptoms = Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => capitalize(name));

    const flowDistribution: Record<string, number> = {};
    recentLogs.forEach((l) => {
      if (l.flow) flowDistribution[l.flow] = (flowDistribution[l.flow] || 0) + 1;
    });

    return { averageCycle, averagePeriodLength, topSymptoms, flowDistribution };
  }, [periodLogs, symptomLogs]);

  const sorted = [...symptomLogs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const confirmDelete = (log: SymptomLog) => {
    if (!log.id) return;
    const id = log.id;
    Alert.alert('Delete symptom log?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSymptoms(id);
            onDeleted(id);
          } catch (err) {
            console.error('Error deleting symptom:', err);
          }
        },
      },
    ]);
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 12 }}>
      <View style={styles.grid}>
        <Stat label="Average Cycle Length" value={`${stats.averageCycle} days`} />
        <Stat label="Average Period Length" value={`${stats.averagePeriodLength} days`} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Most Common Symptoms</Text>
          {stats.topSymptoms.length === 0 ? <Text style={styles.statItem}>—</Text> : null}
          {stats.topSymptoms.map((s) => (
            <View key={s} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.statItem}>{s}</Text>
            </View>
          ))}
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Flow Distribution</Text>
          {Object.keys(stats.flowDistribution).length === 0 ? (
            <Text style={styles.statItem}>—</Text>
          ) : null}
          {Object.entries(stats.flowDistribution).map(([flow, count]) => (
            <View key={flow} style={styles.flowRow}>
              <Text style={styles.statItem}>{capitalize(flow)}</Text>
              <Text style={[styles.statItem, { color: Colors.darkRose, fontWeight: '600' }]}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={styles.tableHeader}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.textPrimary }}>Past Symptoms</Text>
        </View>
        {sorted.length === 0 ? (
          <Text style={[styles.statItem, { padding: 16, color: Colors.textMuted }]}>
            No symptoms logged yet.
          </Text>
        ) : null}
        {sorted.map((log, i) => (
          <View
            key={log.id ?? i}
            style={[styles.row, i < sorted.length - 1 && { borderBottomWidth: 1 }]}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.rowTitle}>{log.symptoms.map(capitalize).join(', ')}</Text>
              <Text style={styles.rowSub}>
                {capitalize(log.intensity)} · {new Date(log.created_at).toLocaleDateString()}
              </Text>
              {log.notes ? (
                <Text style={styles.rowSub}>
                  <Text style={{ fontWeight: '600' }}>Notes: </Text>
                  {log.notes}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={() => setEditing(log)} hitSlop={8} style={styles.iconButton} accessibilityLabel="Edit">
              <FontAwesome name="pencil" size={17} color={Colors.textGray} />
            </Pressable>
            <Pressable onPress={() => confirmDelete(log)} hitSlop={8} style={styles.iconButton} accessibilityLabel="Delete">
              <FontAwesome name="trash" size={17} color={Colors.textGray} />
            </Pressable>
          </View>
        ))}
      </Card>

      <SymptomFormSheet
        visible={Boolean(editing)}
        userId={null}
        existing={editing}
        onClose={() => setEditing(null)}
        onSaved={onRefreshSymptoms}
      />
    </Animated.View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.rosePale,
    borderWidth: 1,
    borderColor: Colors.roseLight,
    gap: 4,
  },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: '500', color: Colors.darkRose },
  statItem: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.rose },
  flowRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tableHeader: {
    padding: 14,
    backgroundColor: Colors.rosePale,
    borderBottomWidth: 1,
    borderBottomColor: Colors.roseLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomColor: Colors.roseLight,
  },
  rowTitle: { fontSize: 14, color: Colors.textPrimary },
  rowSub: { fontSize: 12, color: Colors.textGray },
  iconButton: { padding: 8 },
});
