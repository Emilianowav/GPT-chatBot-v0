const axios = require('axios');

/**
 * Test directo a WooCommerce API para identificar qué parámetro causa el error 400
 */

const BASE_URL = 'https://www.veoveolibros.com.ar/wp-json/wc/v3';
const CONSUMER_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
const CONSUMER_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

async function testWooCommerce() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('TEST DIRECTO A WOOCOMMERCE API');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const tests = [
    {
      name: 'Test 1: Solo credenciales',
      params: {}
    },
    {
      name: 'Test 2: Con search',
      params: { search: 'Harry Potter 3' }
    },
    {
      name: 'Test 3: Con search + per_page',
      params: { search: 'Harry Potter 3', per_page: 100 }
    },
    {
      name: 'Test 4: Con search + per_page + orderby',
      params: { search: 'Harry Potter 3', per_page: 100, orderby: 'relevance' }
    },
    {
      name: 'Test 5: Con search + per_page + orderby + status',
      params: { search: 'Harry Potter 3', per_page: 100, orderby: 'relevance', status: 'publish' }
    },
    {
      name: 'Test 6: Sin orderby ni status',
      params: { search: 'Harry Potter 3', per_page: 100 }
    }
  ];
  
  for (const test of tests) {
    console.log(`\n🧪 ${test.name}`);
    console.log(`   Parámetros:`, JSON.stringify(test.params, null, 2));
    
    try {
      const response = await axios.get(`${BASE_URL}/products`, {
        params: {
          ...test.params,
          consumer_key: CONSUMER_KEY,
          consumer_secret: CONSUMER_SECRET
        },
        timeout: 10000
      });
      
      console.log(`   ✅ SUCCESS - Status: ${response.status}`);
      console.log(`   📊 Items: ${response.data.length}`);
      console.log(`   📋 Headers:`, {
        'x-wp-total': response.headers['x-wp-total'],
        'x-wp-totalpages': response.headers['x-wp-totalpages']
      });
      
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ ERROR ${error.response.status}: ${error.response.statusText}`);
        console.log(`   📝 Response data:`, error.response.data);
      } else {
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CONCLUSIÓN');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('Identifica qué parámetro causa el error 400');
  console.log('Compara los tests exitosos vs fallidos');
}

testWooCommerce();
