import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors, Fonts } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.screenWrap}>
      <LinearGradient
        colors={['#FBF7F0', '#F5EFE6', '#F0DDD0', '#E8C4B8']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.container}>

          {/* ── Logo mark ── */}
          <View style={styles.logoArea}>
            <View style={styles.ring3} />
            <View style={styles.ring2} />
            <View style={styles.ring1} />
            <FontAwesome name="heartbeat" size={38} color={Colors.wine} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrap: { flex: 1 },
  safe: {
    flex: 1,
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
    backgroundColor: `${Colors.wine}12`,
  },
  ring2: {
    position: 'absolute',
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: `${Colors.wine}20`,
  },
  ring1: {
    position: 'absolute',
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: `${Colors.wine}32`,
  },

  // Brand
  brandBlock: { alignItems: 'center', gap: 4 },
  appName: {
    fontFamily: Fonts.bold,
    fontSize: 52,
    color: Colors.textDark,
    letterSpacing: -1,
  },
  appSub: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.wine,
    letterSpacing: 1.5,
  },

  // Tagline
  taglineBlock: { alignItems: 'center', gap: 12 },
  tagline: {
    fontFamily: Fonts.semibold,
    fontSize: 20,
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 28,
  },
  taglineBody: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },

  // Buttons
  buttonBlock: { width: '100%', gap: 12 },
  primaryBtn: {
    backgroundColor: Colors.wine,
    borderRadius: 10,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.wine,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.cream,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: Colors.cream,
    borderRadius: 10,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.blush,
  },
  secondaryBtnText: {
    fontFamily: Fonts.semibold,
    fontSize: 17,
    color: Colors.wine,
  },

  // Footer
  footerText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.borderCard,
    textAlign: 'center',
    lineHeight: 17,
  },
  footerLink: {
    color: Colors.wine,
    fontFamily: Fonts.regular,
  },
});
