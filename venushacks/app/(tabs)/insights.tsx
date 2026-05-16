import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  useWindowDimensions,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useHealth } from '@/context/HealthContext';

// ─── Static Forecast Data (conceptual — not driven by logs) ──────────────────

const RISK_YEARS   = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
const RISK_HEALTHY = [10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15];
const RISK_CURRENT = [10, 12, 15.5, 20, 26, 32, 37.5, 42, 45.5, 48, 50];
const RISK_MANAGED = [10, 11, 12.5, 14, 15.5, 16.5, 17, 17.5, 18, 18.5, 19];

// ─── Chart Layout Constants ───────────────────────────────────────────────────

const CH    = 195;
const T_PAD = 38;
const B_PAD = 22;
const L_PAD = 36;
const R_PAD = 8;

function px(index: number, total: number, chartW: number): number {
  return L_PAD + (index / Math.max(total - 1, 1)) * (chartW - L_PAD - R_PAD);
}

function py(value: number, minV: number, maxV: number): number {
  return T_PAD + (1 - (value - minV) / (maxV - minV)) * (CH - T_PAD - B_PAD);
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

/**
 * Compute up to 5 evenly-spaced x-axis label positions for any array length.
 * Always includes the first and last index.
 */
function getXLabels(n: number): { i: number; label: string }[] {
  if (n <= 1)  return [{ i: 0, label: 'D1' }];
  if (n <= 4)  return Array.from({ length: n }, (_, i) => ({ i, label: `D${i + 1}` }));

  const positions = new Set([
    0,
    Math.round(n / 4),
    Math.round(n / 2),
    Math.round((3 * n) / 4),
    n - 1,
  ]);
  return [...positions].sort((a, b) => a - b).map((i) => ({ i, label: `D${i + 1}` }));
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Segment({
  x1, y1, x2, y2, color, thick = 2.5,
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; thick?: number;
}) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <View style={{
      position: 'absolute',
      left: (x1 + x2) / 2 - len / 2,
      top:  (y1 + y2) / 2 - thick / 2,
      width: len, height: thick,
      backgroundColor: color,
      borderRadius: thick / 2,
      transform: [{ rotate: `${angle}deg` }],
    }} />
  );
}

function YGrid({
  chartW, ticks, minV, maxV, labelFn,
}: {
  chartW: number; ticks: number[]; minV: number; maxV: number;
  labelFn: (v: number) => string;
}) {
  return (
    <>
      {ticks.map((v) => {
        const y = py(v, minV, maxV);
        return (
          <React.Fragment key={v}>
            <View style={{
              position: 'absolute', left: L_PAD, top: y,
              width: chartW - L_PAD - R_PAD, height: 1, backgroundColor: '#F0EDEB',
            }} />
            <Text style={{
              position: 'absolute', left: 0, top: y - 7,
              width: L_PAD - 4, fontSize: 9, color: '#C0B8B4', textAlign: 'right',
            }}>
              {labelFn(v)}
            </Text>
          </React.Fragment>
        );
      })}
    </>
  );
}

// ─── Trend Chart ─────────────────────────────────────────────────────────────

interface TrendChartProps {
  data: number[];
  minV: number; maxV: number; ticks: number[];
  color: string;
  safeValue: number; safeLabel: string; unit: string;
  chartW: number;
  selectedIdx: number | null;
  onSelect: (i: number) => void;
}

function TrendChart({
  data, minV, maxV, ticks, color,
  safeValue, safeLabel, unit,
  chartW, selectedIdx, onSelect,
}: TrendChartProps) {
  const pts = data.map((v, i) => ({ x: px(i, data.length, chartW), y: py(v, minV, maxV) }));
  const safeY = py(safeValue, minV, maxV);
  const xLabels = getXLabels(data.length);

  if (data.length === 0) {
    return (
      <View style={{ width: chartW, height: CH, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, color: '#bbb' }}>No data yet — log readings to see your trend.</Text>
      </View>
    );
  }

  return (
    <View style={{ width: chartW, height: CH }}>
      <YGrid chartW={chartW} ticks={ticks} minV={minV} maxV={maxV} labelFn={String} />

      {/* Safe reference line */}
      <View style={{
        position: 'absolute', left: L_PAD, top: safeY,
        width: chartW - L_PAD - R_PAD, height: 1.5, backgroundColor: '#27AE6055',
      }} />
      <Text style={{
        position: 'absolute', left: L_PAD + 4, top: safeY - 13,
        fontSize: 9, color: '#27AE60', fontWeight: '600',
      }}>
        {safeLabel}
      </Text>

      {/* Segments */}
      {pts.slice(0, -1).map((p, i) => (
        <Segment key={i} x1={p.x} y1={p.y} x2={pts[i + 1].x} y2={pts[i + 1].y} color={color} thick={2.5} />
      ))}

      {/* Dots + touch targets */}
      {pts.map((p, i) => {
        const isSel = selectedIdx === i;
        return (
          <TouchableOpacity
            key={i}
            style={{ position: 'absolute', left: p.x - 14, top: p.y - 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => onSelect(i)}
            activeOpacity={0.7}
          >
            {isSel && <View style={{ position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: `${color}22` }} />}
            <View style={{
              width: isSel ? 9 : 4, height: isSel ? 9 : 4,
              borderRadius: isSel ? 4.5 : 2,
              backgroundColor: isSel ? color : `${color}99`,
              borderWidth: isSel ? 2 : 0, borderColor: '#fff',
            }} />
          </TouchableOpacity>
        );
      })}

      {/* Tooltip */}
      {selectedIdx !== null && selectedIdx < pts.length && (() => {
        const p = pts[selectedIdx];
        const tipW = 72;
        const cl = Math.min(Math.max(p.x - tipW / 2, L_PAD), chartW - R_PAD - tipW);
        return (
          <View style={{
            position: 'absolute', left: cl, top: p.y - 34,
            backgroundColor: '#1A1A2E', borderRadius: 8,
            paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
              {data[selectedIdx]} {unit}
            </Text>
            <Text style={{ color: '#aaa', fontSize: 9, marginTop: 1 }}>
              Entry {selectedIdx + 1}
            </Text>
          </View>
        );
      })()}

      {/* X-axis labels */}
      {xLabels.map(({ i, label }) => (
        <Text key={i} style={{
          position: 'absolute', left: pts[i].x - 12,
          top: CH - B_PAD + 5, fontSize: 9, color: '#C0B8B4', width: 24, textAlign: 'center',
        }}>
          {label}
        </Text>
      ))}
    </View>
  );
}

// ─── 20-Year Risk Forecast Chart ──────────────────────────────────────────────

function RiskChart({ showManaged, chartW }: { showManaged: boolean; chartW: number }) {
  const n = RISK_YEARS.length;
  const healthyPts = RISK_HEALTHY.map((v, i) => ({ x: px(i, n, chartW), y: py(v, 0, 60) }));
  const currentPts = RISK_CURRENT.map((v, i) => ({ x: px(i, n, chartW), y: py(v, 0, 60) }));
  const managedPts = RISK_MANAGED.map((v, i) => ({ x: px(i, n, chartW), y: py(v, 0, 60) }));

  const xLabels = [{ idx: 0, label: 'Now' }, { idx: 5, label: '+10yr' }, { idx: 10, label: '+20yr' }];
  const lastH = healthyPts[healthyPts.length - 1];
  const lastC = currentPts[currentPts.length - 1];
  const lastM = managedPts[managedPts.length - 1];

  return (
    <View style={{ width: chartW, height: CH }}>
      <YGrid chartW={chartW} ticks={[0, 15, 30, 45, 60]} minV={0} maxV={60} labelFn={(v) => `${v}%`} />

      {/* Today marker */}
      <View style={{ position: 'absolute', left: px(0, n, chartW), top: T_PAD, width: 1, height: CH - T_PAD - B_PAD, backgroundColor: '#D5C9E0' }} />
      <Text style={{ position: 'absolute', left: px(0, n, chartW) + 3, top: T_PAD + 2, fontSize: 9, color: '#9B59B6', fontWeight: '600' }}>
        Today
      </Text>

      {/* Current trajectory */}
      {currentPts.slice(0, -1).map((p, i) => (
        <Segment key={`c${i}`} x1={p.x} y1={p.y} x2={currentPts[i + 1].x} y2={currentPts[i + 1].y}
          color={showManaged ? '#E74C3C44' : '#C0392B'} thick={showManaged ? 1.5 : 2.5} />
      ))}

      {/* Healthy baseline */}
      {healthyPts.slice(0, -1).map((p, i) => (
        <Segment key={`h${i}`} x1={p.x} y1={p.y} x2={healthyPts[i + 1].x} y2={healthyPts[i + 1].y} color="#27AE60" thick={2} />
      ))}

      {/* Managed trajectory */}
      {showManaged && managedPts.slice(0, -1).map((p, i) => (
        <Segment key={`m${i}`} x1={p.x} y1={p.y} x2={managedPts[i + 1].x} y2={managedPts[i + 1].y} color="#2471A3" thick={2.5} />
      ))}

      {/* End labels */}
      <Text style={{ position: 'absolute', left: lastH.x + 4, top: lastH.y - 6, fontSize: 9, fontWeight: '700', color: '#27AE60' }}>
        {RISK_HEALTHY[RISK_HEALTHY.length - 1]}%
      </Text>
      <Text style={{ position: 'absolute', left: lastC.x - (showManaged ? 26 : 4), top: lastC.y + (showManaged ? 2 : -6), fontSize: 9, fontWeight: '700', color: showManaged ? '#E74C3C88' : '#C0392B' }}>
        {RISK_CURRENT[RISK_CURRENT.length - 1]}%
      </Text>
      {showManaged && (
        <Text style={{ position: 'absolute', left: lastM.x - 22, top: lastM.y - 14, fontSize: 9, fontWeight: '700', color: '#2471A3' }}>
          {RISK_MANAGED[RISK_MANAGED.length - 1]}%
        </Text>
      )}

      {/* X-axis labels */}
      {xLabels.map(({ idx, label }) => (
        <Text key={idx} style={{
          position: 'absolute', left: px(idx, n, chartW) - 16,
          top: CH - B_PAD + 5, fontSize: 9, color: '#C0B8B4', width: 32, textAlign: 'center',
        }}>
          {label}
        </Text>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Metric = 'bp' | 'glucose';

const BP_TICKS      = [120, 130, 140, 150];
const GLUCOSE_TICKS = [95, 105, 115];

export default function InsightsScreen() {
  const { width } = useWindowDimensions();
  const chartW = width - 40;

  const { logs } = useHealth();

  // Derive chart arrays from context: reverse so oldest entry is index 0 (left)
  const bpData      = logs.slice().reverse().map((l) => l.systolic);
  const glucoseData = logs.slice().reverse().map((l) => l.glucose);

  const [metric,      setMetric]      = useState<Metric>('bp');
  const [selectedBP,  setSelectedBP]  = useState<number | null>(null);
  const [selectedGlc, setSelectedGlc] = useState<number | null>(null);
  const [showManaged, setShowManaged] = useState(false);

  const bpAvg  = avg(bpData);
  const glcAvg = avg(glucoseData);

  const bpMinV  = bpData.length  ? Math.min(...bpData)  - 8  : 118;
  const bpMaxV  = bpData.length  ? Math.max(...bpData)  + 8  : 152;
  const glcMinV = glucoseData.length ? Math.min(...glucoseData) - 8  : 93;
  const glcMaxV = glucoseData.length ? Math.max(...glucoseData) + 8  : 120;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Your Health, Over Time</Text>
        <Text style={styles.headerTitle}>Long-Term Visualizer</Text>
        <Text style={styles.headerSub}>
          Understanding your trends today shapes your heart health for decades to come.
        </Text>
      </View>

      {/* Stat pills / metric selector */}
      <View style={styles.statRow}>
        <TouchableOpacity
          style={[styles.statPill, metric === 'bp' && styles.statPillActive]}
          onPress={() => setMetric('bp')}
          activeOpacity={0.8}
        >
          <FontAwesome name="heartbeat" size={14} color={metric === 'bp' ? '#fff' : '#9B59B6'} />
          <View style={styles.statPillText}>
            <Text style={[styles.statPillValue, metric === 'bp' && styles.statPillValueActive]}>
              {bpData.length ? `${bpAvg} mmHg` : '— mmHg'}
            </Text>
            <Text style={[styles.statPillLabel, metric === 'bp' && styles.statPillLabelActive]}>
              {bpData.length}-entry avg BP
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statPill, metric === 'glucose' && styles.statPillActiveGlc]}
          onPress={() => setMetric('glucose')}
          activeOpacity={0.8}
        >
          <FontAwesome name="tint" size={14} color={metric === 'glucose' ? '#fff' : '#E67E22'} />
          <View style={styles.statPillText}>
            <Text style={[styles.statPillValue, metric === 'glucose' && styles.statPillValueActive]}>
              {glucoseData.length ? `${glcAvg} mg/dL` : '— mg/dL'}
            </Text>
            <Text style={[styles.statPillLabel, metric === 'glucose' && styles.statPillLabelActive]}>
              {glucoseData.length}-entry avg Glucose
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 30-day (or all-time) Trend Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>
          {metric === 'bp' ? 'Systolic Blood Pressure' : 'Pre-Meal Glucose'} — All Readings
        </Text>
        <Text style={styles.chartSubtitle}>
          {logs.length > 0
            ? `Showing ${logs.length} logged reading${logs.length > 1 ? 's' : ''}. Tap a point to inspect.`
            : 'Log your first reading to see your trend.'}
        </Text>

        <View style={styles.chartCanvas}>
          {metric === 'bp' ? (
            <TrendChart
              data={bpData}
              minV={bpMinV}  maxV={bpMaxV}
              ticks={BP_TICKS}
              color="#9B59B6"
              safeValue={120} safeLabel="Normal ≤120"
              unit="mmHg"
              chartW={chartW}
              selectedIdx={selectedBP}
              onSelect={setSelectedBP}
            />
          ) : (
            <TrendChart
              data={glucoseData}
              minV={glcMinV} maxV={glcMaxV}
              ticks={GLUCOSE_TICKS}
              color="#E67E22"
              safeValue={100} safeLabel="Fasting ≤100"
              unit="mg/dL"
              chartW={chartW}
              selectedIdx={selectedGlc}
              onSelect={setSelectedGlc}
            />
          )}
        </View>

        <View style={styles.trendContext}>
          <FontAwesome name="info-circle" size={13} color="#9B59B6" />
          <Text style={styles.trendContextText}>
            {metric === 'bp'
              ? bpData.length
                ? `Your average of ${bpAvg} mmHg across ${bpData.length} reading${bpData.length > 1 ? 's' : ''}. Persistently above 120 mmHg raises long-term cardiovascular risk.`
                : 'Log blood pressure readings to see your trend and average.'
              : glucoseData.length
                ? `Your average of ${glcAvg} mg/dL across ${glucoseData.length} reading${glucoseData.length > 1 ? 's' : ''}. Elevated glucose and BP together can double long-term heart risk.`
                : 'Log glucose readings to see your trend and average.'
            }
          </Text>
        </View>
      </View>

      {/* 20-Year Risk Forecast */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Your Heart's Future — 20-Year Forecast</Text>
        <Text style={styles.chartSubtitle}>Estimated lifetime cardiovascular disease risk (%)</Text>

        <View style={styles.chartCanvas}>
          <RiskChart showManaged={showManaged} chartW={chartW} />
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#27AE60' }]} />
            <Text style={styles.legendLabel}>Healthy baseline</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: showManaged ? '#E74C3C88' : '#C0392B' }]} />
            <Text style={[styles.legendLabel, showManaged && { color: '#C0B8B4' }]}>Current trajectory</Text>
          </View>
          {showManaged && (
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: '#2471A3' }]} />
              <Text style={styles.legendLabel}>If managed now</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.managedToggle, showManaged && styles.managedToggleActive]}
          onPress={() => setShowManaged((v) => !v)}
          activeOpacity={0.8}
        >
          <FontAwesome name={showManaged ? 'check-square' : 'square-o'} size={16} color={showManaged ? '#fff' : '#2471A3'} />
          <Text style={[styles.managedToggleText, showManaged && styles.managedToggleTextActive]}>
            Show "If I manage my BP & glucose today"
          </Text>
        </TouchableOpacity>

        <View style={[styles.trendContext, { marginTop: 10 }]}>
          <FontAwesome name="info-circle" size={13} color="#2471A3" />
          <Text style={styles.trendContextText}>
            {showManaged
              ? 'By managing elevated BP and glucose now, your 20-year cardiovascular risk can stay near 19% — compared to 50% if left unaddressed.'
              : 'Without intervention, slightly elevated BP and glucose in the maternal period can compound year over year. Toggle above to see the difference.'
            }
          </Text>
        </View>
      </View>

      {/* Affirmation */}
      <View style={styles.affirmCard}>
        <FontAwesome name="heart" size={18} color="#C0392B" />
        <Text style={styles.affirmTitle}>You're already ahead.</Text>
        <Text style={styles.affirmBody}>
          Tracking your health today — even small readings — puts you in the top tier of proactive maternal care. Every data point you log paints a clearer picture for your doctor and a healthier future for you.
        </Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PURPLE = '#9B59B6';
const ORANGE = '#E67E22';
const BLUE   = '#2471A3';

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8F4F9' },
  container: { padding: 20 },

  header: { marginBottom: 18, marginTop: 4 },
  headerEyebrow: { fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#1A1A2E', marginTop: 2 },
  headerSub: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 19 },

  statRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: '#E8E0EE',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statPillActive:    { backgroundColor: PURPLE, borderColor: PURPLE },
  statPillActiveGlc: { backgroundColor: ORANGE, borderColor: ORANGE },
  statPillText: { flex: 1 },
  statPillValue: { fontSize: 15, fontWeight: '700', color: '#333' },
  statPillLabel: { fontSize: 10, color: '#999', marginTop: 1 },
  statPillValueActive: { color: '#fff' },
  statPillLabelActive: { color: 'rgba(255,255,255,0.75)' },

  chartCard: {
    backgroundColor: '#fff', borderRadius: 16, paddingTop: 18,
    paddingHorizontal: 0, paddingBottom: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  chartTitle:    { fontSize: 14, fontWeight: '700', color: '#1A1A2E', paddingHorizontal: 18, marginBottom: 2 },
  chartSubtitle: { fontSize: 11, color: '#aaa', paddingHorizontal: 18, marginBottom: 12 },
  chartCanvas:   { paddingHorizontal: 20, overflow: 'hidden' },

  trendContext: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: 14, marginHorizontal: 18, backgroundColor: '#F5F0FA', borderRadius: 10, padding: 12,
  },
  trendContextText: { flex: 1, fontSize: 12, color: '#555', lineHeight: 18 },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 18, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 20, height: 3, borderRadius: 2 },
  legendLabel: { fontSize: 11, color: '#666' },

  managedToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 18, marginTop: 14,
    borderWidth: 1.5, borderColor: BLUE, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
  },
  managedToggleActive:     { backgroundColor: BLUE, borderColor: BLUE },
  managedToggleText:       { flex: 1, fontSize: 13, color: BLUE, fontWeight: '600' },
  managedToggleTextActive: { color: '#fff' },

  affirmCard: {
    backgroundColor: '#FEF9F9', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#FADBD8', padding: 20, alignItems: 'center', gap: 8,
  },
  affirmTitle: { fontSize: 17, fontWeight: '700', color: '#922B21', textAlign: 'center' },
  affirmBody:  { fontSize: 13, color: '#555', lineHeight: 20, textAlign: 'center' },
});
