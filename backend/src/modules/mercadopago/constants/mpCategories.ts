// 📋 Categorías válidas de Mercado Pago
// Fuente: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/your-integrations/preferences

/**
 * Categorías de productos/servicios de Mercado Pago
 * Usar la categoría correcta mejora la tasa de aprobación de pagos
 */
export enum MPCategory {
  // Servicios
  SERVICES = 'services',
  
  // Electrónica y tecnología
  ELECTRONICS = 'electronics',
  COMPUTERS = 'computers',
  PHONES = 'phones',
  CAMERAS = 'cameras',
  
  // Hogar y jardín
  HOME = 'home',
  HOME_APPLIANCES = 'home_appliances',
  
  // Moda y accesorios
  FASHION = 'fashion',
  CLOTHING = 'clothing',
  SHOES = 'shoes',
  ACCESSORIES = 'accessories',
  
  // Deportes y fitness
  SPORTS = 'sports',
  
  // Juguetes y juegos
  TOYS = 'toys',
  GAMES = 'games',
  
  // Libros y medios
  BOOKS = 'books',
  MUSIC = 'music',
  MOVIES = 'movies',
  
  // Salud y belleza
  HEALTH = 'health',
  BEAUTY = 'beauty',
  
  // Alimentos y bebidas
  FOOD = 'food',
  
  // Automóviles
  AUTOMOTIVE = 'automotive',
  CAR_ACCESSORIES = 'car_accessories',
  
  // Arte y artesanía
  ART = 'art',
  CRAFTS = 'crafts',
  
  // Otros
  OTHERS = 'others',
}

/**
 * Mapa de categorías en español para facilitar la selección
 */
export const MPCategoryLabels: Record<MPCategory, string> = {
  [MPCategory.SERVICES]: 'Servicios',
  [MPCategory.ELECTRONICS]: 'Electrónica',
  [MPCategory.COMPUTERS]: 'Computadoras',
  [MPCategory.PHONES]: 'Teléfonos',
  [MPCategory.CAMERAS]: 'Cámaras',
  [MPCategory.HOME]: 'Hogar',
  [MPCategory.HOME_APPLIANCES]: 'Electrodomésticos',
  [MPCategory.FASHION]: 'Moda',
  [MPCategory.CLOTHING]: 'Ropa',
  [MPCategory.SHOES]: 'Calzado',
  [MPCategory.ACCESSORIES]: 'Accesorios',
  [MPCategory.SPORTS]: 'Deportes',
  [MPCategory.TOYS]: 'Juguetes',
  [MPCategory.GAMES]: 'Juegos',
  [MPCategory.BOOKS]: 'Libros',
  [MPCategory.MUSIC]: 'Música',
  [MPCategory.MOVIES]: 'Películas',
  [MPCategory.HEALTH]: 'Salud',
  [MPCategory.BEAUTY]: 'Belleza',
  [MPCategory.FOOD]: 'Alimentos',
  [MPCategory.AUTOMOTIVE]: 'Automotor',
  [MPCategory.CAR_ACCESSORIES]: 'Accesorios para auto',
  [MPCategory.ART]: 'Arte',
  [MPCategory.CRAFTS]: 'Artesanías',
  [MPCategory.OTHERS]: 'Otros',
};

/**
 * Obtiene la categoría por defecto según palabras clave en el título
 */
export function inferCategoryFromTitle(title: string): MPCategory {
  const titleLower = title.toLowerCase();
  
  // Servicios
  if (titleLower.match(/servicio|consulta|asesor|curso|clase|taller|capacitación/)) {
    return MPCategory.SERVICES;
  }
  
  // Electrónica
  if (titleLower.match(/celular|teléfono|smartphone|iphone|samsung/)) {
    return MPCategory.PHONES;
  }
  if (titleLower.match(/computadora|notebook|laptop|pc|tablet/)) {
    return MPCategory.COMPUTERS;
  }
  if (titleLower.match(/cámara|foto|video/)) {
    return MPCategory.CAMERAS;
  }
  if (titleLower.match(/electrónica|auricular|parlante|smart/)) {
    return MPCategory.ELECTRONICS;
  }
  
  // Hogar
  if (titleLower.match(/heladera|lavarropas|cocina|horno|microondas/)) {
    return MPCategory.HOME_APPLIANCES;
  }
  if (titleLower.match(/mueble|decoración|hogar/)) {
    return MPCategory.HOME;
  }
  
  // Moda
  if (titleLower.match(/remera|pantalón|vestido|camisa|ropa/)) {
    return MPCategory.CLOTHING;
  }
  if (titleLower.match(/zapatilla|zapato|bota|sandalia/)) {
    return MPCategory.SHOES;
  }
  if (titleLower.match(/cartera|bolso|reloj|joya|accesorio/)) {
    return MPCategory.ACCESSORIES;
  }
  if (titleLower.match(/moda/)) {
    return MPCategory.FASHION;
  }
  
  // Deportes
  if (titleLower.match(/deporte|gimnasio|fitness|bicicleta|pelota/)) {
    return MPCategory.SPORTS;
  }
  
  // Juguetes y juegos
  if (titleLower.match(/juguete|muñeca|juego/)) {
    return MPCategory.TOYS;
  }
  if (titleLower.match(/videojuego|consola|playstation|xbox/)) {
    return MPCategory.GAMES;
  }
  
  // Libros y medios
  if (titleLower.match(/libro/)) {
    return MPCategory.BOOKS;
  }
  if (titleLower.match(/música|cd|vinilo/)) {
    return MPCategory.MUSIC;
  }
  if (titleLower.match(/película|dvd|blu-ray/)) {
    return MPCategory.MOVIES;
  }
  
  // Salud y belleza
  if (titleLower.match(/salud|vitamina|suplemento/)) {
    return MPCategory.HEALTH;
  }
  if (titleLower.match(/belleza|cosmético|maquillaje|perfume/)) {
    return MPCategory.BEAUTY;
  }
  
  // Alimentos
  if (titleLower.match(/comida|alimento|bebida|café|té/)) {
    return MPCategory.FOOD;
  }
  
  // Automotor
  if (titleLower.match(/auto|coche|vehículo|moto/)) {
    return MPCategory.AUTOMOTIVE;
  }
  if (titleLower.match(/repuesto|accesorio.*auto/)) {
    return MPCategory.CAR_ACCESSORIES;
  }
  
  // Arte
  if (titleLower.match(/arte|pintura|escultura/)) {
    return MPCategory.ART;
  }
  if (titleLower.match(/artesanía|hecho.*mano/)) {
    return MPCategory.CRAFTS;
  }
  
  // Por defecto: servicios (más común en chatbots)
  return MPCategory.SERVICES;
}

/**
 * Genera un statement descriptor optimizado
 * Máximo 22 caracteres, sin caracteres especiales
 */
export function generateStatementDescriptor(
  empresaNombre: string,
  productTitle?: string
): string {
  // Limpiar caracteres especiales y acentos
  const clean = (str: string) => str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-zA-Z0-9\s]/g, '') // Solo letras, números y espacios
    .trim()
    .toUpperCase();
  
  const empresaClean = clean(empresaNombre);
  
  // Si no hay título de producto, usar solo nombre de empresa (max 22 chars)
  if (!productTitle) {
    return empresaClean.substring(0, 22);
  }
  
  const productClean = clean(productTitle);
  
  // Intentar formato: "EMPRESA - PRODUCTO"
  const separator = ' - ';
  const maxEmpresaLen = 10;
  const maxProductLen = 22 - maxEmpresaLen - separator.length;
  
  if (empresaClean.length + separator.length + productClean.length <= 22) {
    return `${empresaClean}${separator}${productClean}`;
  }
  
  // Si no cabe todo, truncar
  const empresaTrunc = empresaClean.substring(0, maxEmpresaLen);
  const productTrunc = productClean.substring(0, maxProductLen);
  
  return `${empresaTrunc}${separator}${productTrunc}`;
}
