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

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_LOGS: LogEntry[] = [
  {
    id: '1',
    date: 'May 14, 2026 · 8:22 AM',
    systolic: 138, diastolic: 89,
    glucose: 102, mealTiming: 'pre',
    a1c: null,
  },
  {
    id: '2',
    date: 'May 12, 2026 · 7:45 PM',
    systolic: 142, diastolic: 92,
    glucose: 118, mealTiming: 'post',
    a1c: null,
  },
  {
    id: '3',
    date: 'May 10, 2026 · 9:10 AM',
    systolic: 136, diastolic: 88,
    glucose: 98, mealTiming: 'pre',
    a1c: 5.9,
  },
  {
    id: '4',
    date: 'May 7, 2026 · 8:05 AM',
    systolic: 140, diastolic: 90,
    glucose: 105, mealTiming: 'pre',
    a1c: null,
  },
];

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
  const [logs, setLogs] = useState<LogEntry[]>(SEED_LOGS);

  function addLog(entry: Omit<LogEntry, 'id' | 'date'>) {
    const newEntry: LogEntry = {
      ...entry,
      id: Date.now().toString(),
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
