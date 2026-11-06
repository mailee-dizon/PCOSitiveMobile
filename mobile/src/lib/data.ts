// Ports of the web client's /api/period, /api/symptoms and /api/emails routes.
// The mobile app talks to Supabase directly instead of going through Next.js.

import { MS_PER_DAY, parseDateOnly, toDateOnly, todayUtc } from '@/lib/date';
import { supabase, supabasePublic } from '@/lib/supabase';
import type {
  Flow,
  Intensity,
  PeriodPredictions,
  PeriodRow,
  SymptomLog,
  UserProfile,
} from '@/lib/types';

// ── Periods ──────────────────────────────────────────────────────────────────

export async function fetchPeriods(userId: string): Promise<PeriodRow[]> {
  const { data, error } = await supabasePublic.from('period').select('*').eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

export async function addPeriod(
  userId: string,
  period: { startDate: string; endDate?: string; flow?: Flow; notes?: string },
) {
  if (!period.startDate) throw new Error('Need a start date of period');
  const { error } = await supabasePublic.from('period').insert([
    {
      user_id: userId,
      notes: period.notes,
      flow: period.flow,
      start_date: period.startDate,
      end_date: period.endDate || null,
    },
  ]);
  if (error) throw error;
}

export async function fetchPredictions(userId: string): Promise<PeriodPredictions | null> {
  const [{ data: periods }, { data: profile }] = await Promise.all([
    supabasePublic
      .from('period')
      .select('start_date, end_date')
      .eq('user_id', userId)
      .order('start_date', { ascending: false }),
    supabase.from('user_profiles').select('avg_period_len').eq('user_id', userId).maybeSingle(),
  ]);

  let avgCycleLength = 28;
  let avgPeriodLength = profile?.avg_period_len || 5;
  const lastPeriodStart = periods?.[0]?.start_date ? parseDateOnly(periods[0].start_date) : null;

  if (!lastPeriodStart) return null;

  if (periods && periods.length >= 2) {
    const cycles: number[] = [];
    for (let i = 1; i < periods.length; i++) {
      const currStart = parseDateOnly(periods[i - 1].start_date);
      const prevStart = parseDateOnly(periods[i].start_date);
      cycles.push((currStart.getTime() - prevStart.getTime()) / MS_PER_DAY);
    }
    avgCycleLength = Math.round(cycles.reduce((a, b) => a + b) / cycles.length);

    const durations = periods
      .filter((p) => p.end_date)
      .map(
        (p) =>
          (parseDateOnly(p.end_date!).getTime() - parseDateOnly(p.start_date).getTime()) /
          MS_PER_DAY,
      );
    if (durations.length > 0) {
      avgPeriodLength = Math.round(durations.reduce((a, b) => a + b) / durations.length);
    }
  }

  // Predict periods up to five months out.
  const predictions = [];
  const endDateLimit = new Date();
  endDateLimit.setMonth(endDateLimit.getMonth() + 5);

  let currentStart = lastPeriodStart;
  while (avgCycleLength > 0 && currentStart < endDateLimit) {
    const nextStart = new Date(currentStart);
    nextStart.setDate(nextStart.getDate() + avgCycleLength);
    const nextEnd = new Date(nextStart);
    nextEnd.setDate(nextEnd.getDate() + avgPeriodLength);
    predictions.push({ start_date: toDateOnly(nextStart), end_date: toDateOnly(nextEnd) });
    currentStart = nextStart;
  }

  return { avgCycleLength, avgPeriodLength, predictions };
}

// ── Symptoms ─────────────────────────────────────────────────────────────────

export async function fetchSymptoms(userId: string, limit = 10): Promise<SymptomLog[]> {
  const { data, error } = await supabasePublic
    .from('symptoms')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(0, limit - 1);
  if (error) throw error;
  return data ?? [];
}

export async function addSymptoms(
  userId: string,
  log: { symptoms: string[]; intensity: Intensity; notes: string },
) {
  const { error } = await supabasePublic.from('symptoms').insert([{ user_id: userId, ...log }]);
  if (error) throw error;
}

export async function updateSymptoms(
  symptomId: number,
  log: { symptoms: string[]; intensity: Intensity; notes: string },
) {
  if (log.symptoms.length === 0) throw new Error('Need symptoms and intensity');
  const { error } = await supabasePublic.from('symptoms').update(log).eq('id', symptomId);
  if (error) throw error;
}

export async function deleteSymptoms(symptomId: number) {
  const { error } = await supabasePublic.from('symptoms').delete().eq('id', symptomId);
  if (error) throw error;
}

// ── Profile & daily intake ───────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(userId: string, profile: UserProfile) {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({ ...profile, user_id: userId, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function hasIntakeToday(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('intake_forms')
    .select('id')
    .eq('user_id', userId)
    .eq('entry_date', todayUtc())
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export interface IntakeForm {
  mood: number;
  motivation: number;
  period_pain: number;
  lifestyle: string;
  medication: boolean;
}

export async function fetchTodayIntake(userId: string): Promise<IntakeForm | null> {
  const { data, error } = await supabase
    .from('intake_forms')
    .select('mood, motivation, period_pain, lifestyle, medication')
    .eq('user_id', userId)
    .eq('entry_date', todayUtc())
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function submitIntake(
  userId: string,
  intake: IntakeForm,
) {
  const { error } = await supabase
    .from('intake_forms')
    .insert([{ user_id: userId, entry_date: todayUtc(), ...intake }]);
  if (error) throw error;
}

// ── Waitlist ─────────────────────────────────────────────────────────────────

export async function joinWaitlist(email: string) {
  const { error } = await supabase.from('emails').insert([{ email }]);
  if (error) throw error;
}
