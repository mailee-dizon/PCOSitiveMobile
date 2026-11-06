import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailyIntakeQuiz } from '@/components/daily-intake-quiz';
import { Button, type IconName } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { hasIntakeToday } from '@/lib/data';

function tabIcon(name: IconName) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <FontAwesome name={name} size={22} color={color} />;
  };
}

export default function TabLayout() {
  const { userId } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  // Nudge the user to fill in today's intake quiz once per launch.
  useEffect(() => {
    if (!userId) return;
    hasIntakeToday(userId)
      .then((done) => setShowPrompt(!done))
      .catch((err) => console.error('Error checking intake_forms', err.message));
  }, [userId]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: Colors.darkRose,
          tabBarInactiveTintColor: Colors.textGray,
          tabBarActiveBackgroundColor: Colors.rosePale,
          tabBarItemStyle: { borderRadius: 14, marginHorizontal: 2, marginVertical: 4 },
          tabBarStyle: { borderTopColor: Colors.roseLight, backgroundColor: Colors.white },
          sceneStyle: { backgroundColor: Colors.pageBg },
        }}>
        <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: tabIcon('home') }} />
        <Tabs.Screen
          name="chloe"
          options={{
            title: 'Chloe',
            tabBarIcon: ({ focused }) => (
              <Image
                source={require('@/assets/images/brand/chloe.jpg')}
                style={[styles.chloeIcon, { borderColor: focused ? Colors.darkRose : Colors.rose }]}
                contentPosition="top"
              />
            ),
          }}
        />
        <Tabs.Screen name="symptom-log" options={{ title: 'Symptom Log', tabBarIcon: tabIcon('calendar') }} />
        <Tabs.Screen
          name="exercise"
          options={{
            title: 'Exercise',
            tabBarIcon: ({ color }) => <FontAwesome5 name="dumbbell" size={20} color={color} />,
          }}
        />
        <Tabs.Screen name="education" options={{ title: 'Education', tabBarIcon: tabIcon('graduation-cap') }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('user') }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: tabIcon('cog') }} />
      </Tabs>

      {showPrompt && (
        <SafeAreaView edges={['top']} style={styles.promptWrap} pointerEvents="box-none">
          <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={styles.prompt}>
            <Text style={styles.promptText}>
              Welcome back! Would you like to fill the daily intake quiz?
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'flex-end' }}>
              <Button small title="Later" variant="outline" onPress={() => setShowPrompt(false)} />
              <Button
                small
                title="Fill now"
                onPress={() => {
                  setShowPrompt(false);
                  setShowQuiz(true);
                }}
              />
            </View>
          </Animated.View>
        </SafeAreaView>
      )}

      {userId ? (
        <DailyIntakeQuiz
          visible={showQuiz}
          userId={userId}
          onComplete={() => setShowQuiz(false)}
          onCancel={() => setShowQuiz(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chloeIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  promptWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  prompt: {
    margin: 12,
    padding: 14,
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.roseLight,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  promptText: { fontSize: 14, color: Colors.textGray },
});
