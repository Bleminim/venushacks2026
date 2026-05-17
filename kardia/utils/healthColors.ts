import { MealTiming } from '@/context/HealthContext';

// ─── Blood Pressure — ACOG Maternal Thresholds ───────────────────────────────
//
//   RED    sys >= 140 OR dia >= 90  →  Gestational hypertension / preeclampsia range
//   YELLOW sys 120–139 OR dia 80–89 →  Elevated, monitor closely during pregnancy
//   GREEN  sys < 120  AND dia < 80  →  Normal for pregnancy

export interface BPStatus {
  label: string;
  sublabel: string;
  color: string;        // primary text / icon color
  bgColor: string;      // card background
  borderColor: string;  // card border AND left accent bar
  icon: 'check-circle' | 'exclamation-circle' | 'exclamation-triangle';
}

export function getBPStatus(systolic: number, diastolic: number): BPStatus {
  // RED — gestational hypertension / preeclampsia danger zone
  if (systolic >= 140 || diastolic >= 90) {
    return {
      label:       'Call Doctor',
      sublabel:    'Gestational Hypertension Risk',
      color:       '#C0392B',
      bgColor:     '#FDEDEC',
      borderColor: '#E74C3C',
      icon:        'exclamation-triangle',
    };
  }
  // YELLOW — elevated for pregnancy, needs monitoring
  if (systolic >= 120 || diastolic >= 80) {
    return {
      label:       'Monitor Closely',
      sublabel:    'Elevated for Pregnancy',
      color:       '#B7770D',
      bgColor:     '#FFFDE7',
      borderColor: '#F1C40F',
      icon:        'exclamation-circle',
    };
  }
  // GREEN — normal
  return {
    label:       'Normal',
    sublabel:    'Looking good',
    color:       '#1E8449',
    bgColor:     '#EAFAF1',
    borderColor: '#27AE60',
    icon:        'check-circle',
  };
}

// ─── Glucose — ACOG Fasting Targets ──────────────────────────────────────────
//
//   Pre-meal (fasting) ACOG thresholds:
//     RED    > 105 mg/dL  →  High risk
//     YELLOW 95–105 mg/dL →  Elevated (95 is the ACOG strict fasting cutoff)
//     GREEN  < 95 mg/dL   →  Normal for pregnancy
//
//   Post-meal: standard 1-hour and 2-hour gestational thresholds.

export interface GlucoseStatus {
  label: string;
  color: string;
}

export function getGlucoseStatus(glucose: number, mealTiming: MealTiming): GlucoseStatus {
  if (mealTiming === 'pre') {
    // ACOG fasting thresholds
    if (glucose > 105) return { label: 'High Risk', color: '#C0392B' };
    if (glucose >= 95) return  { label: 'Elevated',  color: '#B7770D' };
    return                     { label: 'Normal',    color: '#1E8449' };
  }
  // Post-meal: ACOG 2-hour threshold is 120 mg/dL; use 140 as a wider yellow band
  if (glucose > 140) return { label: 'High Risk', color: '#C0392B' };
  if (glucose >= 120) return { label: 'Elevated',  color: '#B7770D' };
  return                     { label: 'Normal',    color: '#1E8449' };
}
