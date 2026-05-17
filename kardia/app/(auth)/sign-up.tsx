import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSignUp } from '@clerk/clerk-expo';

import { Colors, Fonts } from '@/constants/theme';

// ─── OAuth button ─────────────────────────────────────────────────────────────

function OAuthButton({
  label, icon, onPress, style, textStyle,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  style?: object;
  textStyle?: object;
}) {
  return (
    <TouchableOpacity style={[styles.oauthBtn, style]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.oauthIcon}>{icon}</View>
      <Text style={[styles.oauthText, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const isValid = email.trim().length > 0 && password.length >= 8;

  async function handleSignUp() {
    if (!isValid || loading || !isLoaded || !signUp) return;
    setLoading(true);
    setError('');

    try {
      const result = await signUp.create({ emailAddress: email, password });
      if (result.createdSessionId) {
        await setActive!({ session: result.createdSessionId });
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth() {
    Alert.alert('Coming Soon', 'Social sign-in will be available in a future update.', [{ text: 'OK' }]);
  }

  return (
    <View style={styles.screenWrap}>
      <LinearGradient
        colors={['#FBF7F0', '#F5EFE6', '#F0DDD0']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <FontAwesome name="chevron-left" size={14} color={Colors.wine} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>
                Start understanding your heart health today.
              </Text>
            </View>

            {/* Email / Password form */}
            <View style={styles.form}>
              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.borderCard}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(''); }}
                    placeholder="At least 8 characters"
                    placeholderTextColor={Colors.borderCard}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPass((v) => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <FontAwesome
                      name={showPass ? 'eye-slash' : 'eye'}
                      size={16}
                      color={Colors.borderCard}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordHint}>Minimum 8 characters</Text>
              </View>

              {/* Error */}
              {error !== '' && (
                <View style={styles.errorBox}>
                  <FontAwesome name="exclamation-circle" size={14} color={Colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                style={[styles.primaryBtn, (!isValid || loading) && styles.primaryBtnDisabled]}
                onPress={handleSignUp}
                disabled={!isValid || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>Create Account</Text>
                }
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* OAuth */}
            <View style={styles.oauthGroup}>
              <OAuthButton
                label="Continue with Google"
                icon={<Ionicons name="logo-google" size={19} color="#EA4335" />}
                onPress={handleOAuth}
                style={styles.oauthGoogle}
                textStyle={styles.oauthGoogleText}
              />
              <OAuthButton
                label="Continue with Apple"
                icon={<Ionicons name="logo-apple" size={20} color="#fff" />}
                onPress={handleOAuth}
                style={styles.oauthApple}
                textStyle={styles.oauthDarkText}
              />
              <OAuthButton
                label="Continue with Facebook"
                icon={<Ionicons name="logo-facebook" size={20} color="#fff" />}
                onPress={handleOAuth}
                style={styles.oauthFacebook}
                textStyle={styles.oauthDarkText}
              />
            </View>

            {/* Sign in link */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
                <Text style={styles.switchLink}> Log In</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenWrap: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { padding: 24, paddingBottom: 40 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: 28, alignSelf: 'flex-start',
  },
  backText: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.wine },

  header: { marginBottom: 28, gap: 6 },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 30,
    color: Colors.textDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 22,
  },

  // Form
  form: { gap: 18, marginBottom: 28 },
  fieldGroup: { gap: 7 },
  fieldLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.ivory,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 16,
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.textDark,
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: {
    position: 'absolute', right: 14,
    top: 0, bottom: 0, justifyContent: 'center',
  },
  passwordHint: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.dangerBg, borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: Colors.dangerBorder,
  },
  errorText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.danger,
    lineHeight: 18,
  },

  primaryBtn: {
    backgroundColor: Colors.wine,
    borderRadius: 10,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.wine,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnDisabled: { backgroundColor: Colors.blush, shadowOpacity: 0 },
  primaryBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.cream,
  },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.borderCard },
  dividerLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // OAuth
  oauthGroup: { gap: 12, marginBottom: 32 },
  oauthBtn: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 10, paddingHorizontal: 20, gap: 12,
  },
  oauthIcon: { width: 24, alignItems: 'center' },
  oauthText: { fontFamily: Fonts.semibold, fontSize: 15 },

  oauthGoogle: { backgroundColor: Colors.ivory, borderWidth: 1, borderColor: Colors.borderCard },
  oauthGoogleText: { color: Colors.textDark },

  oauthApple: { backgroundColor: Colors.burgundy },
  oauthFacebook: { backgroundColor: '#1877F2' },
  oauthDarkText: { color: Colors.cream },

  // Switch
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMuted,
  },
  switchLink: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.wine,
  },
});
