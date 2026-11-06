import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Card } from '@/components/ui';
import { Colors } from '@/constants/theme';

type Content =
  | string
  | string[]
  | { intro: string; categories: { title: string; items: string[] }[] };

const SECTIONS: { id: string; title: string; content: Content }[] = [
  {
    id: 'what-is-pcos',
    title: 'What is PCOS?',
    content:
      'Polycystic Ovary Syndrome (PCOS) is a common endocrine disorder affecting women of reproductive age, characterized by hormonal imbalances, irregular menstrual cycles, and the development of multiple small cysts on the ovaries. It is a leading cause of infertility in women and is often associated with metabolic complications such as insulin resistance and obesity.',
  },
  {
    id: 'key-symptoms',
    title: 'Key Symptoms',
    content: [
      'Irregular Menstrual Cycles: Infrequent, irregular, or prolonged menstrual periods.',
      'Excess Androgen Levels: Elevated levels of male hormones can cause physical signs like hirsutism (excessive hair growth), acne, and male-pattern baldness.',
      'Polycystic Ovaries: Ovaries may be enlarged and contain numerous small follicles that fail to regularly release eggs.',
      'Weight Gain and Difficulty Losing Weight: Many women with PCOS struggle with weight management due to hormonal imbalances.',
    ],
  },
  {
    id: 'diagnosis',
    title: 'Diagnosis',
    content: [
      'Ultrasound Imaging: To check for cysts on the ovaries.',
      'Blood Tests: To measure hormone levels, including androgens and insulin.',
      'Physical Examination: Assessment of symptoms like excess hair growth, acne, and weight distribution.',
    ],
  },
  {
    id: 'causes',
    title: 'Causes and Risk Factors',
    content: [
      'Genetic Predisposition: Family history of PCOS is a significant risk factor.',
      'Insulin Resistance: Many women with PCOS are insulin resistant, leading to higher insulin levels, which may increase androgen production.',
      'Inflammation: Chronic inflammation has been linked to higher androgen levels in women with PCOS.',
    ],
  },
  {
    id: 'treatment',
    title: 'Treatment Options',
    content: {
      intro: 'Treatment is tailored to individual symptoms and goals:',
      categories: [
        { title: 'Lifestyle Changes', items: ['Diet and exercise to manage weight and insulin levels.'] },
        {
          title: 'Medications',
          items: [
            'Birth Control Pills: Regulate hormones and menstrual cycles.',
            'Metformin: Helps improve insulin resistance.',
            'Anti-Androgens: Reduce male hormone levels.',
          ],
        },
        {
          title: 'Fertility Treatments',
          items: ['If conception is a goal, medications to stimulate ovulation may be used.'],
        },
      ],
    },
  },
  {
    id: 'complications',
    title: 'Complications',
    content: ['Type 2 Diabetes', 'Heart Disease', 'Endometrial Cancer', 'Depression and Anxiety'],
  },
  {
    id: 'management',
    title: 'Management and Lifestyle Tips',
    content: [
      'Balanced Diet: Low-sugar, high-fiber foods help manage blood sugar levels.',
      'Regular Exercise: Improves insulin sensitivity and helps with weight management.',
      'Stress Management: Techniques like yoga and meditation can help regulate hormone levels.',
    ],
  },
  {
    id: 'research',
    title: 'Research and Future Directions',
    content:
      'Emerging studies suggest that understanding the genetic and metabolic pathways involved in PCOS could lead to more targeted treatments and preventative measures. Ongoing research is exploring the role of anti-inflammatory therapies and novel hormonal treatments.',
  },
];

export default function EducationScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const [active, setActive] = useState(SECTIONS[0].id);
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});

  const scrollTo = (id: string) => {
    setActive(id);
    const y = offsets.current[id];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: y - 12, animated: true });
  };

  // Deep link from the dashboard, e.g. /education?section=management
  useEffect(() => {
    if (section && SECTIONS.some((s) => s.id === section)) {
      const t = setTimeout(() => scrollTo(section), 150);
      return () => clearTimeout(t);
    }
  }, [section]);

  return (
    <Screen title="Understanding PCOS" scrollRef={scrollRef}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => scrollTo(s.id)}
              style={[styles.navChip, isActive && { backgroundColor: Colors.rose, borderColor: Colors.rose }]}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: isActive ? Colors.white : '#374151' }}>
                {s.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {SECTIONS.map((s) => (
        <View
          key={s.id}
          onLayout={(e) => (offsets.current[s.id] = e.nativeEvent.layout.y)}>
          <Card style={active === s.id ? { borderColor: Colors.rose, borderWidth: 2 } : undefined}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <SectionBody content={s.content} />
          </Card>
        </View>
      ))}
    </Screen>
  );
}

function SectionBody({ content }: { content: Content }) {
  if (typeof content === 'string') return <Text style={styles.body}>{content}</Text>;
  if (Array.isArray(content)) return <Bullets items={content} />;
  return (
    <View style={{ gap: 14 }}>
      <Text style={styles.body}>{content.intro}</Text>
      {content.categories.map((c) => (
        <View key={c.title} style={{ marginLeft: 12 }}>
          <Text style={{ fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 }}>{c.title}</Text>
          <Bullets items={c.items} />
        </View>
      ))}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ gap: 10 }}>
      {items.map((item) => {
        const [lead, ...rest] = item.split(': ');
        return (
          <View key={item} style={{ flexDirection: 'row', gap: 10 }}>
            <FontAwesome name="circle" size={8} color={Colors.rose} style={{ marginTop: 7 }} />
            <Text style={[styles.body, { flex: 1 }]}>
              {rest.length ? (
                <>
                  <Text style={{ fontWeight: '600' }}>{lead}: </Text>
                  {rest.join(': ')}
                </>
              ) : (
                item
              )}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.roseLight,
    backgroundColor: Colors.white,
  },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 23, color: '#1f2937' },
});
