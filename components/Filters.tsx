'use client';

import { FilterState } from '@/lib/types';
import { presentaciones } from '@/lib/mockData';
import { Calendar, MapPin, Package, Box, Users } from 'lucide-react';

interface FiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  zonas?: string[];
  productos?: string[];
}

export default function Filters({ filters, onFilterChange, zonas: zonasProp, productos: productosProp }: FiltersProps) {
  const zonas = zonasProp ?? ['Todas'];
  const productos = productosProp ?? ['Todos'];
  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-[8px] border border-[#DBE2EB] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-xs font-medium text-[#6B7381] mb-1">
            <Calendar className="w-3 h-3 text-[#993935]" />
            Fecha
          </label>
          <select
            value={filters.fecha}
            onChange={(e) => handleChange('fecha', e.target.value)}
            className="w-full text-sm text-[#2B2E35] bg-[#EFF2F6] border border-[#CCCCCC] rounded-[6px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#993935] focus:border-[#993935] transition-colors"
          >
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="trimestre">Este trimestre</option>
            <option value="año">Este año</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-xs font-medium text-[#6B7381] mb-1">
            <MapPin className="w-3 h-3 text-[#993935]" />
            Zona
          </label>
          <select
            value={filters.zona}
            onChange={(e) => handleChange('zona', e.target.value)}
            className="w-full text-sm text-[#2B2E35] bg-[#EFF2F6] border border-[#CCCCCC] rounded-[6px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#993935] focus:border-[#993935] transition-colors"
          >
            {zonas.map((zona) => (
              <option key={zona} value={zona}>{zona}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-xs font-medium text-[#6B7381] mb-1">
            <Package className="w-3 h-3 text-[#993935]" />
            Producto
          </label>
          <select
            value={filters.producto}
            onChange={(e) => handleChange('producto', e.target.value)}
            className="w-full text-sm text-[#2B2E35] bg-[#EFF2F6] border border-[#CCCCCC] rounded-[6px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#993935] focus:border-[#993935] transition-colors"
          >
            {productos.map((producto) => (
              <option key={producto} value={producto}>{producto}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-xs font-medium text-[#6B7381] mb-1">
            <Box className="w-3 h-3 text-[#993935]" />
            Presentación
          </label>
          <select
            value={filters.presentacion}
            onChange={(e) => handleChange('presentacion', e.target.value)}
            className="w-full text-sm text-[#2B2E35] bg-[#EFF2F6] border border-[#CCCCCC] rounded-[6px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#993935] focus:border-[#993935] transition-colors"
          >
            {presentaciones.map((presentacion) => (
              <option key={presentacion} value={presentacion}>{presentacion}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-xs font-medium text-[#6B7381] mb-1">
            <Users className="w-3 h-3 text-[#993935]" />
            Cliente
          </label>
          <input
            type="text"
            value={filters.cliente}
            onChange={(e) => handleChange('cliente', e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full text-sm text-[#2B2E35] placeholder-[#8B8B8D] bg-[#EFF2F6] border border-[#CCCCCC] rounded-[6px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#993935] focus:border-[#993935] transition-colors"
          />
        </div>
      </div>
    </div>
  );
}