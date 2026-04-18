import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

export interface MarketData {
  usd: {
    bid: number;
    ask: number;
    high: number;
    low: number;
    pctChange: number;
    varBid: number;
  } | null;
  oil: {
    price: number;
    prevClose: number;
    high: number;
    low: number;
    pctChange: number;
    change: number;
    symbol: string;
  } | null;
  fetchedAt: string;
}

async function fetchMarketData(): Promise<MarketData> {
  const [usdRes, oilRes] = await Promise.allSettled([
    fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }),
    fetch("https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d", {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; GPFinancas/1.0)",
      },
    }),
  ]);

  // ── USD/BRL ──────────────────────────────────────────────────────────────
  let usd: MarketData["usd"] = null;
  if (usdRes.status === "fulfilled" && usdRes.value.ok) {
    try {
      const json = await usdRes.value.json();
      const d = json["USDBRL"];
      if (d) {
        usd = {
          bid:       parseFloat(d.bid),
          ask:       parseFloat(d.ask),
          high:      parseFloat(d.high),
          low:       parseFloat(d.low),
          pctChange: parseFloat(d.pctChange),
          varBid:    parseFloat(d.varBid),
        };
      }
    } catch { /* AwesomeAPI returned non-JSON */ }
  }

  // ── Brent Crude ──────────────────────────────────────────────────────────
  let oil: MarketData["oil"] = null;
  if (oilRes.status === "fulfilled" && oilRes.value.ok) {
    try {
      const json  = await oilRes.value.json();
      const meta  = json?.chart?.result?.[0]?.meta;
      if (meta) {
        const price     = meta.regularMarketPrice as number;
        const prevClose = (meta.chartPreviousClose ?? meta.previousClose) as number;
        const change    = price - prevClose;
        oil = {
          price,
          prevClose,
          high:      meta.regularMarketDayHigh as number,
          low:       meta.regularMarketDayLow as number,
          pctChange: prevClose > 0 ? (change / prevClose) * 100 : 0,
          change,
          symbol:    "Brent",
        };
      }
    } catch { /* Yahoo Finance returned non-JSON (blocked) */ }
  }

  return { usd, oil, fetchedAt: new Date().toISOString() };
}

// 5-minute cache — market data updates frequently
const getCachedMarket = unstable_cache(fetchMarketData, ["market-prices"], { revalidate: 300 });

export async function GET() {
  try {
    const data = await getCachedMarket();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[market-prices] fetch error:", err);
    return NextResponse.json({ error: "Falha ao buscar dados de mercado." }, { status: 500 });
  }
}
