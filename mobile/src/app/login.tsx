import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { loginStyles as styles } from '@/assets/styles/login.styles';
import { AuthShell } from '@/components/auth-shell';
import { Banner, Button, Input, Label, LinkText } from '@/components/ui';
import { supabase } from '@/lib/supabase';

// Password resets are completed on the website, which owns the reset page.
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '');

export default function LoginScreen() {
  const params = useLocalSearchParams<{ signup?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(params.signup === 'true');
  const [isForgot, setIsForgot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setError(null);
    setSuccess(null);
  };

  const submit = async () => {
    reset();
    setLoading(true);
    try {
      if (isForgot) {
        if (!email) return setError('Please enter your email address.');
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: WEB_URL ? `${WEB_URL}/api/auth/callback?next=/reset-password` : undefined,
        });
        if (resetError) setError(resetError.message);
        else
          setSuccess(
            'Password reset link has been sent to your email address. Please check your inbox and spam folder.',
          );
        return;
      }

      if (!email || !password) return setError('Please fill in both fields.');

      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) setError(signUpError.message);
        // Supabase returns an empty identities array (with no error) for an existing email.
        else if (data.user?.identities?.length === 0)
          setError('An account with this email already exists. Please sign in instead.');
        else if (data.user && !data.session)
          setSuccess('Please check your email and click the confirmation link to complete your registration.');
        // With a session, the root navigator moves on to the questionnaire.
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) setError(signInError.message);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const title = isForgot ? 'Reset your password' : isSignUp ? 'Create your account' : 'Sign in to your account';
  const subtitle = isForgot
    ? "Enter your email and we'll send you a reset link"
    : isSignUp
      ? 'Start managing your PCOS journey today'
      : 'Welcome back! Please enter your details';
  const buttonTitle = isForgot ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In';

  return (
    <AuthShell>
      <View style={{ gap: 14 }}>
        <View style={{ alignItems: 'center', marginBottom: 8, gap: 6 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
        </View>

        {error ? <Banner kind="error">{error}</Banner> : null}
        {success ? <Banner kind="success">{success}</Banner> : null}

        <View>
          <Label>Email</Label>
          <Input
            icon="envelope"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
        </View>

        {!isForgot && (
          <View>
            <Label>Password</Label>
            <Input
              icon="lock"
              value={password}
              onChangeText={setPassword}
              placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              textContentType={isSignUp ? 'newPassword' : 'password'}
              onSubmitEditing={submit}
            />
          </View>
        )}

        {!isSignUp && !isForgot && (
          <Text style={{ textAlign: 'right', fontSize: 13 }}>
            <LinkText title="Forgot password?" onPress={() => { reset(); setIsForgot(true); }} />
          </Text>
        )}

        <Button title={buttonTitle} onPress={submit} loading={loading} style={{ marginTop: 4 }} />

        <Text style={styles.footer}>
          {isForgot ? (
            <>
              Remember your password?{' '}
              <LinkText title="Back to sign in" onPress={() => { reset(); setIsForgot(false); }} />
            </>
          ) : (
            <>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <LinkText
                title={isSignUp ? 'Sign in' : 'Create one'}
                onPress={() => { reset(); setIsSignUp(!isSignUp); }}
              />
            </>
          )}
        </Text>

        {router.canGoBack() ? (
          <Text style={styles.footer}>
            <LinkText title="← Back" onPress={() => router.back()} />
          </Text>
        ) : null}
      </View>
    </AuthShell>
  );
}


