import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DailyIntakeQuiz } from '@/components/daily-intake-quiz';
import { Screen } from '@/components/screen';
import { Button, Card, Loading } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { fetchExercise, type ExerciseResponse } from '@/lib/server';

const DIFFICULTY: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  'Light exercise': { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#4ade80' },
  'Medium exercise': { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#60a5fa' },
  'Intense exercise': { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', dot: '#fb923c' },
  'Difficult exercise': { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#f87171' },
};

const EXERCISE_EMOJI: Record<string, string> = {
  Yoga: '🧘', Walking: '🚶', Stretching: '🤸', Barre: '🩰',
  'Dance fitness': '💃', Cycling: '🚴', Swimming: '🏊', 'Heavy Yoga': '🧘',
  'Uphill walking': '⛰️', Pilates: '🤸', 'Bodyweight exercises': '💪',
  Running: '🏃', Hiking: '🥾', Kickboxing: '🥊', Zumba: '💃',
  'Weight training': '🏋️', Elliptical: '🔄', Rowing: '🚣',
  HIIT: '⚡', CrossFit: '🏋️', Weightlifting: '🏋️', Sprinting: '🏃',
  'Rock climbing': '🧗',
};

const EXERCISE_DESC: Record<string, string> = {
  Yoga: 'Gentle poses that reduce cortisol — great for PCOS',
  Walking: 'Easy steady-state cardio, improves insulin sensitivity',
  Stretching: 'Relieves muscle tension and eases cramps',
  Barre: "Low-impact toning that's easy on the joints",
  'Dance fitness': 'Fun cardio that lifts your mood naturally',
  Cycling: 'Moderate cardio, joint-friendly and sustainable',
  Swimming: 'Full-body, low-impact, naturally calming',
  'Heavy Yoga': 'Strength-building yoga for a deeper challenge',
  'Uphill walking': 'Extra burn without high-impact stress',
  Pilates: 'Core strength and body awareness',
  'Bodyweight exercises': 'Build strength anywhere, no equipment needed',
  Running: 'High-intensity cardio, boosts endorphins',
  Hiking: 'Outdoor cardio that builds endurance',
  Kickboxing: 'High-energy full-body stress release',
  Zumba: 'Dance cardio — high energy, high fun',
  'Weight training': 'Improves insulin sensitivity and bone density',
  Elliptical: 'Low-impact cardio at your own pace',
  Rowing: 'Full-body cardio and upper-body strength',
  HIIT: 'Short bursts for maximum metabolic benefit',
  CrossFit: 'Varied functional movements for total fitness',
  Weightlifting: 'Build strength and boost metabolism',
  Sprinting: 'Maximum-effort speed work',
  'Rock climbing': 'Full-body strength and problem-solving',
};

type State = { kind: 'loading' } | ExerciseResponse;

export default function ExerciseScreen() {
  const { userId } = useAuth();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [showQuiz, setShowQuiz] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setState({ kind: 'loading' });
    setState(await fetchExercise(userId));
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen title="Today's Exercise">
      <Text style={{ fontSize: 14, color: Colors.textGray, marginTop: -8 }}>
        Personalised for your mood, energy, and PCOS profile.
      </Text>

      {state.kind === 'loading' && <Loading label="Generating your recommendation…" />}

      {state.kind === 'needsIntake' && (
        <Card style={{ alignItems: 'center', padding: 28 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🌸</Text>
          <Text style={styles.title}>Check in first</Text>
          <Text style={styles.body}>
            Complete your daily intake quiz so the model can match today&apos;s exercise to how
            you&apos;re actually feeling right now.
          </Text>
          <Button title="Take the daily quiz" onPress={() => setShowQuiz(true)} />
        </Card>
      )}

      {state.kind === 'error' && (
        <View style={styles.error}>
          <Text style={{ fontSize: 36, marginBottom: 10 }}>⚠️</Text>
          <Text style={{ color: Colors.errorText, fontSize: 14, textAlign: 'center' }}>{state.message}</Text>
          <Button title="Try again" small onPress={load} style={{ marginTop: 16 }} />
        </View>
      )}

      {state.kind === 'result' && (() => {
        const { difficulty, exercises } = state.data;
        const tone = DIFFICULTY[difficulty] ?? DIFFICULTY['Medium exercise'];
        return (
          <>
            <View style={[styles.badge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
              <View style={[styles.badgeDot, { backgroundColor: tone.dot }]} />
              <View>
                <Text style={{ fontSize: 12, color: tone.text, fontWeight: '500' }}>Recommended intensity</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: tone.text }}>{difficulty}</Text>
              </View>
            </View>

            {exercises.map((ex, i) => (
              <Animated.View key={ex} entering={FadeInDown.delay(i * 80)}>
                <Card style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
                  <View style={styles.emoji}>
                    <Text style={{ fontSize: 24 }}>{EXERCISE_EMOJI[ex] ?? '🏃'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary }}>{ex}</Text>
                      <Text style={styles.rank}>#{i + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: Colors.textGray, lineHeight: 19 }}>
                      {EXERCISE_DESC[ex] ?? 'A great choice for your body today.'}
                    </Text>
                  </View>
                </Card>
              </Animated.View>
            ))}

            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ flex: 1, fontSize: 13, color: Colors.textMuted }}>
                These are based on today&apos;s intake. Update your check-in to refresh.
              </Text>
              <Button title="Refresh" small variant="outline" onPress={load} />
            </Card>
          </>
        );
      })()}

      {userId ? (
        <DailyIntakeQuiz
          visible={showQuiz}
          userId={userId}
          onComplete={() => {
            setShowQuiz(false);
            load();
          }}
          onCancel={() => setShowQuiz(false)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  body: { fontSize: 14, color: Colors.textGray, marginBottom: 20, lineHeight: 21, textAlign: 'center' },
  error: {
    alignItems: 'center',
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: 14,
    padding: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  badgeDot: { width: 12, height: 12, borderRadius: 6 },
  emoji: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.rosePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
    backgroundColor: Colors.roseLight,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
});
