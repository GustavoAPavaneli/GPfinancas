"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";

type Mode = "login" | "register";

const ERROR_MAP: Record<string, string> = {
  "auth/invalid-credential":    "E-mail ou senha incorretos.",
  "auth/wrong-password":        "E-mail ou senha incorretos.",
  "auth/user-not-found":        "E-mail ou senha incorretos.",
  "auth/email-already-in-use":  "Este e-mail já está em uso.",
  "auth/weak-password":         "Senha fraca. Use no mínimo 6 caracteres.",
  "auth/invalid-email":         "E-mail inválido.",
  "auth/too-many-requests":     "Muitas tentativas. Aguarde e tente novamente.",
};

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode]       = useState<Mode>("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await signIn(email, password);
      else                  await signUp(email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(ERROR_MAP[code] ?? "Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 26, delay: 0.05 }}
        className="w-full max-w-sm"
      >
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.15 }}
          className="flex flex-col items-center mb-8"
        >
          <motion.div
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(0,212,255,0.35)",
                "0 0 0 22px rgba(0,212,255,0)",
                "0 0 0 0 rgba(0,212,255,0)",
              ],
            }}
            transition={{ duration: 2.8, repeat: Infinity }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.18), rgba(0,102,255,0.12))",
              border: "1px solid rgba(0,212,255,0.35)",
              boxShadow: "0 0 50px rgba(0,212,255,0.18), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <svg width="42" height="42" viewBox="0 0 64 64" fill="none">
              <polygon
                points="32,4 58,18 58,46 32,60 6,46 6,18"
                stroke="rgba(0,212,255,0.65)" strokeWidth="1.5" fill="rgba(0,212,255,0.07)"
              />
              <polygon
                points="32,11 51,22 51,42 32,53 13,42 13,22"
                stroke="rgba(0,212,255,0.22)" strokeWidth="1" fill="none"
              />
              <text
                x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
                fontSize="18" fontWeight="bold" fontFamily="monospace" fill="url(#gLogin)"
              >GP</text>
              <defs>
                <linearGradient id="gLogin" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#0066ff" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-2xl font-bold"
            style={{ color: "#00d4ff", textShadow: "0 0 24px rgba(0,212,255,0.55)" }}
          >
            GP<span style={{ color: "white" }}>finanças</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.28 }}
            transition={{ delay: 0.3 }}
            className="text-xs font-mono mt-1 uppercase tracking-widest"
          >
            Controle financeiro para motoristas
          </motion.p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl p-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 0 80px rgba(0,212,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Mode tabs */}
          <div
            className="flex rounded-xl p-1 mb-5"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold relative transition-colors"
                style={{ color: mode === m ? "white" : "rgba(255,255,255,0.35)" }}
              >
                {mode === m && (
                  <motion.div
                    layoutId="login-tab"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,212,255,0.18), rgba(0,102,255,0.12))",
                      border: "1px solid rgba(0,212,255,0.28)",
                      boxShadow: "0 0 18px rgba(0,212,255,0.1)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">
                  {m === "login" ? "Entrar" : "Criar conta"}
                </span>
              </button>
            ))}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <InputField
                label="E-mail"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="seu@email.com"
                required
              />
              <InputField
                label="Senha"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder={mode === "register" ? "Mínimo 6 caracteres" : "••••••••"}
                required
              />

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    key="err"
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    className="text-xs font-mono px-3 py-2.5 rounded-xl"
                    style={{
                      color: "#ff3366",
                      background: "rgba(255,51,102,0.08)",
                      border: "1px solid rgba(255,51,102,0.22)",
                    }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02, boxShadow: "0 0 40px rgba(0,212,255,0.5)" } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="w-full py-3 rounded-xl text-sm font-bold text-black relative overflow-hidden"
                style={{
                  background: loading
                    ? "rgba(0,212,255,0.25)"
                    : "linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)",
                  boxShadow: loading ? "none" : "0 0 28px rgba(0,212,255,0.32)",
                  color: loading ? "rgba(255,255,255,0.4)" : "black",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {/* Shimmer on hover */}
                {!loading && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                    }}
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">
                  {loading
                    ? "Aguarde..."
                    : mode === "login"
                      ? "Entrar"
                      : "Criar conta"}
                </span>
              </motion.button>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

function InputField({
  label, type, value, onChange, placeholder, required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        className="text-xs font-mono uppercase tracking-wider block mb-1.5"
        style={{ color: focused ? "rgba(0,212,255,0.7)" : "rgba(255,255,255,0.35)" }}
      >
        {label}
      </label>
      <motion.div
        animate={{
          boxShadow: focused
            ? "0 0 0 1px rgba(0,212,255,0.5), 0 0 20px rgba(0,212,255,0.1)"
            : "0 0 0 1px rgba(255,255,255,0.1)",
        }}
        transition={{ duration: 0.18 }}
        className="rounded-xl overflow-hidden"
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required={required}
          className="w-full px-4 py-3 text-sm outline-none"
          style={{
            background: focused ? "rgba(0,212,255,0.05)" : "rgba(255,255,255,0.04)",
            color: "white",
            border: "none",
          }}
        />
      </motion.div>
    </div>
  );
}
