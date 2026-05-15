import path from 'path';
import fs from 'fs';
import { DashboardData, OTIFCausal, OTIFCausalPorMes } from './types';

interface OtifMetric {
  numeroPedidos: number;
  hits: number;
  misses: number;
  otifPercent: number;
}

interface OtifData {
  por_mes: Record<string, Record<string, { cantidad: number; valor: number }>>;
  otifPercentages: Record<string, OtifMetric>;
  causales_totales: string[];
  resumen: {
    total_causales: number;
    meses_procesados: number;
    ultima_actualizacion: string;
  };
}

export function applyLocalOtifOverrides(data: DashboardData): DashboardData {
  try {
    // Try multiple possible paths for otifData.json
    const possiblePaths = [
      path.join(process.cwd(), 'data', 'otifData.json'),
      path.join(__dirname, '..', 'data', 'otifData.json'),
      path.resolve(process.cwd(), 'data', 'otifData.json'),
      '/app/data/otifData.json',  // Para Vercel
      'C:/Users/adesarrollo1/Documents/nuevo-proyecto/ALURA_Dashboard_Comercial/data/otifData.json',  // Desarrollo local
    ];

    let jsonPath = '';
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          jsonPath = p;
          break;
        }
      } catch (e) {
        // Ignorar errores de acceso
      }
    }

    if (!jsonPath) {
      console.warn('otifData.json no encontrado. Rutas probadas:', possiblePaths);
      return data;
    }

    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const otifData = JSON.parse(raw) as OtifData;

    // Get current month (Mayo) OTIF from real data or use default
    const mayoMetric = otifData.otifPercentages['mayo'];
    const otifPercentage = mayoMetric ? mayoMetric.otifPercent : 88.97;

    // Build causales for each month with data, and include all months from otifPercentages
    const causalPorMes: OTIFCausalPorMes[] = [];

    // Process all months from otifPercentages to ensure completeness
    Object.keys(otifData.otifPercentages).forEach((mesKey) => {
      const mesData = otifData.por_mes[mesKey] || {};
      const causales: OTIFCausal[] = Object.entries(mesData)
        .map(([causal, { cantidad, valor }]) => ({
          causal,
          cantidad,
          valor,
        }))
        .sort((a, b) => b.valor - a.valor);

      causalPorMes.push({
        mes: mesKey.charAt(0).toUpperCase() + mesKey.slice(1),
        causales,
      });
    });

    // Update OTIF for each month using real data
    const updatedResumenMensual = data.resumenMensual.map((mes) => {
      const mesKey = mes.mes.toLowerCase();
      const otifMetric = otifData.otifPercentages[mesKey];

      // Use real OTIF if available, otherwise keep existing value
      const mesOtif = otifMetric ? otifMetric.otifPercent : mes.otif;

      return {
        ...mes,
        otif: Math.round(mesOtif * 10) / 10,
      };
    });

    // Find previous month OTIF for comparison
    const mayoIndex = updatedResumenMensual.findIndex(m => m.mes.toLowerCase() === 'mayo');
    const previousOtif = mayoIndex > 0 ? updatedResumenMensual[mayoIndex - 1].otif : 0;

    return {
      ...data,
      kpis: {
        ...data.kpis,
        otif: {
          label: 'OTIF',
          value: Math.round(otifPercentage * 10) / 10,
          previousValue: previousOtif,
          unit: 'percentage',
        },
      },
      resumenMensual: updatedResumenMensual,
      otifCausalPorMes: causalPorMes,
    };
  } catch (err) {
    console.warn('Error cargando OTIF local:', err);
    return data;
  }
}
