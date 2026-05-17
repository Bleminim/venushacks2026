import React, { createContext, useContext, useState, ReactNode } from 'react';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type MealTiming = 'pre' | 'post';

export interface LogEntry {
  id: string;
  date: string;
  systolic: number;
  diastolic: number;
  glucose: number;
  mealTiming: MealTiming;
  a1c: number | null;
}

// ─── Data Generator ───────────────────────────────────────────────────────────
// Clinically grounded maternal narrative arc over 365 days (newest first):
//
//   Phase 1 — Pre-pregnancy  (days 365→274, ~12–9 mo ago)
//     Normal adult baseline: BP ~110/70, fasting glucose ~85
//
//   Phase 2 — 1st/2nd Trimester  (days 273→91, ~9–3 mo ago)
//     Plasma volume expansion causes a physiological BP dip: ~105/65
//     Insulin sensitivity improves early pregnancy: glucose ~80
//
//   Phase 3 — 3rd Trimester risk spike  (days 90→31, ~3–1 mo ago)
//     Mild gestational hypertension creeping toward 140/90 danger zone: ~135/88
//     Borderline gestational diabetes — fasting glucose approaching 95+: ~100
//
//   Phase 4 — Postpartum recovery  (days 30→0, last 30 days)
//     Values declining back toward normal: BP ~120/75, glucose ~90

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

function jitter(value: number, range: number): number {
  return Math.round(value + (Math.random() - 0.5) * 2 * range);
}

function formatDate(d: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${h}:${m} ${ampm}`;
}

// Three readings per day: morning (pre-meal), afternoon (post-meal), evening (post-meal)
const SLOT_HOURS: [number, number, number] = [8, 14, 20];
const SLOT_TIMING: ['pre', 'post', 'post'] = ['pre', 'post', 'post'];

function generateMockData(): LogEntry[] {
  const today = new Date();
  const logs: LogEntry[] = [];

  for (let i = 0; i < 365; i++) {
    let sysBP: number;
    let diaBP: number;
    let glc: number;

    if (i <= 30) {
      // Phase 4 — Postpartum recovery (last 30 days)
      const t = i / 30;
      sysBP = lerp(120, 135, t);
      diaBP = lerp(75,  88,  t);
      glc   = lerp(90,  100, t);

    } else if (i <= 90) {
      // Phase 3 — 3rd trimester risk spike (30–90 days ago)
      const t = (i - 30) / 60;
      sysBP = lerp(135, 120, t);
      diaBP = lerp(88,  80,  t);
      glc   = lerp(100, 92,  t);

    } else if (i <= 273) {
      // Phase 2 — 1st/2nd trimester (90–273 days ago)
      const t = (i - 90) / 183;
      sysBP = lerp(110, 105, t);
      diaBP = lerp(70,  65,  t);
      glc   = lerp(85,  80,  t);

    } else {
      // Phase 1 — Pre-pregnancy baseline (273–365 days ago)
      const t = (i - 273) / 92;
      sysBP = lerp(110, 112, t);
      diaBP = lerp(70,  72,  t);
      glc   = lerp(85,  87,  t);
    }

    // Phase-specific variance: Phase 3 spike gets wider jitter
    const bpVar  = (i > 30 && i <= 90) ? 6 : 5;
    const glcVar = (i > 30 && i <= 90) ? 8 : 5;

    for (let s = 0; s < SLOT_HOURS.length; s++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(SLOT_HOURS[s]);
      d.setMinutes(Math.floor(Math.random() * 30)); // small minute offset within slot
      d.setSeconds(0, 0);

      // Quarterly A1C — only on the morning slot of every 91st day
      const a1c = (i % 91 === 0 && s === 0)
        ? parseFloat((5.4 + Math.random() * 0.6).toFixed(1))
        : null;

      logs.push({
        id:         `gen-${i}-${s}`,
        date:       formatDate(d),
        systolic:   jitter(sysBP, bpVar),
        diastolic:  jitter(diaBP, bpVar),
        glucose:    jitter(glc,   glcVar),
        mealTiming: SLOT_TIMING[s],
        a1c,
      });
    }
  }

  // Array is newest-first: day 0 slot 0 → day 0 slot 1 → day 0 slot 2 → day 1 slot 0 …
  return logs;
}

export const MOCK_HEALTH_LOGS: LogEntry[] = generateMockData();

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

// ─── Context ──────────────────────────────────────────────────────────────────

interface HealthContextValue {
  logs: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'id' | 'date'>) => void;
  updateLog: (id: string, updates: Omit<LogEntry, 'id' | 'date'>) => void;
  deleteLog: (id: string) => void;
}

const HealthContext = createContext<HealthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function HealthProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_HEALTH_LOGS);

  function addLog(entry: Omit<LogEntry, 'id' | 'date'>) {
    const newEntry: LogEntry = {
      ...entry,
      id:   Date.now().toString(),
      date: formatNow(),
    };
    setLogs((prev) => [newEntry, ...prev]);
  }

  function updateLog(id: string, updates: Omit<LogEntry, 'id' | 'date'>) {
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  }

  function deleteLog(id: string) {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <HealthContext.Provider value={{ logs, addLog, updateLog, deleteLog }}>
      {children}
    </HealthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error('useHealth must be used within a HealthProvider');
  return ctx;
}
