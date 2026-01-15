// Tipos para el nodo WooCommerce

export interface WooCommerceConnection {
  id: string;
  name: string;
  eshopUrl: string;
  consumerKey: string;
  consumerSecret: string;
  selfSignedCert?: string;
}

export type WooCommerceModule =
  // COUPON
  | 'delete-coupon'
  // CUSTOMER
  | 'search-customer'
  | 'get-customer'
  | 'create-customer'
  | 'update-customer'
  // ORDER
  | 'search-order'
  | 'get-order'
  | 'create-order'
  | 'update-order'
  | 'update-order-status'
  // PRODUCT
  | 'search-product'
  | 'get-product'
  | 'create-product'
  | 'update-product'
  | 'delete-product';

export interface WooCommerceModuleInfo {
  id: WooCommerceModule;
  category: 'COUPON' | 'CUSTOMER' | 'ORDER' | 'PRODUCT';
  label: string;
  description: string;
  icon: string;
}

export interface WooCommerceConfig {
  connection?: WooCommerceConnection;
  connectionId?: string; // ID de conexión existente
  apiConfigId?: string; // ID de la API en MongoDB
  module: WooCommerceModule;
  params: Record<string, any>;
}

// Catálogo de módulos disponibles
export const WOOCOMMERCE_MODULES: WooCommerceModuleInfo[] = [
  // COUPON
  {
    id: 'delete-coupon',
    category: 'COUPON',
    label: 'Delete a Coupon',
    description: 'This module helps you to delete a specified coupon.',
    icon: '🎟️'
  },
  
  // CUSTOMER
  {
    id: 'search-customer',
    category: 'CUSTOMER',
    label: 'Search for a Customer',
    description: 'This module helps you to find a customer.',
    icon: '🔍'
  },
  {
    id: 'get-customer',
    category: 'CUSTOMER',
    label: 'Get a Customer',
    description: 'This module lets you retrieve a specified customer by its ID.',
    icon: '👤'
  },
  {
    id: 'create-customer',
    category: 'CUSTOMER',
    label: 'Create a Customer',
    description: 'This module helps you to create a new customer.',
    icon: '➕'
  },
  {
    id: 'update-customer',
    category: 'CUSTOMER',
    label: 'Update a Customer',
    description: 'This module helps you to modify a customer.',
    icon: '✏️'
  },
  
  // ORDER
  {
    id: 'search-order',
    category: 'ORDER',
    label: 'Search for an Order',
    description: 'This module helps you to find an order.',
    icon: '🔍'
  },
  {
    id: 'get-order',
    category: 'ORDER',
    label: 'Get an Order',
    description: 'This module lets you retrieve a specified order by its ID.',
    icon: '📦'
  },
  {
    id: 'create-order',
    category: 'ORDER',
    label: 'Create an Order',
    description: 'This module helps you to create a new order.',
    icon: '➕'
  },
  {
    id: 'update-order',
    category: 'ORDER',
    label: 'Update an Order',
    description: 'This module lets you modify an order.',
    icon: '✏️'
  },
  {
    id: 'update-order-status',
    category: 'ORDER',
    label: 'Update an Order Status',
    description: 'This module lets you modify an order status. Order Status Manager plugin is required.',
    icon: '🔄'
  },
  
  // PRODUCT
  {
    id: 'search-product',
    category: 'PRODUCT',
    label: 'Search for a Product',
    description: 'This module helps you find a product.',
    icon: '🔍'
  },
  {
    id: 'get-product',
    category: 'PRODUCT',
    label: 'Get a Product',
    description: 'This module lets you retrieve a specified product by its ID.',
    icon: '📦'
  },
  {
    id: 'create-product',
    category: 'PRODUCT',
    label: 'Create a Product',
    description: 'This module helps you to create a new product.',
    icon: '➕'
  },
  {
    id: 'update-product',
    category: 'PRODUCT',
    label: 'Update a Product',
    description: 'This module lets you modify a product.',
    icon: '✏️'
  },
  {
    id: 'delete-product',
    category: 'PRODUCT',
    label: 'Delete a Product',
    description: 'This module helps you to delete a specified product.',
    icon: '🗑️'
  }
];

// Agrupar módulos por categoría
export const WOOCOMMERCE_MODULES_BY_CATEGORY = {
  COUPON: WOOCOMMERCE_MODULES.filter(m => m.category === 'COUPON'),
  CUSTOMER: WOOCOMMERCE_MODULES.filter(m => m.category === 'CUSTOMER'),
  ORDER: WOOCOMMERCE_MODULES.filter(m => m.category === 'ORDER'),
  PRODUCT: WOOCOMMERCE_MODULES.filter(m => m.category === 'PRODUCT')
};
