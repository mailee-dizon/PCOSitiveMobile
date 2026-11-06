// Symptom logging, viewing and editing — replaces the web SymptomLogger and ShowSymptom.

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Sheet } from '@/components/sheet';
import { Banner, Button, Choice, Input, Label } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { addSymptoms, updateSymptoms } from '@/lib/data';
import type { Intensity, SymptomLog } from '@/lib/types';

export const SYMPTOMS = [
  { name: 'Cramps', icon: '🤕' },
  { name: 'Headache', icon: '😫' },
  { name: 'Bloating', icon: '😣' },
  { name: 'Fatigue', icon: '😴' },
  { name: 'Mood Swings', icon: '🎭' },
  { name: 'Acne', icon: '😔' },
  { name: 'Back Pain', icon: '🤷' },
  { name: 'Breast Tenderness', icon: '💗' },
];

export const SYMPTOM_EMOJI: Record<string, string> = Object.fromEntries(
  SYMPTOMS.map((s) => [s.name.toLowerCase(), s.icon]),
);

const INTENSITIES: { value: Intensity; label: string }[] = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

const INTENSITY_COLOR: Record<Intensity, string> = {
  mild: '#a8e6cf',
  moderate: '#ffd3a8',
  severe: '#f4a0bf',
};

// Create (no `existing`) or edit (with `existing`) a symptom log.
type SymptomFormProps = {
  userId: string | null;
  existing?: SymptomLog | null;
  onClose: () => void;
  onSaved: () => void;
};

export function SymptomFormSheet({ visible, ...props }: SymptomFormProps & { visible: boolean }) {
  return (
    <Sheet
      visible={visible}
      onClose={props.onClose}
      title={props.existing ? 'Edit Symptom' : 'Log Symptoms'}
      subtitle={props.existing ? undefined : "Select what you're experiencing today"}>
      {/* Mounted per opening so the form starts fresh each time. */}
      {visible ? <SymptomForm {...props} /> : null}
    </Sheet>
  );
}

function SymptomForm({ userId, existing, onClose, onSaved }: SymptomFormProps) {
  const [selected, setSelected] = useState<string[]>(existing?.symptoms ?? []);
  const [intensity, setIntensity] = useState<Intensity>(existing?.intensity ?? 'moderate');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (name: string) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  const submit = async () => {
    if (selected.length === 0) {
      setError('Must select at least one symptom.');
      return;
    }
    setSaving(true);
    try {
      const log = { symptoms: selected, intensity, notes };
      if (existing?.id) await updateSymptoms(existing.id, log);
      else if (userId) await addSymptoms(userId, log);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save symptoms');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: 18 }}>
      <View>
        <Label>Select Symptoms</Label>
        <View style={styles.grid}>
          {SYMPTOMS.map((s) => {
            const key = s.name.toLowerCase();
            return (
              <View key={key} style={{ width: '48%' }}>
                <Choice
                  options={[{ value: key, label: s.name, icon: s.icon }]}
                  value={selected.includes(key) ? key : null}
                  onChange={toggle}
                />
              </View>
            );
          })}
        </View>
      </View>

      <View>
        <Label>Intensity</Label>
        <Choice options={INTENSITIES} value={intensity} onChange={setIntensity} />
      </View>

      <View>
        <Label>Notes</Label>
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any additional notes..."
          multiline
        />
      </View>

      {error ? <Banner kind="error">{error}</Banner> : null}

      <View style={styles.buttons}>
        <Button title="Close" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        <Button
          title={existing ? 'Save Changes' : 'Log Symptoms'}
          onPress={submit}
          loading={saving}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

export function SymptomDetailSheet({
  log,
  onClose,
}: {
  log: SymptomLog | null;
  onClose: () => void;
}) {
  return (
    <Sheet
      visible={Boolean(log)}
      onClose={onClose}
      title="Symptoms"
      subtitle={
        log
          ? new Date(log.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })
          : undefined
      }>
      {log ? (
        <View style={{ gap: 18 }}>
          <View>
            <Label>Symptoms</Label>
            <View style={styles.pills}>
              {log.symptoms.map((s) => (
                <Text key={s} style={styles.pill}>
                  {SYMPTOM_EMOJI[s] ?? ''} {s}
                </Text>
              ))}
            </View>
          </View>
          <View>
            <Label>Intensity</Label>
            <Text
              style={[
                styles.pill,
                {
                  alignSelf: 'flex-start',
                  backgroundColor: INTENSITY_COLOR[log.intensity] ?? Colors.rosePale,
                  color: Colors.textPrimary,
                  borderWidth: 0,
                },
              ]}>
              {log.intensity}
            </Text>
          </View>
          {log.notes ? (
            <View>
              <Label>Notes</Label>
              <Text style={{ fontSize: 14, color: Colors.textGray, lineHeight: 21 }}>
                {log.notes}
              </Text>
            </View>
          ) : null}
          <Button title="Close" variant="outline" onPress={onClose} />
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  buttons: { flexDirection: 'row', gap: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 13,
    fontWeight: '500',
    overflow: 'hidden',
    backgroundColor: Colors.rosePale,
    borderWidth: 1,
    borderColor: Colors.roseLight,
    color: Colors.darkRose,
    textTransform: 'capitalize',
  },
});
