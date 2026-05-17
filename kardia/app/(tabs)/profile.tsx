import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';

import { Colors, Fonts } from '@/constants/theme';
import { FadeCard } from '@/components/FadeCard';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsRow({
  icon, label, onPress, isLast,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.settingsLeft}>
          <View style={styles.iconWrap}>
            <FontAwesome name={icon as any} size={15} color={Colors.wine} />
          </View>
          <Text style={styles.settingsLabel}>{label}</Text>
        </View>
        <FontAwesome name="chevron-right" size={11} color={Colors.borderCard} />
      </TouchableOpacity>
      {!isLast && <View style={styles.rowDivider} />}
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { top }     = useSafeAreaInsets();
  const router      = useRouter();
  const { signOut } = useAuth();
  const { user }    = useUser();

  const firstName  = user?.firstName ?? '';
  const lastName   = user?.lastName  ?? '';
  const fullName   = [firstName, lastName].filter(Boolean).join(' ') || 'Your Name';
  const email      = user?.primaryEmailAddress?.emailAddress ?? '';
  const initials   = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase();

  function comingSoon(feature: string) {
    Alert.alert(feature, 'This feature is coming in a future update.', [{ text: 'OK' }]);
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try { await signOut(); }
          catch { Alert.alert('Error', 'Could not sign out. Please try again.'); }
        },
      },
    ]);
  }

  return (
    <View style={styles.screenWrap}>
      <LinearGradient
        colors={['#FBF7F0', '#F5EFE6', '#F0DDD0']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>Account</Text>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSub}>Manage your settings and health data.</Text>
        </View>

        {/* ── Profile card ── */}
        <FadeCard delay={0} style={[styles.card, styles.profileCard]}>
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatarImage} />
          ) : initials ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          ) : (
            <View style={styles.avatar}>
              <FontAwesome name="user" size={24} color={Colors.borderCard} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{fullName}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/edit-profile')}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </FadeCard>

        {/* ── Settings ── */}
        <Text style={styles.sectionLabel}>Settings</Text>
        <FadeCard delay={100} style={styles.card}>
          <SettingsRow
            icon="lock"
            label="Privacy Settings"
            onPress={() => comingSoon('Privacy Settings')}
          />
          <SettingsRow
            icon="file-text-o"
            label="Export Health Data"
            onPress={() => comingSoon('Export Health Data')}
          />
          <SettingsRow
            icon="bell-o"
            label="Notifications"
            onPress={() => comingSoon('Notifications')}
          />
          <SettingsRow
            icon="question-circle-o"
            label="Help & Support"
            onPress={() => comingSoon('Help & Support')}
            isLast
          />
        </FadeCard>

        {/* ── Data protection badge ── */}
        <FadeCard delay={200} style={styles.badge}>
          <FontAwesome name="shield" size={13} color={Colors.wine} />
          <Text style={styles.badgeText}>
            Your health data is protected and encrypted.
          </Text>
        </FadeCard>

        {/* ── Sign out ── */}
        <FadeCard delay={300}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
            <FontAwesome name="sign-out" size={16} color="#fff" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </FadeCard>

        <Text style={styles.version}>Kardia · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenWrap: { flex: 1 },
  scroll:    { flex: 1 },
  container: { padding: 20, paddingBottom: 130 },

  // Header
  header: { marginBottom: 20, marginTop: 4 },
  headerEyebrow: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: 'rgba(140,58,77,0.5)',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 25,
    color: Colors.textDark,
    marginTop: 2,
  },
  headerSub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 19,
  },

  // Cards
  card: {
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: 16,
    marginBottom: 14,
  },

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage:  { width: 52, height: 52, borderRadius: 26 },
  avatarText: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.wine,
  },
  profileInfo:  { flex: 1, marginLeft: 14 },
  profileName: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 3,
  },
  profileEmail: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  editLink: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.wine,
  },

  // Section label
  sectionLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },

  // Settings rows
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconWrap:     { width: 28, alignItems: 'center' },
  settingsLabel: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textDark,
  },
  rowDivider: { height: 1, backgroundColor: Colors.borderCard, marginLeft: 42 },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.blush,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
  },
  badgeText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.wine,
    lineHeight: 17,
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.burgundy,
    borderRadius: 10,
    height: 52,
    marginBottom: 24,
    shadowColor: Colors.burgundy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  signOutText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.cream,
  },

  version: {
    textAlign: 'center',
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: 'rgba(0,0,0,0.4)',
  },
});
