'use client';

import { KPIMetric } from '@/lib/types';
import { formatCOP, formatPct, formatNum } from '@/lib/format';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';

interface KPICardProps {
  metric: KPIMetric;
  onClick?: () => void;
  isActive?: boolean;
  comingSoon?: boolean;
  accent?: 'critical' | 'warning' | 'info';
}

function formatValue(value: number, unit: KPIMetric['unit']): string {
  if (unit === 'currency')   return formatCOP(value);
  if (unit === 'percentage') return formatPct(value);
  return formatNum(value);
}

// Shrink font progressively so long strings never overflow the card.
// Cards are ~120px wide at 8-across; each size class gives roughly:
//   text-xl  → 20px → fits ~9 chars
//   text-lg  → 18px → fits ~11 chars
//   text-base→ 16px → fits ~13 chars
//   text-sm  → 14px → fits ~15 chars  (covers "$18.450.000.000")
function valueSizeClass(str: string): string {
  if (str.length <= 9)  return 'text-xl';
  if (str.length <= 11) return 'text-lg';
  if (str.length <= 13) return 'text-base';
  return 'text-sm';
}

const accentStyles = {
  critical: {
    border:  'border-[#EB5852] border-l-4',
    bg:      'bg-[#EB5852]/5',
    value:   'text-[#EB5852]',
    icon:    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#EB5852] animate-pulse" />,
  },
  warning: {
    border:  'border-[#FFA600] border-l-4',
    bg:      'bg-[#FFA600]/5',
    value:   'text-[#6B4C00]',
    icon:    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#FFA600] animate-pulse" />,
  },
  info: {
    border:  'border-[#82BDFF] border-l-4',
    bg:      'bg-[#82BDFF]/5',
    value:   'text-[#2B2E35]',
    icon:    null,
  },
};

export default function KPICard({ metric, onClick, isActive, comingSoon, accent }: KPICardProps) {
  const hasPrev = metric.previousValue !== 0;
  const change = hasPrev
    ? ((metric.value - metric.previousValue) / metric.previousValue) * 100
    : 0;
  const isPositive = change >= 0;
  const isFlat     = Math.abs(change) < 0.05;

  const mainStr = formatValue(metric.value, metric.unit);
  const prevStr = formatValue(metric.previousValue, metric.unit);

  if (comingSoon) {
    return (
      <div className="bg-white rounded-[8px] border border-[#DBE2EB] border-dashed p-3 flex flex-col overflow-hidden min-h-[96px]">
        <p className="text-[11px] font-medium text-[#6B7381] leading-tight line-clamp-2 min-h-[1.75rem]">
          {metric.label}
        </p>
        <div className="flex-1 flex items-center justify-between py-1 min-w-0">
          <span className="text-xs text-[#8B8B8D] italic">Próximamente</span>
          <ChevronRight className="w-4 h-4 text-[#CCCCCC] flex-shrink-0" />
        </div>
        <div className="h-[14px]" />
      </div>
    );
  }

  const a = accent ? accentStyles[accent] : null;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-[8px] border p-3 flex flex-col overflow-hidden min-h-[96px] transition-all ${
        onClick ? 'cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)]' : ''
      } ${a ? `${a.border} ${a.bg}` : 'bg-white border-[#DBE2EB]'} ${
        isActive ? 'ring-2 ring-[#993935]/20' : ''
      }`}
    >
      {a?.icon}
      <p className="text-[11px] font-medium text-[#6B7381] leading-tight line-clamp-2 min-h-[1.75rem]">
        {metric.label}
      </p>

      <div className="flex-1 flex items-center py-1 min-w-0">
        <span className={`${valueSizeClass(mainStr)} font-bold leading-none whitespace-nowrap ${a ? a.value : 'text-[#2B2E35]'}`}>
          {mainStr}
        </span>
      </div>

      {hasPrev ? (
        <div className="flex items-center gap-1 overflow-hidden min-w-0">
          <span className={`flex-shrink-0 flex items-center gap-0.5 text-[11px] font-medium ${
            isFlat ? 'text-[#8B8B8D]' : isPositive ? 'text-[#27ae60]' : 'text-[#EB5852]'
          }`}>
            {isFlat
              ? <Minus className="w-3 h-3" />
              : isPositive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
            {isFlat ? '—' : `${Math.abs(change).toFixed(1)}%`}
          </span>
          {metric.unit !== 'currency' && (
            <span className="text-[11px] text-[#8B8B8D] truncate min-w-0">
              vs. {prevStr}
            </span>
          )}
        </div>
      ) : (
        <div className="h-[14px]" />
      )}
    </div>
  );
}
