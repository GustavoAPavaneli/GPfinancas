"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  BarChart2,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Fuel,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/dashboard",       label: "Área Principal",  icon: LayoutDashboard },
  { href: "/faturamento",     label: "Faturamento",      icon: TrendingUp      },
  { href: "/despesas",        label: "Despesas",          icon: Receipt         },
  { href: "/relatorios",      label: "Relatórios",        icon: BarChart2       },
  { href: "/combustivel-eye", label: "Combustível Eye",   icon: Fuel            },
];

const COLLAPSED_W = 72;
const EXPANDED_W  = 232;

export default function Sidebar() {
  const pathname       = usePathname();
  const { signOut, user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_expanded");
    if (saved !== null) setExpanded(saved === "true");
  }, []);

  function toggle() {
    setExpanded((v) => {
      localStorage.setItem("sidebar_expanded", String(!v));
      return !v;
    });
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <motion.aside
      animate={{ width: expanded ? EXPANDED_W : COLLAPSED_W }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="relative shrink-0 flex flex-col z-20 overflow-hidden"
      style={{
        background: "rgba(4,4,14,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        minHeight: "100vh",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 shrink-0 overflow-hidden">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: "linear-gradient(135deg, #00d4ff, #0066ff)",
            boxShadow: "0 0 20px rgba(0,212,255,0.45)",
          }}
        >
          GP
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="font-bold text-sm text-white whitespace-nowrap overflow-hidden"
            >
              GP<span className="gradient-text-cyan">Finanças</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-3" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

      {/* Nav items */}
      <nav className="flex-1 px-2 space-y-1 overflow-hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active   = pathname === href;
          const isFuel   = href === "/combustivel-eye";
          const accentColor = isFuel ? "#fbbf24" : "#00d4ff";
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-colors overflow-hidden"
                style={{
                  background: active ? `${accentColor}18` : "transparent",
                  border: active ? `1px solid ${accentColor}33` : "1px solid transparent",
                  boxShadow: active ? `0 0 16px ${accentColor}14` : "none",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                    style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon
                  size={18}
                  className="shrink-0"
                  style={{ color: active ? accentColor : "rgba(255,255,255,0.4)" }}
                />

                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.16 }}
                      className="text-sm font-medium whitespace-nowrap"
                      style={{ color: active ? accentColor : "rgba(255,255,255,0.55)" }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 mt-3" style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

      {/* User email + logout */}
      <AnimatePresence>
        {expanded && user?.email && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3 pb-1 overflow-hidden"
          >
            <p
              className="text-xs font-mono truncate"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              {user.email}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout */}
      <motion.button
        whileHover={{ backgroundColor: "rgba(255,51,102,0.08)" }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex items-center gap-3 px-3 py-2.5 mx-2 mb-1 rounded-xl transition-colors overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.06)", cursor: signingOut ? "wait" : "pointer" }}
        aria-label="Sair"
      >
        <LogOut
          size={16}
          className="shrink-0"
          style={{ color: signingOut ? "rgba(255,51,102,0.3)" : "rgba(255,51,102,0.6)" }}
        />
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.16 }}
              className="text-xs whitespace-nowrap font-medium"
              style={{ color: "rgba(255,51,102,0.6)" }}
            >
              {signingOut ? "Saindo..." : "Sair"}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Toggle */}
      <motion.button
        whileHover={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        whileTap={{ scale: 0.95 }}
        onClick={toggle}
        className="flex items-center gap-3 px-3 py-3 mx-2 my-3 rounded-xl transition-colors overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        aria-label={expanded ? "Recolher menu" : "Expandir menu"}
      >
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="shrink-0"
        >
          {expanded
            ? <ChevronLeft size={16} style={{ color: "rgba(255,255,255,0.35)" }} />
            : <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.35)" }} />
          }
        </motion.div>
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.16 }}
              className="text-xs whitespace-nowrap"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Recolher
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.aside>
  );
}
