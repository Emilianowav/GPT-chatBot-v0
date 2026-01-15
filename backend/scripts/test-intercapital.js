import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'https://app1.intercapital.ar/api/chatbot';
const API_KEY = '2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  },
  timeout: 30000
});

async function testIntercapital() {
  console.log('\n🧪 ========== TEST INTERCAPITAL API ==========\n');

  try {
    // TEST 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    try {
      const health = await axios.get(`${API_URL}/health`);
      console.log('   ✅ Health check OK:', health.data.status);
    } catch (error) {
      console.log('   ❌ Health check failed:', error.message);
    }

    // TEST 2: Validar Usuario (con comitente de prueba)
    console.log('\n2️⃣ Testing Validar Usuario...');
    const comitenteTest = 12345; // Reemplazar con comitente real para testing
    try {
      const validacion = await client.get('/usuarios/validate', {
        params: { comitente: comitenteTest }
      });
      console.log('   ✅ Usuario validado:', validacion.data);
    } catch (error) {
      if (error.response) {
        console.log('   ⚠️  Response:', error.response.status, error.response.data);
      } else {
        console.log('   ❌ Error:', error.message);
      }
    }

    // TEST 3: Crear Orden de Prueba
    console.log('\n3️⃣ Testing Crear Orden...');
    try {
      const orden = await client.post('/ordenes', {
        comitente: comitenteTest,
        operacion: 'COMPRA',
        symbol: 'AL30',
        cantidad: 10,
        precio: 850.50,
        plazo: 'CONTADO',
        tipo_orden: 'MERCADO',
        notas: 'Orden de prueba desde script',
        metadata: {
          whatsapp_phone: '+5491112345678',
          conversation_id: 'test_script_001'
        }
      });
      console.log('   ✅ Orden creada:', orden.data);
      
      // Guardar ID de orden para siguiente test
      const ordenId = orden.data.data?.id;
      
      if (ordenId) {
        // TEST 4: Consultar Orden
        console.log('\n4️⃣ Testing Consultar Orden...');
        try {
          const consulta = await client.get(`/ordenes/${ordenId}`);
          console.log('   ✅ Orden consultada:', consulta.data);
        } catch (error) {
          if (error.response) {
            console.log('   ⚠️  Response:', error.response.status, error.response.data);
          } else {
            console.log('   ❌ Error:', error.message);
          }
        }
      }
    } catch (error) {
      if (error.response) {
        console.log('   ⚠️  Response:', error.response.status, error.response.data);
      } else {
        console.log('   ❌ Error:', error.message);
      }
    }

    // TEST 5: Listar Órdenes
    console.log('\n5️⃣ Testing Listar Órdenes...');
    try {
      const lista = await client.get('/ordenes', {
        params: {
          comitente: comitenteTest,
          limit: 5
        }
      });
      console.log('   ✅ Órdenes listadas:', lista.data);
    } catch (error) {
      if (error.response) {
        console.log('   ⚠️  Response:', error.response.status, error.response.data);
      } else {
        console.log('   ❌ Error:', error.message);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TESTS COMPLETADOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testIntercapital();
