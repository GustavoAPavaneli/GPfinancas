"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/storage";
import { Trip, Platform, PLATFORMS } from "@/lib/types";
import { subscribeTrips, addTrip, removeTrip } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import AnimatedNumber from "@/components/AnimatedNumber";

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = {
  platform: "Uber" as Platform,
  grossValue: "",
  date: today(),
  durationMinutes: "",
  distanceKm: "",
  notes: "",
};

const PLATFORM_COLORS: Record<Platform, string> = {
  Uber: "#00d4ff",
  "99": "#f59e0b",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemAnim = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

export default function FaturamentoPage() {
  const { user } = useAuth();
  const [trips, setTrips]       = useState<Trip[]>([]);
  const [form, setForm]         = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeTrips(user.uid, setTrips);
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await addTrip(user.uid, {
      platform:        form.platform,
      grossValue:      parseFloat(form.grossValue),
      date:            form.date,
      durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
      distanceKm:      form.distanceKm ? parseFloat(form.distanceKm) : undefined,
      notes:           form.notes || undefined,
    });
    setForm({ ...emptyForm, date: today() });
    setShowForm(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!user) return;
    await removeTrip(user.uid, id);
  }

  const sorted = [...trips].sort((a, b) => b.date.localeCompare(a.date));
  const total  = trips.reduce((s, t) => s + t.grossValue, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "rgba(0,212,255,0.7)" }}>Registro</p>
          <h1 className="text-3xl font-bold text-white">Faturamento</h1>
          <p className="text-xs mt-1 opacity-30 font-mono">
            {trips.length} registros ·{" "}
            <AnimatedNumber value={total} format={(v) => formatCurrency(v)} /> bruto total
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{
            background: showForm ? "rgba(255,255,255,0.08)" : "rgba(0,212,255,0.15)",
            border: `1px solid ${showForm ? "rgba(255,255,255,0.12)" : "rgba(0,212,255,0.35)"}`,
            color: showForm ? "rgba(255,255,255,0.5)" : "#00d4ff",
            boxShadow: showForm ? "none" : "0 0 20px rgba(0,212,255,0.2)",
          }}
        >
          {showForm ? "✕ Cancelar" : "+ Novo registro"}
        </motion.button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            key="trip-form"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            onSubmit={handleSubmit}
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", boxShadow: "0 0 40px rgba(0,212,255,0.05)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "#00d4ff" }}>Novo registro</p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Plataforma">
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value as Platform })}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Data">
                <input
                  type="date" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl px-3 py-2.5 text-sm" required
                />
              </Field>
            </div>

            <Field label="Valor bruto (R$)">
              <input
                type="number" step="0.01" min="0" placeholder="0,00"
                value={form.grossValue}
                onChange={(e) => setForm({ ...form, grossValue: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 text-sm" required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Duração (min)">
                <input
                  type="number" min="0" placeholder="Opcional"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                />
              </Field>
              <Field label="Distância (km)">
                <input
                  type="number" step="0.1" min="0" placeholder="Opcional"
                  value={form.distanceKm}
                  onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                />
              </Field>
            </div>

            <Field label="Observações">
              <input
                type="text" placeholder="Opcional"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 text-sm"
              />
            </Field>

            <motion.button
              type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-bold text-black"
              style={{
                background: saving ? "rgba(0,212,255,0.25)" : "linear-gradient(135deg, #00d4ff, #0066ff)",
                boxShadow: saving ? "none" : "0 0 24px rgba(0,212,255,0.4)",
                color: saving ? "rgba(0,0,0,0.4)" : "black",
              }}
            >
              {saving ? "Salvando..." : "Salvar registro"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* List */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
        {sorted.length === 0 ? (
          <motion.div
            variants={itemAnim}
            className="text-center py-16 rounded-2xl"
            style={{ border: "1px dashed rgba(255,255,255,0.07)" }}
          >
            <p className="text-4xl mb-3 opacity-20">⬡</p>
            <p className="text-sm opacity-25">Nenhum registro ainda.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {sorted.map((t) => <TripCard key={t.id} trip={t} onDelete={handleDelete} />)}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-mono uppercase tracking-wider block mb-1.5 opacity-40">{label}</label>
      {children}
    </div>
  );
}

function TripCard({ trip, onDelete }: { trip: Trip; onDelete: (id: string) => void }) {
  const color = PLATFORM_COLORS[trip.platform] ?? "#00d4ff";
  return (
    <motion.div
      variants={itemAnim}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      layout whileHover={{ x: 4 }}
      className="rounded-xl px-4 py-3.5 flex items-center justify-between"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: `${color}20`, color, boxShadow: `0 0 12px ${color}40` }}
        >
          {trip.platform}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{trip.platform}</span>
            <span className="text-xs font-mono opacity-30">{formatDate(trip.date)}</span>
          </div>
          <div className="flex gap-2 mt-0.5 text-xs opacity-30 font-mono">
            {trip.distanceKm && <span>{trip.distanceKm}km</span>}
            {trip.durationMinutes && <span>{trip.durationMinutes}min</span>}
            {trip.notes && <span className="italic">{trip.notes}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-base font-bold font-mono" style={{ color: "#00d4ff" }}>
          {formatCurrency(trip.grossValue)}
        </p>
        <motion.button
          whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(trip.id)}
          className="text-lg leading-none opacity-20 hover:opacity-100 transition-opacity"
          style={{ color: "#ff3366" }}
          aria-label="Excluir"
        >×</motion.button>
      </div>
    </motion.div>
  );
}
