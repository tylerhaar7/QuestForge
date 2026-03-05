import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';

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

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.bg.primary} />
            ) : (
              <Text style={styles.buttonText}>
                {isRegister ? 'CREATE ACCOUNT' : 'SIGN IN'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.toggle}
            onPress={() => { setIsRegister(!isRegister); setError(null); }}
          >
            <Text style={styles.toggleText}>
              {isRegister ? 'Already have an account? Sign in' : "New adventurer? Create account"}
            </Text>
          </Pressable>
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
  button: {
    backgroundColor: colors.gold.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...textStyles.buttonLabel,
    color: colors.bg.primary,
    fontSize: 14,
    fontFamily: fonts.heading,
  },
  toggle: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.gold.muted,
  },
});
