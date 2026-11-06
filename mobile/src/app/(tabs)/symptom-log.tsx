import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Analytics } from '@/components/analytics';
import { Calendar } from '@/components/calendar';
import { Screen } from '@/components/screen';
import { Choice, Loading } from '@/components/ui';
import { useAuth } from '@/context/auth';
import { fetchPeriods, fetchPredictions, fetchSymptoms } from '@/lib/data';
import { parseDateOnly } from '@/lib/date';
import type { PeriodLog, PeriodRange, SymptomLog } from '@/lib/types';

type Tab = 'calendar' | 'stats';

export default function SymptomLogScreen() {
  const { userId } = useAuth();
  const [tab, setTab] = useState<Tab>('calendar');
  const [loading, setLoading] = useState(true);
  const [periodRanges, setPeriodRanges] = useState<PeriodRange[]>([]);
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);

  const loadPeriods = useCallback(async () => {
    if (!userId) return;
    try {
      const [past, future] = await Promise.all([fetchPeriods(userId), fetchPredictions(userId)]);
      const pastLogs: PeriodLog[] = past.map((p) => ({
        startDate: parseDateOnly(p.start_date),
        endDate: parseDateOnly(p.end_date ?? p.start_date),
        flow: p.flow,
        notes: p.notes,
      }));
      const futureRanges: PeriodRange[] = (future?.predictions ?? []).map((p) => ({
        startDate: parseDateOnly(p.start_date),
        endDate: parseDateOnly(p.end_date),
        type: 'future',
      }));
      setPeriodLogs(pastLogs);
      setPeriodRanges([
        ...pastLogs.map((l): PeriodRange => ({ startDate: l.startDate, endDate: l.endDate, type: 'past' })),
        ...futureRanges,
      ]);
    } catch (err) {
      console.error('Error fetching periods:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadSymptoms = useCallback(async () => {
    if (!userId) return;
    try {
      setSymptomLogs(await fetchSymptoms(userId, 200));
    } catch (err) {
      console.error('Error fetching symptoms:', err);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadPeriods();
      loadSymptoms();
    }, [loadPeriods, loadSymptoms]),
  );

  if (loading) return <Loading />;

  return (
    <Screen
      title="Period Tracker"
      aside={
        <View style={{ minWidth: 200 }}>
          <Choice
            options={[
              { value: 'calendar', label: '📅  Calendar' },
              { value: 'stats', label: '📈  Stats' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>
      }>
      {tab === 'calendar' ? (
        <Calendar
          userId={userId}
          periodRanges={periodRanges}
          symptomLog={symptomLogs}
          onRefreshPeriods={loadPeriods}
          onRefreshSymptoms={loadSymptoms}
        />
      ) : (
        <Analytics
          periodLogs={periodLogs}
          symptomLogs={symptomLogs}
          onDeleted={(id) => setSymptomLogs((prev) => prev.filter((s) => s.id !== id))}
          onRefreshSymptoms={loadSymptoms}
        />
      )}
    </Screen>
  );
}
