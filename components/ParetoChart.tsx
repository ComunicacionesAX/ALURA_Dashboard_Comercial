'use client';

import { ClientePareto } from '@/lib/types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

interface ParetoChartProps {
  data: ClientePareto[];
  title?: string;
}

export default function ParetoChart({ data, title = 'Análisis Pareto de Clientes' }: ParetoChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
        <p className="text-center text-sm text-[#8B8B8D]">Sin datos disponibles</p>
      </div>
    );
  }

  const chartData = data.slice(0, 10).map((cliente, idx) => ({
    nombre: cliente.nombre.length > 8 ? cliente.nombre.substring(0, 8) + '.' : cliente.nombre,
    venta: cliente.venta / 1_000_000,
    porcentaje: cliente.porcentaje,
    cumulative: data.slice(0, idx + 1).reduce((sum, c) => sum + c.porcentaje, 0),
  }));

  return (
    <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
      <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DBE2EB" />
            <XAxis
              dataKey="nombre"
              tick={{ fontSize: 11, fill: '#6B7381' }}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#6B7381' }}
              tickFormatter={(value) => `$${Number(value).toFixed(0)}M`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#6B7381' }}
              tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #DBE2EB',
                borderRadius: '8px',
              }}
              formatter={(value, name) => {
                if (name === 'venta') return [`$${Number(value).toFixed(1)}M`, 'Venta'];
                if (name === 'cumulative') return [`${Number(value).toFixed(1)}%`, 'Acumulado'];
                return [value, name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="venta" name="Venta (M COP)" fill="#993935" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              name="% Acumulado"
              stroke="#2D7A5D"
              strokeWidth={2}
              dot={{ fill: '#2D7A5D', r: 4 }}
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
