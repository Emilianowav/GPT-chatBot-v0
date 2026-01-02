import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = '2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a';
const BASE_URL = 'https://app1.intercapital.ar/api/chatbot';

async function testAPI() {
  console.log('🧪 TEST API INTERCAPITAL\n');
  
  // Test 1: Validar usuario
  console.log('1️⃣ Test: Validar Usuario');
  try {
    const response = await axios.get(`${BASE_URL}/usuarios/validate`, {
      params: { comitente: '18728' },
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Respuesta:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test 2: Crear orden (query params)
  console.log('2️⃣ Test: Crear Orden (query params)');
  try {
    const response = await axios.post(`${BASE_URL}/ordenes`, null, {
      params: {
        comitente: 18728,
        operacion: 'COMPRA',
        symbol: 'GGAL',
        cantidad: 1,
        precio: 8370
      },
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Respuesta:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test 3: Crear orden (body)
  console.log('3️⃣ Test: Crear Orden (body)');
  try {
    const response = await axios.post(`${BASE_URL}/ordenes`, {
      comitente: 18728,
      operacion: 'COMPRA',
      symbol: 'GGAL',
      cantidad: 1,
      precio: 8370
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Respuesta:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test 4: Crear orden (body completo con todos los campos)
  console.log('4️⃣ Test: Crear Orden (body completo)');
  try {
    const response = await axios.post(`${BASE_URL}/ordenes`, {
      comitente: 18728,
      operacion: 'COMPRA',
      symbol: 'GGAL',
      cantidad: 1,
      precio: 8370,
      plazo: 'CONTADO',
      tipo_orden: 'MERCADO',
      notas: 'Orden desde WhatsApp',
      metadata: {
        whatsapp_phone: '5493794946066',
        conversation_id: 'test-123'
      }
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Respuesta:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status);
    console.log('   Data:', JSON.stringify(error.response?.data, null, 2) || error.message);
  }
}

testAPI();
