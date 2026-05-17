import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-gifted-charts';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useHealth } from '@/context/HealthContext';
import { Colors, Fonts } from '@/constants/theme';
import { FadeCard } from '@/components/FadeCard';

// ─── Types ────────────────────────────────────────────────────────────────────

type Metric = 'bp' | 'glucose';
type Range  = '1W' | '1M' | '3M' | '1Y' | 'ALL';

const RANGES: Range[] = ['1W', '1M', '3M', '1Y', 'ALL'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Month name → 0-based index for the numeric Date constructor.
const MONTH_IDX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2,  Apr: 3,  May: 4,  Jun: 5,
  Jul: 6, Aug: 7, Sep: 8,  Oct: 9,  Nov: 10, Dec: 11,
};

/**
 * Parse "May 14, 2026 · 8:22 AM" → Unix ms.
 * Uses new Date(year, month, day, h, m) — the numeric constructor — which is
 * guaranteed to work in Hermes, JSC, and V8 unlike new Date(string).
 */
function logMs(dateStr: string): number {
  try {
    const [datePart, timePart] = dateStr.split(' · ');
    // datePart: "May 14, 2026"  →  ["May", "14", "2026"] after stripping comma
    const dp = datePart.trim().replace(',', '').split(/\s+/);
    const month = MONTH_IDX[dp[0]];
    const day   = parseInt(dp[1], 10);
    const year  = parseInt(dp[2], 10);

    // timePart: "8:22 AM"  →  ["8", "22", "AM"]
    const tp  = timePart.trim().split(/[\s:]+/);
    let   h   = parseInt(tp[0], 10);
    const min = parseInt(tp[1], 10);
    if (tp[2] === 'PM' && h !== 12) h += 12;
    if (tp[2] === 'AM' && h === 12) h  = 0;

    if ([month, day, year, h, min].some(isNaN)) return NaN;
    return new Date(year, month, day, h, min).getTime();
  } catch {
    return NaN;
  }
}

function shortDate(dateStr: string): string {
  return dateStr.split(' · ')[0];
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const { top }   = useSafeAreaInsets();
  const { logs }  = useHealth();
  const { width } = useWindowDimensions();
  const chartW    = width - 40;

  const [metric,     setMetric]     = useState<Metric>('bp');
  const [range,      setRange]      = useState<Range>('1M');
  const [headerVal,  setHeaderVal]  = useState<string | null>(null);
  const [headerDate, setHeaderDate] = useState<string | null>(null);

  // ── chartData: filter → sort → map ───────────────────────────────────────
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    let cutoffTime = 0;
    switch (range) {
      case '1W': cutoffTime = now - (7   * ONE_DAY); break;
      case '1M': cutoffTime = now - (30  * ONE_DAY); break;
      case '3M': cutoffTime = now - (90  * ONE_DAY); break;
      case '1Y': cutoffTime = now - (365 * ONE_DAY); break;
      case 'ALL': cutoffTime = 0; break;
      default:    cutoffTime = 0;
    }

    const processedData = logs
      .filter((log) => {
        const t = logMs(log.date);
        return !isNaN(t) && t >= cutoffTime;
      })
      .slice()
      .reverse()
      .map((log) => ({
        value:     metric === 'bp' ? Number(log.systolic) : Number(log.glucose),
        diastolic: Number(log.diastolic),
        date:      log.date,
        label:     '',
      }))
      .filter((item) => !isNaN(item.value));

    return processedData;
  }, [logs, metric, range]);

  // ── Latest-reading header ──────────────────────────────────────────
  const latestPoint = chartData[chartData.length - 1] ?? null;

  const latestValStr = latestPoint
    ? metric === 'bp'
      ? `${latestPoint.value}/${latestPoint.diastolic} mmHg`
      : `${latestPoint.value} mg/dL`
    : '—';

  const displayVal  = headerVal  ?? latestValStr;
  const displayDate = headerDate ?? (latestPoint?.date ?? '');

  function resetHeader() {
    setHeaderVal(null);
    setHeaderDate(null);
  }

  const lineColor = metric === 'bp' ? Colors.wine : Colors.burgundy;
  const fillColor = metric === 'bp' ? '#D4A99A' : '#E8C4B8';

  const dataMax = chartData.length
    ? Math.max(...chartData.map((d) => d.value)) + 100
    : 160;
  const dataMin = chartData.length
    ? metric === 'bp' ? 50 : Math.max(0, Math.min(...chartData.map((d) => d.value)) - 8)
    : 80;

  return (
    <View style={styles.screenWrap}>
      {/* Background gradient matching Figma */}
      <LinearGradient
        colors={['#FBF7F0', '#F5EFE6', '#F0DDD0', '#E8C4B8']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingTop: top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page header ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>Your Health, Overtime</Text>
          <Text style={styles.title}>Insights</Text>
        </View>

        {/* ── Metric toggle ── */}
        <FadeCard delay={0} style={styles.metricToggle}>

          {/* Blood Pressure tab */}
          <TouchableOpacity
            style={[
              styles.metricTab,
              metric === 'bp' && styles.metricTabActive,
            ]}
            onPress={() => { setMetric('bp'); resetHeader(); }}
            activeOpacity={0.8}
          >
            <FontAwesome
              name="heart"
              size={13}
              color={metric === 'bp' ? Colors.cream : 'rgba(0,0,0,0.3)'}
            />
            <Text style={[
              styles.metricTabText,
              metric === 'bp' && styles.metricTabTextActive,
            ]}>
              Blood Pressure
            </Text>
          </TouchableOpacity>

          {/* Glucose tab */}
          <TouchableOpacity
            style={[
              styles.metricTab,
              metric === 'glucose' && styles.metricTabActive,
            ]}
            onPress={() => { setMetric('glucose'); resetHeader(); }}
            activeOpacity={0.8}
          >
            <FontAwesome
              name="tint"
              size={13}
              color={metric === 'glucose' ? Colors.cream : 'rgba(0,0,0,0.3)'}
            />
            <Text style={[
              styles.metricTabText,
              metric === 'glucose' && styles.metricTabTextActive,
            ]}>
              Glucose
            </Text>
          </TouchableOpacity>
        </FadeCard>

        {/* ── Chart card ── */}
        <FadeCard delay={100} style={styles.chartCard}>

          {/* Dynamic header */}
          <View style={styles.dynamicHeader}>
            <Text style={[styles.dynamicValue, { color: lineColor }]}>{displayVal}</Text>
            {displayDate ? (
              <Text style={styles.dynamicDate}>{shortDate(displayDate)}</Text>
            ) : null}
          </View>

          {/* Time range pills */}
          <View style={styles.rangePills}>
            {RANGES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.pill, range === r && styles.pillActive]}
                onPress={() => { setRange(r); resetHeader(); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, range === r && styles.pillTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart or empty state */}
          {chartData.length === 0 ? (
            <View style={styles.emptyChart}>
              <FontAwesome name="line-chart" size={30} color={Colors.blush} />
              <Text style={styles.emptyChartTitle}>No readings recorded yet.</Text>
              <Text style={styles.emptySub}>Switch to a wider range or log more readings.</Text>
            </View>
          ) : (
            <View style={styles.chartWrap}>
              <LineChart
                areaChart
                curved
                data={chartData}
                width={chartW - 40}
                height={130}
                spacing={Math.max(2, (chartW - 60) / Math.max(chartData.length - 1, 1))}
                color={lineColor}
                thickness={2.5}
                startFillColor={fillColor}
                endFillColor={fillColor}
                startOpacity={0.38}
                endOpacity={0.01}
                maxValue={dataMax}
                noOfSections={4}
                hideRules
                hideYAxisText
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={styles.hiddenLabel}
                hideDataPoints
                dataPointsRadius={0}
                pointerConfig={{
                  pointerStripHeight: 175,
                  pointerStripColor: Colors.blush,
                  pointerStripWidth: 1.5,
                  pointerColor: lineColor,
                  radius: 5,
                  activatePointersOnLongPress: false,
                  pointerLabelComponent: (items: any[]) => {
                    const item = items?.[0];
                    if (!item) return null;
                    const val = metric === 'bp'
                      ? `${item.value}/${item.diastolic ?? '—'} mmHg`
                      : `${item.value} mg/dL`;
                    setTimeout(() => {
                      setHeaderVal(val);
                      setHeaderDate(item.date ?? '');
                    }, 0);
                    return null;
                  },
                }}
              />
            </View>
          )}

          {/* Footer */}
          {chartData.length > 0 && (
            <View style={styles.chartFooter}>
              <FontAwesome name="info-circle" size={11} color={Colors.borderCard} />
              <Text style={styles.chartFooterText}>
                {chartData.length} reading{chartData.length !== 1 ? 's' : ''} · Press and drag to scrub
              </Text>
            </View>
          )}
        </FadeCard>

        {/* ── 20-Year Forecast card ── */}
        <FadeCard delay={200} style={styles.forecastCard}>
          <View style={styles.forecastTitleRow}>
            <FontAwesome name="line-chart" size={14} color={Colors.burgundy} />
            <Text style={styles.forecastTitle}>20-Year Heart Health Forecast</Text>
          </View>
          <Text style={styles.forecastBody}>
            Slightly elevated BP and glucose during the maternal period can compound over decades.
            Managing them proactively now makes a measurable difference long-term.
          </Text>
          <View style={styles.forecastStats}>
            <View style={styles.forecastStat}>
              <Text style={[styles.forecastStatVal, { color: Colors.success }]}>15%</Text>
              <Text style={styles.forecastStatLabel}>Healthy{'\n'}baseline</Text>
            </View>
            <View style={styles.forecastDivider} />
            <View style={styles.forecastStat}>
              <Text style={[styles.forecastStatVal, { color: Colors.warning }]}>~50%</Text>
              <Text style={styles.forecastStatLabel}>Unmanaged{'\n'}trajectory</Text>
            </View>
            <View style={styles.forecastDivider} />
            <View style={styles.forecastStat}>
              <Text style={[styles.forecastStatVal, { color: Colors.burgundy }]}>~19%</Text>
              <Text style={styles.forecastStatLabel}>If managed{'\n'}proactively</Text>
            </View>
          </View>
        </FadeCard>

        {/* ── Affirmation ── */}
        <FadeCard delay={300} style={styles.affirmCard}>
          <FontAwesome name="heart" size={16} color={Colors.wine} />
          <Text style={styles.affirmTitle}>You're already ahead.</Text>
          <Text style={styles.affirmBody}>
            Tracking your health today puts you in the top tier of proactive maternal care.
            Every data point you log paints a clearer picture for your doctor — and a healthier future for you.
          </Text>
        </FadeCard>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenWrap: { flex: 1 },
  scroll:    { flex: 1 },
  container: { padding: 20, paddingBottom: 130 },

  pageHeader: { marginBottom: 20, marginTop: 4 },
  eyebrow: {
    fontFamily: Fonts.semibold,
    fontSize: 15,
    color: 'rgba(140,58,77,0.5)',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: Fonts.semibold,
    fontSize: 25,
    color: Colors.textDark,
    marginTop: 2,
  },

  // Metric toggle
  metricToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: 3,
    marginBottom: 16,
    gap: 0,
  },
  metricTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  metricTabActive: { backgroundColor: Colors.wine },
  metricTabText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: 'rgba(0,0,0,0.5)',
  },
  metricTabTextActive: { color: Colors.cream },

  // Diagnostic card
  diagnosticCard: {
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: 15,
    marginBottom: 16,
  },
  diagnosticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  diagnosticLeft: { flex: 1 },
  diagLabel: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 4,
  },
  diagValue: {
    fontFamily: Fonts.regular,
    fontSize: 40,
    color: Colors.textDark,
    lineHeight: 48,
  },
  diagUnit: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textDark,
  },
  diagA1c: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.black,
    marginTop: 8,
  },
  diagGlucoseBox: {
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
  diagGlucoseVal: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.textDark,
  },
  diagGlucoseUnit: {
    fontFamily: Fonts.light,
    fontSize: 10,
    color: Colors.black,
  },

  // Chart card
  chartCard: {
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    paddingTop: 22,
    paddingBottom: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },

  // Dynamic header
  dynamicHeader: { paddingHorizontal: 20, marginBottom: 14 },
  dynamicValue: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  dynamicDate: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 3,
  },

  // Range pills
  rangePills: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 14,
  },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.cream,
  },
  pillActive: { backgroundColor: Colors.wine },
  pillText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
  },
  pillTextActive: { color: Colors.cream },

  // Chart
  chartWrap:   { paddingHorizontal: 0 },
  hiddenLabel: { opacity: 0, height: 0 },

  // Empty state
  emptyChart: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyChartTitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.borderCard,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.borderCard,
    textAlign: 'center',
  },

  // Chart footer
  chartFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  chartFooterText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: Colors.borderCard,
  },

  // Pointer tooltip bubble
  pointerBubble: {
    backgroundColor: Colors.burgundy,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pointerBubbleText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.textLight,
  },

  // Forecast card
  forecastCard: {
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderCard,
    padding: 18,
    marginBottom: 14,
  },
  forecastTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  forecastTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.burgundy,
  },
  forecastBody: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  forecastStats: { flexDirection: 'row', alignItems: 'center' },
  forecastStat:  { flex: 1, alignItems: 'center' },
  forecastStatVal: {
    fontFamily: Fonts.bold,
    fontSize: 22,
  },
  forecastStatLabel: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 14,
  },
  forecastDivider: { width: 1, height: 44, backgroundColor: Colors.borderCard },

  // Affirmation
  affirmCard: {
    backgroundColor: Colors.ivory,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.blush,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  affirmTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.burgundy,
    textAlign: 'center',
  },
  affirmBody: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 19,
    textAlign: 'center',
  },
});
