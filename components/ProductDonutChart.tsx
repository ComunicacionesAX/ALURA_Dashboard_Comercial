'use client';

import { VentaPorProducto } from '@/lib/types';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ProductDonutChartProps {
  data: VentaPorProducto[];
  title?: string;
}

const COLORS = ['#993935', '#B85150', '#D4747B', '#E89699', '#73DEA9', '#82BDFF', '#FFA600', '#FF6B6B'];

export default function ProductDonutChart({ data, title = 'Distribución de Ventas por Producto' }: ProductDonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
        <p className="text-center text-sm text-[#8B8B8D]">Sin datos disponibles</p>
      </div>
    );
  }

  const chartData = data.slice(0, 8).map((producto) => ({
    name: producto.producto,
    value: producto.venta / 1_000_000,
  }));

  return (
    <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
      <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${(name || '').substring(0, 12)}: $${Number(value).toFixed(0)}M`}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(1)}M`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #DBE2EB',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
