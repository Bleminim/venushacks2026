import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LineChart } from 'react-native-gifted-charts';

import { useUser } from '@clerk/clerk-expo';

import { useHealth, LogEntry } from '@/context/HealthContext';
import { getBPStatus } from '@/utils/healthColors';
import { Colors, Fonts } from '@/constants/theme';

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

  return `"Hi, I'm 2 weeks postpartum and my home blood pressure readings have averaged ${bpLine} for the past 5 days, up from my baseline of 118/76.\n\n I'm concerned about postpartum preeclampsia. Can I be seen today, or should I go to the ER?"`;
}

function getDateString(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const now = new Date();
  const day = days[now.getDay()];
  const month = months[now.getMonth()];
  const date = now.getDate();
  const suffix = date === 1 || date === 21 || date === 31 ? 'st'
    : date === 2 || date === 22 ? 'nd'
    : date === 3 || date === 23 ? 'rd' : 'th';
  return `${day}, ${month} ${date}${suffix}`;
}

const MONTH_NUM: Record<string, string> = {
  January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
  July: '07', August: '08', September: '09', October: '10', November: '11', December: '12',
};

function formatLogDate(dateStr: string): string {
  // Input: "May 14, 2026 · 8:22 AM"  →  "05/14/26 8:22 AM"
  try {
    const [datePart, timePart] = dateStr.split(' · ');
    const parts = datePart.trim().replace(',', '').split(/\s+/);
    const mm = MONTH_NUM[parts[0]] ?? '??';
    const dd = parts[1].padStart(2, '0');
    const yy = parts[2].slice(-2);
    return `${mm}/${dd}/${yy} ${timePart.trim()}`;
  } catch {
    return dateStr;
  }
}

const MONTH_IDX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2,  Apr: 3,  May: 4,  Jun: 5,
  Jul: 6, Aug: 7, Sep: 8,  Oct: 9,  Nov: 10, Dec: 11,
};

function logMs(dateStr: string): number {
  try {
    const [datePart, timePart] = dateStr.split(' · ');
    const dp = datePart.trim().replace(',', '').split(/\s+/);
    const month = MONTH_IDX[dp[0].slice(0, 3)];
    const day   = parseInt(dp[1], 10);
    const year  = parseInt(dp[2], 10);
    const tp  = timePart.trim().split(/[\s:]+/);
    let   h   = parseInt(tp[0], 10);
    const min = parseInt(tp[1], 10);
    if (tp[2] === 'PM' && h !== 12) h += 12;
    if (tp[2] === 'AM' && h === 12) h  = 0;
    if ([month, day, year, h, min].some(isNaN)) return NaN;
    return new Date(year, month, day, h, min).getTime();
  } catch { return NaN; }
}

// ─── Mini Chart ───────────────────────────────────────────────────────────────

function MiniChart({ metric, cardWidth }: { metric: 'bp' | 'glucose'; cardWidth: number }) {
  const { logs } = useHealth();

  const chartW    = cardWidth - 12; // 6px padding each side
  const lineColor = metric === 'bp' ? Colors.wine : Colors.burgundy;
  const fillColor = metric === 'bp' ? '#D4A99A' : '#E8C4B8';

  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return logs
      .filter(l => { const t = logMs(l.date); return !isNaN(t) && t >= cutoff; })
      .slice()
      .reverse()
      .map(l => ({
        value:     metric === 'bp' ? Number(l.systolic) : Number(l.glucose),
        diastolic: Number(l.diastolic),
      }))
      .filter(d => !isNaN(d.value));
  }, [logs, metric]);

  if (chartData.length < 2) {
    return (
      <View style={styles.miniChartPlaceholder}>
        <View style={styles.miniChartLine} />
      </View>
    );
  }

  const pad     = 100;
  const dataMax = Math.max(...chartData.map(d => d.value)) + pad;
  const dataMin = metric === 'bp' ? 50 : Math.max(0, Math.min(...chartData.map(d => d.value)) - pad);
  const spacing = Math.max(2, chartW / Math.max(chartData.length - 1, 1));

  return (
    <LineChart
      areaChart
      curved
      data={chartData}
      width={chartW}
      height={55}
      spacing={spacing}
      initialSpacing={0}
      yAxisLabelWidth={0}
      endSpacing={0}
      color={lineColor}
      thickness={2}
      startFillColor={fillColor}
      endFillColor={fillColor}
      startOpacity={0.38}
      endOpacity={0.01}
      maxValue={dataMax}
      minValue={dataMin}
      noOfSections={2}
      hideRules
      hideYAxisText
      yAxisThickness={0}
      xAxisThickness={0}
      hideDataPoints
      dataPointsRadius={0}
      xAxisLabelTextStyle={styles.hiddenLabel}
    />
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyCard}>
      <FontAwesome name="heartbeat" size={36} color={Colors.blush} />
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
  const { top }   = useSafeAreaInsets();
  const { logs }  = useHealth();
  const { user }  = useUser();
  const { width } = useWindowDimensions();
  const [scriptExpanded, setScriptExpanded] = useState(false);
  const [showMAP,        setShowMAP]        = useState(false);

  // width of each mini chart card: screen - 40 padding - 15 gap, split by 2
  const miniCardWidth = (width - 40 - 15) / 2;

  const timeOfDay = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return 'Morning';
    if (h >= 12 && h < 17) return 'Afternoon';
    return 'Evening';
  }, []);

  const firstName = user?.firstName || 'Mom';

  const latest   = logs[0] ?? null;
  const mapValue = latest
    ? Math.round((latest.systolic + 2 * latest.diastolic) / 3)
    : 0;

  return (
    <View style={styles.screenWrap}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#FBF7F0', '#F5DDD0', '#E8C4B8', '#D4A99A']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{getDateString()}</Text>
          <Text style={styles.greeting}>Good {timeOfDay}, {firstName}!</Text>
          <Text style={styles.headerTitle}>
            Here is a review on{'\n'}your health..
          </Text>
        </View>

        {latest === null ? (
          <EmptyState />
        ) : (
          <>
            {/* BP Reading Card — Diagnostic Overview */}
            {(() => {
              const status   = getBPStatus(latest.systolic, latest.diastolic);
              const bodyText = bpPlainText(latest.systolic, latest.diastolic);
              return (
                <>
                  <View style={styles.diagnosticCard}>
                    <View style={styles.diagnosticRow}>
                      <View style={styles.diagnosticLeft}>
                        <Text style={styles.bpLabel}>Blood Pressure</Text>
                        <TouchableOpacity
                          onPress={() => setShowMAP((v) => !v)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.bpValueRow}>
                            {showMAP ? (
                              <Text style={styles.bpValue}>{mapValue}</Text>
                            ) : (
                              <Text style={styles.bpValue}>
                                {latest.systolic}/{latest.diastolic}{' '}
                                <Text style={styles.bpUnit}>mmHg</Text>
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        <Text style={styles.a1cText}>
                          {latest.a1c !== null ? `${latest.a1c}%` : '5.7%'} A1C
                          <Text style={styles.cardDate}>  ·  {formatLogDate(latest.date)}</Text>
                        </Text>
                      </View>

                      {/* Glucose droplet side */}
                      <View style={styles.glucoseBox}>
                        <FontAwesome name="tint" size={22} color={Colors.burgundy} />
                        <Text style={styles.glucoseValue}>{latest.glucose}</Text>
                        <Text style={styles.glucoseLabel}>mg/dL</Text>
                      </View>
                    </View>
                  </View>

                  {/* Mini chart cards row */}
                  <View style={styles.miniChartRow}>
                    <View style={[styles.miniChartCard, { width: miniCardWidth }]}>
                      <Text style={styles.miniChartLabel}>Blood Pressure</Text>
                      <MiniChart metric="bp" cardWidth={miniCardWidth} />
                    </View>
                    <View style={[styles.miniChartCard, { width: miniCardWidth }]}>
                      <Text style={styles.miniChartLabel}>Glucose</Text>
                      <MiniChart metric="glucose" cardWidth={miniCardWidth} />
                    </View>
                  </View>

                  {/* Status card */}
                  <View style={[styles.statusCard, { backgroundColor: status.bgColor, borderColor: status.borderColor }]}>
                    <View style={styles.statusHeader}>
                      <FontAwesome name={status.icon} size={22} color={status.color} />
                      <View style={styles.statusLabelWrap}>
                        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
                        <Text style={[styles.statusSublabel, { color: status.color }]}>{status.sublabel}</Text>
                      </View>
                    </View>
                    <Text style={styles.statusBody}>{bodyText}</Text>
                  </View>

                  {/* What do these numbers mean? */}
                  <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>What do these numbers mean?</Text>
                    {[
                      { bold: `${latest.systolic} (Systolic)`, text: ' \u2014 the pressure when your heart beats. ACOG flags \u2265 140 as gestational hypertension.' },
                      { bold: `${latest.diastolic} (Diastolic)`, text: ' \u2014 the pressure between beats. ACOG flags \u2265 90 as gestational hypertension.' },
                      { bold: 'Normal in pregnancy', text: ' \u2014 below 120/80. Monitor daily; trends matter more than single readings.' },
                    ].map((item, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>
                          <Text style={styles.bulletBold}>{item.bold}</Text>
                          {item.text}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Advocacy Script */}
                  <View style={styles.scriptCard}>
                    <TouchableOpacity
                      onPress={() => setScriptExpanded(!scriptExpanded)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.scriptHeader}>
                        <View style={styles.scriptTitleRow}>
                          <View style={styles.scriptDot}>
                            <View style={styles.scriptDotInner} />
                          </View>
                          <Text style={styles.scriptTitle}>Advocacy Script</Text>
                        </View>
                        <View style={styles.scriptHeaderRight}>
                          <View style={styles.scriptBadge}>
                            <Text style={styles.scriptBadgeText}>For your doctor</Text>
                          </View>
                          <FontAwesome
                            name={scriptExpanded ? 'chevron-up' : 'chevron-down'}
                            size={12}
                            color="rgba(255,255,255,0.6)"
                          />
                        </View>
                      </View>
                    </TouchableOpacity>

                    {scriptExpanded && (
                      <Text style={styles.scriptText}>
                        {buildAdvocacyScript(latest)}
                      </Text>
                    )}
                  </View>
                </>
              );
            })()}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenWrap: { flex: 1 },
  scroll: { flex: 1 },
  container: { padding: 20, paddingBottom: 130 },

  // Header
  header: { marginBottom: 20, marginTop: 4 },
  dateText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  greeting: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.textDark,
  },
  headerTitle: {
    fontFamily: Fonts.regular,
    fontSize: 23,
    color: Colors.textWine,
    lineHeight: 30,
    marginTop: 4,
  },

  // Empty state
  emptyCard: {
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    padding: 32,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 18,
    color: Colors.textDark,
  },
  emptyBody: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyBold: { fontFamily: Fonts.semibold, color: Colors.wine },

  // Diagnostic overview card
  diagnosticCard: {
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: 15,
    marginBottom: 15,
  },
  cardDate: {
    color: Colors.textMuted,
  },
  diagnosticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  diagnosticLeft: { flex: 1 },
  bpLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 4,
  },
  bpValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  bpValue: {
    fontFamily: Fonts.regular,
    fontSize: 40,
    color: Colors.textDark,
    lineHeight: 48,
  },
  bpUnit: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textDark,
  },
  a1cText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.black,
    marginTop: 8,
  },
  glucoseBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 100,
    backgroundColor: Colors.ivory,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    gap: 2,
  },
  glucoseValue: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textDark,
  },
  glucoseLabel: {
    fontFamily: Fonts.light,
    fontSize: 10,
    color: Colors.black,
  },

  // Mini chart cards
  miniChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 15,
  },
  miniChartCard: {
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 6,
    overflow: 'hidden',
  },
  hiddenLabel: { opacity: 0, height: 0 },
  miniChartLabel: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.textWine,
  },
  miniChartPlaceholder: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  miniChartLine: {
    height: 2,
    backgroundColor: Colors.borderCard,
    borderRadius: 1,
  },

  // Status card
  statusCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 15,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statusLabelWrap: { gap: 2 },
  statusLabel: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
  },
  statusSublabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  statusBody: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: '#2C3E50',
    lineHeight: 23,
  },

  // Info card (What do these numbers mean?)
  infoCard: {
    backgroundColor: Colors.ivory,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: 18,
    marginBottom: 15,
  },
  infoTitle: {
    fontFamily: Fonts.semibold,
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 14,
  },
  infoBody: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 19,
  },

  // Bullet list
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27AE60',
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 21,
  },
  bulletBold: {
    fontFamily: Fonts.semibold,
  },

  // Advocacy script card
  scriptCard: {
    backgroundColor: Colors.burgundy,
    borderRadius: 10,
    padding: 20,
    paddingTop: 19,
    marginBottom: 14,
  },
  scriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scriptHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scriptTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scriptDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scriptDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  scriptTitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textLight,
  },
  scriptBadge: {
    backgroundColor: Colors.blush,
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  scriptBadgeText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.burgundy,
  },
  scriptText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textLight,
    lineHeight: 22,
    marginTop: 14,
  },

  bottomSpacer: { height: 24 },
});
