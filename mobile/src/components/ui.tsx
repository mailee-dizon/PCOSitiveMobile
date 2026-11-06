// Small building blocks shared by every screen.

import { FontAwesome } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Colors, Fonts, Radius } from '@/constants/theme';

export type IconName = ComponentProps<typeof FontAwesome>['name'];

// ── Buttons ──────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'outline' | 'ghost';

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  style,
  small = false,
}: {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const isDisabled = disabled || loading;
  const textColor =
    variant === 'primary' ? (isDisabled ? Colors.textMuted : Colors.white) : Colors.textGray;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        variant === 'primary' && {
          backgroundColor: isDisabled ? Colors.roseLight : pressed ? Colors.darkRose : Colors.rose,
        },
        variant === 'outline' && {
          borderWidth: 1,
          borderColor: pressed ? Colors.rose : Colors.roseLight,
          backgroundColor: pressed ? Colors.rosePale : Colors.white,
        },
        variant === 'ghost' && pressed && { backgroundColor: Colors.rosePale },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : icon ? (
        <FontAwesome name={icon} size={small ? 12 : 14} color={textColor} />
      ) : null}
      <Text style={[styles.buttonText, small && { fontSize: 12 }, { color: textColor }]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function LinkText({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Text onPress={onPress} style={styles.link} accessibilityRole="link">
      {title}
    </Text>
  );
}

// ── Layout ───────────────────────────────────────────────────────────────────

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Heading({ children, size = 27 }: { children: ReactNode; size?: number }) {
  return <Text style={[styles.heading, { fontSize: size }]}>{children}</Text>;
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={Colors.rose} />
      {label ? <Text style={styles.muted}>{label}</Text> : null}
    </View>
  );
}

export function Banner({ kind, children }: { kind: 'error' | 'success' | 'warn'; children: ReactNode }) {
  const palette = {
    error: [Colors.errorBg, Colors.errorBorder, Colors.errorText],
    success: [Colors.successBg, Colors.successBorder, Colors.successText],
    warn: [Colors.warnBg, Colors.warnBorder, Colors.warnText],
  }[kind];
  return (
    <View style={[styles.banner, { backgroundColor: palette[0], borderColor: palette[1] }]}>
      {typeof children === 'string' ? (
        <Text style={{ color: palette[2], fontSize: 13 }}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

// ── Form controls ────────────────────────────────────────────────────────────

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Input({ icon, style, ...props }: TextInputProps & { icon?: IconName }) {
  return (
    <View style={styles.inputWrap}>
      {icon ? (
        <FontAwesome name={icon} size={13} color={Colors.textMuted} style={styles.inputIcon} />
      ) : null}
      <TextInput
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, icon && { paddingLeft: 36 }, props.multiline && styles.textArea, style]}
        {...props}
      />
    </View>
  );
}

// A row of selectable pills — stands in for <select> and radio groups.
export function Choice<T extends string | number>({
  options,
  value,
  onChange,
  columns,
}: {
  options: { value: T; label: string; description?: string; icon?: string }[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: number;
}) {
  return (
    <View style={[styles.choiceRow, columns === 1 && { flexDirection: 'column' }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.choice,
              columns ? { flexBasis: `${100 / columns - 3}%`, flexGrow: 1 } : { flexGrow: 1 },
              active && { backgroundColor: Colors.rose, borderColor: Colors.rose },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}>
            <Text style={[styles.choiceText, active && { color: Colors.white }]}>
              {opt.icon ? `${opt.icon}  ` : ''}
              {opt.label}
            </Text>
            {opt.description ? (
              <Text style={[styles.choiceSub, active && { color: Colors.white }]}>
                {opt.description}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleSub}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.toggleOff, true: Colors.rose }}
        thumbColor={Colors.white}
        ios_backgroundColor={Colors.toggleOff}
        accessibilityLabel={label}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 9,
  },
  buttonSmall: { paddingVertical: 7, paddingHorizontal: 11 },
  buttonText: { fontSize: 14, fontWeight: '600' },
  link: { color: Colors.darkRose, fontWeight: '600' },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.roseLight,
    borderRadius: Radius.lg,
    padding: 18,
  },
  heading: { fontFamily: Fonts?.serif, color: Colors.textPrimary },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: Colors.pageBg,
    paddingVertical: 40,
  },
  muted: { color: Colors.textMuted, fontSize: 13 },
  banner: { borderWidth: 1, borderRadius: Radius.sm, paddingVertical: 10, paddingHorizontal: 14 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textGray, marginBottom: 7 },
  inputWrap: { justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 13, zIndex: 1 },
  input: {
    borderWidth: 1,
    borderColor: Colors.roseLight,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  textArea: { minHeight: 84, textAlignVertical: 'top' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    borderWidth: 1,
    borderColor: Colors.roseLight,
    backgroundColor: Colors.rosePale,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  choiceText: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  choiceSub: { fontSize: 12, color: Colors.textGray, marginTop: 2 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.rosePale,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.roseLight,
  },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  toggleSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
