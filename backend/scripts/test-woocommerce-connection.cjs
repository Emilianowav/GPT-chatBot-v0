const axios = require('axios');

const BASE_URL = 'https://www.veoveolibros.com.ar/wp-json/wc/v3';
const CONSUMER_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
const CONSUMER_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

async function testWooCommerce() {
  console.log('🧪 PROBANDO CONEXIÓN WOOCOMMERCE\n');
  
  try {
    // Test 1: Listar todos los productos
    console.log('1️⃣ Listando todos los productos...');
    const response1 = await axios.get(`${BASE_URL}/products`, {
      auth: {
        username: CONSUMER_KEY,
        password: CONSUMER_SECRET
      },
      params: {
        per_page: 5,
        status: 'publish'
      }
    });
    
    console.log(`   ✅ Total de productos: ${response1.data.length}`);
    if (response1.data.length > 0) {
      console.log(`   📦 Primer producto: ${response1.data[0].name}`);
    }
    console.log('');
    
    // Test 2: Buscar "Harry Potter"
    console.log('2️⃣ Buscando "Harry Potter"...');
    const response2 = await axios.get(`${BASE_URL}/products`, {
      auth: {
        username: CONSUMER_KEY,
        password: CONSUMER_SECRET
      },
      params: {
        search: 'Harry Potter',
        per_page: 10,
        status: 'publish'
      }
    });
    
    console.log(`   ✅ Resultados: ${response2.data.length}`);
    response2.data.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} - $${p.price}`);
    });
    console.log('');
    
    // Test 3: Buscar "Harry Potter 5"
    console.log('3️⃣ Buscando "Harry Potter 5"...');
    const response3 = await axios.get(`${BASE_URL}/products`, {
      auth: {
        username: CONSUMER_KEY,
        password: CONSUMER_SECRET
      },
      params: {
        search: 'Harry Potter 5',
        per_page: 10,
        status: 'publish'
      }
    });
    
    console.log(`   ✅ Resultados: ${response3.data.length}`);
    response3.data.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} - $${p.price}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testWooCommerce();
