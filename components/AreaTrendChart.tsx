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

export default function AreaTrendChart({ data, title = 'Tendencia de Ventas y Presupuesto' }: AreaTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
        <p className="text-center text-sm text-[#8B8B8D]">Sin datos disponibles</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    mes: item.mes,
    venta: item.ventaTotal / 1_000_000,
    presupuesto: item.ventaPresupuesto / 1_000_000,
    margen: item.margenBruto,
  }));

  return (
    <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
      <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="colorVenta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#993935" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#993935" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorPresupuesto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2D7A5D" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2D7A5D" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#DBE2EB" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: '#6B7381' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7381' }}
              tickFormatter={(value) => `$${Number(value).toFixed(0)}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #DBE2EB',
                borderRadius: '8px',
              }}
              formatter={(value) => [`$${Number(value).toFixed(1)}M`, '']}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="venta"
              name="Venta Real"
              stroke="#993935"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorVenta)"
            />
            <Area
              type="monotone"
              dataKey="presupuesto"
              name="Presupuesto"
              stroke="#2D7A5D"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPresupuesto)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
