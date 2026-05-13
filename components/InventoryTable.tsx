'use client';

import { Bodega } from '@/lib/types';
import { Warehouse } from 'lucide-react';

interface InventoryTableProps {
  inventario: Bodega[];
}

const estadoColors = {
  alto: 'bg-green-100 text-green-800',
  medio: 'bg-yellow-100 text-yellow-800',
  bajo: 'bg-red-100 text-red-800',
};

export default function InventoryTable({ inventario }: InventoryTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Warehouse className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-800">Inventario por Bodega</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-medium text-gray-600">Bodega</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600">Ubicación</th>
              <th className="text-right py-2 px-2 font-medium text-gray-600">Stock Premix (kg)</th>
              <th className="text-right py-2 px-2 font-medium text-gray-600">Stock Solubles (kg)</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Utilización</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody>
            {inventario.map((bodega) => (
              <tr key={bodega.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-2 font-medium text-gray-900">{bodega.nombre}</td>
                <td className="py-2 px-2 text-gray-600">{bodega.ubicacion}</td>
                <td className="py-2 px-2 text-right text-gray-900">
                  {bodega.stockPremix >= 1000 
                    ? `${(bodega.stockPremix / 1000).toFixed(0)} ton` 
                    : `${bodega.stockPremix} kg`}
                </td>
                <td className="py-2 px-2 text-right text-gray-900">{bodega.stockSolubles.toLocaleString('es-CO')} kg</td>
                <td className="py-2 px-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${bodega.utilizacion >= 90 ? 'bg-red-500' : bodega.utilizacion >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${bodega.utilizacion}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{bodega.utilizacion}%</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${estadoColors[bodega.estado]}`}>
                    {bodega.estado.charAt(0).toUpperCase() + bodega.estado.slice(1)}
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