import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useUser } from '@clerk/clerk-expo';

import { useHealth, LogEntry } from '@/context/HealthContext';
import { getBPStatus } from '@/utils/healthColors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bpPlainText(sys: number, dia: number): string {
  if (sys >= 140 || dia >= 90) {
    return `Your blood pressure of ${sys}/${dia} mmHg meets the ACOG threshold for gestational hypertension. Readings at or above 140/90 require prompt evaluation — contact your care team today. Unmanaged, this can progress to preeclampsia.`;
  }
  if (sys >= 120 || dia >= 80) {
    return `Your blood pressure of ${sys}/${dia} mmHg is elevated for pregnancy. ACOG recommends monitoring any reading above 120/80 closely during the perinatal period. Log daily and mention this at your next visit.`;
  }
  return `Your blood pressure of ${sys}/${dia} mmHg is within the normal range for pregnancy. Keep logging consistently so your care team can spot any trends early.`;
}

function buildAdvocacyScript(entry: LogEntry): string {
  const bpLine = `${entry.systolic}/${entry.diastolic}`;
  const isHigh = entry.systolic >= 140 || entry.diastolic >= 90;
  const threshold = entry.systolic >= 140 || entry.diastolic >= 90
    ? 'the threshold for Stage 2 hypertension'
    : 'approaching elevated levels';

  return `"I've been tracking my blood pressure at home and I want to share a reading with you. My most recent reading was ${bpLine}. I know that's ${isHigh ? 'above 140/90' : 'worth discussing'}, which I understand is ${threshold}.

I'd like to understand:
  1. Does this reading concern you given where I am in my pregnancy or postpartum recovery?
  2. Should we be adjusting my monitoring schedule or treatment plan?
  3. What warning signs should prompt me to call you or go to the ER immediately?

I want to make sure we're on the same page about next steps."`;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyCard}>
      <FontAwesome name="heartbeat" size={36} color="#D7BDE2" />
      <Text style={styles.emptyTitle}>No readings yet</Text>
      <Text style={styles.emptyBody}>
        Head to the <Text style={styles.emptyBold}>Log tab</Text> to record your first blood
        pressure and glucose reading. Your Translation Engine will activate right here.
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { logs }  = useHealth();
  const { user }  = useUser();
  const [scriptExpanded, setScriptExpanded] = useState(false);
  const [showMAP,        setShowMAP]        = useState(false);

  const timeOfDay = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    return 'evening';
  }, []);

  const firstName = user?.firstName || 'there';

  const latest   = logs[0] ?? null;
  const mapValue = latest
    ? Math.round((latest.systolic + 2 * latest.diastolic) / 3)
    : 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good {timeOfDay}, {firstName}.</Text>
        <Text style={styles.headerTitle}>Translation Engine</Text>
        <Text style={styles.headerSub}>Your latest reading, explained.</Text>
      </View>

      {latest === null ? (
        <EmptyState />
      ) : (
        <>
          {/* BP Reading Card */}
          {(() => {
            const status   = getBPStatus(latest.systolic, latest.diastolic);
            const bodyText = bpPlainText(latest.systolic, latest.diastolic);
            return (
              <>
                <View style={styles.readingCard}>
                  <View style={styles.readingRow}>
                    <View style={styles.readingMain}>
                      <Text style={styles.bpLabel}>Blood Pressure</Text>

                      {/* Tappable value — toggles between Sys/Dia and MAP */}
                      <TouchableOpacity
                        onPress={() => setShowMAP((v) => !v)}
                        activeOpacity={0.7}
                        style={styles.bpValueTouchable}
                      >
                        <View style={styles.bpValueRow}>
                          {showMAP ? (
                            <Text style={[styles.bpValue, { color: status.color }]}>
                              {mapValue}
                            </Text>
                          ) : (
                            <Text style={[styles.bpValue, { color: status.color }]}>
                              {latest.systolic}/{latest.diastolic}
                            </Text>
                          )}
                          {/* Swap icon — subtle visual affordance */}
                          <FontAwesome
                            name="exchange"
                            size={13}
                            color={status.color}
                            style={styles.bpSwapIcon}
                          />
                        </View>
                        <Text style={styles.bpUnit}>
                          {showMAP ? 'MAP · Mean Arterial Pressure' : 'mmHg'}
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.bpTimestamp}>{latest.date}</Text>
                    </View>
                    {/* Glucose pill */}
                    <View style={styles.glucoseBox}>
                      <FontAwesome name="tint" size={16} color="#E67E22" />
                      <Text style={styles.glucoseValue}>{latest.glucose}</Text>
                      <Text style={styles.glucoseLabel}>mg/dL</Text>
                    </View>
                  </View>

                  <View style={styles.bpBreakdown}>
                    <View style={styles.bpBreakdownItem}>
                      <Text style={styles.bpBreakdownNum}>{latest.systolic}</Text>
                      <Text style={styles.bpBreakdownLbl}>Systolic</Text>
                    </View>
                    <View style={styles.bpDivider} />
                    <View style={styles.bpBreakdownItem}>
                      <Text style={styles.bpBreakdownNum}>{latest.diastolic}</Text>
                      <Text style={styles.bpBreakdownLbl}>Diastolic</Text>
                    </View>
                    <View style={styles.bpDivider} />
                    {showMAP ? (
                      <View style={styles.bpBreakdownItem}>
                        <Text style={[styles.bpBreakdownNum, { color: status.color }]}>
                          {mapValue}
                        </Text>
                        <Text style={styles.bpBreakdownLbl}>MAP</Text>
                      </View>
                    ) : (
                      <View style={styles.bpBreakdownItem}>
                        <Text style={styles.bpBreakdownNum}>
                          {latest.a1c !== null ? `${latest.a1c}%` : '—'}
                        </Text>
                        <Text style={styles.bpBreakdownLbl}>A1C</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Warning Alert */}
                <View style={[styles.alertCard, { backgroundColor: status.bgColor, borderColor: status.borderColor }]}>
                  <View style={styles.alertHeader}>
                    <FontAwesome name={status.icon} size={20} color={status.color} />
                    <View style={styles.alertTitleGroup}>
                      <Text style={[styles.alertLabel, { color: status.color }]}>{status.label}</Text>
                      <Text style={[styles.alertSublabel, { color: status.color }]}>{status.sublabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.alertBody}>{bodyText}</Text>
                </View>

                {/* What this means */}
                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>What do these numbers mean?</Text>
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIndicator, { backgroundColor: status.color }]} />
                    <Text style={styles.infoText}>
                      <Text style={styles.infoBold}>{latest.systolic} (Systolic)</Text>
                      {' '}— the pressure when your heart beats. ACOG flags ≥ 140 as gestational hypertension.
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIndicator, { backgroundColor: status.color }]} />
                    <Text style={styles.infoText}>
                      <Text style={styles.infoBold}>{latest.diastolic} (Diastolic)</Text>
                      {' '}— the pressure between beats. ACOG flags ≥ 90 as gestational hypertension.
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIndicator, { backgroundColor: '#27AE60' }]} />
                    <Text style={styles.infoText}>
                      <Text style={styles.infoBold}>Normal in pregnancy</Text>
                      {' '}— below 120/80. Monitor daily; trends matter more than single readings.
                    </Text>
                  </View>
                </View>

                {/* Advocacy Script */}
                <TouchableOpacity
                  style={styles.scriptCard}
                  onPress={() => setScriptExpanded(!scriptExpanded)}
                  activeOpacity={0.85}
                >
                  <View style={styles.scriptHeader}>
                    <View style={styles.scriptTitleRow}>
                      <FontAwesome name="stethoscope" size={18} color="#6C3483" />
                      <Text style={styles.scriptTitle}>Advocacy Script</Text>
                    </View>
                    <View style={styles.scriptBadge}>
                      <Text style={styles.scriptBadgeText}>For your doctor</Text>
                    </View>
                  </View>
                  <Text style={styles.scriptSubtitle}>
                    Tap to {scriptExpanded ? 'collapse' : 'expand'} — share at your next appointment
                  </Text>

                  {scriptExpanded && (
                    <View style={styles.scriptBody}>
                      <View style={styles.scriptDivider} />
                      <Text style={styles.scriptText}>{buildAdvocacyScript(latest)}</Text>
                    </View>
                  )}

                  <View style={styles.scriptFooter}>
                    <FontAwesome
                      name={scriptExpanded ? 'chevron-up' : 'chevron-down'}
                      size={12}
                      color="#9B59B6"
                    />
                  </View>
                </TouchableOpacity>
              </>
            );
          })()}
        </>
      )}

      {/* Nudge */}
      <View style={styles.nudgeCard}>
        <FontAwesome name="calendar" size={16} color="#2471A3" />
        <Text style={styles.nudgeText}>
          {logs.length === 0
            ? 'Log your first reading in the '
            : 'Track your next reading in the '}
          <Text style={styles.nudgeBold}>Log tab</Text>
          {logs.length > 0 && `. You have ${logs.length} reading${logs.length > 1 ? 's' : ''} logged.`}
        </Text>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8F4F9' },
  container: { padding: 20 },

  header: { marginBottom: 20, marginTop: 4 },
  greeting: { fontSize: 28, fontWeight: '600', color: '#1A1A2E', letterSpacing: -0.5 },
  headerTitle: { fontSize: 13, color: '#9B59B6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 6 },
  headerSub: { fontSize: 14, color: '#666', marginTop: 2 },

  // Empty state
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 32,
    alignItems: 'center', gap: 12, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  emptyBody: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 21 },
  emptyBold: { fontWeight: '700', color: '#9B59B6' },

  // Reading card
  readingCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  readingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  readingMain: { flex: 1 },
  bpLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  bpValueTouchable: { alignSelf: 'flex-start' },
  bpValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  bpValue: { fontSize: 48, fontWeight: '700', lineHeight: 52 },
  bpSwapIcon: { marginBottom: 10, opacity: 0.55 },
  bpUnit: { fontSize: 14, color: '#999', marginBottom: 8 },
  bpTimestamp: { fontSize: 12, color: '#aaa', marginTop: 2 },

  glucoseBox: { alignItems: 'center', backgroundColor: '#FFF8F0', borderRadius: 12, padding: 12, gap: 2 },
  glucoseValue: { fontSize: 22, fontWeight: '700', color: '#E67E22', marginTop: 4 },
  glucoseLabel: { fontSize: 11, color: '#999' },

  bpBreakdown: {
    flexDirection: 'row', marginTop: 16,
    borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 14,
  },
  bpBreakdownItem: { flex: 1, alignItems: 'center' },
  bpBreakdownNum: { fontSize: 20, fontWeight: '600', color: '#333' },
  bpBreakdownLbl: { fontSize: 11, color: '#999', marginTop: 2 },
  bpDivider: { width: 1, backgroundColor: '#F0F0F0' },

  // Alert card
  alertCard: { borderRadius: 14, borderWidth: 1.5, padding: 16, marginBottom: 14 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  alertTitleGroup: { flex: 1 },
  alertLabel: { fontSize: 15, fontWeight: '700' },
  alertSublabel: { fontSize: 12, opacity: 0.75, marginTop: 1 },
  alertBody: { fontSize: 14, color: '#444', lineHeight: 21 },

  // Info card
  infoCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  infoIndicator: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  infoText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 19 },
  infoBold: { fontWeight: '600', color: '#333' },

  // Advocacy script
  scriptCard: {
    backgroundColor: '#FAF0FF', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#D7BDE2', padding: 16, marginBottom: 14,
  },
  scriptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  scriptTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scriptTitle: { fontSize: 15, fontWeight: '700', color: '#6C3483' },
  scriptBadge: { backgroundColor: '#D7BDE2', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  scriptBadgeText: { fontSize: 11, color: '#6C3483', fontWeight: '600' },
  scriptSubtitle: { fontSize: 12, color: '#9B59B6', marginBottom: 4 },
  scriptBody: { marginTop: 4 },
  scriptDivider: { height: 1, backgroundColor: '#D7BDE2', marginVertical: 12 },
  scriptText: { fontSize: 13.5, color: '#4A235A', lineHeight: 22, fontStyle: 'italic' },
  scriptFooter: { alignItems: 'center', marginTop: 10 },

  // Nudge
  nudgeCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#EBF5FB', borderRadius: 12, padding: 14, gap: 10,
  },
  nudgeText: { flex: 1, fontSize: 13, color: '#1A5276', lineHeight: 19 },
  nudgeBold: { fontWeight: '700' },

  bottomSpacer: { height: 24 },
});
