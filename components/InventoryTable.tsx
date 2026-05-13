'use client';

import { Bodega } from '@/lib/types';
import { Warehouse } from 'lucide-react';

interface InventoryTableProps {
  inventario: Bodega[];
}

const estadoColors = {
  alto: 'bg-[#73DEA9]/10 text-[#2B2E35]',
  medio: 'bg-[#FFA600]/10 text-[#6B4C00]',
  bajo: 'bg-[#EB5852]/10 text-[#EB5852]',
};

const estadoLabel = {
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
};

export default function InventoryTable({ inventario }: InventoryTableProps) {
  return (
    <div className="bg-white rounded-[8px] border border-[#DBE2EB] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
      <div className="flex items-center gap-2 mb-4">
        <Warehouse className="w-4 h-4 text-[#993935]" />
        <h3 className="text-sm font-bold text-[#2B2E35]">Inventario por Bodega</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DBE2EB]">
              <th className="text-left py-2 px-2 font-medium text-[#6B7381]">Bodega</th>
              <th className="text-left py-2 px-2 font-medium text-[#6B7381]">Ubicación</th>
              <th className="text-right py-2 px-2 font-medium text-[#6B7381]">Stock Premix (kg)</th>
              <th className="text-right py-2 px-2 font-medium text-[#6B7381]">Stock Solubles (kg)</th>
              <th className="text-center py-2 px-2 font-medium text-[#6B7381]">Utilización</th>
              <th className="text-center py-2 px-2 font-medium text-[#6B7381]">Estado</th>
            </tr>
          </thead>
          <tbody>
            {inventario.map((bodega) => (
              <tr key={bodega.id} className="border-b border-[#DBE2EB] hover:bg-[#DBE2EB]">
                <td className="py-2 px-2 font-medium text-[#2B2E35]">{bodega.nombre}</td>
                <td className="py-2 px-2 text-[#8B8B8D]">{bodega.ubicacion}</td>
                <td className="py-2 px-2 text-right text-[#2B2E35]">
                  {bodega.stockPremix >= 1000 
                    ? `${(bodega.stockPremix / 1000).toFixed(0)} ton` 
                    : `${bodega.stockPremix} kg`}
                </td>
                <td className="py-2 px-2 text-right text-[#2B2E35]">{bodega.stockSolubles.toLocaleString('es-CO')} kg</td>
                <td className="py-2 px-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-[#DBE2EB] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          bodega.utilizacion >= 90 ? 'bg-[#EB5852]' : 
                          bodega.utilizacion >= 75 ? 'bg-[#FFA600]' : 
                          'bg-[#73DEA9]'
                        }`}
                        style={{ width: `${bodega.utilizacion}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#8B8B8D]">{bodega.utilizacion}%</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center">
                  <span className={`text-xs px-2 py-1 rounded-[999px] ${estadoColors[bodega.estado]}`}>
                    {estadoLabel[bodega.estado]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}