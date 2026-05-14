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

function margenLetra(pct: number): 'A' | 'B' | 'C' | 'D' {
  if (pct >= 30) return 'A';
  if (pct >= 25) return 'B';
  if (pct >= 20) return 'C';
  return 'D';
}

function excelSerialToDate(serial: number): string {
  if (!serial || serial < 1) return '';
  return new Date((serial - 25569) * 86400 * 1000).toISOString().slice(0, 10);
}

export function transformGerencial(rows: RawRow[]): Partial<DashboardData> {
  // ── Single pass: split rows + collect years ───────────────────────────────
  const erp: RawRow[] = [];
  const pptoRows: RawRow[] = [];
  const yearSet = new Set<number>();

  for (const r of rows) {
    if (r['Es_Ppto'] === 'Es ERP') {
      erp.push(r);
      const y = n(r['Año']);
      if (y > 2000) yearSet.add(y);
    } else if (r['Es_Ppto'] === 'Es Ppto') {
      pptoRows.push(r);
    }
  }

  const years = [...yearSet].sort((a, b) => b - a);
  const curYear  = years[0] ?? new Date().getFullYear();
  const prevYear = years[1] ?? curYear - 1;

  // ── Single pass over erp: collect periods + client history + resumen ──────
  const periodSet = new Set<number>();
  // client sets
  const clientesPrevYear  = new Set<string>(); // active in prevYear
  const clientesCurYear   = new Set<string>(); // active in curYear
  const clientesPreCurYear = new Set<string>(); // active before curYear (for "nuevos")
  // maps for clientes sin movimiento
  const ultimaVentaMap     = new Map<string, number>();   // cliente → last period serial (prevYear)
  const ventaAnual2025Map  = new Map<string, number>();   // cliente → total venta prevYear
  // maps for primer periodo nuevos
  const primerPeriodoMap   = new Map<string, { periodo: number; venta: number }>();
  // resumen mensual
  const mesVentaMap = new Map<string, { ord: number; ventaTotal: number; ub: number }>();
  // zona map (will be filled from cur slice later — keep separate for efficiency)
  const zonaMap = new Map<string, { venta: number; ppto: number; ub: number; clientes: Set<string> }>();
  // prod map
  const prodMap = new Map<string, { venta: number; ppto: number; ub: number; material: string }>();
  // cliente venta map (pareto)
  const clienteVentaMap = new Map<string, { zona: string; venta: number }>();

  for (const r of erp) {
    const year   = n(r['Año']);
    const venta  = money(r['Venta']);
    const ub     = money(r['UB']);
    const period = n(r['Periodo']);
    const cliente = String(r['Cliente']);
    const mes    = String(r['Mes']).toLowerCase();

    if (year === curYear && venta > 0) periodSet.add(period);

    // Client history
    if (venta > 0) {
      if (year < curYear)  clientesPreCurYear.add(cliente);
      if (year === prevYear) clientesPrevYear.add(cliente);
      if (year === curYear)  clientesCurYear.add(cliente);
    }

    // ultimaVentaMap + ventaAnual2025Map (single pass, was two)
    if (year === prevYear && venta > 0) {
      if (!ultimaVentaMap.has(cliente) || period > ultimaVentaMap.get(cliente)!) {
        ultimaVentaMap.set(cliente, period);
      }
      ventaAnual2025Map.set(cliente, (ventaAnual2025Map.get(cliente) ?? 0) + venta);
    }

    // Resumen mensual
    if (year === curYear) {
      const label = MES_LABEL[mes] ?? mes;
      if (!mesVentaMap.has(label)) mesVentaMap.set(label, { ord: MESES_ORD[mes] ?? 99, ventaTotal: 0, ub: 0 });
      const m = mesVentaMap.get(label)!;
      m.ventaTotal += venta;
      m.ub         += ub;
    }
  }

  // ── Determine current and previous periods ────────────────────────────────
  const periodosCur = [...periodSet].sort((a, b) => b - a);
  const ultimoPeriodo    = periodosCur[0] ?? 0;
  const penultimoPeriodo = periodosCur[1] ?? 0;

  // ── Single pass: build cur/prev slices + zona/prod/pareto maps ───────────
  let ventaCur = 0, ventaPrev = 0, ubCur = 0, ubPrev = 0;
  const clientesUltimoMes = new Set<string>();
  let mesCur = '';

  for (const r of erp) {
    const period = n(r['Periodo']);
    const venta  = money(r['Venta']);
    const ub     = money(r['UB']);
    const cliente = String(r['Cliente']);

    if (period === ultimoPeriodo) {
      ventaCur += venta;
      ubCur    += ub;
      if (venta > 0) clientesUltimoMes.add(cliente);
      if (!mesCur) mesCur = String(r['Mes'] ?? '').toLowerCase();

      // Zona map
      const zona = String(r['Equipo_Actual'] || '-');
      if (!zonaMap.has(zona)) zonaMap.set(zona, { venta: 0, ppto: 0, ub: 0, clientes: new Set() });
      const z = zonaMap.get(zona)!;
      z.venta += venta;
      z.ub    += ub;
      z.clientes.add(cliente);

      // Prod map
      const prod = String(r['Producto Único'] || 'Otros');
      if (!prodMap.has(prod)) prodMap.set(prod, { venta: 0, ppto: 0, ub: 0, material: String(r['Material'] || '') });
      const p = prodMap.get(prod)!;
      p.venta += venta;
      p.ub    += ub;

      // Pareto
      if (venta > 0) {
        if (!clienteVentaMap.has(cliente)) clienteVentaMap.set(cliente, { zona: String(r['Equipo_Actual'] || '-'), venta: 0 });
        clienteVentaMap.get(cliente)!.venta += venta;
      }
    } else if (period === penultimoPeriodo) {
      ventaPrev += venta;
      ubPrev    += ub;
    }
  }

  const margenCur  = ventaCur  > 0 ? (ubCur  / ventaCur)  * 100 : 0;
  const margenPrev = ventaPrev > 0 ? (ubPrev / ventaPrev) * 100 : 0;

  // ── Single pass over pptoRows: fill zona + prod ppto + resumen ppto ───────
  const mesPptoMap = new Map<string, number>();

  for (const r of pptoRows) {
    const year = n(r['Año']);
    const ppto = money(r['Ppto']);
    const mes  = String(r['Mes']).toLowerCase();

    if (year === curYear) {
      const label = MES_LABEL[mes] ?? mes;
      mesPptoMap.set(label, (mesPptoMap.get(label) ?? 0) + ppto);

      if (mes === mesCur) {
        const zona = String(r['Equipo_Actual'] || '-');
        if (!zonaMap.has(zona)) zonaMap.set(zona, { venta: 0, ppto: 0, ub: 0, clientes: new Set() });
        zonaMap.get(zona)!.ppto += ppto;

        const prod = String(r['Producto Único'] || 'Otros');
        if (!prodMap.has(prod)) prodMap.set(prod, { venta: 0, ppto: 0, ub: 0, material: String(r['Material'] || '') });
        prodMap.get(prod)!.ppto += ppto;
      }
    }
  }

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
        zona: String(zonaRow?.['Equipo_Actual'] ?? '-'),
        diasSinCompra: dias,
        ultimaCompra: lastDate.toISOString().slice(0, 10),
        potencial: Math.round((ventaAnual2025Map.get(c) ?? 0) / 12),
      };
    })
    .sort((a, b) => b.diasSinCompra - a.diasSinCompra);

  // ── Clientes nuevos ───────────────────────────────────────────────────────
  const nuevos2026 = [...clientesCurYear].filter(c => !clientesPreCurYear.has(c));

  // Collect primer periodo for nuevos in one pass (already done above for all curYear)
  // Need separate pass only for nuevos subset
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
      zona: String(zonaRow?.['Equipo_Actual'] ?? '-'),
      fechaCreacion: info ? excelSerialToDate(info.periodo) : '',
      primeraCompra: info?.venta ?? 0,
    };
  }).sort((a, b) => b.primeraCompra - a.primeraCompra);

  // ── Build output arrays ───────────────────────────────────────────────────
  const ventasPorZona: VentaPorZona[] = [...zonaMap.entries()]
    .map(([zona, z]) => ({
      zona,
      venta: z.venta,
      presupuesto: z.ppto,
      cumplimiento: z.ppto > 0 ? (z.venta / z.ppto) * 100 : 0,
      margen: z.venta > 0 ? (z.ub / z.venta) * 100 : 0,
      clientsCount: z.clientes.size,
    }))
    .filter(z => z.venta > 0 || z.presupuesto > 0)
    .sort((a, b) => b.venta - a.venta);

  const ventasPorProducto: VentaPorProducto[] = [...prodMap.entries()]
    .map(([producto, p]) => {
      const margen = p.venta > 0 ? (p.ub / p.venta) * 100 : 0;
      return {
        producto,
        presentacion: p.material,
        venta: p.venta,
        presupuesto: p.ppto,
        cumplimiento: p.ppto > 0 ? (p.venta / p.ppto) * 100 : 0,
        margen,
        categoria: margenLetra(margen),
      };
    })
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
      const v = mesVentaMap.get(mes) ?? { ord: 99, ventaTotal: 0, ub: 0 };
      return {
        mes,
        _ord: v.ord,
        ventaTotal: v.ventaTotal,
        ventaPresupuesto: mesPptoMap.get(mes) ?? 0,
        margenBruto: v.ventaTotal > 0 ? (v.ub / v.ventaTotal) * 100 : 0,
        otif: 0, clientesNuevos: 0, clientesSinMovimiento: 0, quejas: 0, notasCredito: 0,
      };
    })
    .sort((a, b) => (a as any)._ord - (b as any)._ord)
    .map(({ _ord: _, ...rest }) => rest as ResumenMensual);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis: DashboardData['kpis'] = {
    ventaMes:              kpi('Venta del mes',                     ventaCur,              ventaPrev,   'currency',   'compact'),
    margenBruto:           kpi('Margen bruto',                      margenCur,             margenPrev,  'percentage', 'full'),
    otif:                  kpi('OTIF',                              82,                    80,          'percentage', 'full'),
    clientesSinMovimiento: kpi('Clientes sin movimiento (+30 días)', sinMovimientoList.length, 0,        'number',     'full'),
    clientesNuevos:        kpi('Clientes nuevos',                   nuevos2026.length,     0,           'number',     'full'),
    quejas:                kpi('Quejas',                            0,                     0,           'number',     'full'),
    notasCredito:          kpi('Notas crédito',                     0,                     0,           'currency',   'compact'),
    alertasInventario:     kpi('Alertas inventario',                0,                     0,           'number',     'full'),
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
