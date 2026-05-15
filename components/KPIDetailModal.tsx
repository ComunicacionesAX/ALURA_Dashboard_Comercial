'use client';

import { KPIMetric, OTIFCausalPorMes } from '@/lib/types';
import { X, TrendingUp, TrendingDown, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

interface KPIDetailModalProps {
  metric: KPIMetric | null;
  onClose: () => void;
  historicalData?: Array<{ mes: string; valor: number }>;
  otifCausalPorMes?: OTIFCausalPorMes[];
}

export default function KPIDetailModal({ metric, onClose, historicalData, otifCausalPorMes }: KPIDetailModalProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const defaultMes = otifCausalPorMes && otifCausalPorMes.length > 0
    ? otifCausalPorMes[otifCausalPorMes.length - 1].mes
    : historicalData && historicalData.length > 0
    ? historicalData[historicalData.length - 1].mes
    : 'Mayo';
  const [selectedMesOtif, setSelectedMesOtif] = useState<string>(defaultMes);

  if (!metric) return null;

  const mockHistoricalData = historicalData || [
    { mes: 'Enero', valor: metric.previousValue * 0.95 },
    { mes: 'Febrero', valor: metric.previousValue * 0.98 },
    { mes: 'Marzo', valor: metric.previousValue },
    { mes: 'Abril', valor: metric.value * 0.95 },
    { mes: 'Mayo', valor: metric.value },
  ];

  const isOtifMetric     = metric.label === 'OTIF';
  const isUtilidadMetric = metric.label.includes('Utilidad');
  const isVentaAnio      = metric.label === 'Venta año';
  let displayValue = metric.value;
  let displayPreviousValue = metric.previousValue;
  let displayChange = 0;
  let displayIsPositive = true;

  if (isOtifMetric) {
    const selectedMonthData = mockHistoricalData.find(d => d.mes === selectedMesOtif);
    displayValue = selectedMonthData?.valor ?? metric.value;

    const selectedIndex = mockHistoricalData.findIndex(d => d.mes === selectedMesOtif);
    displayPreviousValue = selectedIndex > 0 ? mockHistoricalData[selectedIndex - 1].valor : 0;

    displayChange = displayPreviousValue !== 0
      ? ((displayValue - displayPreviousValue) / displayPreviousValue) * 100
      : 0;
    displayIsPositive = displayChange >= 0;
  } else {
    const change = metric.previousValue !== 0
      ? ((metric.value - metric.previousValue) / metric.previousValue) * 100
      : 0;
    displayChange = change;
    displayIsPositive = change >= 0;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[12px] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#993935] to-[#B85150] p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{metric.label}</h2>
            <p className="text-white/80 text-sm">Análisis detallado de estadísticas</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* KPI Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#F5F7FB] rounded-lg p-4 border border-[#DBE2EB]">
              <p className="text-sm text-[#6B7381] mb-2">Valor Actual{isOtifMetric ? ` - ${selectedMesOtif}` : ''}</p>
              <p className="text-3xl font-bold text-[#2B2E35]">
                {metric.unit === 'currency'
                  ? `$${(displayValue / 1_000_000).toFixed(0)}M`
                  : metric.unit === 'percentage'
                  ? `${displayValue.toFixed(1)}%`
                  : displayValue.toFixed(0)
                }
              </p>
            </div>

            <div className="bg-[#F5F7FB] rounded-lg p-4 border border-[#DBE2EB]">
              <p className="text-sm text-[#6B7381] mb-2">
                {isUtilidadMetric || isVentaAnio
                  ? 'Presupuesto'
                  : isOtifMetric
                  ? `Mes Anterior - ${mockHistoricalData[mockHistoricalData.findIndex(d => d.mes === selectedMesOtif) - 1]?.mes || 'N/A'}`
                  : 'Mes Anterior'}
              </p>
              <p className="text-3xl font-bold text-[#2B2E35]">
                {displayPreviousValue === 0 ? (
                  <span className="text-[#8B8B8D] text-lg">Sin mes anterior</span>
                ) : metric.unit === 'currency'
                  ? `$${(displayPreviousValue / 1_000_000).toFixed(0)}M`
                  : metric.unit === 'percentage'
                  ? `${displayPreviousValue.toFixed(1)}%`
                  : displayPreviousValue.toFixed(0)
                }
              </p>
            </div>

            <div className={`rounded-lg p-4 border ${displayIsPositive ? 'bg-[#73DEA9]/10 border-[#73DEA9]' : 'bg-[#EB5852]/10 border-[#EB5852]'}`}>
              <p className="text-sm text-[#6B7381] mb-2">
                {isUtilidadMetric || isVentaAnio
                  ? 'Variación vs Presupuesto'
                  : isOtifMetric
                  ? `Variación vs ${selectedMesOtif === 'Enero' ? 'Anterior' : mockHistoricalData[mockHistoricalData.findIndex(d => d.mes === selectedMesOtif) - 1]?.mes || 'Anterior'}`
                  : 'Variación'}
              </p>
              <div className="flex items-center gap-2">
                {displayIsPositive ? (
                  <TrendingUp className={`w-5 h-5 text-[#73DEA9]`} />
                ) : (
                  <TrendingDown className={`w-5 h-5 text-[#EB5852]`} />
                )}
                <p className={`text-3xl font-bold ${displayIsPositive ? 'text-[#73DEA9]' : 'text-[#EB5852]'}`}>
                  {displayIsPositive ? '+' : ''}{displayChange.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-[#993935] text-white'
                  : 'bg-[#F5F7FB] text-[#2B2E35] border border-[#DBE2EB] hover:bg-[#DBE2EB]'
              }`}
            >
              <LineChartIcon className="w-4 h-4" />
              Línea
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-[#993935] text-white'
                  : 'bg-[#F5F7FB] text-[#2B2E35] border border-[#DBE2EB] hover:bg-[#DBE2EB]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Barras
            </button>
          </div>

          {/* Chart */}
          <div className="bg-[#F5F7FB] rounded-lg p-6 border border-[#DBE2EB]">
            <h3 className="text-sm font-bold text-[#2B2E35] mb-4">Tendencia mensual</h3>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'line' ? (
                <LineChart data={mockHistoricalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DBE2EB" />
                  <XAxis dataKey="mes" stroke="#6B7381" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#6B7381"
                    tick={{ fontSize: 11 }}
                    tickFormatter={metric.unit === 'currency'
                      ? (v) => `$${(v / 1_000_000).toFixed(0)}M`
                      : metric.unit === 'percentage'
                      ? (v) => `${v.toFixed(0)}%`
                      : (v) => String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #DBE2EB', borderRadius: '8px' }}
                    formatter={(value) => {
                      const v = Number(value);
                      const label = metric.unit === 'currency'
                        ? `$${(v / 1_000_000).toFixed(0)}M`
                        : metric.unit === 'percentage'
                        ? `${v.toFixed(1)}%`
                        : String(v);
                      return [label, metric.label];
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#993935"
                    strokeWidth={3}
                    dot={{ fill: '#993935', r: 5 }}
                    activeDot={{ r: 7 }}
                    name={metric.label}
                  />
                </LineChart>
              ) : (
                <BarChart data={mockHistoricalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DBE2EB" />
                  <XAxis dataKey="mes" stroke="#6B7381" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#6B7381"
                    tick={{ fontSize: 11 }}
                    tickFormatter={metric.unit === 'currency'
                      ? (v) => `$${(v / 1_000_000).toFixed(0)}M`
                      : metric.unit === 'percentage'
                      ? (v) => `${v.toFixed(0)}%`
                      : (v) => String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #DBE2EB', borderRadius: '8px' }}
                    formatter={(value) => {
                      const v = Number(value);
                      const label = metric.unit === 'currency'
                        ? `$${(v / 1_000_000).toFixed(0)}M`
                        : metric.unit === 'percentage'
                        ? `${v.toFixed(1)}%`
                        : String(v);
                      return [label, metric.label];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="valor" fill="#993935" radius={[8, 8, 0, 0]} name={metric.label} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Stats - Only show for non-OTIF metrics */}
          {metric.label !== 'OTIF' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const vals = mockHistoricalData.map(d => d.valor);
                const fmt = (v: number) =>
                  metric.unit === 'currency'
                    ? `$${(v / 1_000_000).toFixed(0)}M`
                    : metric.unit === 'percentage'
                    ? `${v.toFixed(1)}%`
                    : v.toFixed(0);
                const sum = vals.reduce((a, b) => a + b, 0);
                return (
                  <>
                    <div className="bg-[#F5F7FB] rounded-lg p-4 border border-[#DBE2EB]">
                      <p className="text-xs text-[#6B7381] mb-1">Máximo</p>
                      <p className="text-lg font-bold text-[#2B2E35]">{fmt(Math.max(...vals))}</p>
                    </div>
                    <div className="bg-[#F5F7FB] rounded-lg p-4 border border-[#DBE2EB]">
                      <p className="text-xs text-[#6B7381] mb-1">Mínimo</p>
                      <p className="text-lg font-bold text-[#2B2E35]">{fmt(Math.min(...vals))}</p>
                    </div>
                    <div className="bg-[#F5F7FB] rounded-lg p-4 border border-[#DBE2EB]">
                      <p className="text-xs text-[#6B7381] mb-1">Promedio</p>
                      <p className="text-lg font-bold text-[#2B2E35]">{fmt(sum / vals.length)}</p>
                    </div>
                    <div className="bg-[#F5F7FB] rounded-lg p-4 border border-[#DBE2EB]">
                      <p className="text-xs text-[#6B7381] mb-1">{metric.unit === 'currency' ? 'Total acum.' : 'Actual'}</p>
                      <p className="text-lg font-bold text-[#2B2E35]">
                        {metric.unit === 'currency' ? fmt(sum) : fmt(vals[vals.length - 1] ?? 0)}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* OTIF Info - Explanation */}
          {metric.label === 'OTIF' && (
            <div className="border-t pt-6 bg-[#F5F7FB] rounded-lg p-4 border border-[#DBE2EB] mb-4">
              <p className="text-sm text-[#2B2E35] mb-2">
                <span className="font-bold">¿Qué es OTIF?</span> On-Time In-Full (Entrega a Tiempo y Completa)
              </p>
              <p className="text-xs text-[#8B8B8D]">
                En {selectedMesOtif}, el {displayValue.toFixed(1)}% de las órdenes se entregaron a tiempo y completas. El {(100 - displayValue).toFixed(1)}% tuvo problemas (ver causales abajo).
              </p>
            </div>
          )}

          {/* OTIF Causales Breakdown */}
          {otifCausalPorMes && otifCausalPorMes.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#2B2E35]">Causales de No Cumplimiento</h3>
                <select
                  value={selectedMesOtif}
                  onChange={(e) => setSelectedMesOtif(e.target.value)}
                  className="text-xs px-3 py-2 border border-[#DBE2EB] rounded-lg bg-white text-[#2B2E35] focus:outline-none focus:border-[#993935]"
                >
                  {otifCausalPorMes.map((mes) => (
                    <option key={mes.mes} value={mes.mes}>
                      {mes.mes}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {otifCausalPorMes
                  .find((m) => m.mes === selectedMesOtif)
                  ?.causales.map((causal, index) => (
                    <div key={`${causal.causal}-${index}`} className="bg-[#F5F7FB] rounded-lg p-3 border border-[#DBE2EB]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-[#2B2E35]">{causal.causal}</p>
                        <span className="text-xs font-semibold text-[#993935] bg-[#993935]/10 px-2 py-1 rounded">
                          {causal.cantidad} casos
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[#8B8B8D]">Impacto económico</p>
                        <p className="text-sm font-bold text-[#2B2E35]">
                          ${(causal.valor / 1_000_000).toFixed(0)}M
                        </p>
                      </div>
                    </div>
                  )) || <p className="text-sm text-[#8B8B8D]">Sin datos para este mes</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
