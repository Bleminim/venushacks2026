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
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function EditProfileScreen() {
  const router   = useRouter();
  const { user } = useUser();

  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [imageUri,     setImageUri]     = useState<string | null>(null);
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
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
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

      if (imageChanged && imageUri) {
        try {
          const response = await fetch(imageUri);
          const blob     = await response.blob();
          await user.setProfileImage({ file: blob });
          await user.reload(); // flush Clerk cache so imageUrl updates immediately
        } catch {
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
                    <FontAwesome name="user" size={36} color="#C5BAD0" />
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
              placeholderTextColor="#C5BAD0"
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
              placeholderTextColor="#C5BAD0"
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
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PURPLE = '#9B59B6';

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F8F4F9' },
  flex:      { flex: 1 },
  container: { padding: 20, paddingBottom: 48 },

  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 28,
  },
  cancelBtn:       { paddingVertical: 4, paddingRight: 8 },
  cancelText:      { fontSize: 15, color: '#888', fontWeight: '500' },
  navTitle:        { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  saveBtn: {
    backgroundColor: PURPLE, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
    minWidth: 60, alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#D5C9E0' },
  saveBtnText:     { fontSize: 14, fontWeight: '700', color: '#fff' },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrap:    { position: 'relative', marginBottom: 8 },
  avatarImage: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, borderColor: '#E8D5F5',
  },
  avatarPlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#E8D5F5',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#D7BDE2',
  },
  avatarInitials: { fontSize: 32, fontWeight: '700', color: PURPLE },
  cameraOverlay: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: PURPLE,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#F8F4F9',
  },
  avatarHint: { fontSize: 13, color: '#aaa', fontWeight: '500' },

  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#444',
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 14,
  },
  fieldLabel:  { fontSize: 12, color: '#888', fontWeight: '500', marginBottom: 6 },
  fieldSpacer: { height: 14 },
  input: {
    backgroundColor: '#F9F6FC', borderWidth: 1.5, borderColor: '#E8E0EE',
    borderRadius: 12, height: 50, paddingHorizontal: 14,
    fontSize: 16, color: '#1A1A2E',
  },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: PURPLE, borderRadius: 16, height: 56,
    shadowColor: PURPLE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
  },
  primaryBtnDisabled: { backgroundColor: '#D5C9E0', shadowOpacity: 0 },
  primaryBtnText:     { fontSize: 17, fontWeight: '700', color: '#fff' },
});
