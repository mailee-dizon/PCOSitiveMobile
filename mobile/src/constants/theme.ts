/**
 * PCOSitive brand palette — mirrors the colors used across the web client.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  rose: '#e8bcf6',
  darkRose: '#d49ae4',
  deepRose: '#8c52ff',
  roseLight: '#f0e6ff',
  rosePale: '#f7f0ff',
  pageBg: '#fdfaff',
  white: '#ffffff',
  textPrimary: '#1c1917',
  textGray: '#78716c',
  textMuted: '#a8a29e',
  stone: '#f5f5f4',
  toggleOff: '#e5e7eb',
  gradientEnd: '#a6dcff',
  darkPurple: '#484a96',
  periodPast: '#f87171',
  periodFuture: '#fca5a5',
  errorBg: '#fff1f2',
  errorBorder: '#fecdd3',
  errorText: '#be123c',
  successBg: '#f0fdf4',
  successBorder: '#bbf7d0',
  successText: '#15803d',
  warnBg: '#fefce8',
  warnBorder: '#fef08a',
  warnText: '#854d0e',
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif' },
  default: { sans: 'normal', serif: 'serif' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)' },
});

export const Radius = { sm: 8, md: 10, lg: 14, xl: 16 } as const;
