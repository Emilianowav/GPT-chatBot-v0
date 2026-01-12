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
      // Construir items para Mercado Pago
      const items = carrito.items.map(item => ({
        title: item.nombre,
        quantity: item.cantidad,
        unit_price: parseFloat(item.precio),
        currency_id: 'ARS',
        picture_url: item.imagen,
        description: `Producto ID: ${item.productoId}`
      }));

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
          success: config.backUrls?.success || '',
          failure: config.backUrls?.failure || '',
          pending: config.backUrls?.pending || ''
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
