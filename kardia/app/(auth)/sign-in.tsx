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
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSignIn } from '@clerk/clerk-expo';

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

export default function SignInScreen() {
  const router = useRouter();
  const { signIn: clerkSignIn, setActive, isLoaded } = useSignIn();

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const isValid = email.trim().length > 0 && password.length > 0;

  async function handleSignIn() {
    if (!isValid || loading || !isLoaded || !clerkSignIn) return;
    setLoading(true);
    setError('');

    try {
      const result = await clerkSignIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId });
        // InitialLayout's auth guard detects isSignedIn → true and redirects to (tabs).
      } else {
        setError('Sign-in incomplete. Please try again.');
      }
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage ??
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth() {
    Alert.alert('Coming Soon', 'Social sign-in will be available in a future update.', [{ text: 'OK' }]);
  }

  return (
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
            <FontAwesome name="chevron-left" size={14} color="#9B59B6" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue tracking your heart health.
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
                placeholderTextColor="#C5BAD0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  placeholder="Your password"
                  placeholderTextColor="#C5BAD0"
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPass((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <FontAwesome
                    name={showPass ? 'eye-slash' : 'eye'}
                    size={16}
                    color="#C5BAD0"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {error !== '' && (
              <View style={styles.errorBox}>
                <FontAwesome name="exclamation-circle" size={14} color="#C0392B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.primaryBtn, (!isValid || loading) && styles.primaryBtnDisabled]}
              onPress={handleSignIn}
              disabled={!isValid || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Sign In</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or sign in with</Text>
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

          {/* Sign up link */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>New to Kardia?</Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
              <Text style={styles.switchLink}> Create Account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PURPLE = '#9B59B6';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F4F9' },
  flex: { flex: 1 },
  container: { padding: 24, paddingBottom: 40 },

  backBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: 28, alignSelf: 'flex-start',
  },
  backText: { fontSize: 15, color: PURPLE, fontWeight: '500' },

  header: { marginBottom: 28, gap: 6 },
  title:    { fontSize: 30, fontWeight: '700', color: '#1A1A2E', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#666', lineHeight: 22 },

  // Form
  form: { gap: 18, marginBottom: 28 },
  fieldGroup: { gap: 7 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
  passwordLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  forgotLink: { fontSize: 13, color: PURPLE, fontWeight: '500' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8E0EE',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A2E',
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: {
    position: 'absolute', right: 14,
    top: 0, bottom: 0, justifyContent: 'center',
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FDEDEC', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: '#FADBD8',
  },
  errorText: { flex: 1, fontSize: 13, color: '#C0392B', lineHeight: 18 },

  primaryBtn: {
    backgroundColor: PURPLE, borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  primaryBtnDisabled: { backgroundColor: '#D5C9E0', shadowOpacity: 0 },
  primaryBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8E0EE' },
  dividerLabel: { fontSize: 12, color: '#aaa', fontWeight: '500' },

  // OAuth
  oauthGroup: { gap: 12, marginBottom: 32 },
  oauthBtn: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 14, paddingHorizontal: 20, gap: 12,
  },
  oauthIcon: { width: 24, alignItems: 'center' },
  oauthText: { fontSize: 15, fontWeight: '600' },

  oauthGoogle: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E0D8E8' },
  oauthGoogleText: { color: '#333' },

  oauthApple: { backgroundColor: '#1A1A2E' },
  oauthFacebook: { backgroundColor: '#1877F2' },
  oauthDarkText: { color: '#fff' },

  // Switch
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { fontSize: 14, color: '#888' },
  switchLink: { fontSize: 14, color: PURPLE, fontWeight: '700' },
});
