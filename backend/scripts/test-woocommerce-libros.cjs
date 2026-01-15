const axios = require('axios');

const BASE_URL = 'https://www.veoveolibros.com.ar/wp-json/wc/v3';
const CONSUMER_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
const CONSUMER_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

async function buscarLibro(titulo) {
  try {
    console.log(`\n🔍 Buscando: "${titulo}"`);
    console.log('─'.repeat(80));
    
    const response = await axios.get(`${BASE_URL}/products`, {
      params: {
        search: titulo,
        per_page: 10,
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET
      }
    });
    
    const productos = response.data;
    
    if (productos.length === 0) {
      console.log('❌ NO SE ENCONTRARON RESULTADOS');
      return null;
    }
    
    console.log(`✅ Encontrados: ${productos.length} producto(s)\n`);
    
    productos.forEach((p, index) => {
      console.log(`${index + 1}. ${p.name}`);
      console.log(`   ID: ${p.id}`);
      console.log(`   Precio: $${p.price}`);
      console.log(`   Stock: ${p.stock_status} (cantidad: ${p.stock_quantity})`);
      console.log(`   SKU: ${p.sku}`);
      console.log(`   URL: ${p.permalink}`);
      console.log('');
    });
    
    return productos;
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🧪 TEST DE API WOOCOMMERCE - VEO VEO LIBROS');
  console.log('═'.repeat(80));
  
  // Libros que el usuario dijo que no se encontraron
  await buscarLibro('500 gemas preciosas');
  await buscarLibro('El país entero');
  await buscarLibro('La soledad');
  
  // Libros que SÍ funcionaron (para comparar)
  await buscarLibro('Harry Potter 5');
  await buscarLibro('Harry Potter 2');
  
  console.log('\n📊 RESUMEN:');
  console.log('═'.repeat(80));
  console.log('Si los primeros 3 libros NO existen en WooCommerce → ✅ Sistema funciona bien');
  console.log('Si los primeros 3 libros SÍ existen en WooCommerce → ❌ Problema de extracción');
}

main();
