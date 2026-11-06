import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/sheet';
import { Banner, Button, Choice, Label, ToggleRow } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { submitIntake } from '@/lib/data';

const MOOD = [
  { value: 1, label: 'Very Stressed / Sad' },
  { value: 2, label: 'Stressed / Low' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Very Good' },
];
const MOTIVATION = [
  { value: 1, label: 'Very Demotivated' },
  { value: 2, label: 'Demotivated' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Motivated' },
  { value: 5, label: 'Very Motivated' },
];
const PAIN = [
  { value: 1, label: '1 (None)' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5 (Severe)' },
];
// The model server expects these exact strings.
const LIFESTYLE = ['Sedentary', 'Less Active', 'Moderately Active', 'Very Active'].map((v) => ({
  value: v,
  label: v,
}));

type QuizProps = { userId: string; onComplete: () => void; onCancel: () => void };

export function DailyIntakeQuiz({ visible, ...props }: QuizProps & { visible: boolean }) {
  return (
    <Sheet visible={visible} onClose={props.onCancel}>
      {visible ? <QuizForm {...props} /> : null}
    </Sheet>
  );
}

function QuizForm({ userId, onComplete, onCancel }: QuizProps) {
  const [mood, setMood] = useState<number | null>(null);
  const [motivation, setMotivation] = useState<number | null>(null);
  const [periodPain, setPeriodPain] = useState<number | null>(null);
  const [lifestyle, setLifestyle] = useState<string | null>(null);
  const [medication, setMedication] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filled = [mood, motivation, periodPain, lifestyle].filter((v) => v !== null).length;
  const progress = Math.max(8, Math.round((filled / 4) * 100));

  const submit = async () => {
    if (!mood || !motivation || !periodPain || !lifestyle) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitIntake(userId, {
        mood,
        motivation,
        period_pain: periodPain,
        lifestyle,
        medication,
      });
      onComplete();
    } catch (err) {
      setError(
        'Unable to save your responses. Please try again.' +
          (err instanceof Error ? ' ' + err.message : ''),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={{ marginBottom: 18 }}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Daily Intake</Text>
          <Text style={styles.sub}>Quick check — 1 min</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.bar, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={{ gap: 16 }}>
        {error ? <Banner kind="error">{error}</Banner> : null}
        <View>
          <Label>Mood</Label>
          <Choice options={MOOD} value={mood} onChange={setMood} />
        </View>
        <View>
          <Label>Motivation</Label>
          <Choice options={MOTIVATION} value={motivation} onChange={setMotivation} />
        </View>
        <View>
          <Label>Period Pain</Label>
          <Choice options={PAIN} value={periodPain} onChange={setPeriodPain} />
        </View>
        <View>
          <Label>Lifestyle</Label>
          <Choice options={LIFESTYLE} value={lifestyle} onChange={setLifestyle} columns={2} />
        </View>
        <ToggleRow
          label="Medication"
          description="Taking medication for PCOS today"
          value={medication}
          onChange={setMedication}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="Cancel" variant="outline" onPress={onCancel} style={{ flex: 1 }} />
          <Button title="Submit" onPress={submit} loading={loading} style={{ flex: 1 }} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textMuted },
  track: { height: 4, borderRadius: 4, backgroundColor: Colors.roseLight, overflow: 'hidden' },
  bar: { height: 4, borderRadius: 4, backgroundColor: Colors.rose },
});
