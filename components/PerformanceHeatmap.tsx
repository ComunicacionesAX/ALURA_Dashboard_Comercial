'use client';

import { VentaPorZona } from '@/lib/types';

interface PerformanceHeatmapProps {
  data: VentaPorZona[];
  title?: string;
}

export default function PerformanceHeatmap({ data, title = 'Mapa de Desempeño por Zona' }: PerformanceHeatmapProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
        <p className="text-center text-sm text-[#8B8B8D]">Sin datos disponibles</p>
      </div>
    );
  }

  const getPerformanceColor = (cumplimiento: number) => {
    if (cumplimiento >= 100) return 'bg-gradient-to-br from-[#2D7A5D] to-[#1d4a35]';
    if (cumplimiento >= 90) return 'bg-gradient-to-br from-[#73DEA9] to-[#4CB584]';
    if (cumplimiento >= 80) return 'bg-gradient-to-br from-[#82BDFF] to-[#5A9AE8]';
    if (cumplimiento >= 70) return 'bg-gradient-to-br from-[#FFA600] to-[#FF8C00]';
    return 'bg-gradient-to-br from-[#EB5852] to-[#D32F2F]';
  };

  const getPerformanceLabel = (cumplimiento: number) => {
    if (cumplimiento >= 100) return 'Excelente';
    if (cumplimiento >= 90) return 'Muy Bien';
    if (cumplimiento >= 80) return 'Bien';
    if (cumplimiento >= 70) return 'Regular';
    return 'Bajo';
  };

  return (
    <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]">
      <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>

      <div className="space-y-3">
        {data.map((zona, idx) => {
          const cumplimiento = zona.cumplimiento;
          const performancePercentage = Math.min(cumplimiento, 120);

          return (
            <div key={`${zona.zona}-${idx}`} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#2B2E35]">{zona.zona}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    cumplimiento >= 100 ? 'bg-[#2D7A5D]/15 text-[#2D7A5D]' :
                    cumplimiento >= 90 ? 'bg-[#73DEA9]/20 text-[#2D7A5D]' :
                    cumplimiento >= 80 ? 'bg-[#82BDFF]/20 text-[#0066CC]' :
                    cumplimiento >= 70 ? 'bg-[#FFA600]/20 text-[#B86B00]' :
                    'bg-[#EB5852]/20 text-[#9B2A1C]'
                  }`}>
                    {cumplimiento.toFixed(1)}%
                  </span>
                  <span className="text-xs text-[#8B8B8D]">{getPerformanceLabel(cumplimiento)}</span>
                </div>
              </div>

              <div className="relative h-8 w-full rounded-lg bg-[#F5F7FB] overflow-hidden">
                <div
                  className={`h-full ${getPerformanceColor(cumplimiento)} transition-all duration-300 flex items-center justify-end pr-2`}
                  style={{ width: `${performancePercentage}%` }}
                >
                  {performancePercentage > 20 && (
                    <span className="text-xs font-bold text-white">${(zona.venta / 1_000_000).toFixed(0)}M</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-xs text-[#8B8B8D]">
                <span>Venta: ${(zona.venta / 1_000_000).toFixed(0)}M</span>
                <span>Meta: ${(zona.presupuesto / 1_000_000).toFixed(0)}M</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#DBE2EB] pt-4 md:grid-cols-5">
        <div className="text-center">
          <div className="mb-2 h-4 rounded-full bg-gradient-to-br from-[#2D7A5D] to-[#1d4a35]"></div>
          <p className="text-xs text-[#8B8B8D]">≥100%</p>
        </div>
        <div className="text-center">
          <div className="mb-2 h-4 rounded-full bg-gradient-to-br from-[#73DEA9] to-[#4CB584]"></div>
          <p className="text-xs text-[#8B8B8D]">90-99%</p>
        </div>
        <div className="text-center">
          <div className="mb-2 h-4 rounded-full bg-gradient-to-br from-[#82BDFF] to-[#5A9AE8]"></div>
          <p className="text-xs text-[#8B8B8D]">80-89%</p>
        </div>
        <div className="text-center">
          <div className="mb-2 h-4 rounded-full bg-gradient-to-br from-[#FFA600] to-[#FF8C00]"></div>
          <p className="text-xs text-[#8B8B8D]">70-79%</p>
        </div>
        <div className="text-center">
          <div className="mb-2 h-4 rounded-full bg-gradient-to-br from-[#EB5852] to-[#D32F2F]"></div>
          <p className="text-xs text-[#8B8B8D]">&lt;70%</p>
        </div>
      </div>
    </div>
  );
}
