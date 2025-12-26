import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const API_URL = 'https://web-production-934d4.up.railway.app/api/v1';
const API_TOKEN = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';

async function testWorkflowCompleto() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // 1. VERIFICAR WORKFLOW
    console.log('═══════════════════════════════════════════════════════');
    console.log('1️⃣ VERIFICANDO WORKFLOW EN BD');
    console.log('═══════════════════════════════════════════════════════\n');

    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api || !api.workflows || api.workflows.length === 0) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];
    console.log('✅ Workflow encontrado:', workflow.nombre);
    console.log('   Total pasos:', workflow.steps.length);
    console.log('');

    // 2. SIMULAR DATOS RECOPILADOS
    console.log('═══════════════════════════════════════════════════════');
    console.log('2️⃣ SIMULANDO DATOS RECOPILADOS DEL USUARIO');
    console.log('═══════════════════════════════════════════════════════\n');

    const datosRecopilados = {
      deporte: '1',        // Paddle
      fecha: 'hoy',
      duracion: '1',       // 60 minutos
      hora_preferida: '19:00'
    };

    console.log('📦 Datos simulados:');
    console.log('   deporte:', datosRecopilados.deporte);
    console.log('   fecha:', datosRecopilados.fecha);
    console.log('   duracion:', datosRecopilados.duracion);
    console.log('   hora_preferida:', datosRecopilados.hora_preferida);
    console.log('');

    // 3. VERIFICAR PASO 4 (CONSULTAR DISPONIBILIDAD)
    console.log('═══════════════════════════════════════════════════════');
    console.log('3️⃣ VERIFICANDO PASO 4: CONSULTAR DISPONIBILIDAD');
    console.log('═══════════════════════════════════════════════════════\n');

    const paso4 = workflow.steps[4];
    console.log('📋 Paso 4:');
    console.log('   Nombre:', paso4.nombre);
    console.log('   Tipo:', paso4.tipo);
    console.log('   Endpoint ID:', paso4.endpointId);
    console.log('   mapeoParametros:', JSON.stringify(paso4.mapeoParametros, null, 2));
    console.log('');

    // 4. PROCESAR MAPEO DE PARÁMETROS
    console.log('═══════════════════════════════════════════════════════');
    console.log('4️⃣ PROCESANDO MAPEO DE PARÁMETROS');
    console.log('═══════════════════════════════════════════════════════\n');

    const params = {};
    
    if (paso4.mapeoParametros) {
      console.log('✅ Mapeo encontrado');
      
      for (const [paramName, varTemplate] of Object.entries(paso4.mapeoParametros)) {
        // Extraer nombre de variable de {{variable}}
        let varName = varTemplate;
        if (varTemplate.startsWith('{{') && varTemplate.endsWith('}}')) {
          varName = varTemplate.slice(2, -2);
        }
        
        const valor = datosRecopilados[varName];
        
        console.log(`   ${paramName}:`);
        console.log(`      Template: ${varTemplate}`);
        console.log(`      Variable: ${varName}`);
        console.log(`      Valor: ${valor}`);
        
        if (valor !== undefined) {
          params[paramName] = valor;
        }
      }
    } else {
      console.log('❌ No hay mapeo de parámetros');
    }

    console.log('\n📤 Parámetros finales:', JSON.stringify(params, null, 2));
    console.log('');

    // 5. TRANSFORMAR PARÁMETROS (fecha: "hoy" → "2025-12-26", duracion: "1" → 60)
    console.log('═══════════════════════════════════════════════════════');
    console.log('5️⃣ TRANSFORMANDO PARÁMETROS');
    console.log('═══════════════════════════════════════════════════════\n');

    // Transformar fecha
    if (params.fecha === 'hoy') {
      const hoy = new Date();
      params.fecha = hoy.toISOString().split('T')[0];
      console.log(`✅ fecha: "hoy" → "${params.fecha}"`);
    }

    // Transformar duración
    if (params.duracion) {
      const duracionMap = { '1': 60, '2': 90, '3': 120 };
      const duracionOriginal = params.duracion;
      params.duracion = duracionMap[params.duracion] || parseInt(params.duracion);
      console.log(`✅ duracion: "${duracionOriginal}" → ${params.duracion}`);
    }

    console.log('\n📤 Parámetros transformados:', JSON.stringify(params, null, 2));
    console.log('');

    // 6. LLAMAR A LA API
    console.log('═══════════════════════════════════════════════════════');
    console.log('6️⃣ LLAMANDO A LA API DE DISPONIBILIDAD');
    console.log('═══════════════════════════════════════════════════════\n');

    const url = `${API_URL}/disponibilidad`;
    console.log('📍 URL:', url);
    console.log('📦 Query params:', params);
    console.log('🔑 Authorization: Bearer', API_TOKEN.substring(0, 20) + '...');
    console.log('');

    try {
      const response = await axios.get(url, {
        params: params,
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      });

      console.log('✅ Respuesta de la API:');
      console.log('   Status:', response.status);
      console.log('   Data:', JSON.stringify(response.data, null, 2));
      console.log('');

      // 7. ANALIZAR RESPUESTA
      console.log('═══════════════════════════════════════════════════════');
      console.log('7️⃣ ANALIZANDO RESPUESTA');
      console.log('═══════════════════════════════════════════════════════\n');

      const data = response.data;

      if (data.canchas_disponibles && data.canchas_disponibles.length > 0) {
        console.log(`✅ ${data.canchas_disponibles.length} canchas disponibles:`);
        data.canchas_disponibles.forEach((cancha, i) => {
          console.log(`   ${i + 1}. ${cancha.nombre || cancha.id}`);
          console.log(`      Hora: ${cancha.hora_inicio || cancha.hora}`);
          console.log(`      Duración: ${cancha.duracion} min`);
          console.log(`      Precio: $${cancha.precio}`);
        });
      } else {
        console.log('❌ NO HAY CANCHAS DISPONIBLES');
        console.log('');
        console.log('🔍 DIAGNÓSTICO:');
        console.log('   La API devuelve arrays vacíos aunque existan canchas libres.');
        console.log('   Esto indica que:');
        console.log('   1. La API no está consultando correctamente la BD de reservas');
        console.log('   2. La API no está calculando correctamente los slots disponibles');
        console.log('   3. La API puede estar usando una BD diferente o vacía');
        console.log('');
        console.log('💡 SOLUCIÓN:');
        console.log('   Revisar el código de la API en Railway:');
        console.log('   - Endpoint: GET /api/v1/disponibilidad');
        console.log('   - Verificar que consulte la BD correcta');
        console.log('   - Verificar que calcule slots disponibles correctamente');
      }

      if (data.alternativas && data.alternativas.length > 0) {
        console.log(`\n📅 ${data.alternativas.length} alternativas:`);
        data.alternativas.forEach((alt, i) => {
          console.log(`   ${i + 1}. ${alt.mensaje || alt.descripcion}`);
        });
      }

    } catch (error) {
      console.error('❌ Error al llamar a la API:');
      console.error('   Mensaje:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Test completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testWorkflowCompleto();
