// 🧾 Configuración del Módulo AFIP
// Configuración centralizada para Web Services de AFIP

export interface AFIPConfig {
  environment: 'testing' | 'production';
  wsaaUrl: string;
  wsfev1Url: string;
}

export const afipConfig: AFIPConfig = {
  environment: (process.env.AFIP_ENVIRONMENT as 'testing' | 'production') || 'testing',
  
  get wsaaUrl() {
    return this.environment === 'production'
      ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
      : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';
  },
  
  get wsfev1Url() {
    return this.environment === 'production'
      ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
      : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx';
  }
};

// Tipos de comprobante AFIP
export enum TipoComprobante {
  FACTURA_A = 1,
  NOTA_DEBITO_A = 2,
  NOTA_CREDITO_A = 3,
  FACTURA_B = 6,
  NOTA_DEBITO_B = 7,
  NOTA_CREDITO_B = 8,
  FACTURA_C = 11,
  NOTA_DEBITO_C = 12,
  NOTA_CREDITO_C = 13,
}

// Tipos de documento
export enum TipoDocumento {
  CUIT = 80,
  CUIL = 86,
  CDI = 87,
  LE = 89,
  LC = 90,
  CI_EXTRANJERA = 91,
  EN_TRAMITE = 92,
  ACTA_NACIMIENTO = 93,
  CI_BS_AS_RNP = 95,
  DNI = 96,
  PASAPORTE = 94,
  CONSUMIDOR_FINAL = 99,
}

// Conceptos
export enum Concepto {
  PRODUCTOS = 1,
  SERVICIOS = 2,
  PRODUCTOS_Y_SERVICIOS = 3,
}

// Tipos de IVA
export enum TipoIVA {
  IVA_0 = 3,
  IVA_10_5 = 4,
  IVA_21 = 5,
  IVA_27 = 6,
  IVA_5 = 8,
  IVA_2_5 = 9,
}

export const TipoComprobanteLabels: Record<TipoComprobante, string> = {
  [TipoComprobante.FACTURA_A]: 'Factura A',
  [TipoComprobante.NOTA_DEBITO_A]: 'Nota de Débito A',
  [TipoComprobante.NOTA_CREDITO_A]: 'Nota de Crédito A',
  [TipoComprobante.FACTURA_B]: 'Factura B',
  [TipoComprobante.NOTA_DEBITO_B]: 'Nota de Débito B',
  [TipoComprobante.NOTA_CREDITO_B]: 'Nota de Crédito B',
  [TipoComprobante.FACTURA_C]: 'Factura C',
  [TipoComprobante.NOTA_DEBITO_C]: 'Nota de Débito C',
  [TipoComprobante.NOTA_CREDITO_C]: 'Nota de Crédito C',
};

export default afipConfig;
