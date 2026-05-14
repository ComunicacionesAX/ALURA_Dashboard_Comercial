import type { RawRow } from './sheetsClient';
import type {
  DashboardData, KPIMetric, VentaPorZona, VentaPorProducto,
  ClientePareto, ClienteSinMovimiento, ClienteNuevo, ResumenMensual,
} from './types';

const MESES_ORD: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
};
const MES_LABEL: Record<string, string> = {
  ene: 'Enero', feb: 'Febrero', mar: 'Marzo', abr: 'Abril',
  may: 'Mayo', jun: 'Junio', jul: 'Julio', ago: 'Agosto',
  sep: 'Septiembre', oct: 'Octubre', nov: 'Noviembre', dic: 'Diciembre',
};

const EQUIPOS_VALIDOS = new Set(['Porcicultura', 'Avicultura', 'Plantas ABA']);

function n(v: unknown): number {
  const x = Number(v);
  return isNaN(x) ? 0 : x;
}

const money = (v: unknown) => n(v) * 1_000_000;

function kpi(
  label: string, value: number, prev: number,
  unit: KPIMetric['unit'], format: KPIMetric['format'] = 'compact'
): KPIMetric {
  return { label, value, previousValue: prev, unit, format };
}

function excelSerialToDate(serial: number): string {
  if (!serial || serial < 1) return '';
  return new Date((serial - 25569) * 86400 * 1000).toISOString().slice(0, 10);
}

function isComercial(r: RawRow): boolean {
  const consultor = String(r['Consultor_Cliente'] ?? '').trim();
  const producto  = String(r['Producto Único']    ?? '').trim();
  const equipo    = String(r['Equipo_Actual']      ?? '').trim();
  const tieneConsultor = consultor !== '' && consultor !== 'ALIADOS' && consultor !== '-';
  return tieneConsultor || producto === 'Accuremax' || EQUIPOS_VALIDOS.has(equipo);
}

export function transformComercial(rows: RawRow[]): Partial<DashboardData> {
  // ── Single pass: split + filter + collect years ───────────────────────────
  const erp: RawRow[] = [];
  const pptoFiltered: RawRow[] = [];
  const yearSet = new Set<number>();

  for (const r of rows) {
    if (r['Es_Ppto'] === 'Es ERP') {
      if (isComercial(r)) {
        erp.push(r);
        const y = n(r['Año']);
        if (y > 2000) yearSet.add(y);
      }
    } else if (r['Es_Ppto'] === 'Es Ppto' && isComercial(r)) {
      pptoFiltered.push(r);
    }
  }

  const years = [...yearSet].sort((a, b) => b - a);
  const curYear  = years[0] ?? new Date().getFullYear();
  const prevYear = years[1] ?? curYear - 1;

  // ── Single pass over erp: collect periods + client history + resumen ──────
  const periodSet = new Set<number>();
  const clientesPrevYear   = new Set<string>();
  const clientesCurYear    = new Set<string>();
  const clientesPreCurYear = new Set<string>();
  const ultimaVentaMap     = new Map<string, number>();
  const ventaAnual2025Map  = new Map<string, number>();
  const primerPeriodoMap   = new Map<string, { periodo: number; venta: number }>();
  const mesVentaMap = new Map<string, { ord: number; ventaTotal: number }>();

  for (const r of erp) {
    const year    = n(r['Año']);
    const venta   = money(r['Venta']);
    const period  = n(r['Periodo']);
    const cliente = String(r['Cliente']);
    const mes     = String(r['Mes']).toLowerCase();

    if (year === curYear && venta > 0) periodSet.add(period);

    if (venta > 0) {
      if (year < curYear)    clientesPreCurYear.add(cliente);
      if (year === prevYear) clientesPrevYear.add(cliente);
      if (year === curYear)  clientesCurYear.add(cliente);
    }

    if (year === prevYear && venta > 0) {
      if (!ultimaVentaMap.has(cliente) || period > ultimaVentaMap.get(cliente)!) {
        ultimaVentaMap.set(cliente, period);
      }
      ventaAnual2025Map.set(cliente, (ventaAnual2025Map.get(cliente) ?? 0) + venta);
    }

    if (year === curYear) {
      const label = MES_LABEL[mes] ?? mes;
      if (!mesVentaMap.has(label)) mesVentaMap.set(label, { ord: MESES_ORD[mes] ?? 99, ventaTotal: 0 });
      mesVentaMap.get(label)!.ventaTotal += venta;
    }
  }

  const periodosCur = [...periodSet].sort((a, b) => b - a);
  const ultimoPeriodo    = periodosCur[0] ?? 0;
  const penultimoPeriodo = periodosCur[1] ?? 0;

  // ── Single pass over erp: cur/prev totals + zona/prod/pareto maps ─────────
  let ventaCur = 0, ventaPrev = 0;
  const clientesUltimoMes = new Set<string>();
  let mesCur = '';
  const consultorMap = new Map<string, { venta: number; ppto: number; clientes: Set<string> }>();
  const prodMap      = new Map<string, { venta: number; ppto: number; material: string }>();
  const clienteVentaMap = new Map<string, { zona: string; venta: number }>();

  for (const r of erp) {
    const period  = n(r['Periodo']);
    const venta   = money(r['Venta']);
    const cliente = String(r['Cliente']);

    if (period === ultimoPeriodo) {
      ventaCur += venta;
      if (venta > 0) clientesUltimoMes.add(cliente);
      if (!mesCur) mesCur = String(r['Mes'] ?? '').toLowerCase();

      const consultor = String(r['Consultor_Cliente'] || r['Consultor_Actual'] || '-');
      if (!consultorMap.has(consultor)) consultorMap.set(consultor, { venta: 0, ppto: 0, clientes: new Set() });
      const c = consultorMap.get(consultor)!;
      c.venta += venta;
      c.clientes.add(cliente);

      const prod = String(r['Producto Único'] || 'Otros');
      if (!prodMap.has(prod)) prodMap.set(prod, { venta: 0, ppto: 0, material: String(r['Material'] || '') });
      prodMap.get(prod)!.venta += venta;

      if (venta > 0) {
        if (!clienteVentaMap.has(cliente)) clienteVentaMap.set(cliente, { zona: String(r['Consultor_Cliente'] || '-'), venta: 0 });
        clienteVentaMap.get(cliente)!.venta += venta;
      }
    } else if (period === penultimoPeriodo) {
      ventaPrev += venta;
    }
  }

  // ── Single pass over pptoFiltered: ppto totals + zona/prod/resumen ────────
  let pptoCur = 0, pptoPrev = 0;
  const mesPptoMap = new Map<string, number>();

  for (const r of pptoFiltered) {
    const year = n(r['Año']);
    const ppto = money(r['Ppto']);
    const mes  = String(r['Mes']).toLowerCase();

    if (year === curYear) {
      const label = MES_LABEL[mes] ?? mes;
      mesPptoMap.set(label, (mesPptoMap.get(label) ?? 0) + ppto);

      if (mes === mesCur) {
        pptoCur += ppto;

        const consultor = String(r['Consultor_Cliente'] || r['Consultor_Actual'] || '-');
        if (!consultorMap.has(consultor)) consultorMap.set(consultor, { venta: 0, ppto: 0, clientes: new Set() });
        consultorMap.get(consultor)!.ppto += ppto;

        const prod = String(r['Producto Único'] || 'Otros');
        if (!prodMap.has(prod)) prodMap.set(prod, { venta: 0, ppto: 0, material: String(r['Material'] || '') });
        prodMap.get(prod)!.ppto += ppto;
      }
    } else if (year === prevYear && mes === mesCur) {
      pptoPrev += ppto;
    }
  }

  const cumplimientoCur  = pptoCur  > 0 ? (ventaCur  / pptoCur)  * 100 : 0;
  const cumplimientoPrev = pptoPrev > 0 ? (ventaPrev / pptoPrev) * 100 : 0;

  // ── Clientes sin movimiento ───────────────────────────────────────────────
  const sinMovimientoList = [...clientesPrevYear].filter(c => !clientesUltimoMes.has(c));
  const refDate = ultimoPeriodo > 0 ? new Date((ultimoPeriodo - 25569) * 86400 * 1000) : new Date();

  const clientesSinMovimiento: ClienteSinMovimiento[] = sinMovimientoList
    .map((c, i) => {
      const lastSerial = ultimaVentaMap.get(c) ?? 0;
      const lastDate   = lastSerial > 0 ? new Date((lastSerial - 25569) * 86400 * 1000) : new Date();
      const dias = Math.max(0, Math.round((refDate.getTime() - lastDate.getTime()) / 86400000));
      const zonaRow = erp.find(r => r['Cliente'] === c);
      return {
        id: String(i + 1),
        nombre: c,
        zona: String(zonaRow?.['Consultor_Cliente'] ?? '-'),
        diasSinCompra: dias,
        ultimaCompra: lastDate.toISOString().slice(0, 10),
        potencial: Math.round((ventaAnual2025Map.get(c) ?? 0) / 12),
      };
    })
    .sort((a, b) => b.diasSinCompra - a.diasSinCompra);

  // ── Clientes nuevos ───────────────────────────────────────────────────────
  const nuevos2026 = [...clientesCurYear].filter(c => !clientesPreCurYear.has(c));

  for (const r of erp) {
    if (n(r['Año']) !== curYear || money(r['Venta']) <= 0) continue;
    const c = String(r['Cliente']);
    if (!nuevos2026.includes(c)) continue;
    const p = n(r['Periodo']);
    const existing = primerPeriodoMap.get(c);
    if (!existing || p < existing.periodo) primerPeriodoMap.set(c, { periodo: p, venta: money(r['Venta']) });
  }

  const clientesNuevos: ClienteNuevo[] = nuevos2026.map((c, i) => {
    const info = primerPeriodoMap.get(c);
    const zonaRow = erp.find(r => r['Cliente'] === c);
    return {
      id: String(i + 1),
      nombre: c,
      zona: String(zonaRow?.['Consultor_Cliente'] ?? '-'),
      fechaCreacion: info ? excelSerialToDate(info.periodo) : '',
      primeraCompra: info?.venta ?? 0,
    };
  }).sort((a, b) => b.primeraCompra - a.primeraCompra);

  // ── Build output arrays ───────────────────────────────────────────────────
  const ventasPorZona: VentaPorZona[] = [...consultorMap.entries()]
    .map(([zona, z]) => ({
      zona,
      venta: z.venta,
      presupuesto: z.ppto,
      cumplimiento: z.ppto > 0 ? (z.venta / z.ppto) * 100 : 0,
      margen: 0,
      clientsCount: z.clientes.size,
    }))
    .filter(z => z.venta > 0 || z.presupuesto > 0)
    .sort((a, b) => b.venta - a.venta);

  const ventasPorProducto: VentaPorProducto[] = [...prodMap.entries()]
    .map(([producto, p]) => ({
      producto,
      presentacion: p.material,
      venta: p.venta,
      presupuesto: p.ppto,
      cumplimiento: p.ppto > 0 ? (p.venta / p.ppto) * 100 : 0,
      margen: 0,
      categoria: 'B' as const,
    }))
    .filter(p => p.venta > 0 || p.presupuesto > 0)
    .sort((a, b) => b.venta - a.venta);

  const clientesPareto: ClientePareto[] = [...clienteVentaMap.entries()]
    .map(([nombre, c]) => ({
      nombre,
      zona: c.zona,
      venta: c.venta,
      porcentaje: ventaCur > 0 ? (c.venta / ventaCur) * 100 : 0,
      diasSinCompra: 0,
    }))
    .sort((a, b) => b.venta - a.venta)
    .slice(0, 20);

  const resumenMensual: ResumenMensual[] = [...new Set([...mesVentaMap.keys(), ...mesPptoMap.keys()])]
    .map(mes => {
      const v = mesVentaMap.get(mes) ?? { ord: 99, ventaTotal: 0 };
      return {
        mes,
        _ord: v.ord,
        ventaTotal: v.ventaTotal,
        ventaPresupuesto: mesPptoMap.get(mes) ?? 0,
        margenBruto: 0,
        otif: 0, clientesNuevos: 0, clientesSinMovimiento: 0, quejas: 0, notasCredito: 0,
      };
    })
    .sort((a, b) => (a as any)._ord - (b as any)._ord)
    .map(({ _ord: _, ...rest }) => rest as ResumenMensual);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis: DashboardData['kpis'] = {
    ventaMes:              kpi('Venta del mes',                      ventaCur,              ventaPrev,       'currency',   'compact'),
    margenBruto:           kpi('Cumplimiento Ppto',                  cumplimientoCur,       cumplimientoPrev,'percentage', 'full'),
    otif:                  kpi('OTIF',                               82,                    80,              'percentage', 'full'),
    clientesSinMovimiento: kpi('Clientes sin movimiento (+30 días)', sinMovimientoList.length, 0,             'number',     'full'),
    clientesNuevos:        kpi('Clientes nuevos',                    nuevos2026.length,     0,               'number',     'full'),
    quejas:                kpi('Quejas',                             0,                     0,               'number',     'full'),
    notasCredito:          kpi('Notas crédito',                      0,                     0,               'currency',   'compact'),
    alertasInventario:     kpi('Alertas inventario',                 0,                     0,               'number',     'full'),
  };

  return {
    kpis,
    ventasPorZona,
    ventasPorProducto,
    clientesPareto,
    clientesSinMovimiento,
    clientesNuevos,
    resumenMensual,
    quejas: [], notasCredito: [], alertas: [],
    gastosPorZona: [], inventario: [], inventarioPorProducto: [], reglasPromesa: [],
  };
}
