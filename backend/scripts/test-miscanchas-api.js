/**
 * Script para probar la conexión con la API de Mis Canchas
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function main() {
  console.log('🧪 Test de conexión con API de Mis Canchas');
  console.log('==========================================\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    // Obtener la configuración de API
    const apiConfig = await db.collection('api_configurations').findOne({ nombre: 'Mis Canchas API' });
    
    if (!apiConfig) {
      console.error('❌ No se encontró configuración de API');
      process.exit(1);
    }

    const baseUrl = apiConfig.baseUrl;
    const apiKey = apiConfig.autenticacion?.configuracion?.token;

    console.log(`📡 Base URL: ${baseUrl}`);
    console.log(`🔑 API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'NO CONFIGURADA'}\n`);

    if (!apiKey) {
      console.error('❌ API Key no configurada');
      process.exit(1);
    }

    // Test 1: Obtener deportes
    console.log('📋 Test 1: GET /deportes');
    console.log('-'.repeat(40));
    
    try {
      const deportesResponse = await fetch(`${baseUrl}/deportes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (deportesResponse.ok) {
        const deportes = await deportesResponse.json();
        console.log('✅ Respuesta:', JSON.stringify(deportes, null, 2));
      } else {
        console.log(`❌ Error ${deportesResponse.status}: ${await deportesResponse.text()}`);
      }
    } catch (error) {
      console.log(`❌ Error de conexión: ${error.message}`);
    }

    console.log('\n');

    // Test 2: Consultar disponibilidad
    console.log('📋 Test 2: GET /disponibilidad');
    console.log('-'.repeat(40));
    
    // Fecha de mañana en formato YYYY-MM-DD
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaTest = manana.toISOString().split('T')[0];
    
    try {
      const url = `${baseUrl}/disponibilidad?fecha=${fechaTest}&deporte=paddle&duracion=60`;
      console.log(`   URL: ${url}`);
      
      const dispResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (dispResponse.ok) {
        const disponibilidad = await dispResponse.json();
        console.log('✅ Respuesta:', JSON.stringify(disponibilidad, null, 2));
      } else {
        console.log(`❌ Error ${dispResponse.status}: ${await dispResponse.text()}`);
      }
    } catch (error) {
      console.log(`❌ Error de conexión: ${error.message}`);
    }

    console.log('\n');

    // Test 3: Obtener precios
    console.log('📋 Test 3: GET /precios');
    console.log('-'.repeat(40));
    
    try {
      const preciosResponse = await fetch(`${baseUrl}/precios`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (preciosResponse.ok) {
        const precios = await preciosResponse.json();
        console.log('✅ Respuesta:', JSON.stringify(precios, null, 2));
      } else {
        console.log(`❌ Error ${preciosResponse.status}: ${await preciosResponse.text()}`);
      }
    } catch (error) {
      console.log(`❌ Error de conexión: ${error.message}`);
    }

    console.log('\n==========================================');
    console.log('🏁 Tests completados');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

main();
