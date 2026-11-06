import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

const SIZE = 62;

// Chloe wanders along the bottom of the dashboard; tap her to start a chat.
export function RoamingChloe() {
  const { width } = useWindowDimensions();
  const x = useSharedValue(width / 2 - SIZE / 2);
  const bob = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);
  const [isHeart, setIsHeart] = useState(false);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );

    const move = setInterval(() => {
      const next = 16 + Math.random() * (width - SIZE - 32);
      setFlipped(next < x.value);
      x.value = withTiming(next, { duration: 2800, easing: Easing.out(Easing.cubic) });
    }, 3200);

    let heart: ReturnType<typeof setTimeout>;
    const scheduleHeart = () => {
      heart = setTimeout(() => {
        setIsHeart(true);
        heart = setTimeout(() => {
          setIsHeart(false);
          scheduleHeart();
        }, 1500);
      }, 8000 + Math.random() * 5000);
    };
    scheduleHeart();

    return () => {
      clearInterval(move);
      clearTimeout(heart);
    };
  }, [width, x, bob]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: bob.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, style]} pointerEvents="box-none">
      <Animated.View entering={ZoomIn.duration(500)}>
        <Pressable onPress={() => router.navigate('/chloe')} accessibilityLabel="Chat with Chloe">
          <Image
            source={
              isHeart
                ? require('@/assets/images/brand/heart-chloe.png')
                : require('@/assets/images/brand/chloe.jpg')
            }
            contentPosition="top"
            style={[styles.image, { transform: [{ scaleX: flipped ? -1 : 1 }] }]}
          />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 16, left: 0 },
  image: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2.5,
    borderColor: Colors.rose,
    backgroundColor: Colors.rosePale,
  },
});
