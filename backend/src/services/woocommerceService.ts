import axios from 'axios';

interface WooCommerceConnection {
  eshopUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number | null;
  stock_status: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  images: Array<{ src: string; alt: string }>;
  description: string;
  short_description: string;
  sku: string;
}

/**
 * Servicio para interactuar con WooCommerce REST API
 */
export class WooCommerceService {
  private connection: WooCommerceConnection;

  constructor(connection: WooCommerceConnection) {
    this.connection = connection;
  }

  /**
   * Crea cliente axios con autenticación básica
   */
  private getClient() {
    const auth = Buffer.from(
      `${this.connection.consumerKey}:${this.connection.consumerSecret}`
    ).toString('base64');

    return axios.create({
      baseURL: `${this.connection.eshopUrl}/wp-json/wc/v3`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * GET a Product - Obtiene un producto por ID
   */
  async getProduct(productId: string | number): Promise<any> {
    console.log(`🛍️  [WOO] Get Product: ${productId}`);
    
    try {
      const client = this.getClient();
      const response = await client.get(`/products/${productId}`);
      
      const product = response.data;
      
      console.log(`   ✅ Producto encontrado: ${product.name}`);
      console.log(`   💰 Precio: $${product.price}`);
      console.log(`   📦 Stock: ${product.stock_quantity || 'N/A'}`);
      
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        regular_price: product.regular_price,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        stock_status: product.stock_status,
        in_stock: product.stock_status === 'instock',
        categories: product.categories,
        images: product.images,
        image_url: product.images?.[0]?.src || '',
        description: product.description,
        short_description: product.short_description,
        sku: product.sku,
        permalink: product.permalink
      };
    } catch (error: any) {
      console.error(`   ❌ Error obteniendo producto:`, error.response?.data || error.message);
      throw new Error(`Error obteniendo producto: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Search for a Product - Busca productos
   */
  async searchProducts(params: {
    search?: string;
    category?: string;
    limit?: number;
    orderBy?: string;
  }): Promise<any[]> {
    console.log(`🔍 [WOO] Search Products:`, params);
    
    try {
      const client = this.getClient();
      
      const queryParams: any = {
        per_page: params.limit || 10,
        orderby: params.orderBy || 'relevance'
      };
      
      if (params.search) {
        queryParams.search = params.search;
      }
      
      if (params.category) {
        queryParams.category = params.category;
      }
      
      const response = await client.get('/products', { params: queryParams });
      
      const products = response.data;
      
      console.log(`   ✅ Productos encontrados: ${products.length}`);
      
      return products.map((product: WooCommerceProduct) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        regular_price: product.regular_price,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        stock_status: product.stock_status,
        in_stock: product.stock_status === 'instock',
        categories: product.categories,
        images: product.images,
        image_url: product.images?.[0]?.src || '',
        description: product.description,
        short_description: product.short_description,
        sku: product.sku
      }));
    } catch (error: any) {
      console.error(`   ❌ Error buscando productos:`, error.response?.data || error.message);
      throw new Error(`Error buscando productos: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create an Order - Crea una orden
   */
  async createOrder(params: {
    customerId?: string;
    productId: string;
    quantity: number;
    customerPhone?: string;
    customerName?: string;
    customerEmail?: string;
  }): Promise<any> {
    console.log(`📦 [WOO] Create Order:`, params);
    
    try {
      const client = this.getClient();
      
      const orderData: any = {
        line_items: [
          {
            product_id: parseInt(params.productId),
            quantity: params.quantity
          }
        ],
        status: 'pending'
      };
      
      // Si hay customer ID, usarlo
      if (params.customerId) {
        orderData.customer_id = parseInt(params.customerId);
      }
      
      // Si hay datos de billing, agregarlos
      if (params.customerPhone || params.customerName || params.customerEmail) {
        orderData.billing = {};
        
        if (params.customerName) {
          const [firstName, ...lastNameParts] = params.customerName.split(' ');
          orderData.billing.first_name = firstName;
          orderData.billing.last_name = lastNameParts.join(' ') || '';
        }
        
        if (params.customerPhone) {
          orderData.billing.phone = params.customerPhone;
        }
        
        if (params.customerEmail) {
          orderData.billing.email = params.customerEmail;
        }
      }
      
      const response = await client.post('/orders', orderData);
      
      const order = response.data;
      
      console.log(`   ✅ Orden creada: #${order.id}`);
      console.log(`   💰 Total: $${order.total}`);
      console.log(`   📊 Estado: ${order.status}`);
      
      return {
        id: order.id,
        order_number: order.number,
        status: order.status,
        total: order.total,
        currency: order.currency,
        date_created: order.date_created,
        payment_url: order.payment_url || '',
        line_items: order.line_items,
        billing: order.billing,
        shipping: order.shipping
      };
    } catch (error: any) {
      console.error(`   ❌ Error creando orden:`, error.response?.data || error.message);
      throw new Error(`Error creando orden: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get a Customer - Obtiene un cliente por ID
   */
  async getCustomer(customerId: string | number): Promise<any> {
    console.log(`👤 [WOO] Get Customer: ${customerId}`);
    
    try {
      const client = this.getClient();
      const response = await client.get(`/customers/${customerId}`);
      
      const customer = response.data;
      
      console.log(`   ✅ Cliente encontrado: ${customer.email}`);
      
      return {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        username: customer.username,
        billing: customer.billing,
        shipping: customer.shipping
      };
    } catch (error: any) {
      console.error(`   ❌ Error obteniendo cliente:`, error.response?.data || error.message);
      throw new Error(`Error obteniendo cliente: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Search for a Customer - Busca clientes
   */
  async searchCustomers(params: {
    search?: string;
    email?: string;
    limit?: number;
  }): Promise<any[]> {
    console.log(`🔍 [WOO] Search Customers:`, params);
    
    try {
      const client = this.getClient();
      
      const queryParams: any = {
        per_page: params.limit || 10
      };
      
      if (params.search) {
        queryParams.search = params.search;
      }
      
      if (params.email) {
        queryParams.email = params.email;
      }
      
      const response = await client.get('/customers', { params: queryParams });
      
      const customers = response.data;
      
      console.log(`   ✅ Clientes encontrados: ${customers.length}`);
      
      return customers.map((customer: any) => ({
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        username: customer.username,
        billing: customer.billing,
        shipping: customer.shipping
      }));
    } catch (error: any) {
      console.error(`   ❌ Error buscando clientes:`, error.response?.data || error.message);
      throw new Error(`Error buscando clientes: ${error.response?.data?.message || error.message}`);
    }
  }
}

/**
 * Helper para crear instancia del servicio
 */
export function createWooCommerceService(connection: WooCommerceConnection): WooCommerceService {
  return new WooCommerceService(connection);
}
