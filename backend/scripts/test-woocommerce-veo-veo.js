import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WOOCOMMERCE_URL = 'https://www.veoveolibros.com.ar';
const CONSUMER_KEY = 'ck_1f3a8bcc67796cf3d2d00ea950274bbe651da939';
const CONSUMER_SECRET = 'cs_0170ad344d889ae6b305f3d41021f1af4dfd4a41';

async function testWooCommerce() {
  try {
    console.log('🔍 Testeando conexión con WooCommerce de Veo Veo...\n');
    console.log('URL:', WOOCOMMERCE_URL);
    console.log('');

    // Test 1: Listar productos
    console.log('📚 TEST 1: Listar productos');
    const productosResponse = await axios.get(
      `${WOOCOMMERCE_URL}/wp-json/wc/v3/products`,
      {
        params: {
          per_page: 5,
          status: 'publish'
        },
        auth: {
          username: CONSUMER_KEY,
          password: CONSUMER_SECRET
        }
      }
    );

    console.log('✅ Productos obtenidos:', productosResponse.data.length);
    if (productosResponse.data.length > 0) {
      console.log('\n📖 Primeros productos:');
      productosResponse.data.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
        console.log(`      ID: ${p.id}`);
        console.log(`      Precio: $${p.price}`);
        console.log(`      Stock: ${p.stock_status}`);
        console.log('');
      });
    }

    // Test 2: Listar categorías
    console.log('📂 TEST 2: Listar categorías');
    const categoriasResponse = await axios.get(
      `${WOOCOMMERCE_URL}/wp-json/wc/v3/products/categories`,
      {
        params: {
          per_page: 10
        },
        auth: {
          username: CONSUMER_KEY,
          password: CONSUMER_SECRET
        }
      }
    );

    console.log('✅ Categorías obtenidas:', categoriasResponse.data.length);
    if (categoriasResponse.data.length > 0) {
      console.log('\n📂 Categorías disponibles:');
      categoriasResponse.data.slice(0, 5).forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name} (ID: ${c.id}) - ${c.count} productos`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ CONEXIÓN EXITOSA - WooCommerce funcionando correctamente');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERROR al conectar con WooCommerce:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Mensaje:', error.response.data?.message || error.response.statusText);
      console.error('   Datos:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

testWooCommerce();
