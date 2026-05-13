'use client';

import { KPIMetric } from '@/lib/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  metric: KPIMetric;
  onClick?: () => void;
  isActive?: boolean;
}

function formatValue(value: number, unit: KPIMetric['unit'], format: KPIMetric['format']): string {
  if (unit === 'currency') {
    if (format === 'compact') {
      if (value >= 1000000000) {
        return `$${(value / 1000000000).toFixed(1)}M`;
      } else if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(0)}M`;
      }
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  }
  if (unit === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  return value.toString();
}

function calculateChange(current: number, previous: number): { value: number; isPositive: boolean } {
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    isPositive: change >= 0,
  };
}

export default function KPICard({ metric, onClick, isActive }: KPICardProps) {
  const change = calculateChange(metric.value, metric.previousValue);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[8px] border p-4 cursor-pointer transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] ${
        isActive ? 'border-[#993935] ring-2 ring-[#993935]/20' : 'border-[#DBE2EB]'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm text-[#6B7381] font-medium">{metric.label}</span>
        <span className={`text-xs flex items-center gap-1 ${change.isPositive ? 'text-[#73DEA9]' : 'text-[#EB5852]'}`}>
          {change.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change.value.toFixed(1)}%
        </span>
      </div>
      <div className="text-2xl font-bold text-[#2B2E35]">
        {formatValue(metric.value, metric.unit, metric.format)}
      </div>
      <div className="text-xs text-[#8B8B8D] mt-1">
        vs. {formatValue(metric.previousValue, metric.unit, metric.format)} mes anterior
      </div>
    </div>
  );
}