import { dateToKey } from "./calendar";

// ── Deterministic PRNG ───────────────────────────────────────────────
function rand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ── Constants ────────────────────────────────────────────────────────
const MONTHLY_BRUTO    = [4200,4500,4800,5100,5300,4700,4300,4900,5200,5600,5400,5800];
const MONTHLY_DESPESAS = [1100,1050,1200, 980,1150,1300, 950,1100,1250,1050,1400,1200];

// Day-of-week earnings weight  Sun  Mon  Tue  Wed  Thu  Fri  Sat
const DOW_WEIGHT = [0.35, 1.0, 1.0, 1.0, 1.1, 1.35, 1.05];

// ── Public type ──────────────────────────────────────────────────────
export interface ChartData {
  label: string;        // X-axis tick
  bruto: number;
  despesas: number;
  liquido: number;
  rangeLabel?: string;  // shown in tooltip
}

// ── Pre-calculated monthly chart data (12 bars) ──────────────────────
const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export const mockMonthly: ChartData[] = MONTHS_PT.map((label, i) => ({
  label,
  bruto:    MONTHLY_BRUTO[i],
  despesas: MONTHLY_DESPESAS[i],
  liquido:  MONTHLY_BRUTO[i] - MONTHLY_DESPESAS[i],
}));

// ── Per-day raw data for 2025 ────────────────────────────────────────
function generate2025Daily(): Record<string, { bruto: number; despesas: number }> {
  const data: Record<string, { bruto: number; despesas: number }> = {};

  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(2025, m + 1, 0).getDate();
    const keys:       string[] = [];
    const rawWeights: number[] = [];

    // Build per-day weights
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(2025, m, d).getDay();
      rawWeights.push(DOW_WEIGHT[dow] * (0.5 + rand(m * 100 + d) * 1.0));
      keys.push(`2025-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
    }

    // Normalise bruto so monthly sum == MONTHLY_BRUTO[m]
    const totalW = rawWeights.reduce((s, w) => s + w, 0);
    const brutos = rawWeights.map(w => Math.floor((w / totalW) * MONTHLY_BRUTO[m]));
    brutos[brutos.length - 1] += MONTHLY_BRUTO[m] - brutos.reduce((s, v) => s + v, 0);

    keys.forEach((k, i) => { data[k] = { bruto: brutos[i], despesas: 0 }; });

    // Scatter monthly despesas across 4-6 random days (realistic lumps)
    const numExpDays = 4 + Math.floor(rand(m * 13 + 7) * 3);
    const expIdxs:    number[] = [];
    const expW:       number[] = [];

    for (let e = 0; e < numExpDays; e++) {
      expIdxs.push(Math.floor(rand(m * 50 + e * 17) * daysInMonth));
      expW.push(0.3 + rand(m * 30 + e * 11) * 0.7);
    }

    const totalEW = expW.reduce((s, w) => s + w, 0);
    let despSum = 0;
    expIdxs.forEach((idx, i) => {
      const v = Math.floor((expW[i] / totalEW) * MONTHLY_DESPESAS[m]);
      data[keys[idx]].despesas += v;
      despSum += v;
    });
    // Fix rounding
    if (expIdxs.length > 0) {
      data[keys[expIdxs[expIdxs.length - 1]]].despesas += MONTHLY_DESPESAS[m] - despSum;
    }
  }

  return data;
}

export const mock2025Daily = generate2025Daily();

// ── Helper: aggregate daily mock data for a range of dates ───────────
export function aggregateMockRange(startDate: Date, endDate: Date): { bruto: number; despesas: number } {
  let bruto = 0, despesas = 0;
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  while (cur <= end) {
    const k = dateToKey(cur);
    const d = mock2025Daily[k];
    if (d) { bruto += d.bruto; despesas += d.despesas; }
    cur.setDate(cur.getDate() + 1);
  }
  return { bruto, despesas };
}

// ── Summary totals ───────────────────────────────────────────────────
export const mockTotals = {
  year:          2025,
  brutoTotal:    MONTHLY_BRUTO.reduce((s, v) => s + v, 0),
  despesasTotal: MONTHLY_DESPESAS.reduce((s, v) => s + v, 0),
  liquidoTotal:  MONTHLY_BRUTO.reduce((s, v) => s + v, 0) - MONTHLY_DESPESAS.reduce((s, v) => s + v, 0),
  registros:     1251,
};
