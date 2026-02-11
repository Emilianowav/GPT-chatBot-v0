import axios from 'axios';
import { ICarrito } from '../models/Carrito.js';

interface MercadoPagoConfig {
  accessToken: string;
  publicKey?: string;
}

interface PreferenciaResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export class MercadoPagoService {
  private accessToken: string;

  constructor(config: MercadoPagoConfig) {
    this.accessToken = config.accessToken;
  }

  /**
   * Crea una preferencia de pago en Mercado Pago
   */
  async crearPreferencia(
    carrito: ICarrito,
    config: {
      titulo?: string;
      descripcion?: string;
      notificationUrl?: string;
      backUrls?: {
        success?: string;
        failure?: string;
        pending?: string;
      };
      metadata?: Record<string, any>;
    } = {}
  ): Promise<PreferenciaResponse> {
    try {
      // 🧪 TESTING MODE: Hardcodear precio a $0.20 (20 centavos ARS)
      const TESTING_MODE = true;
      const TESTING_PRICE = 0.20;
      
      if (TESTING_MODE) {
        console.log(`   🧪 TESTING MODE ACTIVADO: Precio hardcodeado a $${TESTING_PRICE}`);
      }
      
      // Construir items para Mercado Pago
      const items = carrito.items.map(item => ({
        title: item.nombre,
        quantity: item.cantidad,
        unit_price: TESTING_MODE ? TESTING_PRICE : parseFloat(item.precio),
        currency_id: 'ARS',
        picture_url: item.imagen,
        description: item.nombre
      }));

      // URLs por defecto para back_urls
      const defaultBackUrl = process.env.MP_BACK_URL || 'https://gpt-chatbot-v0.onrender.com/payment';
      
      // Configurar preferencia
      const preferencia = {
        items,
        payer: {
          name: config.metadata?.nombreCliente || 'Cliente',
          phone: {
            area_code: '',
            number: config.metadata?.telefonoCliente || ''
          }
        },
        back_urls: {
          success: config.backUrls?.success || `${defaultBackUrl}/success`,
          failure: config.backUrls?.failure || `${defaultBackUrl}/failure`,
          pending: config.backUrls?.pending || `${defaultBackUrl}/pending`
        },
        auto_return: 'approved',
        notification_url: config.notificationUrl || '',
        external_reference: carrito._id.toString(),
        metadata: {
          carrito_id: carrito._id.toString(),
          contacto_id: carrito.contactoId.toString(),
          empresa_id: carrito.empresaId,
          ...config.metadata
        },
        statement_descriptor: config.titulo || 'Veo Veo Libros',
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      };

      console.log('🔵 Creando preferencia en Mercado Pago...');
      console.log('   Items:', items.length);
      console.log('   Total:', carrito.total);

      const response = await axios.post(
        'https://api.mercadopago.com/checkout/preferences',
        preferencia,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Preferencia creada:', response.data.id);
      console.log('   Link de pago:', response.data.init_point);

      return response.data;
    } catch (error: any) {
      console.error('❌ Error creando preferencia en Mercado Pago:', error.response?.data || error.message);
      throw new Error(`Error en Mercado Pago: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Obtiene información de un pago
   */
  async obtenerPago(paymentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo pago:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtiene información de una preferencia
   */
  async obtenerPreferencia(preferenciaId: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://api.mercadopago.com/checkout/preferences/${preferenciaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo preferencia:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verifica el estado de un pago asociado a una preferencia
   * Busca pagos relacionados con el external_reference (carrito_id)
   */
  async verificarEstadoPreferencia(preferenciaId: string, externalReference: string): Promise<{
    estado: 'approved' | 'pending' | 'in_process' | 'rejected' | 'cancelled' | 'no_payment';
    pago_id?: string;
    detalles?: any;
  }> {
    try {
      // Buscar pagos por external_reference
      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/search`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          params: {
            external_reference: externalReference,
            sort: 'date_created',
            criteria: 'desc',
            range: 'date_created',
            begin_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Últimos 7 días
            end_date: new Date().toISOString()
          }
        }
      );

      const pagos = response.data.results || [];
      
      if (pagos.length === 0) {
        return {
          estado: 'no_payment'
        };
      }

      // Tomar el pago más reciente
      const pagoReciente = pagos[0];
      
      return {
        estado: pagoReciente.status,
        pago_id: pagoReciente.id,
        detalles: {
          id: pagoReciente.id,
          status: pagoReciente.status,
          status_detail: pagoReciente.status_detail,
          transaction_amount: pagoReciente.transaction_amount,
          date_approved: pagoReciente.date_approved,
          payment_method_id: pagoReciente.payment_method_id
        }
      };
    } catch (error: any) {
      console.error('❌ Error verificando estado de preferencia:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verifica el estado de un pago
   */
  async verificarEstadoPago(paymentId: string): Promise<{
    estado: 'approved' | 'pending' | 'rejected' | 'cancelled';
    detalles: any;
  }> {
    const pago = await this.obtenerPago(paymentId);
    
    return {
      estado: pago.status,
      detalles: {
        id: pago.id,
        status: pago.status,
        status_detail: pago.status_detail,
        transaction_amount: pago.transaction_amount,
        date_approved: pago.date_approved,
        external_reference: pago.external_reference
      }
    };
  }
}
