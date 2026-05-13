export type UserRole = 'gerencial' | 'consultor';

export interface FilterState {
  fecha: string;
  zona: string;
  producto: string;
  presentacion: string;
  cliente: string;
}

export interface KPIMetric {
  label: string;
  value: number;
  previousValue: number;
  unit: 'currency' | 'percentage' | 'number';
  format: 'compact' | 'full';
}

export interface VentaPorZona {
  zona: string;
  venta: number;
  presupuesto: number;
  cumplimiento: number;
  margen: number;
  clientsCount: number;
}

export interface VentaPorProducto {
  producto: string;
  presentacion: string;
  venta: number;
  presupuesto: number;
  cumplimiento: number;
  margen: number;
  categoria: 'A' | 'B' | 'C' | 'D';
}

export interface ClientePareto {
  nombre: string;
  zona: string;
  venta: number;
  porcentaje: number;
  diasSinCompra: number;
}

export interface ClienteSinMovimiento {
  id: string;
  nombre: string;
  zona: string;
  diasSinCompra: number;
  ultimaCompra: string;
  potencial: number;
}

export interface ClienteNuevo {
  id: string;
  nombre: string;
  zona: string;
  fechaCreacion: string;
  primeraCompra: number;
}

export interface Queja {
  id: string;
  cliente: string;
  zona: string;
  tipo: string;
  estado: 'abierta' | 'en_proceso' | 'cerrada';
  fecha: string;
  descripcion: string;
}

export interface NotaCredito {
  id: string;
  cliente: string;
  zona: string;
  valor: number;
  motivo: string;
  fecha: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export interface Bodega {
  id: string;
  nombre: string;
  ubicacion: string;
  zonaPrincipal: string;
  stockPremix: number;
  stockSolubles: number;
  estado: 'alto' | 'medio' | 'bajo';
  capacidad: number;
  utilizacion: number;
}

export interface ProductoInventario {
  producto: string;
  presentacion: string;
  stockTotal: number;
 bodegas: { nombre: string; stock: number }[];
}

export interface Alerta {
  id: string;
  tipo: 'otif' | 'inventario' | 'cliente' | 'margen' | 'queja';
  nivel: 'critica' | 'alta' | 'media';
  titulo: string;
  descripcion: string;
  zona?: string;
  fecha: string;
}

export interface GastoPorZona {
  zona: string;
  gasto: number;
  presupuesto: number;
  variacion: number;
  categoria: string;
}

export interface ResumenMensual {
  mes: string;
  ventaTotal: number;
  ventaPresupuesto: number;
  margenBruto: number;
  otif: number;
  clientesNuevos: number;
  clientesSinMovimiento: number;
  quejas: number;
  notasCredito: number;
}

export interface ReglaPromesa {
  tipo: string;
  descripcion: string;
  condiciones: string[];
}

export interface DashboardData {
  kpis: {
    ventaMes: KPIMetric;
    margenBruto: KPIMetric;
    otif: KPIMetric;
    clientesSinMovimiento: KPIMetric;
    clientesNuevos: KPIMetric;
    quejas: KPIMetric;
    notasCredito: KPIMetric;
    alertasInventario: KPIMetric;
  };
  ventasPorZona: VentaPorZona[];
  ventasPorProducto: VentaPorProducto[];
  clientesPareto: ClientePareto[];
  clientesSinMovimiento: ClienteSinMovimiento[];
  clientesNuevos: ClienteNuevo[];
  quejas: Queja[];
  notasCredito: NotaCredito[];
  inventario: Bodega[];
  inventarioPorProducto: ProductoInventario[];
  alertas: Alerta[];
  gastosPorZona: GastoPorZona[];
  resumenMensual: ResumenMensual[];
  reglasPromesa: ReglaPromesa[];
}