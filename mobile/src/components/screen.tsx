import type { ReactNode, Ref } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Heading } from '@/components/ui';
import { Colors } from '@/constants/theme';

// Scrollable page body with a serif title and optional pull-to-refresh.
export function Screen({
  title,
  aside,
  children,
  refreshing,
  onRefresh,
  scrollRef,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollRef?: Ref<ScrollView>;
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.page}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={Colors.rose} />
          ) : undefined
        }>
        <View style={styles.header}>
          <Heading>{title}</Heading>
          {typeof aside === 'string' ? <Text style={styles.aside}>{aside}</Text> : aside}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.pageBg },
  content: { padding: 16, paddingBottom: 40, gap: 14, width: '100%', maxWidth: 800, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  aside: { fontSize: 12, color: Colors.textMuted },
});
