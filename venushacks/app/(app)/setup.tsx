import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type Stage = 'Pregnant' | 'Postpartum';

export default function SetupScreen() {
  const router  = useRouter();
  const { user } = useUser();

  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [stage,        setStage]        = useState<Stage>('Pregnant');
  const [imageUri,     setImageUri]     = useState<string | null>(null);
  const [imageBase64,  setImageBase64]  = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(`data:${result.assets[0].mimeType ?? 'image/jpeg'};base64,${result.assets[0].base64}`);
    }
  }

  async function handleComplete() {
    if (!isValid || loading || !user) return;
    setLoading(true);

    try {
      // Update name + stage metadata
      await user.update({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        unsafeMetadata: { stage },
      });

      // Upload profile image if one was selected
      if (imageBase64) {
        try {
          await user.setProfileImage({ file: imageBase64 });
        } catch (err) {
          console.error("Failed to upload image:", err);
          // Image upload failure is non-fatal — name was already saved
        }
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert(
        'Setup failed',
        err?.errors?.[0]?.longMessage ?? 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
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
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <FontAwesome name="heartbeat" size={26} color="#9B59B6" />
            </View>
            <Text style={styles.welcomeEyebrow}>Welcome to Kardia</Text>
            <Text style={styles.title}>Set up your profile</Text>
            <Text style={styles.subtitle}>
              This helps us personalise your experience and give you the most relevant insights.
            </Text>
          </View>

          {/* ── Avatar picker ── */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.8}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <FontAwesome name="user" size={36} color="#C5BAD0" />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <FontAwesome name="camera" size={12} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to add a photo</Text>
          </View>

          {/* ── Name inputs ── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Your Name</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>First name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="e.g. Maya"
                placeholderTextColor="#C5BAD0"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={[styles.fieldGroup, { marginTop: 14 }]}>
              <Text style={styles.fieldLabel}>Last name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="e.g. Rivera"
                placeholderTextColor="#C5BAD0"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* ── Stage picker ── */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Current Stage</Text>
            <Text style={styles.stageHint}>
              We'll tailor your health insights to your stage of the journey.
            </Text>
            <View style={styles.toggle}>
              {(['Pregnant', 'Postpartum'] as Stage[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.toggleOption, stage === s && styles.toggleActive]}
                  onPress={() => setStage(s)}
                  activeOpacity={0.8}
                >
                  <FontAwesome
                    name={s === 'Pregnant' ? 'heart' : 'star'}
                    size={13}
                    color={stage === s ? '#fff' : '#9B59B6'}
                  />
                  <Text style={[styles.toggleText, stage === s && styles.toggleTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Complete button ── */}
          <TouchableOpacity
            style={[styles.completeBtn, (!isValid || loading) && styles.completeBtnDisabled]}
            onPress={handleComplete}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="check" size={15} color="#fff" />
                <Text style={styles.completeBtnText}>Complete Setup</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.privacyNote}>
            Your information is stored securely and never shared without your consent.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PURPLE = '#9B59B6';

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F8F4F9' },
  flex:      { flex: 1 },
  container: { padding: 24, paddingBottom: 48 },

  // Header
  header: { alignItems: 'center', marginBottom: 28, marginTop: 8, gap: 8 },
  logoMark: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#F0E6FA',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  welcomeEyebrow: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 1 },
  title:    { fontSize: 26, fontWeight: '700', color: '#1A1A2E', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 21, paddingHorizontal: 8 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#F0E6FA',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E8D5F5', borderStyle: 'dashed',
  },
  avatarEditBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: PURPLE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#F8F4F9',
  },
  avatarHint: { fontSize: 12, color: '#aaa' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#444',
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12,
  },

  // Inputs
  fieldGroup: {},
  fieldLabel: { fontSize: 12, color: '#888', fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: '#F9F6FC',
    borderWidth: 1.5, borderColor: '#E8E0EE',
    borderRadius: 12, height: 50,
    paddingHorizontal: 14, fontSize: 16,
    color: '#1A1A2E',
  },

  // Stage toggle
  stageHint: { fontSize: 13, color: '#888', lineHeight: 19, marginBottom: 14, marginTop: -4 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F3EEF8',
    borderRadius: 14, padding: 4, gap: 4,
  },
  toggleOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 46, borderRadius: 10,
  },
  toggleActive:     { backgroundColor: PURPLE },
  toggleText:       { fontSize: 14, fontWeight: '600', color: PURPLE },
  toggleTextActive: { color: '#fff' },

  // Complete button
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: PURPLE, borderRadius: 16, height: 56,
    marginTop: 8, marginBottom: 16,
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  completeBtnDisabled: { backgroundColor: '#D5C9E0', shadowOpacity: 0 },
  completeBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },

  privacyNote: { textAlign: 'center', fontSize: 11, color: '#bbb', lineHeight: 17 },
});
