import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { FantasyButton } from '@/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError(null);

    if (isRegister) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.replace('/');
  }, [email, password, isRegister, router]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>QuestForge</Text>
        <Text style={styles.subtitle}>
          {isRegister ? 'Begin your legend' : 'Welcome back, adventurer'}
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="adventurer@questforge.com"
            placeholderTextColor={colors.text.disabled}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.text.disabled}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <FantasyButton
            variant="primary"
            label={isRegister ? 'CREATE ACCOUNT' : 'SIGN IN'}
            onPress={handleSubmit}
            disabled={loading}
            style={styles.submitButton}
          />
          {loading && (
            <ActivityIndicator size="small" color={colors.gold.primary} style={styles.loadingIndicator} />
          )}

          <FantasyButton
            variant="secondary"
            label={isRegister ? 'ALREADY HAVE AN ACCOUNT' : 'NEW ADVENTURER'}
            onPress={() => { setIsRegister(!isRegister); setError(null); }}
            style={styles.toggleButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    textAlign: 'center',
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.narrative,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  form: {
    width: '100%',
  },
  label: {
    ...textStyles.sectionLabel,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg.secondary,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.combat.red,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
  toggleButton: {
    marginTop: spacing.md,
  },
});
