"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
export interface ChartData {
  label: string;
  bruto: number;
  despesas: number;
  liquido: number;
  rangeLabel?: string;
}

const axisStyle = { fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "monospace" };
const gridStyle = { stroke: "rgba(255,255,255,0.05)", strokeDasharray: "3 3" };

function DarkTooltip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(4,4,14,0.97)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12,
      padding: "10px 14px",
      backdropFilter: "blur(20px)",
      fontSize: 12,
    }}>
      <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 6, fontFamily: "monospace" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontFamily: "monospace", lineHeight: "1.6" }}>
          {p.name}: R$ {Number(p.value).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
        </p>
      ))}
    </div>
  );
}

interface Props {
  data: ChartData[];
  height?: number;
  isDiario?: boolean;
}

export function BarChartMixed({ data, height = 280 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid {...gridStyle} vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis
          tick={axisStyle} axisLine={false} tickLine={false}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          width={46}
        />
        <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.025)" }} />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: "monospace", paddingTop: 12 }}
          iconType="square"
        />
        <Bar
          dataKey="bruto" name="Bruto" fill="#00d4ff"
          radius={[4,4,0,0]} fillOpacity={0.75}
          style={{ filter: "drop-shadow(0 0 4px rgba(0,212,255,0.4))" }}
        />
        <Bar
          dataKey="despesas" name="Despesas" fill="#ff3366"
          radius={[4,4,0,0]} fillOpacity={0.75}
          style={{ filter: "drop-shadow(0 0 4px rgba(255,51,102,0.4))" }}
        />
        <Bar
          dataKey="liquido" name="Líquido" fill="#00ff88"
          radius={[4,4,0,0]} fillOpacity={0.8}
          style={{ filter: "drop-shadow(0 0 4px rgba(0,255,136,0.4))" }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
