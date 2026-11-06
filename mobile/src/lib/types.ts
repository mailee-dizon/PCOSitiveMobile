export type Flow = 'light' | 'medium' | 'heavy';
export type Intensity = 'mild' | 'moderate' | 'severe';
export type Lifestyle = 'sedentary' | 'less_active' | 'active' | 'very_active';

export interface UserProfile {
  id?: string;
  user_id?: string;
  age: number;
  weight: number;
  weight_unit: 'kg' | 'lbs';
  menstrual_irregularities: boolean;
  lifestyle: Lifestyle;
  takes_medication: boolean;
  medication_details?: string | null;
  avg_period_len?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface PeriodRow {
  id: number;
  start_date: string;
  end_date: string | null;
  flow: Flow | null;
  notes: string | null;
}

export interface PeriodRange {
  startDate: Date;
  endDate: Date;
  type: 'past' | 'future';
}

export interface PeriodLog {
  startDate: Date;
  endDate: Date;
  flow: Flow | null;
  notes: string | null;
}

export interface PredictedPeriod {
  start_date: string;
  end_date: string;
}

export interface PeriodPredictions {
  avgCycleLength: number;
  avgPeriodLength: number;
  predictions: PredictedPeriod[];
}

export interface SymptomLog {
  id?: number;
  created_at: string;
  symptoms: string[];
  intensity: Intensity;
  notes: string;
}

export interface ExerciseResult {
  difficulty: string;
  exercises: string[];
}

export interface LoggedItem {
  type: 'period' | 'symptoms';
  detail: string;
}
