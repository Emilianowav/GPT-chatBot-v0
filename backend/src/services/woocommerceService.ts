// 🛒 Servicio de WooCommerce
import axios from 'axios';
import { encryptCredentials, decryptCredentials } from './encryptionService.js';
import { MarketplaceIntegrationModel, IMarketplaceIntegration } from '../models/MarketplaceIntegration.js';

const WOOCOMMERCE_API_VERSION = 'wc/v3';

/**
 * Guarda o actualiza una integración de WooCommerce
 */
export async function saveWooCommerceIntegration(
  empresaId: string,
  usuarioEmpresaId: string,
  storeUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<IMarketplaceIntegration> {
  // Limpiar URL de la tienda
  const cleanStoreUrl = storeUrl.replace(/\/$/, ''); // Remover trailing slash
  
  // Encriptar credenciales
  const encryptedCredentials = encryptCredentials({
    access_token: consumerKey,
    refresh_token: consumerSecret,
    token_type: 'basic',
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
    scope: 'read_write'
  });
  
  // Configuración por defecto
  const defaultConfig = {
    woocommerce: {
      store_url: cleanStoreUrl,
      sync_products: true,
      sync_orders: true,
      sync_customers: false,
      order_statuses: ['processing', 'completed'],
      sync_interval: 30,
      auto_sync: true
    }
  };
  
  // Buscar si ya existe una integración para esta empresa
  const existingIntegration = await MarketplaceIntegrationModel.findOne({
    empresaId,
    provider: 'woocommerce'
  });
  
  if (existingIntegration) {
    // Actualizar integración existente
    existingIntegration.credentials = encryptedCredentials;
    existingIntegration.status = 'active';
    existingIntegration.connected_account = cleanStoreUrl;
    existingIntegration.granted_scopes = ['read_write'];
    existingIntegration.config = defaultConfig;
    existingIntegration.error_message = undefined;
    existingIntegration.last_error = undefined;
    existingIntegration.sync_errors = 0;
    
    await existingIntegration.save();
    return existingIntegration;
  }
  
  // Crear nueva integración
  const integration = new MarketplaceIntegrationModel({
    empresaId,
    usuarioEmpresaId,
    provider: 'woocommerce',
    provider_name: 'WooCommerce',
    credentials: encryptedCredentials,
    status: 'active',
    granted_scopes: ['read_write'],
    connected_account: cleanStoreUrl,
    config: defaultConfig,
    createdBy: usuarioEmpresaId
  });
  
  await integration.save();
  return integration;
}

/**
 * Obtiene credenciales válidas de WooCommerce
 */
export async function getWooCommerceCredentials(integration: IMarketplaceIntegration) {
  const credentials = decryptCredentials(integration.credentials);
  const config = integration.config.woocommerce;
  
  if (!config?.store_url) {
    throw new Error('URL de la tienda no configurada');
  }
  
  return {
    consumerKey: credentials.access_token,
    consumerSecret: credentials.refresh_token,
    storeUrl: config.store_url
  };
}

/**
 * Verifica la conexión con WooCommerce
 */
export async function testConnection(integration: IMarketplaceIntegration): Promise<boolean> {
  try {
    const { consumerKey, consumerSecret, storeUrl } = await getWooCommerceCredentials(integration);
    
    const response = await axios.get(`${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/system_status`, {
      auth: {
        username: consumerKey,
        password: consumerSecret
      },
      timeout: 10000
    });
    
    return response.status === 200;
  } catch (error: any) {
    console.error('❌ Error verificando conexión WooCommerce:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Lista productos de WooCommerce
 */
export async function listProducts(integration: IMarketplaceIntegration, params?: any) {
  const { consumerKey, consumerSecret, storeUrl } = await getWooCommerceCredentials(integration);
  
  try {
    const response = await axios.get(`${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/products`, {
      auth: {
        username: consumerKey,
        password: consumerSecret
      },
      params: {
        per_page: 10,
        ...params
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error listando productos:', error.response?.data || error.message);
    throw new Error('Error al listar productos de WooCommerce');
  }
}

/**
 * Obtiene un producto específico
 */
export async function getProduct(integration: IMarketplaceIntegration, productId: string) {
  const { consumerKey, consumerSecret, storeUrl } = await getWooCommerceCredentials(integration);
  
  try {
    const response = await axios.get(`${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/products/${productId}`, {
      auth: {
        username: consumerKey,
        password: consumerSecret
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error obteniendo producto:', error.response?.data || error.message);
    throw new Error('Error al obtener producto de WooCommerce');
  }
}

/**
 * Crea un producto en WooCommerce
 */
export async function createProduct(integration: IMarketplaceIntegration, productData: any) {
  const { consumerKey, consumerSecret, storeUrl } = await getWooCommerceCredentials(integration);
  
  try {
    const response = await axios.post(
      `${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/products`,
      productData,
      {
        auth: {
          username: consumerKey,
          password: consumerSecret
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error creando producto:', error.response?.data || error.message);
    throw new Error('Error al crear producto en WooCommerce');
  }
}

/**
 * Actualiza un producto en WooCommerce
 */
export async function updateProduct(
  integration: IMarketplaceIntegration,
  productId: string,
  productData: any
) {
  const { consumerKey, consumerSecret, storeUrl } = await getWooCommerceCredentials(integration);
  
  try {
    const response = await axios.put(
      `${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/products/${productId}`,
      productData,
      {
        auth: {
          username: consumerKey,
          password: consumerSecret
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error actualizando producto:', error.response?.data || error.message);
    throw new Error('Error al actualizar producto en WooCommerce');
  }
}

/**
 * Elimina un producto de WooCommerce
 */
export async function deleteProduct(integration: IMarketplaceIntegration, productId: string) {
  const { consumerKey, consumerSecret, storeUrl } = await getWooCommerceCredentials(integration);
  
  try {
    const response = await axios.delete(
      `${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/products/${productId}`,
      {
        auth: {
          username: consumerKey,
          password: consumerSecret
        },
        params: { force: true } // Eliminar permanentemente
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error eliminando producto:', error.response?.data || error.message);
    throw new Error('Error al eliminar producto de WooCommerce');
  }
}

/**
 * Lista órdenes de WooCommerce
 */
export async function listOrders(integration: IMarketplaceIntegration, params?: any) {
  const { consumerKey, consumerSecret, storeUrl } = await getWooCommerceCredentials(integration);
  
  try {
    const response = await axios.get(`${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/orders`, {
      auth: {
        username: consumerKey,
        password: consumerSecret
      },
      params: {
        per_page: 10,
        ...params
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error listando órdenes:', error.response?.data || error.message);
    throw new Error('Error al listar órdenes de WooCommerce');
  }
}

/**
 * Obtiene una orden específica
 */
export async function getOrder(integration: IMarketplaceIntegration, orderId: string) {
  const { consumerKey, consumerSecret, storeUrl } = await getWooCommerceCredentials(integration);
  
  try {
    const response = await axios.get(`${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/orders/${orderId}`, {
      auth: {
        username: consumerKey,
        password: consumerSecret
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error obteniendo orden:', error.response?.data || error.message);
    throw new Error('Error al obtener orden de WooCommerce');
  }
}

/**
 * Actualiza una orden en WooCommerce
 */
export async function updateOrder(
  integration: IMarketplaceIntegration,
  orderId: string,
  orderData: any
) {
  const { consumerKey, consumerSecret, storeUrl } = await getWooCommerceCredentials(integration);
  
  try {
    const response = await axios.put(
      `${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/orders/${orderId}`,
      orderData,
      {
        auth: {
          username: consumerKey,
          password: consumerSecret
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error actualizando orden:', error.response?.data || error.message);
    throw new Error('Error al actualizar orden en WooCommerce');
  }
}

/**
 * Lista clientes de WooCommerce
 */
export async function listCustomers(integration: IMarketplaceIntegration, params?: any) {
  const { consumerKey, consumerSecret, storeUrl } = await getWooCommerceCredentials(integration);
  
  try {
    const response = await axios.get(`${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/customers`, {
      auth: {
        username: consumerKey,
        password: consumerSecret
      },
      params: {
        per_page: 10,
        ...params
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error listando clientes:', error.response?.data || error.message);
    throw new Error('Error al listar clientes de WooCommerce');
  }
}

/**
 * Obtiene categorías de productos
 */
export async function listCategories(integration: IMarketplaceIntegration, params?: any) {
  const { consumerKey, consumerSecret, storeUrl } = await getWooCommerceCredentials(integration);
  
  try {
    const response = await axios.get(`${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/products/categories`, {
      auth: {
        username: consumerKey,
        password: consumerSecret
      },
      params: {
        per_page: 100,
        ...params
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error listando categorías:', error.response?.data || error.message);
    throw new Error('Error al listar categorías de WooCommerce');
  }
}

/**
 * Obtiene reportes de ventas
 */
export async function getSalesReport(integration: IMarketplaceIntegration, params?: any) {
  const { consumerKey, consumerSecret, storeUrl } = await getWooCommerceCredentials(integration);
  
  try {
    const response = await axios.get(`${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/reports/sales`, {
      auth: {
        username: consumerKey,
        password: consumerSecret
      },
      params
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error obteniendo reporte de ventas:', error.response?.data || error.message);
    throw new Error('Error al obtener reporte de ventas de WooCommerce');
  }
}
