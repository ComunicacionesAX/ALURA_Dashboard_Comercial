'use client';

import { ClientePareto } from '@/lib/types';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Cell,
} from 'recharts';

interface ParetoChartProps {
  data: ClientePareto[];
  title?: string;
}

const TICK_STYLE = { fontSize: 11, fill: '#6B7381', fontFamily: 'system-ui,-apple-system,sans-serif' };

export default function ParetoChart({ data, title = 'Análisis Pareto de Clientes' }: ParetoChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
        <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
        <p className="text-center text-sm text-[#8B8B8D]">Sin datos disponibles</p>
      </div>
    );
  }

  const top10 = data.slice(0, 10);
  let cumulative = 0;
  const chartData = top10.map((cliente) => {
    cumulative += cliente.porcentaje;
    return {
      nombre: cliente.nombre.length > 9 ? cliente.nombre.substring(0, 9) + '…' : cliente.nombre,
      venta: cliente.venta / 1_000_000,
      porcentaje: cliente.porcentaje,
      cumulative: Math.min(cumulative, 100),
    };
  });

  const barColor = (pct: number) =>
    pct >= 20 ? '#993935' : pct >= 10 ? '#B85150' : '#D4748A';

  return (
    <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 6, right: 36, left: 0, bottom: 32 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DBE2EB" vertical={false} />
            <XAxis
              dataKey="nombre"
              tick={{ ...TICK_STYLE, fontSize: 10 }}
              angle={-40}
              textAnchor="end"
              height={56}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={TICK_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${Number(v).toFixed(0)}M`}
              width={48}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={TICK_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              width={36}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #DBE2EB',
                borderRadius: '8px',
                fontSize: 12,
              }}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === 'venta') return [`$${v.toFixed(1)}M`, 'Venta'];
                if (name === 'cumulative') return [`${v.toFixed(1)}%`, '% Acumulado'];
                return [`${v}`, String(name)];
              }}
            />
            <Bar yAxisId="left" dataKey="venta" name="venta" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={barColor(entry.porcentaje)} />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              name="cumulative"
              stroke="#FFA600"
              strokeWidth={2}
              dot={{ fill: '#FFA600', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#FFA600' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-5 mt-1 justify-center">
        <span className="flex items-center gap-1.5 text-[11px] text-[#6B7381]">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#993935]" />
          Venta (M COP)
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-[#6B7381]">
          <span className="inline-block w-5 h-0.5 bg-[#FFA600]" />
          % Acumulado
        </span>
      </div>
    </div>
  );
}
