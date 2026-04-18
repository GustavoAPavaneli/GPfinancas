import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const ANP_URL =
  "https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/shpc/qus/ultimas-4-semanas-gasolina-etanol.csv";

export interface FuelPriceData {
  gasolina: { averagePrice: number; sampleSize: number; latestDate: string } | null;
  etanol:   { averagePrice: number; sampleSize: number; latestDate: string } | null;
  updatedAt: string;
}

async function fetchFromAnp(): Promise<FuelPriceData> {
  const res = await fetch(ANP_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`ANP responded ${res.status}`);

  const buffer = await res.arrayBuffer();
  // Strip UTF-8 BOM if present
  const text = new TextDecoder("utf-8").decode(buffer).replace(/^\uFEFF/, "");

  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].split(";").map((h) => h.trim());

  const iP = header.indexOf("Produto");
  const iD = header.indexOf("Data da Coleta");
  const iV = header.indexOf("Valor de Venda");

  if (iP < 0 || iD < 0 || iV < 0) throw new Error("Unexpected CSV structure from ANP");

  // Find most recent date
  let maxTs = 0;
  let maxDateStr = "";
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(";");
    const raw = cols[iD]?.trim();
    if (!raw) continue;
    const [d, m, y] = raw.split("/").map(Number);
    if (!d || !m || !y) continue;
    const ts = new Date(y, m - 1, d).getTime();
    if (ts > maxTs) { maxTs = ts; maxDateStr = raw; }
  }

  // Accept records within the last 7 days of the most recent date
  const weekStart = maxTs - 6 * 86400_000;

  const gasolinaVals: number[] = [];
  const etanolVals:   number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols    = lines[i].split(";");
    const produto = cols[iP]?.trim();
    const dateRaw = cols[iD]?.trim();
    const precoRaw = cols[iV]?.trim();

    if (!produto || !dateRaw || !precoRaw) continue;

    const [d, m, y] = dateRaw.split("/").map(Number);
    if (!d || !m || !y) continue;
    const ts = new Date(y, m - 1, d).getTime();
    if (ts < weekStart) continue;

    const preco = parseFloat(precoRaw.replace(",", "."));
    if (isNaN(preco) || preco <= 0) continue;

    if (produto === "GASOLINA") gasolinaVals.push(preco);
    if (produto === "ETANOL")   etanolVals.push(preco);
  }

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

  const gAvg = avg(gasolinaVals);
  const eAvg = avg(etanolVals);

  return {
    gasolina: gAvg !== null
      ? { averagePrice: gAvg, sampleSize: gasolinaVals.length, latestDate: maxDateStr }
      : null,
    etanol: eAvg !== null
      ? { averagePrice: eAvg, sampleSize: etanolVals.length, latestDate: maxDateStr }
      : null,
    updatedAt: new Date().toISOString(),
  };
}

// Cache for 12 hours — ANP updates weekly, so this is more than enough
const getCachedFuelData = unstable_cache(
  fetchFromAnp,
  ["anp-fuel-prices"],
  { revalidate: 43_200 },
);

export async function GET() {
  try {
    const data = await getCachedFuelData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[fuel-prices] ANP fetch error:", err);
    return NextResponse.json({ error: "Não foi possível obter os dados da ANP." }, { status: 500 });
  }
}
