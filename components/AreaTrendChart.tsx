'use client';

import { ResumenMensual } from '@/lib/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AreaTrendChartProps {
  data: ResumenMensual[];
  title?: string;
}

const TICK_STYLE = { fontSize: 11, fill: '#6B7381', fontFamily: 'system-ui,-apple-system,sans-serif' };

export default function AreaTrendChart({ data, title = 'Tendencia de Ventas y Presupuesto' }: AreaTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
        <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
        <p className="text-center text-sm text-[#8B8B8D]">Sin datos disponibles</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    mes: item.mes.substring(0, 3),
    venta: item.ventaTotal / 1_000_000,
    presupuesto: item.ventaPresupuesto / 1_000_000,
  }));

  return (
    <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradVenta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#993935" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#993935" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPpto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#73DEA9" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#73DEA9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#DBE2EB" vertical={false} />
            <XAxis dataKey="mes" tick={TICK_STYLE} axisLine={false} tickLine={false} />
            <YAxis
              tick={TICK_STYLE}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${Number(v).toFixed(0)}M`}
              width={52}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #DBE2EB',
                borderRadius: '8px',
                fontSize: 12,
              }}
              formatter={(value, name) => [
                `$${Number(value).toFixed(1)}M`,
                name === 'venta' ? 'Venta Real' : 'Presupuesto',
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: 11, color: '#6B7381', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
                  {value === 'venta' ? 'Venta Real' : 'Presupuesto'}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="venta"
              name="venta"
              stroke="#993935"
              strokeWidth={2}
              fill="url(#gradVenta)"
              dot={false}
              activeDot={{ r: 4, fill: '#993935' }}
            />
            <Area
              type="monotone"
              dataKey="presupuesto"
              name="presupuesto"
              stroke="#73DEA9"
              strokeWidth={2}
              fill="url(#gradPpto)"
              dot={false}
              activeDot={{ r: 4, fill: '#73DEA9' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
