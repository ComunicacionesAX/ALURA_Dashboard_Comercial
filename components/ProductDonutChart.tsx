'use client';

import { VentaPorProducto } from '@/lib/types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ProductDonutChartProps {
  data: VentaPorProducto[];
  title?: string;
}

// Design-system palette — brand red shades + status/accent colours
const SLICE_COLORS = [
  '#993935', // brand primary
  '#B85150', // brand mid
  '#D4748A', // brand light
  '#27ae60', // success green
  '#73DEA9', // light green
  '#FFA600', // amber
  '#82BDFF', // light blue
  '#6B7381', // neutral
];

export default function ProductDonutChart({ data, title = 'Distribución de Ventas por Producto' }: ProductDonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
        <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
        <p className="text-center text-sm text-[#8B8B8D]">Sin datos disponibles</p>
      </div>
    );
  }

  const top7 = data.slice(0, 7);
  const rest  = data.slice(7);
  const restTotal = rest.reduce((s, p) => s + p.venta, 0);

  const chartData = [
    ...top7.map((p) => ({ name: p.producto, value: p.venta / 1_000_000 })),
    ...(restTotal > 0 ? [{ name: 'Otros', value: restTotal / 1_000_000 }] : []),
  ];

  const totalM = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <h3 className="mb-2 text-sm font-bold text-[#2B2E35]">{title}</h3>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Donut */}
        <div className="h-[220px] w-full sm:w-[220px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={52}
                dataKey="value"
                strokeWidth={2}
                stroke="white"
                animationBegin={0}
                animationDuration={700}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #DBE2EB',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
                formatter={(value) => {
                  const v = Number(value);
                  return [`$${v.toFixed(1)}M (${((v / totalM) * 100).toFixed(1)}%)`, ''];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend list */}
        <div className="flex-1 space-y-1.5 min-w-0 w-full">
          {chartData.map((d, i) => {
            const pct = totalM > 0 ? (d.value / totalM) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length] }}
                />
                <span className="text-xs text-[#2B2E35] truncate flex-1">{d.name}</span>
                <span className="text-xs font-semibold text-[#2B2E35] flex-shrink-0">{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
