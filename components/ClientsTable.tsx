'use client';

import { ClienteSinMovimiento, ClienteNuevo } from '@/lib/types';
import { UserX, UserPlus, ChevronRight } from 'lucide-react';

interface ClientsTableProps {
  tipo: 'sin-movimiento' | 'nuevos';
  clientes: (ClienteSinMovimiento | ClienteNuevo)[];
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

export default function ClientsTable({ tipo, clientes }: ClientsTableProps) {
  const isSinMovimiento = tipo === 'sin-movimiento';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isSinMovimiento ? (
            <UserX className="w-4 h-4 text-red-600" />
          ) : (
            <UserPlus className="w-4 h-4 text-green-600" />
          )}
          <h3 className="text-sm font-semibold text-gray-800">
            {isSinMovimiento ? 'Clientes sin movimiento (+30 días)' : 'Clientes nuevos'}
          </h3>
        </div>
        <span className={`text-sm font-bold ${isSinMovimiento ? 'text-red-600' : 'text-green-600'}`}>
          {clientes.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-medium text-gray-600">Cliente</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600">Zona</th>
              {isSinMovimiento && (
                <>
                  <th className="text-center py-2 px-2 font-medium text-gray-600">Días sin compra</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">Potencial</th>
                </>
              )}
              {!isSinMovimiento && (
                <>
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Fecha creación</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">Primera compra</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-2 font-medium text-gray-900">{cliente.nombre}</td>
                <td className="py-2 px-2 text-gray-600">{cliente.zona}</td>
                {isSinMovimiento && (
                  <>
                    <td className="py-2 px-2 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        (cliente as ClienteSinMovimiento).diasSinCompra > 40 ? 'bg-red-100 text-red-800' :
                        (cliente as ClienteSinMovimiento).diasSinCompra > 35 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(cliente as ClienteSinMovimiento).diasSinCompra}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-gray-900">
                      {formatCurrency((cliente as ClienteSinMovimiento).potencial)}
                    </td>
                  </>
                )}
                {!isSinMovimiento && (
                  <>
                    <td className="py-2 px-2 text-gray-600">{(cliente as ClienteNuevo).fechaCreacion}</td>
                    <td className="py-2 px-2 text-right text-gray-900">
                      {formatCurrency((cliente as ClienteNuevo).primeraCompra)}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}