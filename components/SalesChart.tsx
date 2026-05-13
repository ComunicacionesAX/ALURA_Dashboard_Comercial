'use client';

import { VentaPorZona } from '@/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SalesChartProps {
  data: VentaPorZona[];
  showMargen?: boolean;
}

export default function SalesChart({ data, showMargen = true }: SalesChartProps) {
  const chartData = data.map((item) => ({
    zona: item.zona.length > 12 ? item.zona.substring(0, 12) + '...' : item.zona,
    venta: item.venta / 1000000000,
    presupuesto: item.presupuesto / 1000000000,
    cumplimiento: item.cumplimiento,
    margen: item.margen,
  }));

  return (
    <div className="bg-white rounded-[8px] border border-[#DBE2EB] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <h3 className="text-sm font-bold text-[#2B2E35] mb-4">Venta por Zona (Millones $)</h3>
      <div className="h-[300px] min-h-[300px]">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} width={800} height={300} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DBE2EB" />
            <XAxis
              dataKey="zona"
              tick={{ fontSize: 11, fill: '#6B7381' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7381' }}
              tickFormatter={(value) => `$${value}M`}
            />
            <Tooltip
              formatter={(value) => [`$${Number(value).toFixed(2)}M`, '']}
              labelStyle={{ color: '#2B2E35' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #DBE2EB',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="venta" name="Venta" fill="#993935" radius={[4, 4, 0, 0]} />
            <Bar dataKey="presupuesto" name="Presupuesto" fill="#DBE2EB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}