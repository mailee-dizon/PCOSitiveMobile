import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import {
  Banner,
  Button,
  Card,
  Choice,
  Input,
  Label,
  Loading,
  ToggleRow,
  type IconName,
} from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { fetchProfile, saveProfile } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import type { Lifestyle, UserProfile } from '@/lib/types';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '');

const LIFESTYLES: { value: Lifestyle; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'less_active', label: 'Less Active' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
];

export default function SettingsScreen() {
  const { userId, email } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    periodReminders: true,
    weeklyDigest: false,
    newsUpdates: false,
  });

  useEffect(() => {
    if (!userId) return;
    fetchProfile(userId)
      .then(setProfile)
      .catch(() => setError('Unable to load profile information.'))
      .finally(() => setLoading(false));
  }, [userId]);

  const save = async (updated: UserProfile) => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await saveProfile(userId, updated);
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      console.error('Profile save error:', err);
      setError('Unable to save your information.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!email) return;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: WEB_URL ? `${WEB_URL}/api/auth/callback?next=/reset-password` : undefined,
    });
    Alert.alert(
      resetError ? 'Something went wrong' : 'Check your email',
      resetError ? resetError.message : `We sent a password reset link to ${email}.`,
    );
  };

  return (
    <Screen title="Settings">
      <Card style={{ gap: 16 }}>
        <View style={styles.sectionHeader}>
          <SectionTitle icon="user" title="Profile Information" />
          {profile && !editing ? (
            <Pressable onPress={() => setEditing(true)} hitSlop={8} style={styles.editLink}>
              <FontAwesome name="pencil" size={13} color={Colors.darkRose} />
              <Text style={{ color: Colors.darkRose }}>Edit</Text>
            </Pressable>
          ) : null}
        </View>
        {error ? <Banner kind="error">{error}</Banner> : null}
        {loading ? (
          <Loading />
        ) : profile ? (
          editing ? (
            <ProfileForm profile={profile} saving={saving} onSave={save} onCancel={() => setEditing(false)} />
          ) : (
            <ProfileSummary profile={profile} />
          )
        ) : (
          <Text style={{ color: Colors.textGray, textAlign: 'center' }}>No profile information found.</Text>
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionTitle icon="envelope" title="Email Notifications" />
        <ToggleRow
          label="Period Reminders"
          description="Get email notifications about your upcoming period"
          value={notifications.periodReminders}
          onChange={(v) => setNotifications((n) => ({ ...n, periodReminders: v }))}
        />
        <ToggleRow
          label="Weekly Health Digest"
          description="Receive a summary of your weekly health tracking"
          value={notifications.weeklyDigest}
          onChange={(v) => setNotifications((n) => ({ ...n, weeklyDigest: v }))}
        />
        <ToggleRow
          label="PCOS News & Updates"
          description="Stay informed about PCOS research and tips"
          value={notifications.newsUpdates}
          onChange={(v) => setNotifications((n) => ({ ...n, newsUpdates: v }))}
        />
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionTitle icon="shield" title="Privacy & Security" />
        <Pressable
          onPress={changePassword}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.rosePale }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Change Password</Text>
            <Text style={styles.rowSub}>Email yourself a password reset link</Text>
          </View>
          <FontAwesome name="lock" size={16} color={Colors.textMuted} />
        </Pressable>
      </Card>
    </Screen>
  );
}

function SectionTitle({ icon, title }: { icon: IconName; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <FontAwesome name={icon} size={18} color={Colors.rose} />
      <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary }}>{title}</Text>
    </View>
  );
}

function ProfileSummary({ profile }: { profile: UserProfile }) {
  const rows = [
    { label: 'Age', value: `${profile.age} years` },
    { label: 'Weight', value: `${profile.weight} ${profile.weight_unit}` },
    { label: 'Lifestyle', value: LIFESTYLES.find((l) => l.value === profile.lifestyle)?.label ?? profile.lifestyle },
    { label: 'Menstrual Irregularities', value: profile.menstrual_irregularities ? 'Yes' : 'No' },
    { label: 'Takes Medication', value: profile.takes_medication ? 'Yes' : 'No' },
    ...(profile.medication_details ? [{ label: 'Medication Details', value: profile.medication_details }] : []),
  ];
  return (
    <View style={{ gap: 12 }}>
      {rows.map(({ label, value }) => (
        <View key={label}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.textGray }}>{label}</Text>
          <Text style={{ fontSize: 17, color: Colors.textPrimary }}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function ProfileForm({
  profile,
  saving,
  onSave,
  onCancel,
}: {
  profile: UserProfile;
  saving: boolean;
  onSave: (p: UserProfile) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(profile);
  const [age, setAge] = useState(String(profile.age || ''));
  const [weight, setWeight] = useState(String(profile.weight || ''));
  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const ageNum = parseInt(age, 10) || 0;
  const weightNum = parseFloat(weight) || 0;

  return (
    <View style={{ gap: 14 }}>
      <View>
        <Label>Age</Label>
        <Input value={age} onChangeText={setAge} keyboardType="number-pad" />
      </View>
      <View>
        <Label>Weight</Label>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Input value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
          </View>
          <Choice
            options={[{ value: 'kg', label: 'kg' }, { value: 'lbs', label: 'lbs' }]}
            value={form.weight_unit}
            onChange={(v) => update('weight_unit', v)}
          />
        </View>
      </View>
      <View>
        <Label>Lifestyle Activity</Label>
        <Choice options={LIFESTYLES} value={form.lifestyle} onChange={(v) => update('lifestyle', v)} columns={2} />
      </View>
      <ToggleRow
        label="I experience menstrual irregularities"
        value={form.menstrual_irregularities}
        onChange={(v) => update('menstrual_irregularities', v)}
      />
      <ToggleRow
        label="I currently take medication for PCOS"
        value={form.takes_medication}
        onChange={(v) => update('takes_medication', v)}
      />
      {form.takes_medication && (
        <View>
          <Label>Medication Details (Optional)</Label>
          <Input
            value={form.medication_details ?? ''}
            onChangeText={(v) => update('medication_details', v)}
            placeholder="List any medications you're taking for PCOS..."
            multiline
          />
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
        <Button title="Cancel" variant="ghost" onPress={onCancel} />
        <Button
          title="Save Changes"
          loading={saving}
          disabled={ageNum <= 0 || weightNum <= 0}
          onPress={() => onSave({ ...form, age: ageNum, weight: weightNum })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.roseLight,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowTitle: { fontWeight: '500', color: Colors.textPrimary },
  rowSub: { fontSize: 13, color: Colors.textMuted },
});
