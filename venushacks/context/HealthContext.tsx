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
// Generates 365 daily entries (newest first) with a narrative arc:
//   • 6–12 months ago : stable pre-pregnancy baseline   (BP ~113–118, glucose ~88–93)
//   • 3–6 months ago  : pregnancy spike, trending up    (BP ~118–135, glucose ~93–115)
//   • 0–3 months ago  : postpartum recovery, trending ↓ (BP ~135–122, glucose ~115–98)
// Small random jitter on every value keeps the line chart looking organic.

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

function generateMockData(): LogEntry[] {
  const today = new Date();
  const logs: LogEntry[] = [];

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Vary log time slightly each day so timestamps look natural
    d.setHours(6 + Math.floor(Math.random() * 3));   // 6–8 AM
    d.setMinutes(Math.floor(Math.random() * 60));
    d.setSeconds(0, 0);

    let sysBP: number;
    let diaBP: number;
    let glc: number;

    if (i <= 90) {
      // 0–3 months ago: postpartum recovery (values falling back toward baseline)
      const t = i / 90;                     // 0 = today, 1 = 3 months ago
      sysBP = lerp(122, 135, t);
      diaBP = lerp(78,  88,  t);
      glc   = lerp(98,  115, t);
    } else if (i <= 180) {
      // 3–6 months ago: pregnancy spike (peak at ~3 mo, rising from 6 mo)
      const t = (i - 90) / 90;             // 0 = 3 months ago, 1 = 6 months ago
      sysBP = lerp(135, 118, t);
      diaBP = lerp(88,  76,  t);
      glc   = lerp(115, 93,  t);
    } else {
      // 6–12 months ago: stable baseline
      const t = (i - 180) / 185;           // 0 = 6 months ago, 1 = 12 months ago
      sysBP = lerp(118, 113, t);
      diaBP = lerp(76,  72,  t);
      glc   = lerp(93,  88,  t);
    }

    // Quarterly A1C entries (every ~91 days)
    const a1c = i % 91 === 0
      ? parseFloat((5.4 + Math.random() * 0.6).toFixed(1))
      : null;

    logs.push({
      id:         `gen-${i}`,
      date:       formatDate(d),
      systolic:   jitter(sysBP, 4),
      diastolic:  jitter(diaBP, 3),
      glucose:    jitter(glc,   5),
      mealTiming: 'pre',
      a1c,
    });
  }

  // Array is already newest-first (i=0 = today)
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
