'use client';

import { VentaPorZona } from '@/lib/types';

interface PerformanceHeatmapProps {
  data: VentaPorZona[];
  title?: string;
}

function cumplLabel(c: number) {
  if (c >= 100) return 'Excelente';
  if (c >= 90)  return 'Muy bien';
  if (c >= 80)  return 'Bien';
  if (c >= 70)  return 'Regular';
  return 'Bajo';
}

function cumplStyles(c: number) {
  if (c >= 100) return { bar: 'bg-[#27ae60]',  badge: 'bg-[#27ae60]/15 text-[#1a7a44]' };
  if (c >= 90)  return { bar: 'bg-[#73DEA9]',  badge: 'bg-[#73DEA9]/20 text-[#1a7a44]' };
  if (c >= 80)  return { bar: 'bg-[#82BDFF]',  badge: 'bg-[#82BDFF]/20 text-[#0066CC]' };
  if (c >= 70)  return { bar: 'bg-[#FFA600]',  badge: 'bg-[#FFA600]/20 text-[#7a4d00]' };
  return         { bar: 'bg-[#EB5852]',  badge: 'bg-[#EB5852]/15 text-[#9B2A1C]' };
}

export default function PerformanceHeatmap({ data, title = 'Mapa de Desempeño por Zona' }: PerformanceHeatmapProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
        <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>
        <p className="text-center text-sm text-[#8B8B8D]">Sin datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-[#DBE2EB] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <h3 className="mb-4 text-sm font-bold text-[#2B2E35]">{title}</h3>

      <div className="space-y-2.5">
        {data.map((zona, idx) => {
          const c  = zona.cumplimiento;
          const st = cumplStyles(c);
          const w  = `${Math.min(c, 120)}%`;

          return (
            <div key={`${zona.zona}-${idx}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[#2B2E35] truncate max-w-[55%]">{zona.zona}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${st.badge}`}>
                    {c.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-[#8B8B8D] hidden sm:inline">{cumplLabel(c)}</span>
                </div>
              </div>

              <div className="relative h-6 w-full rounded-[4px] bg-[#EFF2F6] overflow-hidden">
                <div
                  className={`h-full ${st.bar} transition-all duration-500 rounded-[4px] flex items-center justify-end pr-2`}
                  style={{ width: w }}
                >
                  {c > 25 && (
                    <span className="text-[10px] font-bold text-white leading-none">
                      ${(zona.venta / 1_000_000).toFixed(0)}M
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-[#8B8B8D] mt-0.5">
                <span>Venta: ${(zona.venta / 1_000_000).toFixed(0)}M</span>
                <span>Meta: ${(zona.presupuesto / 1_000_000).toFixed(0)}M</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-[#DBE2EB] grid grid-cols-5 gap-1">
        {[
          { color: 'bg-[#27ae60]', label: '≥100%' },
          { color: 'bg-[#73DEA9]', label: '90–99%' },
          { color: 'bg-[#82BDFF]', label: '80–89%' },
          { color: 'bg-[#FFA600]', label: '70–79%' },
          { color: 'bg-[#EB5852]', label: '<70%' },
        ].map(({ color, label }) => (
          <div key={label} className="text-center">
            <div className={`mb-1 h-2 rounded-full ${color}`} />
            <p className="text-[10px] text-[#8B8B8D]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
