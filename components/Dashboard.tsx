'use client';

import { useState } from 'react';
import { DashboardData, FilterState, UserRole } from '@/lib/types';
import { mockData } from '@/lib/mockData';
import KPICard from './KPICard';
import Filters from './Filters';
import SalesChart from './SalesChart';
import Alerts from './Alerts';
import InventoryTable from './InventoryTable';
import ClientsTable from './ClientsTable';
import ViewToggle from './ViewToggle';
import ChatBot from './ChatBot';
import Image from 'next/image';
import { TrendingUp, Package, AlertCircle, Users } from 'lucide-react';

interface DashboardProps {
  data?: DashboardData;
}

export default function Dashboard({ data = mockData }: DashboardProps) {
  const [filters, setFilters] = useState<FilterState>({
    fecha: 'mes',
    zona: 'Todas',
    producto: 'Todos',
    presentacion: 'Todas',
    cliente: '',
  });

  const [currentView, setCurrentView] = useState<UserRole>('gerencial');

  const filteredVentasPorZona = filters.zona === 'Todas' 
    ? data.ventasPorZona 
    : data.ventasPorZona.filter(z => z.zona === filters.zona);

  const filteredVentasPorProducto = (filters.producto === 'Todos' 
    ? data.ventasPorProducto 
    : data.ventasPorProducto.filter(p => p.producto === filters.producto)
  ).filter(p => filters.presentacion === 'Todas' || p.presentacion === filters.presentacion);

  const filteredClientesPareto = (filters.zona === 'Todas' 
    ? data.clientesPareto 
    : data.clientesPareto.filter(c => c.zona === filters.zona)
  ).filter(c => filters.cliente === '' || c.nombre.toLowerCase().includes(filters.cliente.toLowerCase()));

  const filteredClientesSinMovimiento = filters.zona === 'Todas' 
    ? data.clientesSinMovimiento 
    : data.clientesSinMovimiento.filter(c => c.zona === filters.zona);

  const filteredClientesNuevos = filters.zona === 'Todas' 
    ? data.clientesNuevos 
    : data.clientesNuevos.filter(c => c.zona === filters.zona);

  const filteredGastosPorZona = filters.zona === 'Todas' 
    ? data.gastosPorZona 
    : data.gastosPorZona.filter(g => g.zona === filters.zona);

  const filteredAlertas = data.alertas.filter(a => 
    filters.zona === 'Todas' || (a.zona === filters.zona || !a.zona)
  );

  const renderMargen = (margen: number) => {
    if (currentView === 'consultor') {
      if (margen >= 30) return 'A';
      if (margen >= 25) return 'B';
      if (margen >= 20) return 'C';
      return 'D';
    }
    return `${margen.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#702b2b] to-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image 
                src="https://latam.alura.bio/wp-content/uploads/2024/01/logo.svg"
                alt="Alura"
                width={100}
                height={35}
                className="h-8 w-auto"
              />
              <div className="hidden md:block border-l border-white/30 pl-3 ml-1">
                <h1 className="text-lg font-bold text-white drop-shadow-md">Dashboard Comercial CTC</h1>
                <p className="text-xs text-white/80">Iluma Alliance</p>
              </div>
            </div>
            <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Filters filters={filters} onFilterChange={setFilters} />

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            KPIs Principales
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <KPICard metric={data.kpis.ventaMes} />
            <KPICard metric={data.kpis.margenBruto} />
            <KPICard metric={data.kpis.otif} />
            <KPICard metric={data.kpis.clientesSinMovimiento} />
            <KPICard metric={data.kpis.clientesNuevos} />
            <KPICard metric={data.kpis.quejas} />
            <KPICard metric={data.kpis.notasCredito} />
            <KPICard metric={data.kpis.alertasInventario} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesChart data={filteredVentasPorZona} />
          </div>
          <div>
            <Alertas alertas={filteredAlertas} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Ventas por Producto (Pareto)
            </h3>
            <div className="space-y-3">
              {filteredVentasPorProducto.slice(0, 6).map((producto, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{producto.producto}</p>
                    <p className="text-xs text-gray-500">{producto.presentacion}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${(producto.venta / 1000000000).toFixed(1)}M
                      </p>
                      <p className={`text-xs ${producto.cumplimiento >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {producto.cumplimiento.toFixed(1)}%
                      </p>
                    </div>
                    <span className={`text-sm font-bold px-2 py-1 rounded ${
                      producto.categoria === 'A' ? 'bg-green-100 text-green-800' :
                      producto.categoria === 'B' ? 'bg-blue-100 text-blue-800' :
                      producto.categoria === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentView === 'consultor' ? renderMargen(producto.margen) : `${producto.margen.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clientes Pareto (80/20)
            </h3>
            <div className="space-y-3">
              {filteredClientesPareto.slice(0, 6).map((cliente, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{cliente.nombre}</p>
                    <p className="text-xs text-gray-500">{cliente.zona}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${(cliente.venta / 1000000).toFixed(0)}M
                    </p>
                    <p className="text-xs text-gray-500">{cliente.porcentaje.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ClientsTable tipo="sin-movimiento" clientes={filteredClientesSinMovimiento} />
        
        <ClientsTable tipo="nuevos" clientes={filteredClientesNuevos} />

        <InventoryTable inventario={data.inventario} />

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Gastos por Zona</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">Zona</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">Gasto</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">Presupuesto</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-600">Variación</th>
                </tr>
              </thead>
              <tbody>
                {filteredGastosPorZona.map((gasto, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium text-gray-900">{gasto.zona}</td>
                    <td className="py-2 px-2 text-right text-gray-900">
                      ${(gasto.gasto / 1000000).toFixed(0)}M
                    </td>
                    <td className="py-2 px-2 text-right text-gray-600">
                      ${(gasto.presupuesto / 1000000).toFixed(0)}M
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        gasto.variacion > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {gasto.variacion > 0 ? '+' : ''}{gasto.variacion.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <ChatBot />
    </div>
  );
}

function Alertas({ alertas }: { alertas: any[] }) {
  return <Alerts alertas={alertas} />;
}