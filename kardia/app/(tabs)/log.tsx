import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useHealth, LogEntry, MealTiming } from '@/context/HealthContext';
import { getBPStatus, getGlucoseStatus } from '@/utils/healthColors';
import { Colors, Fonts } from '@/constants/theme';
import { FadeCard } from '@/components/FadeCard';

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function NumericInput({
  value, onChangeText, placeholder, maxLength = 4,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  maxLength?: number;
}) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.borderCard}
      keyboardType="numeric"
      maxLength={maxLength}
      returnKeyType="done"
    />
  );
}

interface LogCardProps {
  entry: LogEntry;
  onEdit: (entry: LogEntry) => void;
}

function LogCard({ entry, onEdit }: LogCardProps) {
  const bp  = getBPStatus(entry.systolic, entry.diastolic);
  const glc = getGlucoseStatus(entry.glucose, entry.mealTiming);

  return (
    <View style={[styles.logCard, { backgroundColor: bp.bgColor }]}>
      <View style={[styles.logBar, { backgroundColor: bp.borderColor }]} />

      <View style={styles.logBody}>
        <View style={styles.logHeaderRow}>
          <Text style={styles.logDate}>{entry.date}</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => onEdit(entry)}
            activeOpacity={0.7}
          >
            <FontAwesome name="pencil" size={12} color={Colors.wine} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logBPRow}>
          <Text style={[styles.logBPValue, { color: bp.color }]}>
            {entry.systolic}/{entry.diastolic}
          </Text>
          <Text style={styles.logBPUnit}>mmHg</Text>
          <View style={[styles.logBadge, { backgroundColor: bp.color + '22' }]}>
            <Text style={[styles.logBadgeText, { color: bp.color }]}>{bp.label}</Text>
          </View>
        </View>

        <View style={styles.logMetaRow}>
          <View style={styles.logMetaItem}>
            <FontAwesome name="tint" size={11} color={glc.color} />
            <Text style={styles.logMetaLabel}>
              {entry.mealTiming === 'pre' ? 'Pre-meal' : 'Post-meal'} glucose
            </Text>
            <Text style={[styles.logMetaValue, { color: glc.color }]}>
              {entry.glucose} mg/dL
            </Text>
          </View>
          {entry.a1c !== null && (
            <View style={styles.logMetaItem}>
              <FontAwesome name="flask" size={11} color={Colors.burgundy} />
              <Text style={styles.logMetaLabel}>A1C</Text>
              <Text style={[styles.logMetaValue, { color: Colors.burgundy }]}>
                {entry.a1c}%
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LogScreen() {
  const { top }  = useSafeAreaInsets();
  const listRef  = useRef<FlatList>(null);
  const { logs, addLog, updateLog } = useHealth();

  // Form state
  const [systolic,   setSystolic]   = useState('');
  const [diastolic,  setDiastolic]  = useState('');
  const [glucose,    setGlucose]    = useState('');
  const [mealTiming, setMealTiming] = useState<MealTiming>('pre');
  const [a1c,        setA1c]        = useState('');
  const [editingId,  setEditingId]  = useState<string | null>(null);

  const isFormValid =
    systolic.trim() !== '' &&
    diastolic.trim() !== '' &&
    glucose.trim() !== '';

  const editingEntry = editingId ? logs.find((l) => l.id === editingId) : null;

  function populateForm(entry: LogEntry) {
    setSystolic(String(entry.systolic));
    setDiastolic(String(entry.diastolic));
    setGlucose(String(entry.glucose));
    setMealTiming(entry.mealTiming);
    setA1c(entry.a1c !== null ? String(entry.a1c) : '');
    setEditingId(entry.id);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }

  function cancelEdit() {
    setEditingId(null);
    resetForm();
  }

  function resetForm() {
    setSystolic('');
    setDiastolic('');
    setGlucose('');
    setMealTiming('pre');
    setA1c('');
  }

  function handleSave() {
    if (!isFormValid) return;

    const sys    = parseInt(systolic,  10);
    const dia    = parseInt(diastolic, 10);
    const glc    = parseInt(glucose,   10);
    const a1cVal = a1c.trim() ? parseFloat(a1c) : null;

    const fields = { systolic: sys, diastolic: dia, glucose: glc, mealTiming, a1c: a1cVal };

    if (editingId) {
      updateLog(editingId, fields);
      setEditingId(null);
    } else {
      addLog(fields);
    }

    resetForm();
  }

  const ListHeader = (
    <View>
      <FadeCard delay={0} style={styles.header}>
        <Text style={styles.headerEyebrow}>Daily Check-In</Text>
        <Text style={styles.headerTitle}>Log a Reading</Text>
        <Text style={styles.headerSub}>
          Consistent tracking helps your care team spot patterns early.
        </Text>
      </FadeCard>

      {editingEntry && (
        <View style={styles.editBanner}>
          <FontAwesome name="pencil-square-o" size={14} color={Colors.wine} />
          <Text style={styles.editBannerText} numberOfLines={1}>
            Editing: {editingEntry.date}
          </Text>
          <TouchableOpacity onPress={cancelEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FontAwesome name="times" size={16} color={Colors.wine} />
          </TouchableOpacity>
        </View>
      )}

      <FadeCard delay={100} style={styles.formCard}>
        <Text style={styles.sectionLabel}>Blood Pressure</Text>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <FieldLabel>Systolic (top)</FieldLabel>
            <NumericInput value={systolic} onChangeText={setSystolic} placeholder="120" />
          </View>
          <View style={styles.halfField}>
            <FieldLabel>Diastolic (bottom)</FieldLabel>
            <NumericInput value={diastolic} onChangeText={setDiastolic} placeholder="80" />
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Glucose</Text>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <FieldLabel>Level (mg/dL)</FieldLabel>
            <NumericInput value={glucose} onChangeText={setGlucose} placeholder="100" />
          </View>
          <View style={styles.halfField}>
            <FieldLabel>Meal Timing</FieldLabel>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleOption, mealTiming === 'pre' && styles.toggleActive]}
                onPress={() => setMealTiming('pre')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, mealTiming === 'pre' && styles.toggleTextActive]}>
                  Pre-meal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleOption, mealTiming === 'post' && styles.toggleActive]}
                onPress={() => setMealTiming('post')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, mealTiming === 'post' && styles.toggleTextActive]}>
                  Post-meal
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>
          A1C{' '}
          <Text style={styles.optionalTag}>(quarterly — optional)</Text>
        </Text>
        <NumericInput value={a1c} onChangeText={setA1c} placeholder="e.g. 5.7" maxLength={4} />
        <Text style={styles.a1cHint}>
          Only log when your doctor orders this test (~every 3 months).
        </Text>

        <TouchableOpacity
          style={[styles.saveBtn, !isFormValid && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isFormValid}
          activeOpacity={0.85}
        >
          <FontAwesome name={editingId ? 'check' : 'plus'} size={15} color="#fff" />
          <Text style={styles.saveBtnText}>
            {editingId ? 'Update Log' : 'Save Log'}
          </Text>
        </TouchableOpacity>
      </FadeCard>

      <FadeCard delay={200} style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Recent Readings</Text>
        <Text style={styles.historyCount}>{logs.length} entries</Text>
      </FadeCard>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={88}
    >
      <View style={styles.flex}>
        <LinearGradient
          colors={['#FBF7F0', '#F5EFE6', '#F0DDD0']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <FlatList
          ref={listRef}
          style={styles.scroll}
          contentContainerStyle={[styles.container, { paddingTop: top + 20 }]}
          data={logs}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          renderItem={({ item, index }) => (
            <FadeCard delay={300 + index * 50}>
              <LogCard entry={item} onEdit={populateForm} />
            </FadeCard>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListFooterComponent={<View style={{ height: 32 }} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 130 },

  header: { marginBottom: 16, marginTop: 4 },
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

  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.blush,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  editBannerText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.wine,
  },

  formCard: {
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: 20,
    marginBottom: 22,
  },
  sectionLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 13,
    color: Colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  optionalTag: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'none',
    letterSpacing: 0,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  fieldLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    fontFamily: Fonts.semibold,
    fontSize: 17,
    color: Colors.textDark,
  },

  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: 10,
    height: 48,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderCard,
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  toggleActive: {
    backgroundColor: Colors.wine,
    margin: 3,
    borderRadius: 7,
  },
  toggleText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.wine,
  },
  toggleTextActive: { color: Colors.cream },

  divider: { height: 1, backgroundColor: Colors.borderCard, marginVertical: 18 },
  a1cHint: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.wine,
    borderRadius: 10,
    height: 52,
    marginTop: 22,
  },
  saveBtnDisabled: { backgroundColor: Colors.blush },
  saveBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.cream,
  },

  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  historyTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 18,
    color: Colors.textDark,
  },
  historyCount: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },

  logCard: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: Colors.burgundy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  logBar: { width: 5 },
  logBody: { flex: 1, padding: 14 },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logDate: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
    marginRight: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.blush,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  editBtnText: {
    fontFamily: Fonts.semibold,
    fontSize: 12,
    color: Colors.wine,
  },

  logBPRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  logBPValue: {
    fontFamily: Fonts.bold,
    fontSize: 26,
  },
  logBPUnit: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  logBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  logBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
  },

  logMetaRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  logMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  logMetaLabel: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.textMuted,
  },
  logMetaValue: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
});
