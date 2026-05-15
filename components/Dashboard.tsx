'use client';

import { useState, useEffect, useCallback } from 'react';
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
import DashboardSkeleton from './DashboardSkeleton';
import KPIDetailModal from './KPIDetailModal';
import Image from 'next/image';
import { TrendingUp, Package, Users, RefreshCw, AlertCircle } from 'lucide-react';
import ParetoChart from './ParetoChart';
import ProductDonutChart from './ProductDonutChart';
import AreaTrendChart from './AreaTrendChart';
import PerformanceHeatmap from './PerformanceHeatmap';

// Estructura vacía para estado inicial — no mezcla datos simulados con datos reales
const emptyData: DashboardData = {
  kpis: mockData.kpis,            // placeholder hasta que cargue
  ventasPorZona: [],
  ventasPorProducto: [],
  clientesPareto: [],
  clientesSinMovimiento: [],
  clientesNuevos: [],
  quejas: [],
  notasCredito: [],
  inventario: [],
  inventarioPorProducto: [],
  alertas: [],
  gastosPorZona: [],
  resumenMensual: [],
  reglasPromesa: [],
  otifCausalPorMes: [],
};

function mergeLiveData(live: Partial<DashboardData>): DashboardData {
  return {
    ...emptyData,
    ...live,
    kpis: { ...emptyData.kpis, ...(live.kpis ?? {}) },
  };
}

export default function Dashboard() {
  const [filters, setFilters] = useState<FilterState>({
    fecha: 'mes',
    zona: 'Todas',
    producto: 'Todos',
    presentacion: 'Todas',
    cliente: '',
  });
  const [currentView, setCurrentView] = useState<UserRole>('gerencial');
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedKPI, setSelectedKPI] = useState<typeof data.kpis.ventaMes | null>(null);

  const fetchData = useCallback(async (view: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = view === 'gerencial' ? '/api/data/gerencial' : '/api/data/comercial';
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const live: Partial<DashboardData> = await res.json();
      setData(mergeLiveData(live));
      setLastUpdated(new Date());
    } catch (e) {
      setError('No se pudieron cargar los datos del servidor.');
      setData(emptyData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentView);
  }, [currentView, fetchData]);

  const handleViewChange = (view: UserRole) => {
    setCurrentView(view);
  };

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

  const buildKpiHistory = (metric: typeof data.kpis.ventaMes) => {
    if (!data.resumenMensual || data.resumenMensual.length === 0) return undefined;

    if (metric.label.includes('Venta')) {
      return data.resumenMensual.map(item => ({ mes: item.mes, valor: item.ventaTotal }));
    }
    if (metric.label.includes('Margen')) {
      return data.resumenMensual.map(item => ({ mes: item.mes, valor: item.margenBruto }));
    }
    if (metric.label === 'OTIF') {
      return data.resumenMensual.map(item => ({ mes: item.mes, valor: item.otif }));
    }
    if (metric.label.includes('sin movimiento')) {
      return data.resumenMensual.map(item => ({ mes: item.mes, valor: item.clientesSinMovimiento }));
    }
    if (metric.label.includes('Clientes nuevos')) {
      return data.resumenMensual.map(item => ({ mes: item.mes, valor: item.clientesNuevos }));
    }
    if (metric.label === 'Quejas') {
      return data.resumenMensual.map(item => ({ mes: item.mes, valor: item.quejas }));
    }
    if (metric.label.includes('crédito')) {
      return data.resumenMensual.map(item => ({ mes: item.mes, valor: item.notasCredito }));
    }
    return undefined;
  };

  // Derive dynamic filter options from real data
  const zonaOptions = ['Todas', ...new Set(data.ventasPorZona.map(z => z.zona))];
  const productoOptions = ['Todos', ...new Set(data.ventasPorProducto.map(p => p.producto))];

  return (
    <div className="min-h-screen bg-[#EFF2F6]">
      <header className="bg-[#993935] border-b border-[#CCCCCC] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="https://latam.alura.bio/wp-content/uploads/2024/01/logo.svg"
                alt="Alura"
                width={100}
                height={35}
                className="h-8 w-auto brightness-0 invert"
              />
              <div className="hidden md:block border-l border-white/30 pl-3 ml-1">
                <h1 className="text-lg font-bold text-white">Dashboard Comercial CTC</h1>
                <p className="text-xs text-white/80">Iluma Alliance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-xs text-white/70 hidden md:block">
                  Actualizado: {lastUpdated.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={() => fetchData(currentView)}
                disabled={loading}
                className="p-2 rounded-[6px] text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Refrescar datos"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <ViewToggle currentView={currentView} onViewChange={handleViewChange} />
            </div>
          </div>
        </div>
      </header>

      {loading && !error && <DashboardSkeleton />}

      {error && !loading && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 bg-[#FFA600]/10 border border-[#FFA600] rounded-[8px] px-4 py-3 text-sm text-[#6B4C00]">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#FFA600]" />
            {error}
            <button
              onClick={() => fetchData(currentView)}
              className="ml-auto text-xs font-medium underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      <main className={`max-w-7xl mx-auto px-4 py-6 space-y-6 ${loading ? 'hidden' : ''}`}>

        <Filters
          filters={filters}
          onFilterChange={setFilters}
          zonas={zonaOptions}
          productos={productoOptions}
        />

        <section>
          <h2 className="text-lg font-bold text-[#2B2E35] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#993935]" />
            KPIs Principales
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div onClick={() => setSelectedKPI(data.kpis.ventaMes)} className="cursor-pointer">
              <KPICard metric={data.kpis.ventaMes} />
            </div>
            {currentView === 'gerencial' && (
              <div onClick={() => setSelectedKPI(data.kpis.margenBruto)} className="cursor-pointer">
                <KPICard metric={data.kpis.margenBruto} />
              </div>
            )}
            {currentView === 'consultor' && (
              <div onClick={() => setSelectedKPI({ ...data.kpis.margenBruto, label: 'Cumplimiento Ppto' })} className="cursor-pointer">
                <KPICard metric={{ ...data.kpis.margenBruto, label: 'Cumplimiento Ppto' }} />
              </div>
            )}
            <div onClick={() => setSelectedKPI(data.kpis.otif)} className="cursor-pointer">
              <KPICard metric={data.kpis.otif} />
            </div>
            <div onClick={() => setSelectedKPI(data.kpis.clientesSinMovimiento)} className="cursor-pointer">
              <KPICard metric={data.kpis.clientesSinMovimiento} />
            </div>
            <div onClick={() => setSelectedKPI(data.kpis.clientesNuevos)} className="cursor-pointer">
              <KPICard metric={data.kpis.clientesNuevos} />
            </div>
            <div onClick={() => setSelectedKPI(data.kpis.quejas)} className="cursor-pointer">
              <KPICard metric={data.kpis.quejas} />
            </div>
            <div onClick={() => setSelectedKPI(data.kpis.notasCredito)} className="cursor-pointer">
              <KPICard metric={data.kpis.notasCredito} />
            </div>
            <div onClick={() => setSelectedKPI(data.kpis.alertasInventario)} className="cursor-pointer">
              <KPICard metric={data.kpis.alertasInventario} />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesChart
              data={filteredVentasPorZona}
              chartTitle={currentView === 'consultor' ? 'Venta por Consultor (MM COP)' : 'Venta por Zona / Equipo (MM COP)'}
            />
          </div>
          <div>
            <Alertas alertas={filteredAlertas} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AreaTrendChart
            data={data.resumenMensual}
            title="Tendencia de Ventas vs Presupuesto"
          />
          <PerformanceHeatmap
            data={filteredVentasPorZona}
            title={currentView === 'consultor' ? 'Mapa de Desempeño por Consultor' : 'Mapa de Desempeño por Zona'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ParetoChart
            data={filteredClientesPareto}
            title="Análisis Pareto de Clientes (Top 10)"
          />
          <ProductDonutChart
            data={filteredVentasPorProducto}
            title="Distribución de Ventas por Producto"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-[#DBE2EB] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
            <h3 className="text-sm font-bold text-[#2B2E35] mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#993935]" />
              Top 6 Productos
            </h3>
            {filteredVentasPorProducto.length === 0 ? (
              <p className="text-sm text-[#8B8B8D] text-center py-6">Sin datos para el filtro seleccionado</p>
            ) : (
              <div className="space-y-3">
                {filteredVentasPorProducto.slice(0, 6).map((producto, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-[#DBE2EB] rounded-[6px] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2B2E35] truncate">{producto.producto}</p>
                      <p className="text-xs text-[#8B8B8D] truncate">{producto.presentacion || '—'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#2B2E35]">
                          {producto.venta >= 1e9 ? `$${(producto.venta/1e9).toFixed(2)}Bn` : `$${(producto.venta/1e6).toFixed(0)}M`}
                        </p>
                        <p className={`text-xs ${producto.cumplimiento >= 100 ? 'text-[#73DEA9]' : 'text-[#EB5852]'}`}>
                          {producto.cumplimiento > 0 ? `${producto.cumplimiento.toFixed(1)}%` : '—'}
                        </p>
                      </div>
                      {currentView === 'gerencial' && producto.margen > 0 && (
                        <span className={`text-sm font-bold px-2 py-1 rounded-[6px] ${
                          producto.categoria === 'A' ? 'bg-[#73DEA9]/20 text-[#2B2E35]' :
                          producto.categoria === 'B' ? 'bg-[#82BDFF]/20 text-[#2B2E35]' :
                          producto.categoria === 'C' ? 'bg-[#FFA600]/20 text-[#2B2E35]' :
                          'bg-[#EB5852]/20 text-[#EB5852]'
                        }`}>
                          {renderMargen(producto.margen)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-[#DBE2EB] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
            <h3 className="text-sm font-bold text-[#2B2E35] mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#993935]" />
              Top 6 Clientes
            </h3>
            {filteredClientesPareto.length === 0 ? (
              <p className="text-sm text-[#8B8B8D] text-center py-6">Sin datos para el filtro seleccionado</p>
            ) : (
              <div className="space-y-3">
                {filteredClientesPareto.slice(0, 6).map((cliente, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-[#DBE2EB] rounded-[6px] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2B2E35] truncate">{cliente.nombre}</p>
                      <p className="text-xs text-[#8B8B8D]">{cliente.zona}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#2B2E35]">
                        {cliente.venta >= 1e9 ? `$${(cliente.venta/1e9).toFixed(2)}Bn` : `$${(cliente.venta/1e6).toFixed(0)}M`}
                      </p>
                      <p className="text-xs text-[#8B8B8D]">{cliente.porcentaje.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {(data.clientesSinMovimiento.length > 0 || data.clientesNuevos.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.clientesSinMovimiento.length > 0 && (
              <ClientsTable tipo="sin-movimiento" clientes={filteredClientesSinMovimiento} />
            )}

            {data.clientesNuevos.length > 0 && (
              <ClientsTable tipo="nuevos" clientes={filteredClientesNuevos} />
            )}
          </div>
        )}

        {data.inventario.length > 0 && (
          <InventoryTable inventario={data.inventario} />
        )}

        {currentView === 'gerencial' && filteredGastosPorZona.length > 0 && (
          <div className="bg-white rounded-lg border border-[#DBE2EB] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
            <h3 className="text-sm font-bold text-[#2B2E35] mb-4">Gastos por Zona</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DBE2EB]">
                    <th className="text-left py-2 px-2 font-medium text-[#6B7381]">Zona</th>
                    <th className="text-right py-2 px-2 font-medium text-[#6B7381]">Gasto</th>
                    <th className="text-right py-2 px-2 font-medium text-[#6B7381]">Presupuesto</th>
                    <th className="text-center py-2 px-2 font-medium text-[#6B7381]">Variación</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGastosPorZona.map((gasto, index) => (
                    <tr key={index} className="border-b border-[#DBE2EB] hover:bg-[#DBE2EB]">
                      <td className="py-2 px-2 font-medium text-[#2B2E35]">{gasto.zona}</td>
                      <td className="py-2 px-2 text-right text-[#2B2E35]">
                        ${(gasto.gasto / 1000000).toFixed(0)}M
                      </td>
                      <td className="py-2 px-2 text-right text-[#8B8B8D]">
                        ${(gasto.presupuesto / 1000000).toFixed(0)}M
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`text-xs px-2 py-1 rounded-[999px] ${
                          gasto.variacion > 0 ? 'bg-[#EB5852]/10 text-[#EB5852]' : 'bg-[#73DEA9]/10 text-[#2B2E35]'
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
        )}
      </main>

      <KPIDetailModal
        metric={selectedKPI}
        onClose={() => setSelectedKPI(null)}
        historicalData={selectedKPI ? buildKpiHistory(selectedKPI) : undefined}
        otifCausalPorMes={selectedKPI?.label === 'OTIF' ? data.otifCausalPorMes : undefined}
      />

      <ChatBot data={loading ? null : data} />
    </div>
  );
}

function Alertas({ alertas }: { alertas: DashboardData['alertas'] }) {
  return <Alerts alertas={alertas} />;
}
