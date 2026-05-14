'use client';

import { ComercialFilters, ComercialFilterOptions } from '@/lib/types';
import { UserCheck, Users, Package, CalendarDays, ChevronDown, X } from 'lucide-react';
import PeriodPicker, { periodoLabel } from './PeriodPicker';

interface Props {
  filters: ComercialFilters;
  options: ComercialFilterOptions;
  onChange: (f: ComercialFilters) => void;
}

const empty: ComercialFilters = { consultor: '', cliente: '', producto: '', periodo: '' };

export default function ComercialFiltersPanel({ filters, options, onChange }: Props) {
  const set = (key: keyof ComercialFilters, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasActive = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white rounded-[8px] border border-[#DBE2EB] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Consultor */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#6B7381] mb-1 overflow-hidden">
            <UserCheck className="w-3 h-3 text-[#993935] flex-shrink-0" />
            <span className="truncate">Consultor</span>
          </label>
          <SelectWrapper value={filters.consultor} onChange={v => set('consultor', v)}>
            <option value="">Todos</option>
            {(options.consultores ?? []).map(c => <option key={c} value={c}>{c}</option>)}
          </SelectWrapper>
        </div>

        {/* Cliente */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#6B7381] mb-1 overflow-hidden">
            <Users className="w-3 h-3 text-[#993935] flex-shrink-0" />
            <span className="truncate">Cliente</span>
          </label>
          <SelectWrapper value={filters.cliente} onChange={v => set('cliente', v)}>
            <option value="">Todos</option>
            {(options.clientes ?? []).map(c => <option key={c} value={c}>{c}</option>)}
          </SelectWrapper>
        </div>

        {/* Producto Único */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#6B7381] mb-1 overflow-hidden">
            <Package className="w-3 h-3 text-[#993935] flex-shrink-0" />
            <span className="truncate">Producto Único</span>
          </label>
          <SelectWrapper value={filters.producto} onChange={v => set('producto', v)}>
            <option value="">Todos</option>
            {(options.productos ?? []).map(p => <option key={p} value={p}>{p}</option>)}
          </SelectWrapper>
        </div>

        {/* Período */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#6B7381] mb-1 overflow-hidden">
            <CalendarDays className="w-3 h-3 text-[#993935] flex-shrink-0" />
            <span className="truncate">Período</span>
          </label>
          <PeriodPicker
            value={filters.periodo}
            periodos={options.periodos ?? []}
            onChange={v => set('periodo', v)}
          />
        </div>
      </div>

      {/* Chips + clear */}
      {hasActive && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#DBE2EB]">
          {filters.consultor && (
            <Chip label={`Consultor: ${filters.consultor}`} onRemove={() => set('consultor', '')} />
          )}
          {filters.cliente && (
            <Chip label={`Cliente: ${filters.cliente}`} onRemove={() => set('cliente', '')} />
          )}
          {filters.producto && (
            <Chip label={`Producto: ${filters.producto}`} onRemove={() => set('producto', '')} />
          )}
          {filters.periodo && (
            <Chip label={`Período: ${periodoLabel(filters.periodo)}`} onRemove={() => set('periodo', '')} />
          )}
          <button
            onClick={() => onChange(empty)}
            className="ml-auto flex items-center gap-1.5 text-xs text-[#EB5852] hover:text-[#c0392b] transition-colors py-1 px-2 rounded-[6px] hover:bg-[#EB5852]/10"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}

function SelectWrapper({
  value, onChange, children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none text-sm text-[#2B2E35] bg-[#EFF2F6] border border-[#CCCCCC] rounded-[6px] pl-3 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-[#993935] focus:border-[#993935] transition-colors cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7381]" />
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#993935]/10 text-[#993935] text-xs font-medium px-2 py-0.5 rounded-[999px]">
      {label}
      <button onClick={onRemove} className="hover:text-[#7a2e2b] ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
