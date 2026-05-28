'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';

const MESES_ORD: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
};
const MES_LABEL: Record<string, string> = {
  ene: 'Enero', feb: 'Febrero', mar: 'Marzo', abr: 'Abril',
  may: 'Mayo', jun: 'Junio', jul: 'Julio', ago: 'Agosto',
  sep: 'Septiembre', oct: 'Octubre', nov: 'Noviembre', dic: 'Diciembre',
};

export function periodoLabel(p: string): string {
  if (!p) return 'Período actual';
  const [year, mes] = p.split('-');
  if (mes === 'all') return `Año ${year} (completo)`;
  return `${MES_LABEL[mes] ?? mes} ${year}`;
}

interface YearGroup {
  year: string;
  months: string[];
}

function buildGroups(periodos: string[]): YearGroup[] {
  const yearMap = new Map<string, string[]>();
  for (const p of periodos) {
    const [y, m] = p.split('-');
    if (!y || !m || m === 'all') continue;
    if (!yearMap.has(y)) yearMap.set(y, []);
    yearMap.get(y)!.push(p);
  }
  return [...yearMap.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, months]) => ({
      year,
      months: months.sort((a, b) => {
        const am = a.split('-')[1];
        const bm = b.split('-')[1];
        return (MESES_ORD[bm] ?? 0) - (MESES_ORD[am] ?? 0);
      }),
    }));
}

interface Props {
  value: string;
  periodos: string[];
  onChange: (v: string) => void;
}

export default function PeriodPicker({ value, periodos, onChange }: Props) {
  const groups = buildGroups(periodos);
  const firstYear = groups[0]?.year ?? String(new Date().getFullYear());

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string> | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const expandedYears = expanded ?? new Set([firstYear]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const toggleYear = (y: string) => {
    setExpanded(prev => {
      const next = new Set(prev ?? [firstYear]);
      if (next.has(y)) next.delete(y);
      else next.add(y);
      return next;
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full text-sm text-[#2B2E35] bg-[#EFF2F6] border border-[#CCCCCC] rounded-[6px] pl-3 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-[#993935] focus:border-[#993935] transition-colors text-left cursor-pointer"
      >
        <span className="block truncate">{periodoLabel(value)}</span>
      </button>
      <ChevronDown
        className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7381] transition-transform ${open ? 'rotate-180' : ''}`}
      />

      {open && (
        <div className="absolute z-50 mt-1 left-0 w-full bg-white border border-[#DBE2EB] rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1 max-h-72 overflow-y-auto">

          {/* Período actual */}
          <button
            type="button"
            onClick={() => select('')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[#EFF2F6] ${
              value === '' ? 'text-[#993935] font-semibold' : 'text-[#2B2E35]'
            }`}
          >
            <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
              {value === '' && <Check className="w-3.5 h-3.5" />}
            </span>
            Período actual
          </button>

          {groups.length > 0 && <div className="my-1 border-t border-[#EFF2F6]" />}

          {groups.map(({ year, months }) => (
            <div key={year}>
              {/* Year header toggle */}
              <button
                type="button"
                onClick={() => toggleYear(year)}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#6B7381] uppercase tracking-wide hover:bg-[#EFF2F6] transition-colors"
              >
                {expandedYears.has(year)
                  ? <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                {year}
              </button>

              {expandedYears.has(year) && (
                <>
                  {/* Full-year option */}
                  {(() => {
                    const v = `${year}-all`;
                    return (
                      <button
                        type="button"
                        onClick={() => select(v)}
                        className={`w-full flex items-center gap-2 px-3 py-2 pl-8 text-sm transition-colors hover:bg-[#EFF2F6] ${
                          value === v ? 'text-[#993935] font-semibold' : 'text-[#2B2E35]'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                          {value === v && <Check className="w-3.5 h-3.5" />}
                        </span>
                        Año {year} (completo)
                      </button>
                    );
                  })()}

                  {/* Month options */}
                  {months.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => select(p)}
                      className={`w-full flex items-center gap-2 px-3 py-2 pl-8 text-sm transition-colors hover:bg-[#EFF2F6] ${
                        value === p ? 'text-[#993935] font-semibold' : 'text-[#2B2E35]'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                        {value === p && <Check className="w-3.5 h-3.5" />}
                      </span>
                      {periodoLabel(p)}
                    </button>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
