// 🧾 Servicio de Facturación AFIP (WSFEv1)
import * as soap from 'soap';
import { format } from 'date-fns';
import { afipConfig, TipoComprobante } from '../config.js';
import { AFIPSeller } from '../models/AFIPSeller.js';
import { AFIPInvoice } from '../models/AFIPInvoice.js';
import { obtenerCredenciales } from './afipAuthService.js';

export interface InvoiceData {
  tipoComprobante: number;
  concepto: number;
  clienteTipoDoc: number;
  clienteNroDoc: number;
  clienteRazonSocial?: string;
  importeNeto: number;
  importeIVA: number;
  importeExento: number;
  importeTotal: number;
  iva?: Array<{
    id: number;
    baseImp: number;
    importe: number;
  }>;
  comprobanteAsociado?: {
    tipo: number;
    puntoVenta: number;
    numero: number;
  };
}

/**
 * Obtiene los puntos de venta disponibles en AFIP
 */
export async function obtenerPuntosVentaDisponibles(sellerId: string): Promise<number[]> {
  try {
    const seller = await AFIPSeller.findById(sellerId);
    if (!seller) throw new Error('Seller no encontrado');
    
    const { token, sign, cuit } = await obtenerCredenciales(sellerId);
    
    // Determinar URL según ambiente del seller
    const wsfev1Url = seller.environment === 'production'
      ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
      : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx';
    
    // Conectar a WSFEv1 con opciones SSL
    const client = await soap.createClientAsync(wsfev1Url + '?WSDL', {
      wsdl_options: {
        rejectUnauthorized: false, // Deshabilitar verificación SSL para AFIP
        strictSSL: false
      }
    } as any);
    
    // Consultar puntos de venta
    const result = await client.FEParamGetPtosVentaAsync({
      Auth: { Token: token, Sign: sign, Cuit: cuit }
    });
    
    const puntosVenta = result[0].FEParamGetPtosVentaResult?.ResultGet?.PtoVenta || [];
    const numeros = puntosVenta.map((pv: any) => pv.Nro);
    
    console.log(`📊 [AFIP] Puntos de venta disponibles:`, numeros);
    
    return numeros;
    
  } catch (error: any) {
    console.error('❌ [AFIP] Error obteniendo puntos de venta:', error.message);
    throw error;
  }
}

/**
 * Obtiene el último número de comprobante autorizado
 */
export async function obtenerUltimoComprobante(
  sellerId: string,
  tipoComprobante: number,
  puntoVenta?: number
): Promise<number> {
  try {
    const seller = await AFIPSeller.findById(sellerId);
    if (!seller) throw new Error('Seller no encontrado');
    
    const pv = puntoVenta || seller.puntoVenta;
    const { token, sign, cuit } = await obtenerCredenciales(sellerId);
    
    // Determinar URL según ambiente del seller
    const wsfev1Url = seller.environment === 'production'
      ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
      : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx';
    
    // Conectar a WSFEv1 con opciones SSL
    const client = await soap.createClientAsync(wsfev1Url + '?WSDL', {
      wsdl_options: {
        rejectUnauthorized: false,
        strictSSL: false
      }
    } as any);
    
    // Consultar último comprobante
    const result = await client.FECompUltimoAutorizadoAsync({
      Auth: { Token: token, Sign: sign, Cuit: cuit },
      PtoVta: pv,
      CbteTipo: tipoComprobante
    });
    
    const ultimoNro = result[0].FECompUltimoAutorizadoResult.CbteNro || 0;
    
    console.log(`📊 [AFIP] Último comprobante tipo ${tipoComprobante} PV ${pv}: ${ultimoNro}`);
    
    return ultimoNro;
    
  } catch (error: any) {
    console.error('❌ [AFIP] Error obteniendo último comprobante:', error.message);
    throw error;
  }
}

/**
 * Crea una factura/comprobante en AFIP
 */
export async function crearComprobante(
  sellerId: string,
  invoiceData: InvoiceData
): Promise<any> {
  try {
    console.log('🧾 [AFIP] Creando comprobante...');
    
    const seller = await AFIPSeller.findById(sellerId);
    if (!seller) throw new Error('Seller no encontrado');
    
    const { token, sign, cuit } = await obtenerCredenciales(sellerId);
    
    // Obtener último número
    const ultimoNro = await obtenerUltimoComprobante(
      sellerId,
      invoiceData.tipoComprobante,
      seller.puntoVenta
    );
    const nuevoNro = ultimoNro + 1;
    
    // Fecha actual en formato YYYYMMDD
    const fecha = format(new Date(), 'yyyyMMdd');
    
    // Preparar request
    const facturaRequest: any = {
      Auth: { Token: token, Sign: sign, Cuit: cuit },
      FeCAEReq: {
        FeCabReq: {
          CantReg: 1,
          PtoVta: seller.puntoVenta,
          CbteTipo: invoiceData.tipoComprobante
        },
        FeDetReq: {
          FECAEDetRequest: {
            Concepto: invoiceData.concepto,
            DocTipo: invoiceData.clienteTipoDoc,
            DocNro: invoiceData.clienteNroDoc,
            CbteDesde: nuevoNro,
            CbteHasta: nuevoNro,
            CbteFch: fecha,
            ImpTotal: invoiceData.importeTotal,
            ImpTotConc: 0,
            ImpNeto: invoiceData.importeNeto,
            ImpOpEx: invoiceData.importeExento,
            ImpIVA: invoiceData.importeIVA,
            ImpTrib: 0,
            MonId: 'PES',
            MonCotiz: 1
          }
        }
      }
    };
    
    // Agregar IVA si existe
    if (invoiceData.iva && invoiceData.iva.length > 0) {
      facturaRequest.FeCAEReq.FeDetReq.FECAEDetRequest.Iva = {
        AlicIva: invoiceData.iva.map(iva => ({
          Id: iva.id,
          BaseImp: iva.baseImp,
          Importe: iva.importe
        }))
      };
    }
    
    // Agregar comprobante asociado si existe (para NC/ND)
    if (invoiceData.comprobanteAsociado) {
      facturaRequest.FeCAEReq.FeDetReq.FECAEDetRequest.CbtesAsoc = {
        CbteAsoc: {
          Tipo: invoiceData.comprobanteAsociado.tipo,
          PtoVta: invoiceData.comprobanteAsociado.puntoVenta,
          Nro: invoiceData.comprobanteAsociado.numero
        }
      };
    }
    
    // Determinar URL según ambiente del seller
    const wsfev1Url = seller.environment === 'production'
      ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
      : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx';
    
    // Conectar y enviar
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📤 [AFIP] ENVIANDO COMPROBANTE A AFIP');
    console.log(`   🌐 URL WSFEv1: ${wsfev1Url}`);
    console.log(`   🔧 Ambiente: ${seller.environment.toUpperCase()}`);
    console.log(`   📋 CUIT Emisor: ${seller.cuit}`);
    console.log(`   📋 Punto de Venta: ${seller.puntoVenta}`);
    console.log(`   📋 Tipo Comprobante: ${invoiceData.tipoComprobante}`);
    console.log(`   📋 Número: ${nuevoNro}`);
    console.log(`   💰 Importe Total: $${invoiceData.importeTotal}`);
    console.log('═══════════════════════════════════════════════════════════');
    const client = await soap.createClientAsync(wsfev1Url + '?WSDL', {
      wsdl_options: {
        rejectUnauthorized: false,
        strictSSL: false
      }
    } as any);
    const result = await client.FECAESolicitarAsync(facturaRequest);
    
    const response = result[0].FECAESolicitarResult;
    
    // Log completo de la respuesta para debugging
    console.log('📋 [AFIP] Respuesta completa:', JSON.stringify(response, null, 2));
    
    // FECAEDetResponse puede ser un array o un objeto
    const detResponseArray = response.FeDetResp.FECAEDetResponse;
    const detResponse = Array.isArray(detResponseArray) ? detResponseArray[0] : detResponseArray;
    
    // Verificar resultado
    if (detResponse.Resultado !== 'A') {
      // Extraer observaciones - puede ser array de objetos o un solo objeto
      let obsTexto = '';
      
      if (detResponse.Observaciones?.Obs) {
        const obs = detResponse.Observaciones.Obs;
        if (Array.isArray(obs)) {
          obsTexto = obs.map((o: any) => `[${o.Code}] ${o.Msg}`).join(', ');
        } else if (obs.Code) {
          obsTexto = `[${obs.Code}] ${obs.Msg}`;
        }
      }
      
      // Extraer errores si existen
      let errTexto = '';
      
      if (response.Errors?.Err) {
        const errors = response.Errors.Err;
        if (Array.isArray(errors)) {
          errTexto = errors.map((e: any) => `[${e.Code}] ${e.Msg}`).join(', ');
        } else if (errors.Code) {
          errTexto = `[${errors.Code}] ${errors.Msg}`;
        }
      }
      
      const mensajeCompleto = [obsTexto, errTexto].filter(Boolean).join(' | ') || 'Sin detalles del error';
      
      console.error('❌ [AFIP] Comprobante rechazado:', mensajeCompleto);
      throw new Error(`Comprobante rechazado por AFIP: ${mensajeCompleto}`);
    }
    
    // Guardar en base de datos
    const invoice = new AFIPInvoice({
      empresaId: seller.empresaId,
      sellerId: seller._id,
      tipoComprobante: invoiceData.tipoComprobante,
      puntoVenta: seller.puntoVenta,
      numero: nuevoNro,
      fecha,
      clienteTipoDoc: invoiceData.clienteTipoDoc,
      clienteNroDoc: invoiceData.clienteNroDoc,
      clienteRazonSocial: invoiceData.clienteRazonSocial,
      concepto: invoiceData.concepto,
      importeNeto: invoiceData.importeNeto,
      importeIVA: invoiceData.importeIVA,
      importeExento: invoiceData.importeExento,
      importeTotal: invoiceData.importeTotal,
      iva: invoiceData.iva,
      comprobanteAsociado: invoiceData.comprobanteAsociado,
      cae: detResponse.CAE,
      caeVencimiento: detResponse.CAEFchVto,
      resultado: detResponse.Resultado,
      rawResponse: response,
      environment: seller.environment
    });
    
    await invoice.save();
    
    // Actualizar estadísticas del seller
    if (invoiceData.tipoComprobante === TipoComprobante.FACTURA_A ||
        invoiceData.tipoComprobante === TipoComprobante.FACTURA_B ||
        invoiceData.tipoComprobante === TipoComprobante.FACTURA_C) {
      seller.totalFacturas += 1;
    } else if (invoiceData.tipoComprobante === TipoComprobante.NOTA_CREDITO_A ||
               invoiceData.tipoComprobante === TipoComprobante.NOTA_CREDITO_B ||
               invoiceData.tipoComprobante === TipoComprobante.NOTA_CREDITO_C) {
      seller.totalNotasCredito += 1;
    } else {
      seller.totalNotasDebito += 1;
    }
    await seller.save();
    
    console.log('✅ [AFIP] Comprobante creado exitosamente');
    console.log(`   CAE: ${detResponse.CAE}`);
    console.log(`   Número: ${seller.puntoVenta.toString().padStart(4, '0')}-${nuevoNro.toString().padStart(8, '0')}`);
    
    return {
      success: true,
      invoice,
      cae: detResponse.CAE,
      caeVencimiento: detResponse.CAEFchVto,
      numero: nuevoNro,
      puntoVenta: seller.puntoVenta
    };
    
  } catch (error: any) {
    console.error('❌ [AFIP] Error creando comprobante:', error.message);
    throw error;
  }
}

/**
 * Consulta un comprobante en AFIP
 */
export async function consultarComprobante(
  sellerId: string,
  tipoComprobante: number,
  puntoVenta: number,
  numero: number
): Promise<any> {
  try {
    const seller = await AFIPSeller.findById(sellerId);
    if (!seller) throw new Error('Seller no encontrado');
    
    const { token, sign, cuit } = await obtenerCredenciales(sellerId);
    
    // Determinar URL según ambiente del seller
    const wsfev1Url = seller.environment === 'production'
      ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
      : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx';
    
    const client = await soap.createClientAsync(wsfev1Url + '?WSDL', {
      wsdl_options: {
        rejectUnauthorized: false,
        strictSSL: false
      }
    } as any);
    
    const result = await client.FECompConsultarAsync({
      Auth: { Token: token, Sign: sign, Cuit: cuit },
      FeCompConsReq: {
        CbteTipo: tipoComprobante,
        PtoVta: puntoVenta,
        CbteNro: numero
      }
    });
    
    return result[0].FECompConsultarResult;
    
  } catch (error: any) {
    console.error('❌ [AFIP] Error consultando comprobante:', error.message);
    throw error;
  }
}

export default {
  crearComprobante,
  obtenerUltimoComprobante,
  consultarComprobante
};
