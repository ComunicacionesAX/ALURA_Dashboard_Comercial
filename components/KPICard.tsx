'use client';

import { KPIMetric } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  metric: KPIMetric;
  onClick?: () => void;
  isActive?: boolean;
}

function formatValue(value: number, unit: KPIMetric['unit'], format: KPIMetric['format']): string {
  if (unit === 'currency') {
    if (format === 'compact') {
      if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}Bn`;
      if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(0)}M`;
      return `$${(value / 1_000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  }
  if (unit === 'percentage') return `${value.toFixed(1)}%`;
  return value.toLocaleString('es-CO');
}

export default function KPICard({ metric, onClick, isActive }: KPICardProps) {
  const hasPrev = metric.previousValue !== 0;
  const change = hasPrev
    ? ((metric.value - metric.previousValue) / metric.previousValue) * 100
    : 0;
  const isPositive = change >= 0;
  const isFlat = Math.abs(change) < 0.05;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[8px] border p-4 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)]' : ''
      } ${isActive ? 'border-[#993935] ring-2 ring-[#993935]/20' : 'border-[#DBE2EB]'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-[#6B7381] font-medium leading-tight pr-2">{metric.label}</span>
        {hasPrev && (
          <span className={`text-[11px] flex items-center gap-0.5 flex-shrink-0 font-medium ${
            isFlat ? 'text-[#8B8B8D]' : isPositive ? 'text-[#27ae60]' : 'text-[#EB5852]'
          }`}>
            {isFlat
              ? <Minus className="w-3 h-3" />
              : isPositive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
            {isFlat ? '—' : `${Math.abs(change).toFixed(1)}%`}
          </span>
        )}
      </div>
      <div className="text-xl font-bold text-[#2B2E35] leading-none">
        {formatValue(metric.value, metric.unit, metric.format)}
      </div>
      {hasPrev && (
        <div className="text-[11px] text-[#8B8B8D] mt-1.5">
          vs. {formatValue(metric.previousValue, metric.unit, metric.format)} mes ant.
        </div>
      )}
    </div>
  );
}
