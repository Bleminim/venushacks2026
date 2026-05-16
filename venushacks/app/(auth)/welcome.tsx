import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>

        {/* ── Logo mark ── */}
        <View style={styles.logoArea}>
          <View style={styles.ring3} />
          <View style={styles.ring2} />
          <View style={styles.ring1} />
          <FontAwesome name="heartbeat" size={38} color="#9B59B6" />
        </View>

        {/* ── Brand ── */}
        <View style={styles.brandBlock}>
          <Text style={styles.appName}>Kardia</Text>
          <Text style={styles.appSub}>καρδιά · heart</Text>
        </View>

        {/* ── Tagline ── */}
        <View style={styles.taglineBlock}>
          <Text style={styles.tagline}>
            Your maternal heart health,{'\n'}understood and advocated for.
          </Text>
          <Text style={styles.taglineBody}>
            Track your blood pressure, glucose, and A1C. Translate the numbers into
            plain-language insights — and the words to speak up at every appointment.
          </Text>
        </View>

        {/* ── CTA buttons ── */}
        <View style={styles.buttonBlock}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(auth)/sign-up')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Log In</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <Text style={styles.footerText}>
          By continuing, you agree to our{' '}
          <Text style={styles.footerLink}>Privacy Policy</Text>
          {' '}and{' '}
          <Text style={styles.footerLink}>Terms of Service</Text>.
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F4F9',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 24,
    gap: 28,
  },

  // Logo
  logoArea: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring3: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#9B59B612',
  },
  ring2: {
    position: 'absolute',
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#9B59B620',
  },
  ring1: {
    position: 'absolute',
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#9B59B632',
  },

  // Brand
  brandBlock: { alignItems: 'center', gap: 4 },
  appName: {
    fontSize: 52,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -1,
  },
  appSub: {
    fontSize: 14,
    color: '#9B59B6',
    letterSpacing: 1.5,
    fontWeight: '500',
  },

  // Tagline
  taglineBlock: { alignItems: 'center', gap: 12 },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A2E',
    textAlign: 'center',
    lineHeight: 28,
  },
  taglineBody: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 21,
  },

  // Buttons
  buttonBlock: { width: '100%', gap: 12 },
  primaryBtn: {
    backgroundColor: '#9B59B6',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9B59B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D7BDE2',
  },
  secondaryBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#9B59B6',
  },

  // Footer
  footerText: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 17,
  },
  footerLink: {
    color: '#9B59B6',
    fontWeight: '500',
  },
});
