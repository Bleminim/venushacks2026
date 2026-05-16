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
import FontAwesome from '@expo/vector-icons/FontAwesome';

// ─── Types ────────────────────────────────────────────────────────────────────

type MealTiming = 'pre' | 'post';

interface LogEntry {
  id: string;
  date: string;
  systolic: number;
  diastolic: number;
  glucose: number;
  mealTiming: MealTiming;
  a1c: number | null; // quarterly — often absent
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_LOGS: LogEntry[] = [
  {
    id: '1',
    date: 'May 14, 2026 · 8:22 AM',
    systolic: 138, diastolic: 89,
    glucose: 102, mealTiming: 'pre',
    a1c: null,
  },
  {
    id: '2',
    date: 'May 12, 2026 · 7:45 PM',
    systolic: 142, diastolic: 92,
    glucose: 118, mealTiming: 'post',
    a1c: null,
  },
  {
    id: '3',
    date: 'May 10, 2026 · 9:10 AM',
    systolic: 136, diastolic: 88,
    glucose: 98, mealTiming: 'pre',
    a1c: 5.9,
  },
  {
    id: '4',
    date: 'May 7, 2026 · 8:05 AM',
    systolic: 140, diastolic: 90,
    glucose: 105, mealTiming: 'pre',
    a1c: null,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNow(): string {
  const d = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${h}:${m} ${ampm}`;
}

function classifyBP(sys: number, dia: number) {
  if (sys >= 140 || dia >= 90)
    return { label: 'Stage 2 High',  color: '#C0392B', bg: '#FDEDEC', bar: '#E74C3C' };
  if (sys >= 130 || dia >= 80)
    return { label: 'Stage 1 High',  color: '#D35400', bg: '#FEF5EC', bar: '#E67E22' };
  if (sys >= 120)
    return { label: 'Elevated',       color: '#B7770D', bg: '#FFFDE7', bar: '#F1C40F' };
  return   { label: 'Normal',         color: '#1E8449', bg: '#EAFAF1', bar: '#27AE60' };
}

function classifyGlucose(value: number, timing: MealTiming) {
  // pre-meal fasting thresholds
  if (timing === 'pre') {
    if (value >= 126) return { label: 'High',    color: '#C0392B' };
    if (value >= 100) return { label: 'Elevated', color: '#D35400' };
    return               { label: 'Normal',    color: '#1E8449' };
  }
  // post-meal (2 h) thresholds
  if (value >= 200) return { label: 'High',    color: '#C0392B' };
  if (value >= 140) return { label: 'Elevated', color: '#D35400' };
  return               { label: 'Normal',    color: '#1E8449' };
}

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
      placeholderTextColor="#C5BAD0"
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
  const bp  = classifyBP(entry.systolic, entry.diastolic);
  const glc = classifyGlucose(entry.glucose, entry.mealTiming);

  return (
    <View style={[styles.logCard, { backgroundColor: bp.bg }]}>
      {/* left colour bar */}
      <View style={[styles.logBar, { backgroundColor: bp.bar }]} />

      <View style={styles.logBody}>
        {/* header row */}
        <View style={styles.logHeaderRow}>
          <Text style={styles.logDate}>{entry.date}</Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => onEdit(entry)}
            activeOpacity={0.7}
          >
            <FontAwesome name="pencil" size={12} color="#6C3483" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* BP reading */}
        <View style={styles.logBPRow}>
          <Text style={[styles.logBPValue, { color: bp.color }]}>
            {entry.systolic}/{entry.diastolic}
          </Text>
          <Text style={styles.logBPUnit}>mmHg</Text>
          <View style={[styles.logBadge, { backgroundColor: bp.color + '22' }]}>
            <Text style={[styles.logBadgeText, { color: bp.color }]}>{bp.label}</Text>
          </View>
        </View>

        {/* Glucose + A1C row */}
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
              <FontAwesome name="flask" size={11} color="#2471A3" />
              <Text style={styles.logMetaLabel}>A1C</Text>
              <Text style={[styles.logMetaValue, { color: '#2471A3' }]}>
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
  const listRef = useRef<FlatList>(null);

  // Form state
  const [systolic,   setSystolic]   = useState('');
  const [diastolic,  setDiastolic]  = useState('');
  const [glucose,    setGlucose]    = useState('');
  const [mealTiming, setMealTiming] = useState<MealTiming>('pre');
  const [a1c,        setA1c]        = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Log list
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);

  // ── Derived ────────────────────────────────────────────────────────────────

  const isFormValid =
    systolic.trim() !== '' &&
    diastolic.trim() !== '' &&
    glucose.trim() !== '';

  const editingEntry = editingId ? logs.find((l) => l.id === editingId) : null;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function populateForm(entry: LogEntry) {
    setSystolic(String(entry.systolic));
    setDiastolic(String(entry.diastolic));
    setGlucose(String(entry.glucose));
    setMealTiming(entry.mealTiming);
    setA1c(entry.a1c !== null ? String(entry.a1c) : '');
    setEditingId(entry.id);
    // scroll to top so the form is visible
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

    const sys   = parseInt(systolic,  10);
    const dia   = parseInt(diastolic, 10);
    const glc   = parseInt(glucose,   10);
    const a1cVal = a1c.trim() ? parseFloat(a1c) : null;

    if (editingId) {
      setLogs((prev) =>
        prev.map((l) =>
          l.id === editingId
            ? { ...l, systolic: sys, diastolic: dia, glucose: glc, mealTiming, a1c: a1cVal }
            : l
        )
      );
      setEditingId(null);
    } else {
      const newEntry: LogEntry = {
        id: Date.now().toString(),
        date: formatNow(),
        systolic: sys, diastolic: dia,
        glucose: glc, mealTiming, a1c: a1cVal,
      };
      setLogs((prev) => [newEntry, ...prev]);
    }

    resetForm();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const ListHeader = (
    <View>
      {/* Screen header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Daily Check-In</Text>
        <Text style={styles.headerTitle}>Log a Reading</Text>
        <Text style={styles.headerSub}>
          Consistent tracking helps your care team spot patterns early.
        </Text>
      </View>

      {/* Edit-mode banner */}
      {editingEntry && (
        <View style={styles.editBanner}>
          <FontAwesome name="pencil-square-o" size={14} color="#6C3483" />
          <Text style={styles.editBannerText} numberOfLines={1}>
            Editing: {editingEntry.date}
          </Text>
          <TouchableOpacity onPress={cancelEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FontAwesome name="times" size={16} color="#6C3483" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Form card ── */}
      <View style={styles.formCard}>

        {/* Blood Pressure */}
        <Text style={styles.sectionLabel}>Blood Pressure</Text>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <FieldLabel>Systolic (top)</FieldLabel>
            <NumericInput
              value={systolic}
              onChangeText={setSystolic}
              placeholder="120"
            />
          </View>
          <View style={styles.halfField}>
            <FieldLabel>Diastolic (bottom)</FieldLabel>
            <NumericInput
              value={diastolic}
              onChangeText={setDiastolic}
              placeholder="80"
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Glucose */}
        <Text style={styles.sectionLabel}>Glucose</Text>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <FieldLabel>Level (mg/dL)</FieldLabel>
            <NumericInput
              value={glucose}
              onChangeText={setGlucose}
              placeholder="100"
            />
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

        {/* A1C */}
        <Text style={styles.sectionLabel}>
          A1C{' '}
          <Text style={styles.optionalTag}>(quarterly — optional)</Text>
        </Text>
        <NumericInput
          value={a1c}
          onChangeText={setA1c}
          placeholder="e.g. 5.7"
          maxLength={4}
        />
        <Text style={styles.a1cHint}>
          Only log when your doctor orders this test (~every 3 months).
        </Text>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, !isFormValid && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isFormValid}
          activeOpacity={0.85}
        >
          <FontAwesome
            name={editingId ? 'check' : 'plus'}
            size={15}
            color="#fff"
          />
          <Text style={styles.saveBtnText}>
            {editingId ? 'Update Log' : 'Save Log'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* History header */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Recent Readings</Text>
        <Text style={styles.historyCount}>{logs.length} entries</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={88}
    >
      <FlatList
        ref={listRef}
        style={styles.scroll}
        contentContainerStyle={styles.container}
        data={logs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <LogCard entry={item} onEdit={populateForm} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={<View style={{ height: 32 }} />}
        showsVerticalScrollIndicator={false}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PURPLE = '#9B59B6';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: '#F8F4F9' },
  container: { padding: 20 },

  // Screen header
  header: { marginBottom: 16, marginTop: 4 },
  headerEyebrow: {
    fontSize: 12, color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 26, fontWeight: '700', color: '#1A1A2E', marginTop: 2,
  },
  headerSub: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 19 },

  // Edit banner
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5EEF8',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D7BDE2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  editBannerText: {
    flex: 1, fontSize: 13, color: '#6C3483', fontWeight: '500',
  },

  // Form card
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#444',
    textTransform: 'uppercase', letterSpacing: 0.4,
    marginBottom: 10,
  },
  optionalTag: {
    fontSize: 11, fontWeight: '400', color: '#aaa',
    textTransform: 'none', letterSpacing: 0,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  fieldLabel: {
    fontSize: 12, color: '#888', marginBottom: 6, fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9F6FC',
    borderWidth: 1.5,
    borderColor: '#E8E0EE',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A2E',
  },

  // Pre/Post toggle
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#F3EEF8',
    borderRadius: 12,
    height: 48,
    overflow: 'hidden',
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: PURPLE,
    margin: 3,
    borderRadius: 9,
  },
  toggleText: {
    fontSize: 12, fontWeight: '600', color: '#9B59B6',
  },
  toggleTextActive: { color: '#fff' },

  divider: {
    height: 1, backgroundColor: '#F0EBF5',
    marginVertical: 18,
  },

  a1cHint: {
    fontSize: 11, color: '#bbb', marginTop: 6, lineHeight: 16,
  },

  // Save button
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PURPLE,
    borderRadius: 14,
    height: 52,
    marginTop: 22,
  },
  saveBtnDisabled: { backgroundColor: '#D5C9E0' },
  saveBtnText: {
    fontSize: 16, fontWeight: '700', color: '#fff',
  },

  // History section header
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18, fontWeight: '700', color: '#1A1A2E',
  },
  historyCount: {
    fontSize: 12, color: '#aaa',
  },

  // Log card
  logCard: {
    flexDirection: 'row',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
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
  logDate: { fontSize: 11, color: '#999', flex: 1, marginRight: 8 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0E8F8',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  editBtnText: { fontSize: 12, color: '#6C3483', fontWeight: '600' },

  // BP value inside card
  logBPRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  logBPValue: { fontSize: 26, fontWeight: '700' },
  logBPUnit:  { fontSize: 13, color: '#aaa', alignSelf: 'flex-end', marginBottom: 2 },
  logBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  logBadgeText: { fontSize: 11, fontWeight: '700' },

  // Glucose / A1C row
  logMetaRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  logMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  logMetaLabel: { fontSize: 11, color: '#999' },
  logMetaValue: { fontSize: 12, fontWeight: '700' },
});
