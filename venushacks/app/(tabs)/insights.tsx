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

// ─── Hardcoded Mock Data ──────────────────────────────────────────────────────

/** 30 days of systolic BP readings trending around 135 mmHg */
const BP_SYS_30D = [
  138, 136, 140, 135, 133, 137, 142, 139, 134, 136,
  138, 141, 135, 133, 137, 140, 138, 135, 134, 138,
  141, 136, 133, 137, 139, 135, 138, 140, 136, 135,
];

/** 30 days of pre-meal glucose readings trending around 105 mg/dL */
const GLUCOSE_30D = [
  108, 104, 107, 110, 103, 106, 112, 108, 103, 105,
  109, 106, 103, 107, 111, 108, 104, 106, 103, 108,
  112, 107, 103, 106, 109, 105, 108, 111, 107, 104,
];

/**
 * 20-year cardiovascular risk forecast.
 * 11 biennial data points (years 0, 2, 4 … 20).
 * Values are illustrative % lifetime CVD risk estimates.
 */
const RISK_YEARS  = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
const RISK_HEALTHY = [10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15];
const RISK_CURRENT = [10, 12,   15.5, 20, 26, 32,   37.5, 42, 45.5, 48,  50];
const RISK_MANAGED = [10, 11,   12.5, 14, 15.5, 16.5, 17, 17.5, 18, 18.5, 19];

// ─── Chart Layout Constants ───────────────────────────────────────────────────

const CH      = 195;   // total canvas height (px)
const T_PAD   = 38;    // top padding – room for tooltip
const B_PAD   = 22;    // bottom padding – x-axis labels
const L_PAD   = 36;    // left padding – y-axis labels
const R_PAD   = 8;

/** Map a data index to an x-pixel coordinate inside the chart canvas */
function px(index: number, total: number, chartW: number): number {
  return L_PAD + (index / (total - 1)) * (chartW - L_PAD - R_PAD);
}

/** Map a data value to a y-pixel coordinate (top = high value) */
function py(value: number, minV: number, maxV: number): number {
  return T_PAD + (1 - (value - minV) / (maxV - minV)) * (CH - T_PAD - B_PAD);
}

function avg(arr: number[]): number {
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

// ─── Primitive chart components ───────────────────────────────────────────────

/** Draws a single line segment between two absolute pixel points. */
function Segment({
  x1, y1, x2, y2, color, thick = 2.5,
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; thick?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <View
      style={{
        position: 'absolute',
        // position the View so its center sits exactly at the midpoint of the segment
        left: (x1 + x2) / 2 - len / 2,
        top:  (y1 + y2) / 2 - thick / 2,
        width: len,
        height: thick,
        backgroundColor: color,
        borderRadius: thick / 2,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

/** Renders horizontal grid lines with left-side y-axis labels. */
function YGrid({
  chartW, ticks, minV, maxV,
  labelFn,
}: {
  chartW: number;
  ticks: number[];
  minV: number;
  maxV: number;
  labelFn: (v: number) => string;
}) {
  return (
    <>
      {ticks.map((v) => {
        const y = py(v, minV, maxV);
        return (
          <React.Fragment key={v}>
            <View style={{
              position: 'absolute',
              left: L_PAD,
              top: y,
              width: chartW - L_PAD - R_PAD,
              height: 1,
              backgroundColor: '#F0EDEB',
            }} />
            <Text style={{
              position: 'absolute',
              left: 0,
              top: y - 7,
              width: L_PAD - 4,
              fontSize: 9,
              color: '#C0B8B4',
              textAlign: 'right',
            }}>
              {labelFn(v)}
            </Text>
          </React.Fragment>
        );
      })}
    </>
  );
}

// ─── Trend Chart (30-day time series) ────────────────────────────────────────

const BP_TICKS      = [120, 130, 140, 150];
const GLUCOSE_TICKS = [95, 105, 115];

interface TrendChartProps {
  data: number[];
  minV: number;
  maxV: number;
  ticks: number[];
  color: string;
  safeValue: number;
  safeLabel: string;
  unit: string;
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

  // X-axis labels: Day 1, 7, 14, 21, 30
  const xLabels = [
    { i: 0,  label: 'D1'  },
    { i: 6,  label: 'D7'  },
    { i: 13, label: 'D14' },
    { i: 20, label: 'D21' },
    { i: 29, label: 'D30' },
  ];

  return (
    <View style={{ width: chartW, height: CH }}>
      {/* Y-axis grid */}
      <YGrid chartW={chartW} ticks={ticks} minV={minV} maxV={maxV} labelFn={String} />

      {/* Safe-range reference line */}
      <View style={{
        position: 'absolute',
        left: L_PAD,
        top: safeY,
        width: chartW - L_PAD - R_PAD,
        height: 1.5,
        backgroundColor: '#27AE6055',
      }} />
      <Text style={{
        position: 'absolute',
        left: L_PAD + 4,
        top: safeY - 13,
        fontSize: 9,
        color: '#27AE60',
        fontWeight: '600',
      }}>
        {safeLabel}
      </Text>

      {/* Line segments */}
      {pts.slice(0, -1).map((p, i) => (
        <Segment
          key={i}
          x1={p.x} y1={p.y}
          x2={pts[i + 1].x} y2={pts[i + 1].y}
          color={color}
          thick={2.5}
        />
      ))}

      {/* Dots + touch targets */}
      {pts.map((p, i) => {
        const isSelected = selectedIdx === i;
        return (
          <TouchableOpacity
            key={i}
            style={{
              position: 'absolute',
              left: p.x - 14,
              top:  p.y - 14,
              width: 28,
              height: 28,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => onSelect(i)}
            activeOpacity={0.7}
          >
            {isSelected && (
              <View style={{
                position: 'absolute',
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: `${color}22`,
              }} />
            )}
            <View style={{
              width: isSelected ? 9 : 4,
              height: isSelected ? 9 : 4,
              borderRadius: isSelected ? 4.5 : 2,
              backgroundColor: isSelected ? color : `${color}99`,
              borderWidth: isSelected ? 2 : 0,
              borderColor: '#fff',
            }} />
          </TouchableOpacity>
        );
      })}

      {/* Tooltip */}
      {selectedIdx !== null && (() => {
        const p = pts[selectedIdx];
        const tipW = 72;
        const clampedLeft = Math.min(Math.max(p.x - tipW / 2, L_PAD), chartW - R_PAD - tipW);
        return (
          <View style={{
            position: 'absolute',
            left: clampedLeft,
            top: p.y - 34,
            backgroundColor: '#1A1A2E',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 5,
            alignItems: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
              {data[selectedIdx]} {unit}
            </Text>
            <Text style={{ color: '#aaa', fontSize: 9, marginTop: 1 }}>
              Day {selectedIdx + 1}
            </Text>
          </View>
        );
      })()}

      {/* X-axis labels */}
      {xLabels.map(({ i, label }) => (
        <Text
          key={i}
          style={{
            position: 'absolute',
            left: pts[i].x - 12,
            top: CH - B_PAD + 5,
            fontSize: 9,
            color: '#C0B8B4',
            width: 24,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

// ─── 20-Year Risk Forecast Chart ──────────────────────────────────────────────

const RISK_MIN = 0;
const RISK_MAX = 60;
const RISK_TICKS = [0, 15, 30, 45, 60];

interface RiskChartProps {
  showManaged: boolean;
  chartW: number;
}

function RiskChart({ showManaged, chartW }: RiskChartProps) {
  const n = RISK_YEARS.length;

  const healthyPts = RISK_HEALTHY.map((v, i) => ({
    x: px(i, n, chartW), y: py(v, RISK_MIN, RISK_MAX),
  }));
  const currentPts = RISK_CURRENT.map((v, i) => ({
    x: px(i, n, chartW), y: py(v, RISK_MIN, RISK_MAX),
  }));
  const managedPts = RISK_MANAGED.map((v, i) => ({
    x: px(i, n, chartW), y: py(v, RISK_MIN, RISK_MAX),
  }));

  const xLabels = [
    { idx: 0,  label: 'Now'   },
    { idx: 5,  label: '+10yr' },
    { idx: 10, label: '+20yr' },
  ];

  const lastHealthy = healthyPts[healthyPts.length - 1];
  const lastCurrent = currentPts[currentPts.length - 1];
  const lastManaged = managedPts[managedPts.length - 1];

  return (
    <View style={{ width: chartW, height: CH }}>
      {/* Y-axis grid */}
      <YGrid
        chartW={chartW}
        ticks={RISK_TICKS}
        minV={RISK_MIN}
        maxV={RISK_MAX}
        labelFn={(v) => `${v}%`}
      />

      {/* "Now" vertical marker */}
      <View style={{
        position: 'absolute',
        left: px(0, n, chartW),
        top: T_PAD,
        width: 1,
        height: CH - T_PAD - B_PAD,
        backgroundColor: '#D5C9E0',
      }} />
      <Text style={{
        position: 'absolute',
        left: px(0, n, chartW) + 3,
        top: T_PAD + 2,
        fontSize: 9,
        color: '#9B59B6',
        fontWeight: '600',
      }}>
        Today
      </Text>

      {/* Current trajectory (faded when managed shown) */}
      {currentPts.slice(0, -1).map((p, i) => (
        <Segment
          key={`cur${i}`}
          x1={p.x} y1={p.y}
          x2={currentPts[i + 1].x} y2={currentPts[i + 1].y}
          color={showManaged ? '#E74C3C44' : '#C0392B'}
          thick={showManaged ? 1.5 : 2.5}
        />
      ))}

      {/* Healthy baseline */}
      {healthyPts.slice(0, -1).map((p, i) => (
        <Segment
          key={`hlt${i}`}
          x1={p.x} y1={p.y}
          x2={healthyPts[i + 1].x} y2={healthyPts[i + 1].y}
          color="#27AE60"
          thick={2}
        />
      ))}

      {/* Managed trajectory */}
      {showManaged && managedPts.slice(0, -1).map((p, i) => (
        <Segment
          key={`mgd${i}`}
          x1={p.x} y1={p.y}
          x2={managedPts[i + 1].x} y2={managedPts[i + 1].y}
          color="#2471A3"
          thick={2.5}
        />
      ))}

      {/* End-of-line labels */}
      <Text style={{
        position: 'absolute',
        left: lastHealthy.x + 4,
        top: lastHealthy.y - 6,
        fontSize: 9, fontWeight: '700', color: '#27AE60',
      }}>
        {RISK_HEALTHY[RISK_HEALTHY.length - 1]}%
      </Text>
      <Text style={{
        position: 'absolute',
        left: lastCurrent.x - (showManaged ? 26 : 4),
        top: lastCurrent.y + (showManaged ? 2 : -6),
        fontSize: 9, fontWeight: '700',
        color: showManaged ? '#E74C3C88' : '#C0392B',
      }}>
        {RISK_CURRENT[RISK_CURRENT.length - 1]}%
      </Text>
      {showManaged && (
        <Text style={{
          position: 'absolute',
          left: lastManaged.x - 22,
          top: lastManaged.y - 14,
          fontSize: 9, fontWeight: '700', color: '#2471A3',
        }}>
          {RISK_MANAGED[RISK_MANAGED.length - 1]}%
        </Text>
      )}

      {/* X-axis labels */}
      {xLabels.map(({ idx, label }) => (
        <Text
          key={idx}
          style={{
            position: 'absolute',
            left: px(idx, n, chartW) - 16,
            top: CH - B_PAD + 5,
            fontSize: 9,
            color: '#C0B8B4',
            width: 32,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Metric = 'bp' | 'glucose';

export default function InsightsScreen() {
  const { width } = useWindowDimensions();
  const chartW = width - 40; // 20px horizontal padding each side

  const [metric, setMetric]           = useState<Metric>('bp');
  const [selectedBP, setSelectedBP]   = useState<number>(BP_SYS_30D.length - 1);
  const [selectedGlc, setSelectedGlc] = useState<number>(GLUCOSE_30D.length - 1);
  const [showManaged, setShowManaged] = useState(false);

  const bpAvg  = avg(BP_SYS_30D);
  const glcAvg = avg(GLUCOSE_30D);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Your Health, Over Time</Text>
        <Text style={styles.headerTitle}>Long-Term Visualizer</Text>
        <Text style={styles.headerSub}>
          Understanding your trends today shapes your heart health for decades to come.
        </Text>
      </View>

      {/* ── 30-Day Stat Pills ── */}
      <View style={styles.statRow}>
        <TouchableOpacity
          style={[styles.statPill, metric === 'bp' && styles.statPillActive]}
          onPress={() => setMetric('bp')}
          activeOpacity={0.8}
        >
          <FontAwesome name="heartbeat" size={14} color={metric === 'bp' ? '#fff' : '#9B59B6'} />
          <View style={styles.statPillText}>
            <Text style={[styles.statPillValue, metric === 'bp' && styles.statPillValueActive]}>
              {bpAvg} mmHg
            </Text>
            <Text style={[styles.statPillLabel, metric === 'bp' && styles.statPillLabelActive]}>
              30-day avg BP
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
              {glcAvg} mg/dL
            </Text>
            <Text style={[styles.statPillLabel, metric === 'glucose' && styles.statPillLabelActive]}>
              30-day avg Glucose
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── 30-Day Trend Chart ── */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>
          {metric === 'bp' ? 'Systolic Blood Pressure' : 'Pre-Meal Glucose'} — Last 30 Days
        </Text>
        <Text style={styles.chartSubtitle}>Tap any point to inspect that day's reading</Text>

        <View style={styles.chartCanvas}>
          {metric === 'bp' ? (
            <TrendChart
              data={BP_SYS_30D}
              minV={118}  maxV={152}
              ticks={BP_TICKS}
              color="#9B59B6"
              safeValue={120}
              safeLabel="Normal ≤120"
              unit="mmHg"
              chartW={chartW}
              selectedIdx={selectedBP}
              onSelect={setSelectedBP}
            />
          ) : (
            <TrendChart
              data={GLUCOSE_30D}
              minV={93}   maxV={120}
              ticks={GLUCOSE_TICKS}
              color="#E67E22"
              safeValue={100}
              safeLabel="Fasting ≤100"
              unit="mg/dL"
              chartW={chartW}
              selectedIdx={selectedGlc}
              onSelect={setSelectedGlc}
            />
          )}
        </View>

        {/* Context callout */}
        <View style={styles.trendContext}>
          <FontAwesome name="info-circle" size={13} color="#9B59B6" />
          <Text style={styles.trendContextText}>
            {metric === 'bp'
              ? `Your 30-day average of ${bpAvg} mmHg is above the 120 mmHg threshold. Persistently elevated BP is the leading risk factor for maternal cardiovascular disease.`
              : `Your 30-day average of ${glcAvg} mg/dL is slightly above the healthy fasting target of 100. Elevated glucose and blood pressure together can double long-term heart risk.`
            }
          </Text>
        </View>
      </View>

      {/* ── 20-Year Risk Forecast ── */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Your Heart's Future — 20-Year Forecast</Text>
        <Text style={styles.chartSubtitle}>
          Estimated lifetime cardiovascular disease risk (%)
        </Text>

        <View style={styles.chartCanvas}>
          <RiskChart showManaged={showManaged} chartW={chartW} />
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#27AE60' }]} />
            <Text style={styles.legendLabel}>Healthy baseline</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: showManaged ? '#E74C3C88' : '#C0392B' }]} />
            <Text style={[styles.legendLabel, showManaged && { color: '#C0B8B4' }]}>
              Current trajectory
            </Text>
          </View>
          {showManaged && (
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: '#2471A3' }]} />
              <Text style={styles.legendLabel}>If managed now</Text>
            </View>
          )}
        </View>

        {/* Managed toggle */}
        <TouchableOpacity
          style={[styles.managedToggle, showManaged && styles.managedToggleActive]}
          onPress={() => setShowManaged((v) => !v)}
          activeOpacity={0.8}
        >
          <FontAwesome
            name={showManaged ? 'check-square' : 'square-o'}
            size={16}
            color={showManaged ? '#fff' : '#2471A3'}
          />
          <Text style={[styles.managedToggleText, showManaged && styles.managedToggleTextActive]}>
            Show "If I manage my BP & glucose today"
          </Text>
        </TouchableOpacity>

        {/* Forecast context */}
        <View style={[styles.trendContext, { marginTop: 10 }]}>
          <FontAwesome name="info-circle" size={13} color="#2471A3" />
          <Text style={styles.trendContextText}>
            {showManaged
              ? 'By managing elevated BP and glucose now, research shows your 20-year cardiovascular risk can stay near 19% — compared to 50% if left unaddressed. The action you take today has compounding benefits for decades.'
              : 'Without lifestyle or medical intervention, slightly elevated BP and glucose in the maternal period can compound year over year. Toggle the scenario above to see what proactive management looks like.'
            }
          </Text>
        </View>
      </View>

      {/* ── Positive Affirmation ── */}
      <View style={styles.affirmCard}>
        <FontAwesome name="heart" size={18} color="#C0392B" />
        <Text style={styles.affirmTitle}>You're already ahead.</Text>
        <Text style={styles.affirmBody}>
          Tracking your health today — even small readings — puts you in the top tier of proactive maternal care. Every data point you log helps paint a clearer picture for your doctor and a healthier future for you and your family.
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

  // Header
  header: { marginBottom: 18, marginTop: 4 },
  headerEyebrow: {
    fontSize: 12, color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 26, fontWeight: '700', color: '#1A1A2E', marginTop: 2,
  },
  headerSub: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 19 },

  // Stat pills (metric selector)
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E8E0EE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statPillActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  statPillActiveGlc: {
    backgroundColor: ORANGE,
    borderColor: ORANGE,
  },
  statPillText: { flex: 1 },
  statPillValue: { fontSize: 15, fontWeight: '700', color: '#333' },
  statPillLabel: { fontSize: 10, color: '#999', marginTop: 1 },
  statPillValueActive: { color: '#fff' },
  statPillLabelActive: { color: 'rgba(255,255,255,0.75)' },

  // Chart card
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingTop: 18,
    paddingHorizontal: 0,
    paddingBottom: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 14, fontWeight: '700', color: '#1A1A2E',
    paddingHorizontal: 18, marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 11, color: '#aaa',
    paddingHorizontal: 18, marginBottom: 12,
  },
  chartCanvas: {
    paddingHorizontal: 20,
    overflow: 'hidden',
  },

  // Trend context callout
  trendContext: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    marginHorizontal: 18,
    backgroundColor: '#F5F0FA',
    borderRadius: 10,
    padding: 12,
  },
  trendContextText: {
    flex: 1, fontSize: 12, color: '#555', lineHeight: 18,
  },

  // Risk chart legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 18,
    marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 20, height: 3, borderRadius: 2 },
  legendLabel: { fontSize: 11, color: '#666' },

  // Managed scenario toggle
  managedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 18,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: BLUE,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  managedToggleActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  managedToggleText: {
    flex: 1, fontSize: 13, color: BLUE, fontWeight: '600',
  },
  managedToggleTextActive: { color: '#fff' },

  // Affirmation card
  affirmCard: {
    backgroundColor: '#FEF9F9',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FADBD8',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  affirmTitle: {
    fontSize: 17, fontWeight: '700', color: '#922B21', textAlign: 'center',
  },
  affirmBody: {
    fontSize: 13, color: '#555', lineHeight: 20, textAlign: 'center',
  },
});
