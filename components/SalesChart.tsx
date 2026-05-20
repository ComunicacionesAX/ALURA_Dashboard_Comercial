'use client';

import { VentaPorZona } from '@/lib/types';
import { formatCOP } from '@/lib/format';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

interface SalesChartProps {
  data: VentaPorZona[];
  chartTitle?: string;
  isMonthly?: boolean;
}

// Compact axis formatter: 1.200.000.000 → "1,2B" · 500.000.000 → "500M" · 1.500.000 → "1,5M"
function formatY(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1).replace('.', ',')}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(v >= 100_000_000 ? 0 : 1).replace('.', ',')}M`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

// Word-wrap X-axis tick: splits the label at word boundaries into up to 2 lines,
// rotated -38° so there is no truncation and names stay fully readable.
function CustomXTick({ x, y, payload }: any) {
  const name: string = payload.value ?? '';
  const words = name.split(' ');
  let line1 = name;
  let line2 = '';
  if (words.length > 1 && name.length > 9) {
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(' ');
    line2 = words.slice(mid).join(' ');
  }
  return (
    <g transform={`translate(${x},${y + 4})`}>
      <text
        transform="rotate(-38)"
        textAnchor="end"
        fill="#6B7381"
        fontSize={11}
        fontFamily="system-ui,-apple-system,sans-serif"
      >
        <tspan x={0} dy={0}>{line1}</tspan>
        {line2 && <tspan x={0} dy={13}>{line2}</tspan>}
      </text>
    </g>
  );
}

const THRESHOLD_ENTRIES = [
  { color: '#27ae60', label: 'Venta ≥ 100%',   test: (p: number) => p >= 100 },
  { color: '#FFA600', label: 'Venta 80 – 99%', test: (p: number) => p >= 80 && p < 100 },
  { color: '#993935', label: 'Venta < 80%',    test: (p: number) => p < 80 },
];

function CustomLegend({ data }: { data: { cumplimiento: number }[] }) {
  const activeEntries = THRESHOLD_ENTRIES.filter(e => data.some(d => e.test(d.cumplimiento)));
  return (
    <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-1 mb-3">
      {activeEntries.map(e => (
        <span key={e.color} className="flex items-center gap-1.5 text-[11px] text-[#6B7381]">
          <span className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: e.color }} />
          {e.label}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-[11px] text-[#6B7381]">
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#DBE2EB] flex-shrink-0" />
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
  const chartHeight = isMonthly
    ? 270
    : Math.max(260, Math.min(460, data.length * 52 + 80));

  const bottomMargin = isMonthly ? 8 : 68;
  const xAxisHeight  = isMonthly ? 22 : 68;

  return (
    <div className="bg-white rounded-[8px] border border-[#DBE2EB] p-3 sm:p-4 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <h3 className="text-sm font-bold text-[#2B2E35] mb-2">
        {chartTitle ?? 'Venta por Zona'}
      </h3>

      {!isMonthly && <CustomLegend data={data} />}

      {data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-[#8B8B8D]">
          Sin datos para el filtro seleccionado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: bottomMargin }}
            barCategoryGap="22%"
            barGap={3}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#DBE2EB" vertical={false} />
            <XAxis
              dataKey="zona"
              tick={isMonthly
                ? { fontSize: 11, fill: '#6B7381', fontFamily: 'system-ui,-apple-system,sans-serif' }
                : <CustomXTick />}
              tickLine={false}
              axisLine={false}
              interval={0}
              height={xAxisHeight}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7381', fontFamily: 'system-ui,-apple-system,sans-serif' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatY}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#EFF2F6' }} />
            <Legend wrapperStyle={{ display: 'none' }} />

            <Bar dataKey="venta" name="Venta" radius={[4, 4, 0, 0]} maxBarSize={44}>
              {data.map((entry, i) => (
                <Cell key={i} fill={isMonthly ? '#993935' : barColor(entry.cumplimiento)} />
              ))}
            </Bar>
            <Bar dataKey="presupuesto" name="Presupuesto" fill="#DBE2EB" radius={[4, 4, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
