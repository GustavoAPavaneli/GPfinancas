"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Fuel, RefreshCw, TrendingDown, TrendingUp, Activity,
  DollarSign, Droplets,
} from "lucide-react";
import type { FuelPriceData } from "@/app/api/fuel-prices/route";
import type { MarketData }    from "@/app/api/market-prices/route";

// ── Formatters ───────────────────────────────────────────────────────────────

function fmtBRL(n: number, decimals = 2) {
  return n.toLocaleString("pt-BR", {
    style: "currency", currency: "BRL",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}
function fmtDate(str: string) {
  const [d, m] = str.split("/");
  const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${d} ${months[parseInt(m) - 1]}`;
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ── Animation variants ───────────────────────────────────────────────────────

const container = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const item = {
  hidden: { opacity: 0, y: 26 },
  show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 26 } },
};

// ── Main page ────────────────────────────────────────────────────────────────

export default function CombustivelEyePage() {
  const [fuel,    setFuel]    = useState<FuelPriceData | null>(null);
  const [market,  setMarket]  = useState<MarketData | null>(null);
  const [loadingFuel,   setLoadingFuel]   = useState(true);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [errorFuel,   setErrorFuel]   = useState("");
  const [errorMarket, setErrorMarket] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const marketIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadFuel = useCallback(async () => {
    try {
      const res = await fetch("/api/fuel-prices");
      if (!res.ok) throw new Error();
      setFuel(await res.json());
      setErrorFuel("");
    } catch { setErrorFuel("Não foi possível carregar dados da ANP."); }
    finally  { setLoadingFuel(false); }
  }, []);

  const loadMarket = useCallback(async () => {
    try {
      const res = await fetch("/api/market-prices");
      if (!res.ok) throw new Error();
      setMarket(await res.json());
      setErrorMarket("");
    } catch { setErrorMarket("Não foi possível carregar dados de mercado."); }
    finally  { setLoadingMarket(false); }
  }, []);

  // Load on mount; market auto-refreshes every 60 s
  useEffect(() => {
    loadFuel();
    loadMarket();
    marketIntervalRef.current = setInterval(loadMarket, 60_000);
    return () => {
      if (marketIntervalRef.current) clearInterval(marketIntervalRef.current);
    };
  }, [loadFuel, loadMarket]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([loadFuel(), loadMarket()]);
    setRefreshing(false);
  }

  const gasolinaPrice = fuel?.gasolina?.averagePrice ?? null;
  const etanolPrice   = fuel?.etanol?.averagePrice   ?? null;
  const adv = gasolinaPrice && etanolPrice
    ? (etanolPrice / gasolinaPrice) <= 0.7 ? "vantagem" : "desvantagem"
    : null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-7">

      {/* ── Header ── */}
      <motion.div variants={item} className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "rgba(251,191,36,0.8)" }}>
            Monitoramento
          </p>
          <h1 className="text-3xl font-bold text-white">
            Combustível <span style={{ color: "#fbbf24" }}>Eye</span>
          </h1>
          <p className="text-xs mt-1 opacity-30 font-mono">
            Preços ANP · Câmbio AwesomeAPI · Petróleo Yahoo Finance
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
          onClick={handleRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono"
          style={{
            background: "rgba(251,191,36,0.08)",
            border: "1px solid rgba(251,191,36,0.2)",
            color: "rgba(251,191,36,0.7)",
          }}
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.7, repeat: refreshing ? Infinity : 0, ease: "linear" }}
          >
            <RefreshCw size={13} />
          </motion.div>
          {refreshing ? "Atualizando..." : "Atualizar"}
        </motion.button>
      </motion.div>

      {/* ── Live indicator ── */}
      <motion.div variants={item} className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#00ff88" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs font-mono" style={{ color: "rgba(0,255,136,0.6)" }}>AO VIVO</span>
        </div>
        <span className="text-base font-mono text-white font-semibold drop-shadow-md">
  Câmbio e petróleo: atualização automática a cada 60s
</span>
{market?.fetchedAt && (
          <>
            <span className="text-xs font-mono opacity-20">·</span>
            <span className="text-xs font-mono opacity55">última sync {fmtTime(market.fetchedAt)}</span>
          </>
        )}
      </motion.div>

      {/* ── Section: Combustíveis ANP ── */}
      <motion.div variants={item}>
        <SectionLabel icon={<Fuel size={22} />} label="Combustíveis · Média nacional ANP" color="#ffffff" />
        {errorFuel && <ErrorBanner msg={errorFuel} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          {loadingFuel ? <><SkeletonCard /><SkeletonCard /></> : <>
            <PriceCard
              title="Gasolina Comum"
              sub="Gasolina C"
              mainValue={fuel?.gasolina?.averagePrice != null ? fmtBRL(fuel.gasolina.averagePrice, 3) : "—"}
              unit="/ litro"
              metaLeft={fuel?.gasolina?.latestDate ? `Ref. ${fmtDate(fuel.gasolina.latestDate)}` : ""}
              metaRight={fuel?.gasolina?.sampleSize ? `${fuel.gasolina.sampleSize.toLocaleString("pt-BR")} postos` : ""}
              color="#00d4ff"
              gradFrom="rgba(0,212,255,0.13)" gradTo="rgba(0,102,255,0.07)"
              border="rgba(0,212,255,0.22)"
              icon="⛽"
              pct={null}
            />
            <PriceCard
              title="Etanol Hidratado"
              sub="Álcool comum"
              mainValue={fuel?.etanol?.averagePrice != null ? fmtBRL(fuel.etanol.averagePrice, 3) : "—"}
              unit="/ litro"
              metaLeft={fuel?.etanol?.latestDate ? `Ref. ${fmtDate(fuel.etanol.latestDate)}` : ""}
              metaRight={fuel?.etanol?.sampleSize ? `${fuel.etanol.sampleSize.toLocaleString("pt-BR")} postos` : ""}
              color="#00ff88"
              gradFrom="rgba(0,255,136,0.12)" gradTo="rgba(0,160,90,0.06)"
              border="rgba(0,255,136,0.22)"
              icon="🌿"
              pct={null}
            />
          </>}
        </div>
      </motion.div>

      {/* ── Section: Mercado ── */}
      <motion.div variants={item}>
        <SectionLabel icon={<Activity size={13} />} label="Mercado · Tempo real" color="#a78bfa" />
        {errorMarket && <ErrorBanner msg={errorMarket} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          {loadingMarket ? <><SkeletonCard /><SkeletonCard /></> : <>
            {/* USD/BRL */}
            <PriceCard
              title="Dólar Americano"
              sub="USD / BRL"
              mainValue={market?.usd?.bid != null ? fmtBRL(market.usd.bid) : "—"}
              unit="por dólar"
              metaLeft={market?.usd?.bid != null ? `Máx ${fmtBRL(market.usd.high)}  Mín ${fmtBRL(market.usd.low)}` : ""}
              metaRight=""
              color="#a78bfa"
              gradFrom="rgba(167,139,250,0.12)" gradTo="rgba(109,40,217,0.06)"
              border="rgba(167,139,250,0.22)"
              icon={<DollarSign size={18} />}
              pct={market?.usd?.pctChange ?? null}
            />

            {/* Brent Crude */}
            <PriceCard
              title="Petróleo Brent"
              sub="BZ=F · USD/barril"
              mainValue={market?.oil?.price != null ? fmtUSD(market.oil.price) : "—"}
              unit="por barril"
              metaLeft={market?.oil?.price != null ? `Máx ${fmtUSD(market.oil.high)}  Mín ${fmtUSD(market.oil.low)}` : ""}
              metaRight=""
              color="#f97316"
              gradFrom="rgba(249,115,22,0.12)" gradTo="rgba(180,60,0,0.06)"
              border="rgba(249,115,22,0.22)"
              icon={<Droplets size={18} />}
              pct={market?.oil?.pctChange ?? null}
            />
          </>}
        </div>
      </motion.div>

      {/* ── Ethanol advantage indicator ── */}
      <AnimatePresence>
        {adv && gasolinaPrice && etanolPrice && (
          <motion.div
            key="adv"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="rounded-2xl p-5"
            style={{
              background: adv === "vantagem"
                ? "linear-gradient(135deg,rgba(0,255,136,0.1),rgba(0,212,255,0.05))"
                : "linear-gradient(135deg,rgba(255,51,102,0.08),rgba(255,107,53,0.05))",
              border: `1px solid ${adv === "vantagem" ? "rgba(0,255,136,0.2)" : "rgba(255,51,102,0.15)"}`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              {adv === "vantagem"
                ? <TrendingDown size={15} style={{ color: "#00ff88" }} />
                : <TrendingUp   size={15} style={{ color: "#ff3366" }} />
              }
              <p className="text-sm font-semibold"
                style={{ color: adv === "vantagem" ? "#00ff88" : "#ff3366" }}
              >
                {adv === "vantagem" ? "Etanol compensando" : "Gasolina compensando"}
              </p>
              <span className="text-xs font-mono ml-auto px-2 py-0.5 rounded-md"
                style={{
                  background: adv === "vantagem" ? "rgba(0,255,136,0.1)" : "rgba(255,51,102,0.1)",
                  color: adv === "vantagem" ? "#00ff88" : "#ff3366",
                  border: adv === "vantagem" ? "1px solid rgba(0,255,136,0.2)" : "1px solid rgba(255,51,102,0.2)",
                }}
              >
                {((etanolPrice / gasolinaPrice) * 100).toFixed(1)}%
              </span>
            </div>

            <p className="text-xs opacity-45 leading-relaxed mb-4">
              {adv === "vantagem"
                ? "Relação etanol/gasolina abaixo de 70% — etanol é mais econômico por km."
                : "Relação etanol/gasolina acima de 70% — gasolina entrega mais km por real."}
            </p>

            <div className="h-2 rounded-full overflow-hidden relative" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="absolute top-0 bottom-0 w-px z-10" style={{ left: "70%", background: "rgba(255,255,255,0.3)" }} />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((etanolPrice / gasolinaPrice) * 100, 100)}%` }}
                transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="h-full rounded-full"
                style={{
                  background: adv === "vantagem"
                    ? "linear-gradient(90deg,#00ff8870,#00ff88)"
                    : "linear-gradient(90deg,#ff336670,#ff3366)",
                  boxShadow: adv === "vantagem" ? "0 0 8px rgba(0,255,136,0.5)" : "0 0 8px rgba(255,51,102,0.5)",
                }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono opacity-20 mt-1.5">
              <span>← etanol vantagem</span><span>gasolina vantagem →</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer note ── */}
      <motion.div variants={item}
        className="rounded-2xl p-4 text-xs font-mono opacity-25 leading-relaxed space-y-1"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
      >
        <p>Combustíveis: médias nacionais calculadas sobre o levantamento semanal da ANP. Câmbio: AwesomeAPI (tempo real). Petróleo Brent: Yahoo Finance (atraso de ~15 min).</p>
      </motion.div>
    </motion.div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: `${color}90` }}>{icon}</span>
      <span className="text-xs font-mono uppercase tracking-widest" style={{ color: `${color}70` }}>{label}</span>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <motion.p
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="text-xs font-mono mt-2 px-3 py-2 rounded-xl"
      style={{ background: "rgba(255,51,102,0.07)", border: "1px solid rgba(255,51,102,0.18)", color: "#ff3366" }}
    >
      {msg}
    </motion.p>
  );
}

function PriceCard({
  title, sub, mainValue, unit, metaLeft, metaRight,
  color, gradFrom, gradTo, border, icon, pct,
}: {
  title: string; sub: string;
  mainValue: string; unit: string;
  metaLeft: string; metaRight: string;
  color: string; gradFrom: string; gradTo: string; border: string;
  icon: React.ReactNode;
  pct: number | null;
}) {
  const isUp   = pct !== null && pct >= 0;
  const pctAbs = pct !== null ? Math.abs(pct) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      whileHover={{ scale: 1.02, y: -3 }}
      className="rounded-2xl p-6 relative overflow-hidden cursor-default"
      style={{
        background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
        border: `1px solid ${border}`,
        boxShadow: `0 0 50px ${gradFrom}, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ boxShadow: [`0 0 0 0 ${color}28`, `0 0 0 20px ${color}00`] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest mb-0.5" style={{ color: `${color}80` }}>{sub}</p>
          <p className="text-sm font-bold text-white">{title}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
            style={{ background: `${color}18`, boxShadow: `0 0 14px ${color}28`, color }}
          >
            {icon}
          </div>
          {/* % change badge */}
          {pct !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-mono font-semibold"
              style={{
                background: isUp ? "rgba(255,51,102,0.12)" : "rgba(0,255,136,0.1)",
                color:      isUp ? "#ff6688" : "#00ff88",
                border:     `1px solid ${isUp ? "rgba(255,51,102,0.2)" : "rgba(0,255,136,0.18)"}`,
              }}
            >
              {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {pctAbs.toFixed(2)}%
            </motion.div>
          )}
        </div>
      </div>

      {/* Main price */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.12 }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={mainValue}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="text-4xl font-bold font-mono"
            style={{ color, textShadow: `0 0 22px ${color}70` }}
          >
            {mainValue}
          </motion.p>
        </AnimatePresence>
        <p className="text-xs mt-1 font-mono opacity-35">{unit}</p>
      </motion.div>

      {/* Footer */}
      {(metaLeft || metaRight) && (
        <div
          className="flex items-center justify-between mt-4 pt-3"
          style={{ borderTop: `1px solid ${color}14` }}
        >
          <span className="text-xs font-mono opacity-35">{metaLeft}</span>
          {metaRight && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-md"
              style={{ background: `${color}10`, color: `${color}70`, border: `1px solid ${color}18` }}
            >
              {metaRight}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <motion.div
      animate={{ opacity: [0.35, 0.6, 0.35] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      className="rounded-2xl p-6 h-48"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="space-y-3">
        <div className="h-2.5 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="h-4   w-32 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="h-10  w-36 rounded-xl mt-5" style={{ background: "rgba(255,255,255,0.07)" }} />
      </div>
    </motion.div>
  );
}
