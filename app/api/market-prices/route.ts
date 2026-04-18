import { NextResponse } from "next/server";

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

async function fetchUSD(): Promise<MarketData["usd"]> {
  // Primary: AwesomeAPI (real-time bid/ask/high/low)
  try {
    const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });
    if (res.ok) {
      const json = await res.json();
      const d = json["USDBRL"];
      if (d && d.bid) {
        return {
          bid:       parseFloat(d.bid),
          ask:       parseFloat(d.ask),
          high:      parseFloat(d.high),
          low:       parseFloat(d.low),
          pctChange: parseFloat(d.pctChange),
          varBid:    parseFloat(d.varBid),
        };
      }
    }
  } catch { /* blocked or unavailable */ }

  // Fallback: open.er-api.com (global CDN, no key needed)
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = await res.json();
      const rate = json?.rates?.BRL as number | undefined;
      if (rate) {
        return {
          bid:       rate,
          ask:       rate,
          high:      rate,
          low:       rate,
          pctChange: 0,
          varBid:    0,
        };
      }
    }
  } catch { /* also unavailable */ }

  return null;
}

async function fetchOil(): Promise<MarketData["oil"]> {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1d",
      {
        next: { revalidate: 300 },
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
      }
    );
    if (res.ok) {
      const json  = await res.json();
      const meta  = json?.chart?.result?.[0]?.meta;
      if (meta) {
        const price     = meta.regularMarketPrice as number;
        const prevClose = (meta.chartPreviousClose ?? meta.previousClose) as number;
        const change    = price - prevClose;
        return {
          price,
          prevClose,
          high:      meta.regularMarketDayHigh as number,
          low:       meta.regularMarketDayLow as number,
          pctChange: prevClose > 0 ? (change / prevClose) * 100 : 0,
          change,
          symbol:    "Brent",
        };
      }
    }
  } catch { /* Yahoo Finance blocked */ }
  return null;
}

export async function GET() {
  const [usd, oil] = await Promise.all([fetchUSD(), fetchOil()]);
  return NextResponse.json({ usd, oil, fetchedAt: new Date().toISOString() });
}
