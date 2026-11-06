import { FontAwesome } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Card } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { fetchPeriods, fetchPredictions, fetchSymptoms } from '@/lib/data';
import { parseDateOnly } from '@/lib/date';
import type { PeriodPredictions, PeriodRow, SymptomLog } from '@/lib/types';

const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export default function ProfileScreen() {
  const { userId, email, session, signOut } = useAuth();
  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [predictions, setPredictions] = useState<PeriodPredictions | null>(null);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      Promise.all([fetchPeriods(userId), fetchPredictions(userId), fetchSymptoms(userId, 3)])
        .then(([p, pred, s]) => {
          setPeriods(p);
          setPredictions(pred);
          setSymptoms(s);
        })
        .catch((err) => console.error('Error loading profile data:', err));
    }, [userId]),
  );

  const userName = email?.split('@')[0] ?? '';
  const joined = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const lastPeriod = periods
    .map((p) => p.start_date)
    .sort()
    .at(-1);
  const today = new Date();
  const nextPeriod = predictions?.predictions.find((p) => parseDateOnly(p.start_date) > today);

  const health = [
    { label: 'Last Period', value: lastPeriod ? fmt(parseDateOnly(lastPeriod)) : '—' },
    { label: 'Cycle Length', value: predictions ? `${predictions.avgCycleLength} Days` : '—' },
    { label: 'Next Period', value: nextPeriod ? fmt(parseDateOnly(nextPeriod.start_date)) : '—' },
  ];

  return (
    <Screen title="Profile">
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={styles.banner} />
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <FontAwesome name="user" size={40} color={Colors.rose} />
          </View>
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 4 }}>
          <Text style={styles.name}>{userName}</Text>
          <Text style={{ color: Colors.textGray }}>{email}</Text>
          <Button
            title="Edit Profile"
            small
            icon="pencil"
            onPress={() => router.navigate('/settings')}
            style={{ alignSelf: 'flex-start', marginTop: 10 }}
          />
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        {joined ? <InfoRow icon="calendar" text={`Joined ${joined}`} /> : null}
        <InfoRow icon="envelope" text={email ?? ''} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Health Information</Text>
        <View style={{ gap: 10, marginTop: 12 }}>
          {health.map((item) => (
            <View key={item.label} style={styles.healthItem}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.textGray }}>{item.label}</Text>
              <Text style={{ fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 }}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {symptoms.length === 0 ? (
          <Text style={{ color: Colors.textMuted, marginTop: 10 }}>No recent activity</Text>
        ) : (
          symptoms.map((log, i) => (
            <View key={log.id ?? i} style={[styles.activityRow, i < symptoms.length - 1 && styles.divider]}>
              <Text style={{ color: Colors.textPrimary, flex: 1 }}>
                Logged {log.symptoms.join(', ')}
              </Text>
              <Text style={{ fontSize: 13, color: Colors.textGray }}>
                {new Date(log.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Button title="Log out" variant="outline" icon="sign-out" onPress={signOut} />
    </Screen>
  );
}

function InfoRow({ icon, text }: { icon: 'calendar' | 'envelope'; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <FontAwesome name={icon} size={15} color={Colors.rose} />
      <Text style={{ color: Colors.textGray }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 96,
    experimental_backgroundImage: `linear-gradient(to right, ${Colors.rose}, ${Colors.darkRose})`,
  },
  avatarWrap: { marginTop: -48, marginLeft: 20, marginBottom: 10 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: Colors.white,
    backgroundColor: Colors.rosePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  healthItem: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.roseLight,
    backgroundColor: Colors.rosePale,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: Colors.roseLight },
});
