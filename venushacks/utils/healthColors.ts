import { MealTiming } from '@/context/HealthContext';

// ─── Blood Pressure ───────────────────────────────────────────────────────────

export interface BPStatus {
  label: string;
  sublabel: string;
  color: string;        // primary text / icon color
  bgColor: string;      // card background
  borderColor: string;  // card border AND left accent bar
  icon: 'check-circle' | 'exclamation-circle' | 'exclamation-triangle';
}

export function getBPStatus(systolic: number, diastolic: number): BPStatus {
  if (systolic >= 140 || diastolic >= 90) {
    return {
      label: 'Stage 2 High',
      sublabel: 'Stage 2 Hypertension',
      color: '#C0392B',
      bgColor: '#FDEDEC',
      borderColor: '#E74C3C',
      icon: 'exclamation-triangle',
    };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return {
      label: 'Stage 1 High',
      sublabel: 'Stage 1 Hypertension',
      color: '#D35400',
      bgColor: '#FEF5EC',
      borderColor: '#E67E22',
      icon: 'exclamation-circle',
    };
  }
  if (systolic >= 120) {
    return {
      label: 'Elevated',
      sublabel: 'Elevated Blood Pressure',
      color: '#B7770D',
      bgColor: '#FFFDE7',
      borderColor: '#F1C40F',
      icon: 'exclamation-circle',
    };
  }
  return {
    label: 'Normal',
    sublabel: 'Looking good',
    color: '#1E8449',
    bgColor: '#EAFAF1',
    borderColor: '#27AE60',
    icon: 'check-circle',
  };
}

// ─── Glucose ──────────────────────────────────────────────────────────────────

export interface GlucoseStatus {
  label: string;
  color: string;
}

export function getGlucoseStatus(glucose: number, mealTiming: MealTiming): GlucoseStatus {
  if (mealTiming === 'pre') {
    if (glucose >= 126) return { label: 'High',     color: '#C0392B' };
    if (glucose >= 100) return { label: 'Elevated', color: '#D35400' };
    return                     { label: 'Normal',   color: '#1E8449' };
  }
  // post-meal thresholds
  if (glucose >= 200) return { label: 'High',     color: '#C0392B' };
  if (glucose >= 140) return { label: 'Elevated', color: '#D35400' };
  return                     { label: 'Normal',   color: '#1E8449' };
}
