import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Input } from '@/components/ui';
import { Colors, Radius } from '@/constants/theme';
import { parseDateOnly, toDateOnly } from '@/lib/date';

// Date input that stores its value as "YYYY-MM-DD", like <input type="date">.
export function DateField({
  value,
  onChange,
  placeholder = 'Select a date',
  maximumDate,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maximumDate?: Date;
}) {
  const [open, setOpen] = useState(false);

  // The native picker isn't available on web; fall back to a typed date.
  if (Platform.OS === 'web') {
    return <Input value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" />;
  }

  const date = value ? parseDateOnly(value) : new Date();

  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={[styles.field, open && { borderColor: Colors.rose }]}
        accessibilityRole="button">
        <Text style={{ color: value ? Colors.textPrimary : Colors.textMuted, fontSize: 15 }}>
          {value
            ? date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : placeholder}
        </Text>
        <FontAwesome name="calendar" size={14} color={Colors.textMuted} />
      </Pressable>
      {open && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={maximumDate}
          accentColor={Colors.darkRose}
          themeVariant="light"
          onChange={(event, selected) => {
            setOpen(false);
            if (event.type === 'set' && selected) onChange(toDateOnly(selected));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.roseLight,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
});
