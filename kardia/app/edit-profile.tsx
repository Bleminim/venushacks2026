import { useEffect, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors, Fonts } from '@/constants/theme';

export default function EditProfileScreen() {
  const router   = useRouter();
  const { user } = useUser();

  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [imageUri,     setImageUri]     = useState<string | null>(null);
  const [imageBase64,  setImageBase64]  = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [loading,      setLoading]      = useState(false);

  // Pre-fill with current Clerk values on mount
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName  ?? '');
    }
  }, [user?.id]);

  const isValid      = firstName.trim().length > 0 && lastName.trim().length > 0;
  const displayImage = imageUri ?? user?.imageUrl ?? null;
  const initials     = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase();

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
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
      setImageChanged(true);
    }
  }

  async function handleSave() {
    if (!isValid || loading || !user) return;
    setLoading(true);

    try {
      await user.update({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
      });

      if (imageChanged && imageBase64) {
        try {
          await user.setProfileImage({ file: imageBase64 });
          await user.reload(); // flush Clerk cache so imageUrl updates immediately
        } catch (err) {
          console.error("Failed to upload image:", err);
          // Image upload is non-fatal; name was already saved
        }
      }

      router.back();
    } catch (err: any) {
      Alert.alert(
        'Update failed',
        err?.errors?.[0]?.longMessage ?? 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
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
            {/* ── Nav row ── */}
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.navTitle}>Edit Profile</Text>
              <TouchableOpacity
                style={[styles.saveBtn, (!isValid || loading) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!isValid || loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Save</Text>
                }
              </TouchableOpacity>
            </View>

            {/* ── Avatar ── */}
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.8}>
                {displayImage ? (
                  <Image source={{ uri: displayImage }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    {initials ? (
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    ) : (
                      <FontAwesome name="user" size={36} color={Colors.borderCard} />
                    )}
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  <FontAwesome name="camera" size={13} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Tap to change photo</Text>
            </View>

            {/* ── Name card ── */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Name</Text>

              <Text style={styles.fieldLabel}>First name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={Colors.borderCard}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />

              <View style={styles.fieldSpacer} />

              <Text style={styles.fieldLabel}>Last name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={Colors.borderCard}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            {/* ── Save Changes (bottom) ── */}
            <TouchableOpacity
              style={[styles.primaryBtn, (!isValid || loading) && styles.primaryBtnDisabled]}
              onPress={handleSave}
              disabled={!isValid || loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Save Changes</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenWrap: { flex: 1 },
  safe:      { flex: 1 },
  flex:      { flex: 1 },
  container: { padding: 20, paddingBottom: 48 },

  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 28,
  },
  cancelBtn:  { paddingVertical: 4, paddingRight: 8 },
  cancelText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textMuted,
  },
  navTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.textDark,
  },
  saveBtn: {
    backgroundColor: Colors.wine, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
    minWidth: 60, alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: Colors.blush },
  saveBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.cream,
  },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrap:    { position: 'relative', marginBottom: 8 },
  avatarImage: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: Colors.blush,
  },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.blush,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.borderCard,
  },
  avatarInitials: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    color: Colors.wine,
  },
  cameraOverlay: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.wine,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.cream,
  },
  avatarHint: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
  },

  card: {
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: 18,
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  fieldSpacer: { height: 14 },
  input: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: 10,
    height: 50,
    paddingHorizontal: 14,
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.textDark,
  },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.wine, borderRadius: 10, height: 56,
    shadowColor: Colors.wine, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
  },
  primaryBtnDisabled: { backgroundColor: Colors.blush, shadowOpacity: 0 },
  primaryBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.cream,
  },
});
