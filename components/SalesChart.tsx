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
  ReferenceLine,
} from 'recharts';

interface SalesChartProps {
  data: VentaPorZona[];
  showMargen?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}M`;
  }
  return `$${(value / 1000000).toFixed(0)}M`;
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
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Venta por Zona (Millones $)</h3>
      <div className="h-[300px] min-h-[300px]">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} width={800} height={300} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="zona"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `$${value}M`}
            />
            <Tooltip
              formatter={(value) => [`$${Number(value).toFixed(2)}M`, '']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#000" />
            <Bar dataKey="venta" name="Venta" fill="#702b2b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="presupuesto" name="Presupuesto" fill="#a88b8b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}