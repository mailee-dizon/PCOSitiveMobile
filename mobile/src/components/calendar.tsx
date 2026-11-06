import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AddPeriodSheet } from '@/components/add-period';
import { SYMPTOM_EMOJI, SymptomDetailSheet, SymptomFormSheet } from '@/components/symptoms';
import { Button, Card, Heading } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { isSameDay } from '@/lib/date';
import type { PeriodRange, SymptomLog } from '@/lib/types';

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function Calendar({
  userId,
  periodRanges,
  symptomLog,
  onRefreshPeriods,
  onRefreshSymptoms,
}: {
  userId: string | null;
  periodRanges: PeriodRange[];
  symptomLog: SymptomLog[];
  onRefreshPeriods: () => void;
  onRefreshSymptoms: () => void;
}) {
  const [addPeriodOpen, setAddPeriodOpen] = useState(false);
  const [addSymptomOpen, setAddSymptomOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SymptomLog | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const startWeekDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startWeekDay + daysInMonth) / 7) * 7;

  const forwardLimit = new Date();
  forwardLimit.setMonth(forwardLimit.getMonth() + 5);
  const canGoForward = new Date(year, month + 1, 1) <= forwardLimit;

  const today = new Date();
  const cells: Date[] = Array.from(
    { length: totalCells },
    (_, i) => new Date(year, month, i - startWeekDay + 1),
  );
  const weeks = Array.from({ length: totalCells / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <Animated.View entering={FadeInDown.duration(300)}>
      <Card style={{ padding: 14 }}>
        <View style={{ alignItems: 'center', paddingBottom: 8 }}>
          <Heading size={26}>Calendar</Heading>
        </View>

        {/* Month navigation */}
        <View style={styles.monthNav}>
          <Pressable
            onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}
            hitSlop={10}
            style={styles.navButton}
            accessibilityLabel="Previous month">
            <FontAwesome name="arrow-left" size={14} color={Colors.textGray} />
          </Pressable>
          <Text style={styles.monthLabel}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable
            onPress={() => canGoForward && setCurrentMonth(new Date(year, month + 1, 1))}
            hitSlop={10}
            style={styles.navButton}
            accessibilityLabel="Next month">
            <FontAwesome
              name="arrow-right"
              size={14}
              color={canGoForward ? Colors.textGray : Colors.roseLight}
            />
          </Pressable>
        </View>

        {/* Legend + actions */}
        <View style={styles.toolbar}>
          <View style={{ gap: 4, marginRight: 'auto' }}>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: Colors.periodFuture }]} />
              <Text style={styles.legendText}>Predicted</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: Colors.periodPast }]} />
              <Text style={styles.legendText}>Period</Text>
            </View>
          </View>
          <Button small title="+ Symptom" onPress={() => setAddSymptomOpen(true)} />
          <Button small title="+ Period" onPress={() => setAddPeriodOpen(true)} />
        </View>

        {/* Day headers */}
        <View style={styles.week}>
          {DAYS_SHORT.map((d, i) => (
            <Text key={i} style={styles.dayHeader}>
              {d}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={{ gap: 4 }}>
          {weeks.map((week, w) => (
            <View key={w} style={styles.week}>
              {week.map((date) => {
                const isToday = isSameDay(date, today);
                const isCurrentMonth = date.getMonth() === month;
                const period = periodRanges.find((r) => date >= r.startDate && date <= r.endDate);
                const logsForDay = symptomLog.filter((log) =>
                  isSameDay(new Date(log.created_at), date),
                );
                const emojis = Array.from(new Set(logsForDay.flatMap((l) => l.symptoms))).map(
                  (s) => SYMPTOM_EMOJI[s] ?? '❓',
                );

                let bg: string = Colors.white;
                let border: string = Colors.roseLight;
                let numColor: string = isCurrentMonth ? Colors.textPrimary : Colors.textMuted;
                if (period?.type === 'past') {
                  bg = Colors.periodPast;
                  border = Colors.periodPast;
                  numColor = Colors.white;
                } else if (period?.type === 'future') {
                  bg = Colors.periodFuture;
                  border = Colors.periodFuture;
                }
                // Today gets a ring rather than hiding the period color.
                if (isToday) {
                  border = Colors.darkRose;
                  if (!period) {
                    bg = Colors.rose;
                    numColor = Colors.white;
                  }
                }

                return (
                  <Pressable
                    key={date.toISOString()}
                    disabled={logsForDay.length === 0}
                    onPress={() => setSelectedLog(logsForDay[0])}
                    accessibilityLabel={`${date.toDateString()}${
                      logsForDay.length ? `, symptoms: ${logsForDay[0].symptoms.join(', ')}` : ''
                    }`}
                    style={[
                      styles.cell,
                      { backgroundColor: bg, borderColor: border, borderWidth: isToday ? 2 : 1 },
                    ]}>
                    <Text style={[styles.cellNum, { color: numColor }]}>{date.getDate()}</Text>
                    {emojis.length > 0 ? (
                      <Text style={styles.cellEmoji} numberOfLines={1}>
                        {emojis.slice(0, 3).join('')}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </Card>

      <SymptomFormSheet
        visible={addSymptomOpen}
        userId={userId}
        onClose={() => setAddSymptomOpen(false)}
        onSaved={onRefreshSymptoms}
      />
      <AddPeriodSheet
        visible={addPeriodOpen}
        userId={userId}
        onClose={() => setAddPeriodOpen(false)}
        onSaved={onRefreshPeriods}
      />
      <SymptomDetailSheet log={selectedLog} onClose={() => setSelectedLog(null)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  navButton: { padding: 8, borderRadius: 8 },
  monthLabel: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, minWidth: 140, textAlign: 'center' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 11, color: Colors.textPrimary },
  week: { flexDirection: 'row', gap: 4 },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textGray,
    paddingVertical: 4,
    marginBottom: 4,
  },
  cell: { flex: 1, height: 56, borderRadius: 8, padding: 4, justifyContent: 'space-between' },
  cellNum: { fontSize: 12, fontWeight: '500' },
  cellEmoji: { fontSize: 10, textAlign: 'center' },
});
