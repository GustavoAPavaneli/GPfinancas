"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const links = [
  { href: "/", label: "Area principal", icon: "◈" },
  { href: "/corridas", label: "Corridas", icon: "⬡" },
  { href: "/despesas", label: "Despesas", icon: "◇" },
  { href: "/relatorios", label: "Relatórios", icon: "◎" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="relative z-20 sticky top-0"
      style={{
        background: "rgba(4,4,14,0.8)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-1">
        <div className="mr-5 flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, #00d4ff, #0066ff)",
              boxShadow: "0 0 16px rgba(0,212,255,0.5)",
            }}
          >
            M
          </div>
          <span className="font-bold text-white tracking-tight text-sm">
            GP<span className="gradient-text-cyan">Finanças</span>
          </span>
        </div>

        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              style={{ color: active ? "#00d4ff" : "rgba(255,255,255,0.5)" }}
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: "rgba(0,212,255,0.1)",
                    border: "1px solid rgba(0,212,255,0.25)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative text-xs opacity-60">{l.icon}</span>
              <span className="relative hidden sm:inline">{l.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
