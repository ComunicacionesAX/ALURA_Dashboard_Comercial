'use client';

import { VentaPorZona } from '@/lib/types';
import { formatCOP, formatNum } from '@/lib/format';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

interface SalesChartProps {
  data: VentaPorZona[];
  chartTitle?: string;
  isMonthly?: boolean;
}

// Legend entries are derived from which cumplimiento thresholds actually
// appear in the visible data — so it always matches the bars on screen.
const THRESHOLD_ENTRIES = [
  { color: '#27ae60', label: 'Venta ≥ 100%',   test: (p: number) => p >= 100 },
  { color: '#FFA600', label: 'Venta 80 – 99%', test: (p: number) => p >= 80 && p < 100 },
  { color: '#993935', label: 'Venta < 80%',    test: (p: number) => p < 80 },
];

function CustomLegend({ data }: { data: { cumplimiento: number }[] }) {
  const activeEntries = THRESHOLD_ENTRIES.filter(e => data.some(d => e.test(d.cumplimiento)));
  return (
    <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-1 mb-2">
      {activeEntries.map(e => (
        <span key={e.color} className="flex items-center gap-1.5 text-xs text-[#6B7381]">
          <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: e.color }} />
          {e.label}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-xs text-[#6B7381]">
        <span className="inline-block w-3 h-3 rounded-sm bg-[#DBE2EB] flex-shrink-0" />
        Presupuesto
      </span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const venta = payload.find((p: any) => p.dataKey === 'venta');
  const ppto  = payload.find((p: any) => p.dataKey === 'presupuesto');
  const cumpl = venta?.value && ppto?.value
    ? ((venta.value / ppto.value) * 100).toFixed(1)
    : null;

  return (
    <div className="bg-white border border-[#DBE2EB] rounded-[8px] shadow-lg px-3 py-2 text-xs space-y-1 min-w-[200px]">
      <p className="font-semibold text-[#2B2E35] border-b border-[#DBE2EB] pb-1 mb-1">{label}</p>
      {venta && (
        <div className="flex justify-between gap-4">
          <span className="text-[#6B7381]">Venta</span>
          <span className="font-medium text-[#2B2E35]">{formatCOP(venta.value)}</span>
        </div>
      )}
      {ppto && (
        <div className="flex justify-between gap-4">
          <span className="text-[#6B7381]">Presupuesto</span>
          <span className="font-medium text-[#2B2E35]">{formatCOP(ppto.value)}</span>
        </div>
      )}
      {cumpl && (
        <div className="flex justify-between gap-4 border-t border-[#DBE2EB] pt-1">
          <span className="text-[#6B7381]">Cumplimiento</span>
          <span className={`font-semibold ${Number(cumpl) >= 100 ? 'text-[#27ae60]' : 'text-[#EB5852]'}`}>
            {cumpl}%
          </span>
        </div>
      )}
    </div>
  );
}

const barColor = (pct: number) =>
  pct >= 100 ? '#27ae60' : pct >= 80 ? '#FFA600' : '#993935';

export default function SalesChart({ data, chartTitle, isMonthly = false }: SalesChartProps) {
  const maxLabel = isMonthly ? 10 : 12;
  const chartData = data.map(item => ({
    zona: item.zona.length > maxLabel ? item.zona.slice(0, maxLabel) + '…' : item.zona,
    venta:        item.venta,
    presupuesto:  item.presupuesto,
    cumplimiento: item.cumplimiento,
  }));

  return (
    <div className="bg-white rounded-[8px] border border-[#DBE2EB] p-3 sm:p-4 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <h3 className="text-sm font-bold text-[#2B2E35] mb-3">
        {chartTitle ?? 'Venta por Zona'}
      </h3>

      {!isMonthly && <CustomLegend data={chartData} />}

      {data.length === 0 ? (
        <div className="h-[240px] flex items-center justify-center text-sm text-[#8B8B8D]">
          Sin datos para el filtro seleccionado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 8, left: 0, bottom: isMonthly ? 24 : 60 }}
            barCategoryGap="28%"
            barGap={3}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#DBE2EB" vertical={false} />
            <XAxis
              dataKey="zona"
              tick={{ fontSize: 10, fill: '#6B7381' }}
              tickLine={false}
              angle={isMonthly ? 0 : -35}
              textAnchor={isMonthly ? 'middle' : 'end'}
              interval={0}
              height={isMonthly ? 24 : 60}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6B7381' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => formatNum(v)}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#EFF2F6' }} />
            <Legend wrapperStyle={{ display: 'none' }} />

            <Bar dataKey="venta" name="Venta" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={isMonthly ? '#993935' : barColor(entry.cumplimiento)} />
              ))}
            </Bar>
            <Bar dataKey="presupuesto" name="Presupuesto" fill="#DBE2EB" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
