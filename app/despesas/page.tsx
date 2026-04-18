"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/storage";
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from "@/lib/types";
import { subscribeExpenses, addExpense, removeExpense } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";
import AnimatedNumber from "@/components/AnimatedNumber";

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = {
  category: "Combustível" as ExpenseCategory,
  value: "",
  date: today(),
  description: "",
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  "Combustível":         "#f59e0b",
  "Manutenção":          "#ff3366",
  "Seguro":              "#8b5cf6",
  "Alimentação":         "#00d4ff",
  "Lavagem":             "#00ff88",
  "IPVA/Licenciamento":  "#f97316",
  "Outros":              "#6b7280",
};

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  "Combustível":         "⛽",
  "Manutenção":          "🔧",
  "Seguro":              "🛡",
  "Alimentação":         "🍔",
  "Lavagem":             "🚿",
  "IPVA/Licenciamento":  "📋",
  "Outros":              "◈",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemAnim = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

export default function DespesasPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm]         = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeExpenses(user.uid, setExpenses);
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await addExpense(user.uid, {
      category:    form.category,
      value:       parseFloat(form.value),
      date:        form.date,
      description: form.description || undefined,
    });
    setForm({ ...emptyForm, date: today() });
    setShowForm(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!user) return;
    await removeExpense(user.uid, id);
  }

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const total  = expenses.reduce((s, e) => s + e.value, 0);

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.value, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "rgba(255,51,102,0.7)" }}>
            Controle
          </p>
          <h1 className="text-3xl font-bold text-white">Despesas</h1>
          <p className="text-xs mt-1 opacity-30 font-mono">
            {expenses.length} registros ·{" "}
            <AnimatedNumber value={total} format={(v) => formatCurrency(v)} />
            {" "}total
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{
            background: showForm ? "rgba(255,255,255,0.08)" : "rgba(255,51,102,0.15)",
            border: `1px solid ${showForm ? "rgba(255,255,255,0.12)" : "rgba(255,51,102,0.35)"}`,
            color: showForm ? "rgba(255,255,255,0.5)" : "#ff3366",
            boxShadow: showForm ? "none" : "0 0 20px rgba(255,51,102,0.2)",
          }}
        >
          {showForm ? "✕ Cancelar" : "+ Nova despesa"}
        </motion.button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            key="expense-form"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            onSubmit={handleSubmit}
            className="rounded-2xl p-5 space-y-4"
            style={{
              background: "rgba(255,51,102,0.04)",
              border: "1px solid rgba(255,51,102,0.15)",
              boxShadow: "0 0 40px rgba(255,51,102,0.05)",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "#ff3366" }}>
              Nova despesa
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Categoria">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                >
                  {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Data">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  required
                />
              </Field>
            </div>

            <Field label="Valor (R$)">
              <input
                type="number" step="0.01" min="0" placeholder="0,00"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                required
              />
            </Field>

            <Field label="Descrição">
              <input
                type="text" placeholder="Opcional"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl px-3 py-2.5 text-sm"
              />
            </Field>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{
                background: saving ? "rgba(255,51,102,0.2)" : "linear-gradient(135deg, #ff3366, #ff6b35)",
                boxShadow: saving ? "none" : "0 0 24px rgba(255,51,102,0.4)",
                color: saving ? "rgba(255,255,255,0.3)" : "white",
              }}
            >
              {saving ? "Salvando..." : "Salvar despesa"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-xs font-mono uppercase tracking-widest opacity-40">Por categoria</p>
          <div className="space-y-2.5">
            {byCategory.map(({ cat, total: catTotal }) => {
              const color = CATEGORY_COLORS[cat];
              const pct   = total > 0 ? (catTotal / total) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{CATEGORY_ICONS[cat]}</span>
                      <span className="text-xs opacity-60">{cat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs opacity-30 font-mono">{pct.toFixed(1)}%</span>
                      <span className="text-xs font-bold font-mono" style={{ color }}>
                        {formatCurrency(catTotal)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 6px ${color}80` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* List */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
        {sorted.length === 0 ? (
          <motion.div
            variants={itemAnim}
            className="text-center py-16 rounded-2xl"
            style={{ border: "1px dashed rgba(255,255,255,0.07)" }}
          >
            <p className="text-4xl mb-3 opacity-20">◇</p>
            <p className="text-sm opacity-25">Nenhuma despesa registrada ainda.</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {sorted.map((e) => <ExpenseCard key={e.id} expense={e} onDelete={handleDelete} />)}
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

function ExpenseCard({ expense, onDelete }: { expense: Expense; onDelete: (id: string) => void }) {
  const color = CATEGORY_COLORS[expense.category];
  const icon  = CATEGORY_ICONS[expense.category];
  return (
    <motion.div
      variants={itemAnim}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      layout
      whileHover={{ x: 4 }}
      className="rounded-xl px-4 py-3.5 flex items-center justify-between"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
          style={{ background: `${color}20`, boxShadow: `0 0 12px ${color}40` }}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{expense.category}</span>
            <span className="text-xs font-mono opacity-30">{formatDate(expense.date)}</span>
          </div>
          {expense.description && (
            <p className="text-xs opacity-30 mt-0.5">{expense.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-base font-bold font-mono" style={{ color: "#ff3366" }}>
          {formatCurrency(expense.value)}
        </p>
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(expense.id)}
          className="text-lg leading-none opacity-20 hover:opacity-100 transition-opacity"
          style={{ color: "#ff3366" }}
          aria-label="Excluir"
        >×</motion.button>
      </div>
    </motion.div>
  );
}
