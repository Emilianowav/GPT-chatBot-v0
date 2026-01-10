const axios = require('axios');

const BASE_URL = 'https://www.veoveolibros.com.ar/wp-json/wc/v3';
const CONSUMER_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
const CONSUMER_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

async function checkProducts() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('VERIFICAR PRODUCTOS EN WOOCOMMERCE');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const searches = [
    'Harry Potter',
    'harry potter 3',
    'Harry Potter and the Prisoner',
    'Prisoner of Azkaban',
    'HP',
    'Potter'
  ];
  
  for (const search of searches) {
    console.log(`\n🔍 Búsqueda: "${search}"`);
    console.log('─'.repeat(63));
    
    try {
      const response = await axios.get(`${BASE_URL}/products`, {
        params: {
          search,
          per_page: 10,
          consumer_key: CONSUMER_KEY,
          consumer_secret: CONSUMER_SECRET
        }
      });
      
      console.log(`✅ Resultados: ${response.data.length}`);
      
      if (response.data.length > 0) {
        response.data.forEach((p, i) => {
          console.log(`\n${i + 1}. ${p.name}`);
          console.log(`   ID: ${p.id}`);
          console.log(`   Precio: $${p.price}`);
          console.log(`   Stock: ${p.stock_status}`);
        });
      } else {
        console.log('   No se encontraron productos');
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status || error.message}`);
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CONCLUSIÓN');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('Identifica qué términos de búsqueda funcionan');
  console.log('Ajusta la normalización según los productos reales');
}

checkProducts();
