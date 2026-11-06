// Chloe chat needs the OpenAI key, so it runs on the Python server in ../server.
// Exercise recommendations come straight from the model server deployed on Railway.

import Constants from 'expo-constants';

import { fetchProfile, fetchTodayIntake } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import type { ExerciseResult, LoggedItem } from '@/lib/types';

const SERVER_PORT = 8001;
const MODEL_URL = (
  process.env.EXPO_PUBLIC_MODEL_URL ?? 'https://pcospositiveapp-production.up.railway.app'
).replace(/\/$/, '');

// In development, Expo knows the computer's address (the same one the phone
// loads the app from), so the server is found automatically — on a simulator,
// an emulator or a real phone. EXPO_PUBLIC_API_URL overrides it, e.g. for a
// deployed server.
export function chloeServerUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (configured) return configured;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  // In tunnel mode the host is an Expo URL, not the computer, so it can't reach the server.
  if (host && !host.endsWith('.exp.direct')) return `http://${host}:${SERVER_PORT}`;
  return `http://localhost:${SERVER_PORT}`;
}

// The server checks this token to know which user to log periods/symptoms for.
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function sendChloeMessage(
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<{ response: string | null; logged: LoggedItem[] }> {
  const res = await fetch(`${chloeServerUrl()}/api/chloe/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`Chloe server responded with ${res.status}`);
  const data = await res.json();
  return { response: data.response ?? null, logged: data.logged ?? [] };
}

export type ExerciseResponse =
  | { kind: 'needsIntake' }
  | { kind: 'result'; data: ExerciseResult }
  | { kind: 'error'; message: string };

// Port of the web client's /api/exercise route.
export async function fetchExercise(userId: string): Promise<ExerciseResponse> {
  let profile, intake;
  try {
    [profile, intake] = await Promise.all([fetchProfile(userId), fetchTodayIntake(userId)]);
  } catch {
    return { kind: 'error', message: 'Could not load your check-in. Please try again.' };
  }
  if (!intake) return { kind: 'needsIntake' };

  // Estimate BMI — assume avg height 1.65 m since height is not collected.
  let bmi = 25.0;
  if (profile?.weight) {
    const weightKg = profile.weight_unit === 'lbs' ? profile.weight * 0.453592 : profile.weight;
    bmi = Math.round((weightKg / (1.65 * 1.65)) * 10) / 10;
  }

  try {
    const res = await fetch(`${MODEL_URL}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age: profile?.age ?? 25,
        bmi,
        menstrual_irregularity: profile?.menstrual_irregularities ? 1 : 0,
        mood: intake.mood,
        motivation: intake.motivation,
        period_pain: intake.period_pain,
        lifestyle: intake.lifestyle,
        medication: intake.medication,
      }),
    });
    if (!res.ok) throw new Error(`Model server responded with ${res.status}`);
    return { kind: 'result', data: (await res.json()) as ExerciseResult };
  } catch (err) {
    console.error('[exercise] model server error:', err);
    return { kind: 'error', message: 'The exercise model is unavailable right now. Please try again.' };
  }
}
