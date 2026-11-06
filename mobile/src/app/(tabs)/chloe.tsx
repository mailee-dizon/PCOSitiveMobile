import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { formatTime } from '@/lib/date';
import { chloeServerUrl, sendChloeMessage } from '@/lib/server';
import type { LoggedItem } from '@/lib/types';

interface Message {
  role: 'bot' | 'user';
  text: string;
  timestamp: string;
  logged?: LoggedItem[];
}

const chloeAvatar = require('@/assets/images/brand/heart-chloe.png');

export default function ChloeScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: "Hi! I'm Chloe, your PCOS wellness companion. I'm here to support you on your health journey. How can I help you today? 💜",
      timestamp: formatTime(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages, isTyping]);

  const send = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    const history: Message[] = [...messages, { role: 'user', text, timestamp: formatTime() }];
    setMessages(history);
    setInput('');
    setIsTyping(true);
    try {
      const { response, logged } = await sendChloeMessage(
        history.map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
      );
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: response || "I'm here to help! Let me know what you need.",
          timestamp: formatTime(),
          logged,
        },
      ]);
    } catch (err) {
      console.error('Chloe error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text:
            "I apologize, but I'm having trouble connecting right now. Please try again in a moment." +
            (__DEV__ ? `\n\n(Dev: couldn't reach the Chloe server at ${chloeServerUrl()}. Is \`npm run server\` running, and is your phone on the same network?)` : ''),
          timestamp: formatTime(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Colors.pageBg }}>
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Image source={chloeAvatar} style={{ width: 32, height: 32, borderRadius: 16 }} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Chloe</Text>
          <Text style={styles.headerSub}>Your PCOS Wellness Assistant</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 49 : 0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16, gap: 18 }}
          keyboardDismissMode="interactive"
          renderItem={({ item }) => <Bubble message={item} />}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Message Chloe..."
            placeholderTextColor={Colors.textMuted}
            multiline
            style={styles.input}
            accessibilityLabel="Message Chloe"
          />
          <Pressable
            onPress={send}
            disabled={!input.trim() || isTyping}
            style={[styles.send, { backgroundColor: input.trim() ? Colors.rose : Colors.roseLight }]}
            accessibilityLabel="Send message">
            <FontAwesome name="paper-plane" size={16} color={Colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[styles.row, isUser && { flexDirection: 'row-reverse' }]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Image source={chloeAvatar} style={{ width: 22, height: 22, borderRadius: 11 }} />
        </View>
      )}
      <View style={{ maxWidth: '82%', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={{ fontSize: 15, lineHeight: 22, color: isUser ? Colors.white : Colors.textPrimary }}>
            {message.text}
          </Text>
        </View>
        {message.logged?.map((item, i) => (
          <Text key={i} style={styles.logged}>
            ✓ {item.type === 'period' ? 'Period logged' : 'Symptoms logged'} — {item.detail}
          </Text>
        ))}
        <Text style={styles.time}>{message.timestamp}</Text>
      </View>
    </Animated.View>
  );
}

function Dot({ delay }: { delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(-4, { duration: 300 }), withTiming(0, { duration: 300 })), -1),
    );
  }, [delay, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[styles.dot, style]} />;
}

function TypingIndicator() {
  return (
    <View style={[styles.row, { marginTop: 18 }]}>
      <View style={styles.avatar}>
        <Image source={chloeAvatar} style={{ width: 22, height: 22, borderRadius: 11 }} />
      </View>
      <View style={[styles.botBubble, styles.bubble, { flexDirection: 'row', gap: 4, paddingVertical: 14 }]}>
        <Dot delay={0} />
        <Dot delay={200} />
        <Dot delay={400} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.roseLight,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.rosePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textGray },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.rosePale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  userBubble: { backgroundColor: Colors.rose },
  botBubble: { backgroundColor: Colors.white, borderWidth: 1, borderColor: '#e5e7eb' },
  logged: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.darkRose,
    backgroundColor: Colors.rosePale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  time: { fontSize: 11, color: Colors.textMuted, marginTop: 4, paddingHorizontal: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.textGray },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.roseLight,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 42,
    borderWidth: 1,
    borderColor: Colors.roseLight,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
