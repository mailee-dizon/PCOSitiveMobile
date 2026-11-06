import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RoamingChloe } from '@/components/roaming-chloe';
import { Screen } from '@/components/screen';
import { Button, Card, Loading } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { fetchPredictions, fetchSymptoms } from '@/lib/data';
import { MS_PER_DAY, parseDateOnly } from '@/lib/date';
import type { PeriodPredictions, SymptomLog } from '@/lib/types';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EDUCATION_LINKS = [
  { title: 'Understanding PCOS', sub: 'Symptoms and management', section: 'what-is-pcos' },
  { title: 'Nutrition guide', sub: 'PCOS-friendly diet tips', section: 'management' },
  { title: 'Exercise tips', sub: 'Workouts for PCOS', section: 'management' },
  { title: 'Stress and hormones', sub: 'Managing cortisol levels', section: 'management' },
];

function getCyclePhase(cycleDay: number): string {
  if (cycleDay <= 5) return 'Menstrual phase';
  if (cycleDay <= 13) return 'Follicular phase';
  if (cycleDay <= 16) return 'Ovulation phase';
  return 'Luteal phase';
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / MS_PER_DAY);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export default function DashboardScreen() {
  const { userId } = useAuth();
  const [periodData, setPeriodData] = useState<PeriodPredictions | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [predictions, recent] = await Promise.all([
        fetchPredictions(userId),
        fetchSymptoms(userId, 3),
      ]);
      setPeriodData(predictions);
      setSymptoms(recent);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Reload whenever the tab comes into view (e.g. after Chloe logs something).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) return <Loading />;

  const today = new Date();
  const currentDay = today.getDay();
  const avgCycleLength = periodData?.avgCycleLength ?? 28;
  const nextPeriod =
    periodData?.predictions.find((p) => parseDateOnly(p.start_date) > today) ?? null;
  const nextStart = nextPeriod ? parseDateOnly(nextPeriod.start_date) : null;
  const daysUntilNext = nextStart
    ? Math.ceil((nextStart.getTime() - today.getTime()) / MS_PER_DAY)
    : null;

  let cycleDay = 1;
  let phaseName = 'Follicular phase';
  let phaseNote = '';
  if (nextStart) {
    const lastStart = new Date(nextStart.getTime() - avgCycleLength * MS_PER_DAY);
    cycleDay = Math.floor((today.getTime() - lastStart.getTime()) / MS_PER_DAY) + 1;
    cycleDay = Math.max(1, Math.min(cycleDay, avgCycleLength));
    phaseName = getCyclePhase(cycleDay);
    if (phaseName === 'Ovulation phase') phaseNote = 'Ovulation window';
    else if (phaseName === 'Follicular phase') {
      const d = 14 - cycleDay;
      phaseNote = d > 0 ? `Ovulation expected in ~${d} days` : 'Approaching ovulation';
    } else if (daysUntilNext !== null) {
      phaseNote = `Period expected in ~${daysUntilNext} day${daysUntilNext !== 1 ? 's' : ''}`;
    }
  }
  const phaseProgress = (cycleDay / avgCycleLength) * 100;
  const latestSymptoms = symptoms[0]?.symptoms ?? [];

  const isInAnyPeriod = (date: Date) =>
    periodData?.predictions.some(
      (p) => date >= parseDateOnly(p.start_date) && date <= parseDateOnly(p.end_date),
    ) ?? false;

  return (
    <View style={{ flex: 1 }}>
      <Screen
        title="Dashboard"
        aside={today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await load();
          setRefreshing(false);
        }}>
        {/* Stats */}
        <View style={styles.statGrid}>
          <Stat
            label="Next period"
            value={daysUntilNext !== null ? `${daysUntilNext} days` : '—'}
            accent
            pill={nextStart ? `Est. ${nextStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : undefined}
            pillAccent
          />
          <Stat label="Cycle length" value={`${avgCycleLength} days`} pill="avg · based on data" />
          <Stat label="Mood today" value="😊 Good" pill="not tracked" small />
          <Stat
            label="Active symptoms"
            value={String(latestSymptoms.length)}
            accent
            pill={latestSymptoms.length > 0 ? latestSymptoms.slice(0, 2).join(' · ') : 'none logged today'}
            pillAccent={latestSymptoms.length > 0}
          />
        </View>

        {/* Weekly view */}
        <Card>
          <Text style={styles.cardTitle}>Weekly view</Text>
          <View style={styles.weekRow}>
            {WEEK_DAYS.map((day, index) => {
              const cellDate = new Date(today);
              cellDate.setDate(today.getDate() - currentDay + index);
              const isToday = index === currentDay;
              const isPeriod = !isToday && isInAnyPeriod(cellDate);
              return (
                <View key={day} style={{ alignItems: 'center', gap: 5 }}>
                  <Text style={{ fontSize: 10, color: Colors.textMuted }}>{day}</Text>
                  <View
                    style={[
                      styles.dayDot,
                      isToday && { backgroundColor: Colors.rose },
                      isPeriod && { backgroundColor: Colors.roseLight },
                    ]}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '500',
                        color: isToday ? Colors.white : isPeriod ? Colors.deepRose : Colors.textGray,
                      }}>
                      {cellDate.getDate()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          <Text style={styles.link} onPress={() => router.navigate('/symptom-log')}>
            View full calendar
          </Text>
          <View style={styles.phaseBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: Colors.deepRose }}>{phaseName}</Text>
              <Text style={{ fontSize: 11, color: Colors.darkRose }}>
                Day {cycleDay} of {avgCycleLength}
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.bar, { width: `${phaseProgress}%` }]} />
            </View>
            {phaseNote ? (
              <Text style={{ fontSize: 10, color: Colors.darkRose, marginTop: 5 }}>{phaseNote}</Text>
            ) : null}
          </View>
        </Card>

        {/* Education */}
        <Card>
          <Text style={styles.cardTitle}>Education</Text>
          <View style={{ gap: 8 }}>
            {EDUCATION_LINKS.map((item) => (
              <Pressable
                key={item.title}
                onPress={() => router.navigate({ pathname: '/education', params: { section: item.section } })}
                style={({ pressed }) => [
                  styles.eduItem,
                  pressed && { backgroundColor: Colors.roseLight, borderColor: Colors.darkRose },
                ]}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.textPrimary }}>{item.title}</Text>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>{item.sub}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Chloe */}
        <Card style={{ marginBottom: 80 }}>
          <Text style={styles.cardTitle}>Chat with Chloe</Text>
          <View style={styles.chloeBubble}>
            <Text style={{ fontSize: 13, color: Colors.textGray, lineHeight: 19 }}>
              Tell me your symptoms and I&apos;ll give you personalised tips and recommendations.
            </Text>
          </View>
          <Button title="Start chat" onPress={() => router.navigate('/chloe')} />

          <View style={styles.activity}>
            <Text style={{ fontSize: 11, color: Colors.textMuted, marginBottom: 8 }}>Recent activity</Text>
            {symptoms.length === 0 ? (
              <Text style={{ fontSize: 12, color: Colors.textMuted }}>No recent activity</Text>
            ) : (
              symptoms.map((log) => (
                <View key={log.id} style={styles.activityRow}>
                  <View style={styles.activityDot} />
                  <View>
                    <Text style={{ fontSize: 13, color: Colors.textPrimary }}>
                      Logged {log.symptoms.length} symptom{log.symptoms.length !== 1 ? 's' : ''}
                    </Text>
                    <Text style={{ fontSize: 11, color: Colors.textMuted }}>
                      {getRelativeTime(log.created_at)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </Card>
      </Screen>
      <RoamingChloe />
    </View>
  );
}

function Stat({
  label,
  value,
  pill,
  accent,
  pillAccent,
  small,
}: {
  label: string;
  value: string;
  pill?: string;
  accent?: boolean;
  pillAccent?: boolean;
  small?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={{ fontSize: 11, color: Colors.textMuted, marginBottom: 7 }}>{label}</Text>
      <Text
        style={{
          fontSize: small ? 18 : 21,
          fontWeight: '500',
          color: accent ? Colors.darkRose : Colors.textPrimary,
        }}>
        {value}
      </Text>
      {pill ? (
        <Text
          numberOfLines={1}
          style={[
            styles.pill,
            pillAccent
              ? { backgroundColor: Colors.rosePale, color: Colors.darkRose }
              : { backgroundColor: Colors.stone, color: Colors.textGray },
          ]}>
          {pill}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.roseLight,
    borderRadius: 14,
    padding: 14,
  },
  pill: {
    alignSelf: 'flex-start',
    marginTop: 7,
    fontSize: 11,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dayDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  link: { textAlign: 'center', fontSize: 12, color: Colors.darkRose, marginTop: 4, padding: 4 },
  phaseBox: { marginTop: 12, backgroundColor: Colors.rosePale, borderRadius: 10, padding: 12 },
  track: { height: 4, backgroundColor: Colors.roseLight, borderRadius: 4 },
  bar: { height: 4, backgroundColor: Colors.rose, borderRadius: 4 },
  eduItem: { padding: 12, borderWidth: 1, borderColor: Colors.roseLight, borderRadius: 10 },
  chloeBubble: {
    backgroundColor: Colors.pageBg,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  activity: { marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: Colors.roseLight },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7 },
  activityDot: { width: 7, height: 7, borderRadius: 4, marginTop: 5, backgroundColor: Colors.rose },
});
