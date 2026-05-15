'use client';

import { ResumenMensual } from '@/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ComparisonChartProps {
  data: ResumenMensual[];
  title?: string;
}

export default function ComparisonChart({ data, title = 'Comparación: Mes Actual vs Mes Anterior' }: ComparisonChartProps) {
  if (data.length < 2) {
    return (
      <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
        <p className="text-center text-sm text-[#8B8B8D]">Se requieren al menos 2 meses de datos</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => new Date(a.mes).getTime() - new Date(b.mes).getTime());
  const lastTwo = sortedData.slice(-2);

  const chartData = lastTwo.map((item) => ({
    mes: item.mes.substring(0, 7),
    venta: item.ventaTotal / 1_000_000,
    presupuesto: item.ventaPresupuesto / 1_000_000,
    margen: item.margenBruto,
  }));

  const variacion = lastTwo.length === 2
    ? (((lastTwo[1].ventaTotal - lastTwo[0].ventaTotal) / lastTwo[0].ventaTotal) * 100)
    : 0;

  const marginVariation = lastTwo.length === 2
    ? (lastTwo[1].margenBruto - lastTwo[0].margenBruto).toFixed(1)
    : 0;

  return (
    <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#2B2E35]">{title}</h3>
          <p className="mt-1 text-xs text-[#8B8B8D]">Últimos dos meses registrados</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${variacion >= 0 ? 'text-[#2D7A5D]' : 'text-[#9B2A1C]'}`}>
            {variacion >= 0 ? '+' : ''}{variacion.toFixed(1)}%
          </p>
          <p className="text-xs text-[#8B8B8D]">Variación en ventas</p>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DBE2EB" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 12, fill: '#6B7381' }}
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
            <Bar dataKey="venta" name="Venta Real" fill="#993935" radius={[4, 4, 0, 0]} />
            <Bar dataKey="presupuesto" name="Presupuesto" fill="#2D7A5D" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-[#DBE2EB] pt-4">
        <div className="rounded-lg bg-[#F5F7FB] p-3">
          <p className="text-xs text-[#8B8B8D]">Variación Venta</p>
          <p className={`text-lg font-bold ${variacion >= 0 ? 'text-[#2D7A5D]' : 'text-[#9B2A1C]'}`}>
            {variacion >= 0 ? '↑' : '↓'} {Math.abs(variacion).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg bg-[#F5F7FB] p-3">
          <p className="text-xs text-[#8B8B8D]">Variación Margen</p>
          <p className={`text-lg font-bold ${Number(marginVariation) >= 0 ? 'text-[#2D7A5D]' : 'text-[#9B2A1C]'}`}>
            {Number(marginVariation) >= 0 ? '+' : ''}{marginVariation}pp
          </p>
        </div>
        <div className="rounded-lg bg-[#F5F7FB] p-3">
          <p className="text-xs text-[#8B8B8D]">Cumplimiento</p>
          <p className="text-lg font-bold text-[#993935]">
            {lastTwo.length === 2 ? ((lastTwo[1].ventaTotal / lastTwo[1].ventaPresupuesto) * 100).toFixed(1) : '-'}%
          </p>
        </div>
      </div>
    </div>
  );
}
