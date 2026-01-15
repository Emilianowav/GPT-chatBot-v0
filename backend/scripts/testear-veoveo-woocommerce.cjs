require('dotenv').config();
const axios = require('axios');

// Credenciales de VeoVeo WooCommerce
const VEOVEO_URL = 'https://www.veoveolibros.com.ar';
const CONSUMER_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
const CONSUMER_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

async function testearVeoVeo() {
  try {
    console.log('🔍 TESTEANDO ENDPOINTS DE VEOVEO WOOCOMMERCE');
    console.log('═══════════════════════════════════════\n');
    console.log(`📍 URL: ${VEOVEO_URL}`);
    console.log(`🔑 Consumer Key: ${CONSUMER_KEY.substring(0, 15)}...`);
    console.log('');

    // Test 1: Listar primeros 10 productos
    console.log('📚 TEST 1: LISTAR PRIMEROS 10 PRODUCTOS');
    console.log('─────────────────────────────────────');
    try {
      const response = await axios.get(`${VEOVEO_URL}/wp-json/wc/v3/products`, {
        params: {
          per_page: 10,
          orderby: 'title',
          order: 'asc'
        },
        auth: {
          username: CONSUMER_KEY,
          password: CONSUMER_SECRET
        }
      });

      const products = response.data;
      console.log(`✅ Encontrados: ${products.length} productos\n`);

      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Precio: $${product.price}`);
        console.log(`   Stock: ${product.stock_status}`);
        console.log('');
      });
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status} - ${error.response?.statusText}`);
      console.log(`   Mensaje: ${error.response?.data?.message || error.message}\n`);
    }

    // Test 2: Buscar "Harry Potter"
    console.log('═══════════════════════════════════════');
    console.log('🔍 TEST 2: BUSCAR "Harry Potter"');
    console.log('─────────────────────────────────────');
    try {
      const response = await axios.get(`${VEOVEO_URL}/wp-json/wc/v3/products`, {
        params: {
          search: 'Harry Potter',
          per_page: 10
        },
        auth: {
          username: CONSUMER_KEY,
          password: CONSUMER_SECRET
        }
      });

      const products = response.data;
      console.log(`✅ Encontrados: ${products.length} productos\n`);

      if (products.length > 0) {
        products.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name}`);
          console.log(`   ID: ${product.id}`);
          console.log(`   Precio: $${product.price}`);
          console.log('');
        });
      } else {
        console.log('   (Sin resultados)\n');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status} - ${error.response?.statusText}`);
      console.log(`   Mensaje: ${error.response?.data?.message || error.message}\n`);
    }

    // Test 3: Buscar "harry potter 5"
    console.log('═══════════════════════════════════════');
    console.log('🔍 TEST 3: BUSCAR "harry potter 5"');
    console.log('─────────────────────────────────────');
    try {
      const response = await axios.get(`${VEOVEO_URL}/wp-json/wc/v3/products`, {
        params: {
          search: 'harry potter 5',
          per_page: 10
        },
        auth: {
          username: CONSUMER_KEY,
          password: CONSUMER_SECRET
        }
      });

      const products = response.data;
      console.log(`✅ Encontrados: ${products.length} productos\n`);

      if (products.length > 0) {
        products.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name}`);
          console.log(`   ID: ${product.id}`);
          console.log(`   Precio: $${product.price}`);
          console.log('');
        });
      } else {
        console.log('   (Sin resultados)\n');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status} - ${error.response?.statusText}`);
      console.log(`   Mensaje: ${error.response?.data?.message || error.message}\n`);
    }

    // Test 4: Buscar "Harry Potter y la Orden del Fénix"
    console.log('═══════════════════════════════════════');
    console.log('🔍 TEST 4: BUSCAR "Harry Potter y la Orden del Fénix"');
    console.log('─────────────────────────────────────');
    try {
      const response = await axios.get(`${VEOVEO_URL}/wp-json/wc/v3/products`, {
        params: {
          search: 'Harry Potter y la Orden del Fénix',
          per_page: 10
        },
        auth: {
          username: CONSUMER_KEY,
          password: CONSUMER_SECRET
        }
      });

      const products = response.data;
      console.log(`✅ Encontrados: ${products.length} productos\n`);

      if (products.length > 0) {
        products.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name}`);
          console.log(`   ID: ${product.id}`);
          console.log(`   Precio: $${product.price}`);
          console.log('');
        });
      } else {
        console.log('   (Sin resultados)\n');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.response?.status} - ${error.response?.statusText}`);
      console.log(`   Mensaje: ${error.response?.data?.message || error.message}\n`);
    }

    // Test 5: Verificar parámetros válidos de orderby
    console.log('═══════════════════════════════════════');
    console.log('🔍 TEST 5: VERIFICAR PARÁMETROS ORDERBY');
    console.log('─────────────────────────────────────');
    
    const orderbyOptions = ['date', 'id', 'title', 'popularity', 'rating'];
    
    for (const orderby of orderbyOptions) {
      try {
        const response = await axios.get(`${VEOVEO_URL}/wp-json/wc/v3/products`, {
          params: {
            per_page: 1,
            orderby: orderby
          },
          auth: {
            username: CONSUMER_KEY,
            password: CONSUMER_SECRET
          }
        });
        console.log(`✅ orderby="${orderby}" - FUNCIONA`);
      } catch (error) {
        console.log(`❌ orderby="${orderby}" - ERROR: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✅ TESTS COMPLETADOS');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testearVeoVeo();
