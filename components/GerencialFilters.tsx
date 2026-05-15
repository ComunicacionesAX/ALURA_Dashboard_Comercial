'use client';

import { GerencialFilters, GerencialFilterOptions } from '@/lib/types';
import { Building2, BarChart2, Layers, CalendarDays, UserCircle2, Users, X } from 'lucide-react';
import PeriodPicker, { periodoLabel } from './PeriodPicker';
import { SingleSelect } from './FilterSelect';

interface Props {
  filters: GerencialFilters;
  options: GerencialFilterOptions;
  onChange: (f: GerencialFilters) => void;
}

const empty: GerencialFilters = { sociedad: '', sbu: '', division: '', periodo: '', consultor: '', cliente: '' };

export default function GerencialFiltersPanel({ filters, options, onChange }: Props) {
  const set = (key: keyof GerencialFilters, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasActive = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white rounded-[8px] border border-[#DBE2EB] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

        {/* Sociedad */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#6B7381] mb-1">
            <Building2 className="w-3 h-3 text-[#993935] flex-shrink-0" />
            <span className="truncate">Sociedad</span>
          </label>
          <SingleSelect
            value={filters.sociedad}
            options={options.sociedades ?? []}
            placeholder="Todas"
            onChange={v => set('sociedad', v)}
          />
        </div>

        {/* UEN */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#6B7381] mb-1">
            <BarChart2 className="w-3 h-3 text-[#993935] flex-shrink-0" />
            <span className="truncate">UEN (Unidad Estratégica de Negocio)</span>
          </label>
          <SingleSelect
            value={filters.sbu}
            options={options.sbus ?? []}
            placeholder="Todos"
            onChange={v => set('sbu', v)}
          />
        </div>

        {/* División */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#6B7381] mb-1">
            <Layers className="w-3 h-3 text-[#993935] flex-shrink-0" />
            <span className="truncate">División</span>
          </label>
          <SingleSelect
            value={filters.division}
            options={options.divisiones ?? []}
            onChange={v => set('division', v)}
          />
        </div>

        {/* Período */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#6B7381] mb-1">
            <CalendarDays className="w-3 h-3 text-[#993935] flex-shrink-0" />
            <span className="truncate">Período</span>
          </label>
          <PeriodPicker
            value={filters.periodo}
            periodos={options.periodos ?? []}
            onChange={v => set('periodo', v)}
          />
        </div>

        {/* Consultor */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#6B7381] mb-1">
            <UserCircle2 className="w-3 h-3 text-[#993935] flex-shrink-0" />
            <span className="truncate">Consultor</span>
          </label>
          <SingleSelect
            value={filters.consultor}
            options={options.consultores ?? []}
            onChange={v => set('consultor', v)}
          />
        </div>

        {/* Cliente */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#6B7381] mb-1">
            <Users className="w-3 h-3 text-[#993935] flex-shrink-0" />
            <span className="truncate">Cliente</span>
          </label>
          <SingleSelect
            value={filters.cliente}
            options={options.clientes ?? []}
            onChange={v => set('cliente', v)}
          />
        </div>
      </div>

      {/* Active filter chips */}
      {hasActive && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#DBE2EB]">
          {filters.sociedad && (
            <Chip label={`Sociedad: ${filters.sociedad}`} onRemove={() => set('sociedad', '')} />
          )}
          {filters.sbu && (
            <Chip label={`UEN: ${filters.sbu}`} onRemove={() => set('sbu', '')} />
          )}
          {filters.division && (
            <Chip label={`División: ${filters.division}`} onRemove={() => set('division', '')} />
          )}
          {filters.periodo && (
            <Chip label={`Período: ${periodoLabel(filters.periodo)}`} onRemove={() => set('periodo', '')} />
          )}
          {filters.consultor && (
            <Chip label={`Consultor: ${filters.consultor}`} onRemove={() => set('consultor', '')} />
          )}
          {filters.cliente && (
            <Chip label={`Cliente: ${filters.cliente}`} onRemove={() => set('cliente', '')} />
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
