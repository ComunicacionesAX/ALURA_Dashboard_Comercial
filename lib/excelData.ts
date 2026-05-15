import path from 'path';
import fs from 'fs';
import { DashboardData } from './types';
import { mockData } from './mockData';
import { applyLocalOtifOverrides } from './otifLocalData';

export async function loadDashboardData(): Promise<DashboardData> {
  const jsonPath = path.join(process.cwd(), 'data', 'dashboardData.json');

  if (!fs.existsSync(jsonPath)) {
    console.warn('dashboardData.json no encontrado — usando datos de ejemplo. Ejecuta: node scripts/buildData.js');
    return mockData;
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const realData = JSON.parse(raw) as DashboardData;

  // Completar con mock los campos no disponibles en Excel
  return applyLocalOtifOverrides({
    ...realData,
    quejas: mockData.quejas,
    notasCredito: mockData.notasCredito,
    inventario: mockData.inventario,
    inventarioPorProducto: mockData.inventarioPorProducto,
    gastosPorZona: mockData.gastosPorZona,
    reglasPromesa: mockData.reglasPromesa,
    alertas: [
      ...realData.alertas,
      ...mockData.alertas.slice(2),
    ],
  });
}
