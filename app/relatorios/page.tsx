"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/storage";
import { Trip, Expense, Platform, PLATFORMS } from "@/lib/types";
import { subscribeTrips, subscribeExpenses } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import AnimatedNumber from "@/components/AnimatedNumber";
import { BarChartMixed } from "@/components/Charts";
import { ChartData } from "@/components/Charts";
import {
  getWeeksOfMonth, getISOWeek, navigateISOWeek,
  getDayLabel, dateToKey, PT_MONTHS_FULL,
} from "@/lib/calendar";

type ChartView = "anual" | "semanal" | "diario";

const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const PLATFORM_COLORS: Record<Platform, string> = { Uber: "#00d4ff", "99": "#f59e0b" };

interface PeriodOption { label: string; year: number; month: number }
function buildPeriods(): PeriodOption[] {
  const out: PeriodOption[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      label: d.toLocaleString("pt-BR", { month: "long", year: "numeric" }),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    });
  }
  return out;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 28 } },
};

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [trips,    setTrips]    = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const now = new Date();
  const [chartView,      setChartView]      = useState<ChartView>("anual");
  const [chartYear]                          = useState(now.getFullYear());
  const [semanalMonth,   setSemanalMonth]   = useState(now.getMonth());
  const [diarioWeekDate, setDiarioWeekDate] = useState(() => new Date());
  const [periodIndex,    setPeriodIndex]    = useState(0);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeTrips(user.uid, setTrips);
    const u2 = subscribeExpenses(user.uid, setExpenses);
    return () => { u1(); u2(); };
  }, [user]);

  // ── Chart data (real) ─────────────────────────────────────────────
  const chartData = useMemo((): ChartData[] => {
    if (chartView === "anual") {
      return MONTHS_PT.map((label, i) => {
        const m  = i + 1;
        const bt = trips.filter(t => { const [y,mo] = t.date.split("-").map(Number); return y===chartYear && mo===m; });
        const be = expenses.filter(e => { const [y,mo] = e.date.split("-").map(Number); return y===chartYear && mo===m; });
        const bruto    = bt.reduce((s,t)=>s+t.grossValue, 0);
        const despesas = be.reduce((s,e)=>s+e.value, 0);
        return { label, bruto, despesas, liquido: bruto - despesas };
      });
    }

    if (chartView === "semanal") {
      const weeks = getWeeksOfMonth(chartYear, semanalMonth + 1);
      return weeks.map(w => {
        const wStart = dateToKey(w.start);
        const wEnd   = dateToKey(w.end);
        const bt = trips.filter(t => t.date >= wStart && t.date <= wEnd);
        const be = expenses.filter(e => e.date >= wStart && e.date <= wEnd);
        const bruto    = bt.reduce((s,t)=>s+t.grossValue, 0);
        const despesas = be.reduce((s,e)=>s+e.value, 0);
        return { label: w.label, rangeLabel: w.rangeLabel, bruto, despesas, liquido: bruto - despesas };
      });
    }

    // diario
    const week = getISOWeek(diarioWeekDate);
    return week.days.map(day => {
      const k        = dateToKey(day);
      const bruto    = trips.filter(t=>t.date===k).reduce((s,t)=>s+t.grossValue, 0);
      const despesas = expenses.filter(e=>e.date===k).reduce((s,e)=>s+e.value, 0);
      return {
        label:      getDayLabel(day),
        rangeLabel: `${String(day.getDate()).padStart(2,"0")}/${String(day.getMonth()+1).padStart(2,"0")}`,
        bruto,
        despesas,
        liquido: bruto - despesas,
      };
    });
  }, [chartView, chartYear, semanalMonth, diarioWeekDate, trips, expenses]);

  // Navigation
  const semanalLabel   = `${PT_MONTHS_FULL[semanalMonth]} ${chartYear}`;
  const diarioWeek     = getISOWeek(diarioWeekDate);
  const diarioLabel    = diarioWeek.rangeLabel;
  const canPrevSem     = semanalMonth > 0;
  const canNextSem     = semanalMonth < 11;
  const diarioMonday   = diarioWeek.monday;
  const yearStart      = new Date(chartYear, 0, 1);
  const yearEnd        = new Date(chartYear, 11, 31);
  const canPrevDiario  = diarioMonday > yearStart;
  const canNextDiario  = diarioMonday < yearEnd;

  // ── Stats for selected period ─────────────────────────────────────
  const periods = buildPeriods();
  const { year, month } = periods[periodIndex];

  const periodTrips    = trips.filter(t    => { const [y,m] = t.date.split("-").map(Number);    return y===year && m===month; });
  const periodExpenses = expenses.filter(e => { const [y,m] = e.date.split("-").map(Number); return y===year && m===month; });

  const bruto      = periodTrips.reduce((s,t)=>s+t.grossValue, 0);
  const despesas   = periodExpenses.reduce((s,e)=>s+e.value, 0);
  const liquido    = bruto - despesas;
  const totalMin   = periodTrips.reduce((s,t)=>s+(t.durationMinutes??0), 0);
  const totalKm    = periodTrips.reduce((s,t)=>s+(t.distanceKm??0), 0);
  const avgTrip    = periodTrips.length > 0 ? bruto / periodTrips.length : 0;
  const hourlyRate = totalMin > 0 ? (bruto / totalMin) * 60 : null;
  const byPlatform = PLATFORMS
    .map(p => ({
      platform: p,
      count: periodTrips.filter(t=>t.platform===p).length,
      bruto: periodTrips.filter(t=>t.platform===p).reduce((s,t)=>s+t.grossValue, 0),
    }))
    .filter(p=>p.count>0).sort((a,b)=>b.bruto-a.bruto);
  const isEmpty = periodTrips.length === 0 && periodExpenses.length === 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "rgba(139,92,246,0.8)" }}>Análise</p>
        <h1 className="text-3xl font-bold text-white">Relatórios</h1>
      </motion.div>

      {/* ── CHART CARD ─────────────────────────────────────────── */}
      <motion.div variants={item} className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-4 flex-wrap gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div>
            <p className="text-sm font-semibold text-white">Visão geral · {chartYear}</p>
            <p className="text-xs opacity-30 font-mono mt-0.5">
              {trips.length} faturamentos · {formatCurrency(trips.reduce((s,t)=>s+t.grossValue,0))} bruto
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-1 rounded-md"
            style={{ background: "rgba(0,255,136,0.1)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.2)" }}
          >
            dados reais
          </span>
        </div>

        {/* View tabs */}
        <div className="flex gap-1 px-4 pt-4 pb-2">
          {(["anual","semanal","diario"] as ChartView[]).map(v => {
            const LABELS: Record<ChartView,string> = { anual:"Anual", semanal:"Semanal", diario:"Diário" };
            const active = chartView === v;
            return (
              <motion.button key={v} whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                onClick={() => setChartView(v)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: active ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.07)"}`,
                  color: active ? "#00d4ff" : "rgba(255,255,255,0.4)",
                  boxShadow: active ? "0 0 16px rgba(0,212,255,0.1)" : "none",
                }}
              >{LABELS[v]}</motion.button>
            );
          })}
        </div>

        {/* Period navigation */}
        <AnimatePresence mode="wait">
          {chartView !== "anual" && (
            <motion.div key={chartView}
              initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between px-4 pb-3 pt-1"
            >
              <NavBtn
                enabled={chartView === "semanal" ? canPrevSem : canPrevDiario}
                onClick={() => chartView === "semanal"
                  ? setSemanalMonth(m => Math.max(0, m - 1))
                  : setDiarioWeekDate(d => navigateISOWeek(d, -1))
                }
              ><ChevronLeft size={15} /></NavBtn>

              <div className="text-center">
                <p className="text-sm font-semibold text-white">
                  {chartView === "semanal" ? semanalLabel : diarioLabel}
                </p>
                {chartView === "semanal" && (
                  <p className="text-xs opacity-30 font-mono mt-0.5">
                    {getWeeksOfMonth(chartYear, semanalMonth + 1).length} semanas
                  </p>
                )}
                {chartView === "diario" && (
                  <p className="text-xs opacity-30 font-mono mt-0.5">
                    {diarioWeek.monday.toLocaleString("pt-BR",{weekday:"short"})} → {diarioWeek.sunday.toLocaleString("pt-BR",{weekday:"short"})}
                  </p>
                )}
              </div>

              <NavBtn
                enabled={chartView === "semanal" ? canNextSem : canNextDiario}
                onClick={() => chartView === "semanal"
                  ? setSemanalMonth(m => Math.min(11, m + 1))
                  : setDiarioWeekDate(d => navigateISOWeek(d, 1))
                }
              ><ChevronRight size={15} /></NavBtn>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart */}
        <div className="px-2 pb-5 pt-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${chartView}-${semanalMonth}-${dateToKey(diarioWeekDate)}`}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
              transition={{ duration: 0.22 }}
            >
              <BarChartMixed
                data={chartData}
                isDiario={chartView === "diario"}
                height={chartView === "diario" ? 260 : 280}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Legend */}
        <div className="flex gap-4 px-5 py-3 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {[
            { color:"#00d4ff", label:"Bruto — valor recebido do app" },
            { color:"#ff3366", label:"Despesas — combustível, manutenção etc." },
            { color:"#00ff88", label:"Líquido — bruto menos despesas" },
          ].map(({ color, label }) => (
            <div key={color} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: color, boxShadow:`0 0 4px ${color}` }} />
              <span className="text-xs opacity-30">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <motion.div variants={item}>
        <p className="text-xs font-mono uppercase tracking-widest opacity-40 mb-3">Detalhe por período</p>
        <div className="flex gap-2 flex-wrap">
          {periods.map((p, i) => (
            <motion.button key={i} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              onClick={() => setPeriodIndex(i)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono capitalize"
              style={{
                background: i===periodIndex ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${i===periodIndex ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.07)"}`,
                color: i===periodIndex ? "#a78bfa" : "rgba(255,255,255,0.4)",
                boxShadow: i===periodIndex ? "0 0 16px rgba(139,92,246,0.15)" : "none",
              }}
            >{p.label}</motion.button>
          ))}
        </div>
      </motion.div>

      {isEmpty ? (
        <motion.div variants={item} className="text-center py-12 rounded-2xl"
          style={{ border:"1px dashed rgba(255,255,255,0.07)" }}
        >
          <p className="text-4xl mb-3 opacity-20">◎</p>
          <p className="text-sm opacity-25">Nenhum dado para este período.</p>
        </motion.div>
      ) : (
        <>
          <motion.div variants={item} className="rounded-2xl p-5"
            style={{
              background: liquido>=0 ? "linear-gradient(135deg,rgba(0,255,136,0.1),rgba(0,212,255,0.06))" : "linear-gradient(135deg,rgba(255,51,102,0.1),rgba(255,107,53,0.06))",
              border: `1px solid ${liquido>=0 ? "rgba(0,255,136,0.2)" : "rgba(255,51,102,0.2)"}`,
            }}
          >
            <p className="text-xs font-mono uppercase tracking-widest opacity-40 mb-1 capitalize">{periods[periodIndex].label}</p>
            <div className="flex items-end gap-6 flex-wrap">
              <div>
                <p className="text-xs opacity-40 mb-0.5">Líquido</p>
                <AnimatedNumber value={liquido} format={v=>formatCurrency(v)}
                  className={`text-4xl font-bold font-mono ${liquido>=0?"glow-green":"glow-red"}`}
                  style={{ color: liquido>=0?"#00ff88":"#ff3366" } as React.CSSProperties}
                />
              </div>
              {hourlyRate!==null && (
                <div className="mb-1">
                  <p className="text-xs opacity-40 mb-0.5">por hora</p>
                  <AnimatedNumber value={hourlyRate} format={v=>formatCurrency(v)}
                    className="text-xl font-bold font-mono" style={{ color:"#00d4ff" } as React.CSSProperties}
                  />
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat label="Faturamentos"   value={String(periodTrips.length)} color="#00d4ff" />
            <MiniStat label="Bruto"          value={formatCurrency(bruto)}      color="#00d4ff" />
            <MiniStat label="Despesas"       value={formatCurrency(despesas)}   color="#ff3366" />
            <MiniStat label="Líquido"        value={formatCurrency(liquido)}    color="#00ff88" />
            <MiniStat label="Média/registro" value={formatCurrency(avgTrip)}    color="#a78bfa" />
            {totalKm>0 && bruto>0 && <MiniStat label="R$/km" value={formatCurrency(bruto/totalKm)} color="#00ff88" />}
            {totalMin>0 && <MiniStat label="Horas" value={`${Math.floor(totalMin/60)}h${String(totalMin%60).padStart(2,"0")}m`} color="#00d4ff" />}
            {totalKm>0 && <MiniStat label="Km" value={`${totalKm.toFixed(1)}km`} color="#a78bfa" />}
          </motion.div>

          <motion.div variants={item} className="rounded-2xl p-4 space-y-3"
            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-xs font-mono uppercase tracking-widest opacity-40">Composição</p>
            <BarRow label="Despesas" value={despesas}           total={bruto} color="#ff3366" />
            <BarRow label="Líquido"  value={Math.max(0,liquido)} total={bruto} color="#00ff88" />
          </motion.div>

          {byPlatform.length>0 && (
            <motion.div variants={item} className="rounded-2xl p-4 space-y-3"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-xs font-mono uppercase tracking-widest opacity-40">Por plataforma</p>
              {byPlatform.map(({ platform, count, bruto: pB }) => {
                const color = PLATFORM_COLORS[platform];
                const pct   = bruto>0 ? (pB/bruto)*100 : 0;
                return (
                  <div key={platform}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background:color, boxShadow:`0 0 6px ${color}` }} />
                        <span className="text-sm font-medium text-white">{platform}</span>
                        <span className="text-xs opacity-30 font-mono">{count} reg.</span>
                      </div>
                      <span className="text-sm font-bold font-mono" style={{ color }}>{formatCurrency(pB)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                      <motion.div
                        initial={{ width:0 }} animate={{ width:`${pct}%` }}
                        transition={{ duration:1, ease:[0.16,1,0.3,1], delay:0.3 }}
                        className="h-full rounded-full"
                        style={{ background:`linear-gradient(90deg,${color}70,${color})`, boxShadow:`0 0 8px ${color}80` }}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}

function NavBtn({ enabled, onClick, children }: { enabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={enabled ? { scale:1.1 } : {}}
      whileTap={enabled ? { scale:0.9 } : {}}
      disabled={!enabled}
      onClick={onClick}
      className="w-9 h-9 rounded-lg flex items-center justify-center"
      style={{
        background: enabled ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: enabled ? "#00d4ff" : "rgba(255,255,255,0.2)",
        opacity: enabled ? 1 : 0.4,
        cursor: enabled ? "pointer" : "default",
      }}
    >{children}</motion.button>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <motion.div whileHover={{ scale:1.03, y:-2 }} className="rounded-xl p-3 cursor-default"
      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}
    >
      <p className="text-xs opacity-35 font-mono uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-bold font-mono" style={{ color }}>{value}</p>
    </motion.div>
  );
}

function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total>0 ? Math.min((value/total)*100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs opacity-40">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-30 font-mono">{pct.toFixed(1)}%</span>
          <span className="text-xs font-bold font-mono" style={{ color }}>{formatCurrency(value)}</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }}
          transition={{ duration:1.1, ease:[0.16,1,0.3,1], delay:0.25 }}
          className="h-full rounded-full"
          style={{ background:`linear-gradient(90deg,${color}60,${color})`, boxShadow:`0 0 10px ${color}80` }}
        />
      </div>
    </div>
  );
}
