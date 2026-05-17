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
import { LineChart } from 'react-native-gifted-charts';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useHealth } from '@/context/HealthContext';

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

    // 1. Find anchor time — latest valid timestamp in the logs array.
    //    Uses logMs() to handle our "May 14, 2026 · 8:22 AM" format safely.
    const validTimes = logs
      .map((l) => logMs(l.date))
      .filter((t) => !isNaN(t));
    const anchorTime = validTimes.length > 0 ? Math.max(...validTimes) : Date.now();

    // 2. Determine cutoff time mathematically via switch.
    //    'ALL' → cutoffTime = 0, so every entry with a real timestamp passes.
    let cutoffTime = 0;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    switch (range) {
      case '1W': cutoffTime = anchorTime - (7   * ONE_DAY); break;
      case '1M': cutoffTime = anchorTime - (30  * ONE_DAY); break;
      case '3M': cutoffTime = anchorTime - (90  * ONE_DAY); break;
      case '1Y': cutoffTime = anchorTime - (365 * ONE_DAY); break;
      case 'ALL': cutoffTime = 0; break;
      default:    cutoffTime = 0;
    }

    // 3. Filter by date, sort oldest-first, then map safely.
    //    Number() coercion ensures no strings slip into the chart library.
    const processedData = logs
      .filter((log) => {
        const t = logMs(log.date);
        return !isNaN(t) && t >= cutoffTime;
      })
      .slice()
      .reverse()                         // oldest-first → left-to-right on chart
      .map((log) => ({
        value:     metric === 'bp' ? Number(log.systolic) : Number(log.glucose),
        diastolic: Number(log.diastolic), // carried for BP tooltip (sys/dia pair)
        date:      log.date,
        label:     '',                    // suppresses gifted-charts x-axis labels
      }))
      .filter((item) => !isNaN(item.value));

    return processedData;
  }, [logs, metric, range]);

  // ── Latest-reading header (shown before user scrubs) ──────────────────────
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

  const lineColor = metric === 'bp' ? '#9B59B6' : '#E67E22';
  const fillColor = metric === 'bp' ? '#C39BD3' : '#F0B27A';

  const dataMax = chartData.length
    ? Math.max(...chartData.map((d) => d.value)) + (metric === 'bp' ? 14 : 18)
    : 160;
  const dataMin = chartData.length
    ? Math.min(...chartData.map((d) => d.value)) - 8
    : 80;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: top + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Page header ── */}
      <View style={styles.pageHeader}>
        <Text style={styles.eyebrow}>Your Health, Over Time</Text>
        <Text style={styles.title}>Insights</Text>
      </View>

      {/* ── Metric toggle ── */}
      <View style={styles.metricToggle}>
        {(['bp', 'glucose'] as Metric[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.metricTab,
              metric === m && (m === 'bp' ? styles.metricTabBP : styles.metricTabGlc),
            ]}
            onPress={() => { setMetric(m); resetHeader(); }}
            activeOpacity={0.8}
          >
            <FontAwesome
              name={m === 'bp' ? 'heartbeat' : 'tint'}
              size={13}
              color={metric === m ? '#fff' : '#888'}
            />
            <Text style={[styles.metricTabText, metric === m && styles.metricTabTextActive]}>
              {m === 'bp' ? 'Blood Pressure' : 'Glucose'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Chart card ── */}
      <View style={styles.chartCard}>

        {/* Dynamic header — updates live while scrubbing */}
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
            <FontAwesome name="line-chart" size={30} color="#D5C9E0" />
            <Text style={styles.emptyTitle}>No readings recorded yet.</Text>
            <Text style={styles.emptySub}>Switch to a wider range or log more readings.</Text>
          </View>
        ) : (
          <View style={styles.chartWrap}>
            <LineChart
              areaChart
              curved
              data={chartData}
              width={chartW - 40}
              height={200}
              // Pack points tightly to fill available width (Robinhood sweep)
              spacing={Math.max(2, Math.floor((chartW - 60) / Math.max(chartData.length - 1, 1)))}
              // Line style
              color={lineColor}
              thickness={2.5}
              // Gradient fill beneath the curve
              startFillColor={fillColor}
              endFillColor={fillColor}
              startOpacity={0.38}
              endOpacity={0.01}
              // Y scale anchored to data range
              maxValue={dataMax}
              minValue={dataMin}
              noOfSections={4}
              // Hide all axes and grid — Robinhood aesthetic
              hideRules
              hideYAxisText
              yAxisThickness={0}
              xAxisThickness={0}
              xAxisLabelTextStyle={styles.hiddenLabel}
              // No dots on line — continuous sweep look
              hideDataPoints
              dataPointsRadius={0}
              // Interactive scrubbing
              pointerConfig={{
                pointerStripHeight: 175,
                pointerStripColor: '#E0D6EA',
                pointerStripWidth: 1.5,
                pointerColor: lineColor,
                radius: 5,
                pointerLabelWidth: 140,
                pointerLabelHeight: 50,
                activatePointersOnLongPress: false,
                autoAdjustPointerLabelPosition: true,
                pointerLabelComponent: (items: any[]) => {
                  const item = items?.[0];
                  if (!item) return null;

                  // Build display string from the data item
                  const val = metric === 'bp'
                    ? `${item.value}/${item.diastolic ?? '—'} mmHg`
                    : `${item.value} mg/dL`;
                  const date: string = item.date ?? '';

                  // Schedule header state update outside the render cycle
                  setTimeout(() => {
                    setHeaderVal(val);
                    setHeaderDate(date);
                  }, 0);

                  return (
                    <View style={styles.pointerBubble}>
                      <Text style={styles.pointerBubbleText}>{val}</Text>
                    </View>
                  );
                },
              }}
            />
          </View>
        )}

        {/* Footer */}
        {chartData.length > 0 && (
          <View style={styles.chartFooter}>
            <FontAwesome name="info-circle" size={11} color="#C5BAD0" />
            <Text style={styles.chartFooterText}>
              {chartData.length} reading{chartData.length !== 1 ? 's' : ''} · Press and drag to scrub
            </Text>
          </View>
        )}
      </View>

      {/* ── 20-Year Forecast card ── */}
      <View style={styles.forecastCard}>
        <View style={styles.forecastTitleRow}>
          <FontAwesome name="line-chart" size={14} color="#2471A3" />
          <Text style={styles.forecastTitle}>20-Year Heart Health Forecast</Text>
        </View>
        <Text style={styles.forecastBody}>
          Slightly elevated BP and glucose during the maternal period can compound over decades.
          Managing them proactively now makes a measurable difference long-term.
        </Text>
        <View style={styles.forecastStats}>
          <View style={styles.forecastStat}>
            <Text style={[styles.forecastStatVal, { color: '#27AE60' }]}>15%</Text>
            <Text style={styles.forecastStatLabel}>Healthy{'\n'}baseline</Text>
          </View>
          <View style={styles.forecastDivider} />
          <View style={styles.forecastStat}>
            <Text style={[styles.forecastStatVal, { color: '#E67E22' }]}>~50%</Text>
            <Text style={styles.forecastStatLabel}>Unmanaged{'\n'}trajectory</Text>
          </View>
          <View style={styles.forecastDivider} />
          <View style={styles.forecastStat}>
            <Text style={[styles.forecastStatVal, { color: '#2471A3' }]}>~19%</Text>
            <Text style={styles.forecastStatLabel}>If managed{'\n'}proactively</Text>
          </View>
        </View>
      </View>

      {/* ── Affirmation ── */}
      <View style={styles.affirmCard}>
        <FontAwesome name="heart" size={16} color="#C0392B" />
        <Text style={styles.affirmTitle}>You're already ahead.</Text>
        <Text style={styles.affirmBody}>
          Tracking your health today puts you in the top tier of proactive maternal care.
          Every data point you log paints a clearer picture for your doctor — and a healthier future for you.
        </Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PURPLE = '#9B59B6';
const ORANGE = '#E67E22';

const styles = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: '#F8F4F9' },
  container: { padding: 20, paddingBottom: 130 },

  pageHeader: { marginBottom: 20, marginTop: 4 },
  eyebrow:    { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  title:      { fontSize: 26, fontWeight: '700', color: '#1A1A2E', marginTop: 2 },

  // Metric toggle
  metricToggle: {
    flexDirection: 'row',
    backgroundColor: '#EDE7F6',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  metricTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
  },
  metricTabBP:         { backgroundColor: PURPLE },
  metricTabGlc:        { backgroundColor: ORANGE },
  metricTabText:       { fontSize: 13, fontWeight: '600', color: '#888' },
  metricTabTextActive: { color: '#fff' },

  // Chart card
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingTop: 22,
    paddingBottom: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },

  // Dynamic header
  dynamicHeader: { paddingHorizontal: 20, marginBottom: 14 },
  dynamicValue:  { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  dynamicDate:   { fontSize: 13, color: '#aaa', marginTop: 3 },

  // Range pills
  rangePills: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 14,
  },
  pill:          { paddingHorizontal: 13, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F3EEF8' },
  pillActive:    { backgroundColor: PURPLE },
  pillText:      { fontSize: 12, fontWeight: '600', color: '#888' },
  pillTextActive:{ color: '#fff' },

  // Chart
  chartWrap:   { paddingHorizontal: 16 },
  hiddenLabel: { opacity: 0, height: 0 },

  // Empty state
  emptyChart: { height: 200, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: '#C5BAD0', textAlign: 'center' },
  emptySub:   { fontSize: 12, color: '#D5C9E0', textAlign: 'center' },

  // Chart footer
  chartFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, paddingHorizontal: 20,
  },
  chartFooterText: { fontSize: 11, color: '#C5BAD0' },

  // Pointer tooltip bubble
  pointerBubble: {
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pointerBubbleText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Forecast card
  forecastCard: {
    backgroundColor: '#EBF5FB',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D6EAF8',
  },
  forecastTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  forecastTitle:    { fontSize: 14, fontWeight: '700', color: '#1A5276' },
  forecastBody:     { fontSize: 12, color: '#555', lineHeight: 18, marginBottom: 16 },
  forecastStats:    { flexDirection: 'row', alignItems: 'center' },
  forecastStat:     { flex: 1, alignItems: 'center' },
  forecastStatVal:  { fontSize: 22, fontWeight: '700' },
  forecastStatLabel:{ fontSize: 10, color: '#777', textAlign: 'center', marginTop: 3, lineHeight: 14 },
  forecastDivider:  { width: 1, height: 44, backgroundColor: '#CBE4F0' },

  // Affirmation
  affirmCard: {
    backgroundColor: '#FEF9F9',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FADBD8',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  affirmTitle: { fontSize: 16, fontWeight: '700', color: '#922B21', textAlign: 'center' },
  affirmBody:  { fontSize: 12, color: '#555', lineHeight: 19, textAlign: 'center' },
});
