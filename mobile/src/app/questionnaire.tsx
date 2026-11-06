import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateField } from '@/components/date-field';
import { Banner, Button, Choice, Input, Label, ToggleRow, type IconName } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { addPeriod, saveProfile } from '@/lib/data';
import { parseDateOnly, toDateOnly } from '@/lib/date';
import type { Lifestyle } from '@/lib/types';

const STEPS = 7;

const LIFESTYLES: { value: Lifestyle; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise, desk job' },
  { value: 'less_active', label: 'Less Active', description: 'Light exercise 1-3 days/week' },
  { value: 'active', label: 'Active', description: 'Moderate exercise 3-5 days/week' },
  { value: 'very_active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
];

export default function QuestionnaireScreen() {
  const { userId, refreshProfile, signOut } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [irregular, setIrregular] = useState(false);
  const [lifestyle, setLifestyle] = useState<Lifestyle>('sedentary');
  const [takesMedication, setTakesMedication] = useState(false);
  const [medicationDetails, setMedicationDetails] = useState('');
  const [periodLength, setPeriodLength] = useState(0);
  const [lastPeriod, setLastPeriod] = useState('');

  const ageNum = parseInt(age, 10) || 0;
  const weightNum = parseFloat(weight) || 0;

  const canProceed = (() => {
    switch (step) {
      case 1: return ageNum > 0;
      case 2: return weightNum > 0;
      case 6: return periodLength > 0;
      case 7: return lastPeriod !== '';
      default: return true;
    }
  })();

  const submit = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      await saveProfile(userId, {
        age: ageNum,
        weight: weightNum,
        weight_unit: weightUnit,
        menstrual_irregularities: irregular,
        lifestyle,
        takes_medication: takesMedication,
        medication_details: medicationDetails || null,
        avg_period_len: periodLength,
      });
    } catch (err) {
      setError(`Profile insert failed: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
      return;
    }
    try {
      const end = parseDateOnly(lastPeriod);
      end.setDate(end.getDate() + periodLength - 1);
      await addPeriod(userId, { startDate: lastPeriod, endDate: toDateOnly(end), flow: 'light' });
    } catch (err) {
      // The profile exists now, so don't block onboarding on the period row.
      console.error('Period insert failed:', err);
    }
    // Flips hasProfile → the root navigator swaps in the main app.
    await refreshProfile();
    setLoading(false);
  };

  const header = (icon: IconName, title: string, sub: string) => (
    <View style={{ alignItems: 'center', marginBottom: 24 }}>
      <View style={styles.stepIcon}>
        <FontAwesome name={icon} size={22} color={Colors.darkRose} />
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSub}>{sub}</Text>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            {header('user', 'Tell us about yourself', "Let's start with some basic information")}
            <Label>Age</Label>
            <Input value={age} onChangeText={setAge} placeholder="Enter your age" keyboardType="number-pad" />
          </>
        );
      case 2:
        return (
          <>
            {header('balance-scale', 'Weight Information', 'This helps us provide personalized recommendations')}
            <Label>Weight</Label>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Input value={weight} onChangeText={setWeight} placeholder="Enter weight" keyboardType="decimal-pad" />
              </View>
              <Choice
                options={[{ value: 'kg', label: 'kg' }, { value: 'lbs', label: 'lbs' }]}
                value={weightUnit}
                onChange={setWeightUnit}
              />
            </View>
          </>
        );
      case 3:
        return (
          <>
            {header('calendar', 'Menstrual Health', 'Understanding your cycle helps with tracking')}
            <ToggleRow
              label="I experience menstrual irregularities"
              description="This includes irregular periods, missed periods, or unpredictable cycles"
              value={irregular}
              onChange={setIrregular}
            />
          </>
        );
      case 4:
        return (
          <>
            {header('heartbeat', 'Lifestyle Activity', 'How active are you on a typical day?')}
            <Choice options={LIFESTYLES} value={lifestyle} onChange={setLifestyle} columns={1} />
          </>
        );
      case 5:
        return (
          <>
            {header('medkit', 'Medication', 'Are you currently taking medication for PCOS?')}
            <ToggleRow
              label="I currently take medication for PCOS"
              description="This includes birth control, metformin, or other PCOS medications"
              value={takesMedication}
              onChange={setTakesMedication}
            />
            {takesMedication && (
              <View style={{ marginTop: 14 }}>
                <Label>Medication Details (Optional)</Label>
                <Input
                  value={medicationDetails}
                  onChangeText={setMedicationDetails}
                  placeholder="List any medications you're taking for PCOS..."
                  multiline
                />
              </View>
            )}
          </>
        );
      case 6:
        return (
          <>
            {header('clock-o', 'Average Period Length', 'How many days does your period typically last?')}
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setPeriodLength((n) => Math.max(1, n - 1))}
                disabled={periodLength <= 1}
                style={[styles.stepperButton, { opacity: periodLength <= 1 ? 0.4 : 1 }]}
                accessibilityLabel="Fewer days">
                <Text style={{ fontSize: 22, color: Colors.textGray }}>−</Text>
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.stepperValue}>{periodLength}</Text>
                <Text style={{ fontSize: 13, color: Colors.textMuted }}>days</Text>
              </View>
              <Pressable
                onPress={() => setPeriodLength((n) => Math.min(14, n + 1))}
                disabled={periodLength >= 14}
                style={[
                  styles.stepperButton,
                  { backgroundColor: Colors.rose, borderWidth: 0, opacity: periodLength >= 14 ? 0.4 : 1 },
                ]}
                accessibilityLabel="More days">
                <Text style={{ fontSize: 22, color: Colors.white }}>+</Text>
              </Pressable>
            </View>
            <Text style={{ textAlign: 'center', fontSize: 13, color: Colors.textMuted }}>
              Select a value between 1 and 14 days
            </Text>
          </>
        );
      case 7:
        return (
          <>
            {header('calendar-check-o', 'Last Period Date', 'When did your last period start?')}
            <Label>Last Period Start Date</Label>
            <DateField value={lastPeriod} onChange={setLastPeriod} maximumDate={new Date()} />
          </>
        );
    }
  };

  const progress = (step / STEPS) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.pageBg }}>
      <View style={styles.hero}>
        <SafeAreaView edges={['top']} style={{ alignItems: 'center', paddingBottom: 24, paddingTop: 12 }}>
          <Image
            source={require('@/assets/images/brand/PCOSitiveLogo.png')}
            style={{ width: 150, height: 31, marginBottom: 14 }}
            contentFit="contain"
          />
          <Text style={styles.heroTitle}>Welcome to PCOSitive!</Text>
          <Text style={styles.heroSub}>Let&apos;s personalize your experience</Text>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>Step {step} of {STEPS}</Text>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${progress}%` }]} />
          </View>

          <View style={{ marginTop: 28 }}>
            {error ? <View style={{ marginBottom: 16 }}><Banner kind="error">{error}</Banner></View> : null}
            {renderStep()}
          </View>
          <Text style={styles.signOut} onPress={signOut}>Not you? Sign out</Text>
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Button
            title="Back"
            variant="ghost"
            disabled={step === 1}
            onPress={() => setStep((s) => Math.max(1, s - 1))}
          />
          {step < STEPS ? (
            <Button title="Next" disabled={!canProceed} onPress={() => setStep((s) => s + 1)} style={{ paddingHorizontal: 32 }} />
          ) : (
            <Button title="Complete Setup" disabled={!canProceed} loading={loading} onPress={submit} />
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: Colors.rose },
  heroTitle: { fontSize: 22, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 12, color: Colors.textMuted },
  track: { height: 4, backgroundColor: Colors.roseLight, borderRadius: 4 },
  bar: { height: 4, backgroundColor: Colors.rose, borderRadius: 4 },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.rosePale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stepTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6, textAlign: 'center' },
  stepSub: { fontSize: 14, color: Colors.textGray, textAlign: 'center' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginTop: 8,
    marginBottom: 16,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.roseLight,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { fontSize: 52, fontWeight: '700', color: Colors.darkRose, lineHeight: 58 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.roseLight,
    backgroundColor: Colors.white,
  },
  signOut: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: 40 },
});
