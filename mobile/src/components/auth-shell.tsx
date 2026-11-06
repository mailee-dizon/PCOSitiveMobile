import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

// Gradient-topped wrapper shared by the waitlist and sign-in screens.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <View style={styles.page}>
      <View style={styles.hero} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Image
              source={require('@/assets/images/brand/PCOSitiveLogo.png')}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="PCOSitive"
            />
            <View style={styles.card}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.pageBg },
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    experimental_backgroundImage: `linear-gradient(135deg, ${Colors.rose}, ${Colors.gradientEnd})`,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 24 },
  logo: { width: 220, height: 45, alignSelf: 'center' },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.roseLight,
    shadowColor: '#8c52ff',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
});
