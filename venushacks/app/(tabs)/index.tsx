import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// --- Mock Data ---
const READING = {
  systolic: 145,
  diastolic: 95,
  timestamp: 'Today at 8:14 AM',
  pulse: 82,
};

// BP thresholds (mmHg)
function classifyBP(sys: number, dia: number) {
  if (sys >= 140 || dia >= 90) {
    return {
      level: 'warning',
      label: 'High Blood Pressure',
      sublabel: 'Stage 2 Hypertension',
      color: '#C0392B',
      bgColor: '#FDEDEC',
      borderColor: '#E74C3C',
      icon: 'exclamation-triangle' as const,
      plainText:
        'Your blood pressure of 145/95 is above the safe range. Readings at or above 140/90 are classified as Stage 2 hypertension. During and after pregnancy, high blood pressure can affect both your heart and your baby\'s health. This reading warrants a prompt conversation with your care team.',
    };
  }
  if (sys >= 130 || dia >= 80) {
    return {
      level: 'caution',
      label: 'Elevated Blood Pressure',
      sublabel: 'Stage 1 Hypertension',
      color: '#D35400',
      bgColor: '#FEF9E7',
      borderColor: '#F39C12',
      icon: 'exclamation-circle' as const,
      plainText:
        'Your blood pressure is slightly elevated. Monitor closely and discuss with your provider.',
    };
  }
  return {
    level: 'normal',
    label: 'Normal Blood Pressure',
    sublabel: 'Looking good',
    color: '#1E8449',
    bgColor: '#EAFAF1',
    borderColor: '#27AE60',
    icon: 'check-circle' as const,
    plainText: 'Your blood pressure is within a healthy range. Keep up the great work.',
  };
}

const ADVOCACY_SCRIPT = `"I've been tracking my blood pressure at home and I want to share a reading with you. This morning it was 145/95. I know that's above 140/90, which I understand is the threshold for Stage 2 hypertension.

I'd like to understand:
  1. Does this reading concern you given where I am in my pregnancy or postpartum recovery?
  2. Should we be adjusting my monitoring schedule or treatment plan?
  3. What warning signs should prompt me to call you or go to the ER immediately?

I want to make sure we're on the same page about next steps."`;

export default function HomeScreen() {
  const status = classifyBP(READING.systolic, READING.diastolic);
  const [scriptExpanded, setScriptExpanded] = useState(false);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning</Text>
        <Text style={styles.headerTitle}>Translation Engine</Text>
        <Text style={styles.headerSub}>Your latest reading, explained.</Text>
      </View>

      {/* BP Reading Card */}
      <View style={styles.readingCard}>
        <View style={styles.readingRow}>
          <View style={styles.readingMain}>
            <Text style={styles.bpLabel}>Blood Pressure</Text>
            <View style={styles.bpValueRow}>
              <Text style={[styles.bpValue, { color: status.color }]}>
                {READING.systolic}/{READING.diastolic}
              </Text>
              <Text style={styles.bpUnit}>mmHg</Text>
            </View>
            <Text style={styles.bpTimestamp}>{READING.timestamp}</Text>
          </View>
          <View style={styles.pulseBox}>
            <FontAwesome name="heartbeat" size={18} color="#C0392B" />
            <Text style={styles.pulseValue}>{READING.pulse}</Text>
            <Text style={styles.pulseLabel}>bpm</Text>
          </View>
        </View>

        {/* Systolic / Diastolic breakdown */}
        <View style={styles.bpBreakdown}>
          <View style={styles.bpBreakdownItem}>
            <Text style={styles.bpBreakdownNum}>{READING.systolic}</Text>
            <Text style={styles.bpBreakdownLbl}>Systolic</Text>
          </View>
          <View style={styles.bpDivider} />
          <View style={styles.bpBreakdownItem}>
            <Text style={styles.bpBreakdownNum}>{READING.diastolic}</Text>
            <Text style={styles.bpBreakdownLbl}>Diastolic</Text>
          </View>
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
        <Text style={styles.alertBody}>{status.plainText}</Text>
      </View>

      {/* What this means section */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>What do these numbers mean?</Text>
        <View style={styles.infoRow}>
          <View style={[styles.infoIndicator, { backgroundColor: '#C0392B' }]} />
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>145 (Systolic)</Text> — the pressure when your heart beats. Above 140 is high.
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.infoIndicator, { backgroundColor: '#E74C3C' }]} />
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>95 (Diastolic)</Text> — the pressure between beats. Above 90 is high.
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.infoIndicator, { backgroundColor: '#27AE60' }]} />
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>Healthy range</Text> — below 120/80 is ideal for most people.
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
          Tap to {scriptExpanded ? 'collapse' : 'expand'} — copy and share at your next appointment
        </Text>

        {scriptExpanded && (
          <View style={styles.scriptBody}>
            <View style={styles.scriptDivider} />
            <Text style={styles.scriptText}>{ADVOCACY_SCRIPT}</Text>
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

      {/* Next step nudge */}
      <View style={styles.nudgeCard}>
        <FontAwesome name="calendar" size={16} color="#2471A3" />
        <Text style={styles.nudgeText}>
          Readings like this are worth logging daily. Head to the{' '}
          <Text style={styles.nudgeBold}>Log tab</Text> to track your next measurement.
        </Text>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F8F4F9',
  },
  container: {
    padding: 20,
  },

  // Header
  header: {
    marginBottom: 20,
    marginTop: 4,
  },
  greeting: {
    fontSize: 13,
    color: '#888',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 2,
  },
  headerSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // Reading Card
  readingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  readingMain: {
    flex: 1,
  },
  bpLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  bpValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bpValue: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 52,
  },
  bpUnit: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  bpTimestamp: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  pulseBox: {
    alignItems: 'center',
    backgroundColor: '#FEF9F9',
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  pulseValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#C0392B',
    marginTop: 4,
  },
  pulseLabel: {
    fontSize: 11,
    color: '#999',
  },
  bpBreakdown: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 14,
  },
  bpBreakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  bpBreakdownNum: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  bpBreakdownLbl: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  bpDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },

  // Alert Card
  alertCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  alertTitleGroup: {
    flex: 1,
  },
  alertLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  alertSublabel: {
    fontSize: 12,
    opacity: 0.75,
    marginTop: 1,
  },
  alertBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 21,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  infoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
  },
  infoBold: {
    fontWeight: '600',
    color: '#333',
  },

  // Advocacy Script Card
  scriptCard: {
    backgroundColor: '#FAF0FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D7BDE2',
    padding: 16,
    marginBottom: 14,
  },
  scriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scriptTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scriptTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6C3483',
  },
  scriptBadge: {
    backgroundColor: '#D7BDE2',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scriptBadgeText: {
    fontSize: 11,
    color: '#6C3483',
    fontWeight: '600',
  },
  scriptSubtitle: {
    fontSize: 12,
    color: '#9B59B6',
    marginBottom: 4,
  },
  scriptBody: {
    marginTop: 4,
  },
  scriptDivider: {
    height: 1,
    backgroundColor: '#D7BDE2',
    marginVertical: 12,
  },
  scriptText: {
    fontSize: 13.5,
    color: '#4A235A',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  scriptFooter: {
    alignItems: 'center',
    marginTop: 10,
  },

  // Nudge
  nudgeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF5FB',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  nudgeText: {
    flex: 1,
    fontSize: 13,
    color: '#1A5276',
    lineHeight: 19,
  },
  nudgeBold: {
    fontWeight: '700',
  },

  bottomSpacer: {
    height: 24,
  },
});
