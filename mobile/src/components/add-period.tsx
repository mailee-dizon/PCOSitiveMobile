import { useState } from 'react';
import { View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Sheet } from '@/components/sheet';
import { Banner, Button, Choice, Input, Label } from '@/components/ui';
import { addPeriod } from '@/lib/data';
import type { Flow } from '@/lib/types';

const FLOWS: { value: Flow; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

type AddPeriodProps = { userId: string | null; onClose: () => void; onSaved: () => void };

export function AddPeriodSheet({ visible, ...props }: AddPeriodProps & { visible: boolean }) {
  return (
    <Sheet
      visible={visible}
      onClose={props.onClose}
      title="Add Period"
      subtitle="Log a past or current period">
      {visible ? <AddPeriodForm {...props} /> : null}
    </Sheet>
  );
}

function AddPeriodForm({ userId, onClose, onSaved }: AddPeriodProps) {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!userId) return;
    if (!startDate) {
      setError('Please choose a start date.');
      return;
    }
    if (endDate && endDate < startDate) {
      setError('End date must be after the start date.');
      return;
    }
    setSaving(true);
    try {
      await addPeriod(userId, { startDate, endDate, flow: flow ?? undefined, notes });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add period');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View>
        <Label>Flow</Label>
        <Choice options={FLOWS} value={flow} onChange={setFlow} />
      </View>
      <View>
        <Label>Start Date</Label>
        <DateField value={startDate} onChange={setStartDate} maximumDate={new Date()} />
      </View>
      <View>
        <Label>End Date</Label>
        <DateField value={endDate} onChange={setEndDate} />
      </View>
      <View>
        <Label>Notes</Label>
        <Input value={notes} onChangeText={setNotes} placeholder="Notes..." multiline />
      </View>
      {error ? <Banner kind="error">{error}</Banner> : null}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <Button title="Close" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        <Button title="Add Period" onPress={submit} loading={saving} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
