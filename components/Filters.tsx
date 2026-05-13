'use client';

import { FilterState } from '@/lib/types';
import { zonas, productos, presentaciones } from '@/lib/mockData';
import { Calendar, MapPin, Package, Box, Users } from 'lucide-react';

interface FiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export default function Filters({ filters, onFilterChange }: FiltersProps) {
  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
            <Calendar className="w-3 h-3" />
            Fecha
          </label>
          <select
            value={filters.fecha}
            onChange={(e) => handleChange('fecha', e.target.value)}
            className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#702b2b]"
          >
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="trimestre">Este trimestre</option>
            <option value="año">Este año</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
            <MapPin className="w-3 h-3" />
            Zona
          </label>
          <select
            value={filters.zona}
            onChange={(e) => handleChange('zona', e.target.value)}
            className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#702b2b]"
          >
            {zonas.map((zona) => (
              <option key={zona} value={zona}>{zona}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
            <Package className="w-3 h-3" />
            Producto
          </label>
          <select
            value={filters.producto}
            onChange={(e) => handleChange('producto', e.target.value)}
            className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#702b2b]"
          >
            {productos.map((producto) => (
              <option key={producto} value={producto}>{producto}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
            <Box className="w-3 h-3" />
            Presentación
          </label>
          <select
            value={filters.presentacion}
            onChange={(e) => handleChange('presentacion', e.target.value)}
            className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#702b2b]"
          >
            {presentaciones.map((presentacion) => (
              <option key={presentacion} value={presentacion}>{presentacion}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-1">
            <Users className="w-3 h-3" />
            Cliente
          </label>
          <input
            type="text"
            value={filters.cliente}
            onChange={(e) => handleChange('cliente', e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full text-sm text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#702b2b]"
          />
        </div>
      </div>
    </div>
  );
}