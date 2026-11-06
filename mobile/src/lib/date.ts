export const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Parses a date-only string ("YYYY-MM-DD") as a local calendar date.
// `new Date("YYYY-MM-DD")` parses as UTC midnight, which shifts to the
// previous local day in negative UTC-offset timezones — this avoids that.
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Formats a Date as a local "YYYY-MM-DD" string.
export function toDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// The web server keys daily intake forms by UTC date, so the app must too.
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function formatTime(date = new Date()): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
