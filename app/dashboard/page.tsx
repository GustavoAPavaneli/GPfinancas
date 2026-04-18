"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/storage";
import { Trip, Expense } from "@/lib/types";
import { subscribeTrips, subscribeExpenses } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import AnimatedNumber from "@/components/AnimatedNumber";

function thisMonthFilter(dateStr: string): boolean {
  const now = new Date();
  const [year, month] = dateStr.split("-").map(Number);
  return year === now.getFullYear() && month === now.getMonth() + 1;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [trips, setTrips]       = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubTrips    = subscribeTrips(user.uid, setTrips);
    const unsubExpenses = subscribeExpenses(user.uid, setExpenses);
    return () => { unsubTrips(); unsubExpenses(); };
  }, [user]);

  const monthTrips    = trips.filter((t) => thisMonthFilter(t.date));
  const monthExpenses = expenses.filter((e) => thisMonthFilter(e.date));

  const bruto    = monthTrips.reduce((s, t) => s + t.grossValue, 0);
  const despesas = monthExpenses.reduce((s, e) => s + e.value, 0);
  const liquido  = bruto - despesas;

  const recentTrips = [...trips]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const now          = new Date();
  const monthLabel   = now.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  const despesaRatio = bruto > 0 ? (despesas / bruto) * 100 : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={item}>
        <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "rgba(0,212,255,0.7)" }}>
          Painel · <span className="capitalize">{monthLabel}</span>
        </p>
        <h1 className="text-3xl font-bold shimmer-text">Área Principal</h1>
      </motion.div>

      {/* Main result card */}
      <motion.div
        variants={item}
        whileHover={{ scale: 1.015 }}
        className="relative rounded-2xl overflow-hidden p-6"
        style={{
          background: liquido >= 0
            ? "linear-gradient(135deg, rgba(0,255,136,0.12) 0%, rgba(0,212,255,0.08) 100%)"
            : "linear-gradient(135deg, rgba(255,51,102,0.12) 0%, rgba(255,107,53,0.08) 100%)",
          border: `1px solid ${liquido >= 0 ? "rgba(0,255,136,0.25)" : "rgba(255,51,102,0.25)"}`,
          boxShadow: liquido >= 0
            ? "0 0 40px rgba(0,255,136,0.08), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 0 40px rgba(255,51,102,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            animation: liquido >= 0
              ? "pulse-ring 3s ease-out infinite"
              : "pulse-ring-red 3s ease-out infinite",
          }}
        />
        <p className="text-xs font-mono uppercase tracking-widest mb-2 opacity-50">
          Resultado do mês
        </p>
        <AnimatedNumber
          value={liquido}
          format={(v) => formatCurrency(v)}
          className={`text-5xl font-bold font-mono ${liquido >= 0 ? "glow-green" : "glow-red"}`}
          style={{ color: liquido >= 0 ? "#00ff88" : "#ff3366" } as React.CSSProperties}
        />
        <p className="text-xs mt-2 opacity-40">
          {monthTrips.length} faturamentos · {monthExpenses.length} despesas
        </p>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        <StatCard label="Bruto"    value={bruto}    color="#00d4ff" sub={`${monthTrips.length} registros`} />
        <StatCard label="Despesas" value={despesas} color="#ff3366" sub={`${despesaRatio.toFixed(1)}% do bruto`} />
        <StatCard label="Líquido"  value={liquido}  color="#00ff88" sub="bruto − despesas" />
      </motion.div>

      {/* Progress bars */}
      <motion.div
        variants={item}
        className="rounded-2xl p-4 space-y-3"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <ProgressBar
          label="Despesas sobre bruto"
          ratio={despesaRatio}
          color="#ff3366"
          valueLabel={`${despesaRatio.toFixed(1)}%`}
        />
        <ProgressBar
          label="Líquido sobre bruto"
          ratio={bruto > 0 ? Math.max(0, (liquido / bruto) * 100) : 0}
          color="#00ff88"
          valueLabel={bruto > 0 ? `${((liquido / bruto) * 100).toFixed(1)}%` : "—"}
        />
      </motion.div>

      {/* Recent */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
            Últimos registros
          </p>
          <Link href="/faturamento" className="text-xs font-mono" style={{ color: "rgba(0,212,255,0.7)" }}>
            ver todos →
          </Link>
        </div>

        {recentTrips.length === 0 ? (
          <div
            className="text-center py-12 rounded-2xl"
            style={{ border: "1px dashed rgba(255,255,255,0.1)" }}
          >
            <p className="text-sm opacity-30">Nenhum registro ainda.</p>
            <Link href="/faturamento" className="text-sm mt-2 inline-block" style={{ color: "#00d4ff" }}>
              Registrar primeiro faturamento →
            </Link>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
            {recentTrips.map((t) => <TripRow key={t.id} trip={t} />)}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatCard({ label, value, color, sub }: { label: string; value: number; color: string; sub: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      className="rounded-xl p-4 cursor-default card-glow"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <p className="text-xs opacity-40 mb-1 font-mono uppercase tracking-wider">{label}</p>
      <AnimatedNumber
        value={value}
        format={(v) => formatCurrency(v)}
        className="text-lg font-bold font-mono"
        style={{ color } as React.CSSProperties}
      />
      <p className="text-xs mt-1 opacity-30">{sub}</p>
    </motion.div>
  );
}

function ProgressBar({ label, ratio, color, valueLabel }: { label: string; ratio: number; color: string; valueLabel: string }) {
  const capped = Math.min(ratio, 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs opacity-40">{label}</span>
        <span className="text-xs font-mono" style={{ color }}>{valueLabel}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${capped}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 8px ${color}80` }}
        />
      </div>
    </div>
  );
}

function TripRow({ trip }: { trip: Trip }) {
  const [, month, day] = trip.date.split("-");
  const COLOR: Record<string, string> = { Uber: "#00d4ff", "99": "#f59e0b" };
  const color = COLOR[trip.platform] ?? "#00d4ff";
  return (
    <motion.div
      variants={item}
      whileHover={{ x: 4 }}
      className="rounded-xl px-4 py-3 flex items-center justify-between card-glow"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: `${color}20`, color }}
        >
          {trip.platform.slice(0, 1)}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{trip.platform}</p>
          <p className="text-xs opacity-30 font-mono">{day}/{month}</p>
        </div>
      </div>
      <p className="text-sm font-bold font-mono" style={{ color: "#00ff88" }}>
        {formatCurrency(trip.grossValue)}
      </p>
    </motion.div>
  );
}
