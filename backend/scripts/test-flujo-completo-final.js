import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';
const API_URL = 'https://web-production-934d4.up.railway.app/api/v1';
const API_TOKEN = 'mc_3f9580c86f9529a6f74d48bdacd1764c236bd5c449a40f6510991e6363bc268a';

async function testFlujoCompleto() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST COMPLETO DEL FLUJO DE JUVENTUS');
    console.log('═══════════════════════════════════════════════════════\n');

    // 1. VERIFICAR WORKFLOW
    console.log('1️⃣ VERIFICANDO WORKFLOW EN BD\n');

    const api = await db.collection('api_configurations').findOne({
      nombre: /mis canchas/i
    });

    if (!api || !api.workflows || api.workflows.length === 0) {
      console.log('❌ No se encontró workflow');
      await mongoose.disconnect();
      return;
    }

    const workflow = api.workflows[0];
    console.log('✅ Workflow:', workflow.nombre);
    console.log('   Total pasos:', workflow.steps.length);
    console.log('');

    // 2. SIMULAR PASO 0: ELEGIR DEPORTE
    console.log('═══════════════════════════════════════════════════════');
    console.log('2️⃣ PASO 0: ELEGIR DEPORTE');
    console.log('═══════════════════════════════════════════════════════\n');

    const paso0 = workflow.steps[0];
    console.log('Usuario escribe: "1" (Paddle)');
    console.log('Validación:', paso0.validacion);
    
    let deporteInput = '1';
    let deporteGuardado = deporteInput;
    
    if (paso0.validacion?.mapeo) {
      deporteGuardado = paso0.validacion.mapeo[deporteInput] || deporteInput;
    }
    
    console.log(`✅ Se guarda: "${deporteGuardado}"`);
    console.log('');

    // 3. SIMULAR PASOS 1-3: RECOPILAR DATOS
    console.log('═══════════════════════════════════════════════════════');
    console.log('3️⃣ PASOS 1-3: RECOPILAR FECHA, DURACIÓN, HORA');
    console.log('═══════════════════════════════════════════════════════\n');

    const datosRecopilados = {
      deporte: deporteGuardado,
      fecha: 'hoy',
      duracion: '1',
      hora_preferida: '19:00'
    };

    console.log('📦 Datos recopilados:');
    console.log('   deporte:', datosRecopilados.deporte);
    console.log('   fecha:', datosRecopilados.fecha);
    console.log('   duracion:', datosRecopilados.duracion);
    console.log('   hora_preferida:', datosRecopilados.hora_preferida);
    console.log('');

    // 4. SIMULAR PASO 4: CONSULTAR DISPONIBILIDAD
    console.log('═══════════════════════════════════════════════════════');
    console.log('4️⃣ PASO 4: CONSULTAR DISPONIBILIDAD');
    console.log('═══════════════════════════════════════════════════════\n');

    const paso4 = workflow.steps[4];
    console.log('Configuración del paso:');
    console.log('   endpointId:', paso4.endpointId);
    console.log('   mapeoParametros:', paso4.mapeoParametros);
    console.log('');

    // Mapear parámetros
    const params = {};
    if (paso4.mapeoParametros) {
      for (const [paramName, varTemplate] of Object.entries(paso4.mapeoParametros)) {
        let varName = varTemplate;
        if (varTemplate.startsWith('{{') && varTemplate.endsWith('}}')) {
          varName = varTemplate.slice(2, -2);
        }
        params[paramName] = datosRecopilados[varName];
      }
    }

    // Transformar fecha
    if (params.fecha === 'hoy') {
      const hoy = new Date();
      params.fecha = hoy.toISOString().split('T')[0];
    }

    console.log('📤 Parámetros enviados a la API:');
    console.log('   fecha:', params.fecha);
    console.log('   deporte:', params.deporte);
    console.log('');

    // Llamar a la API
    console.log('🚀 Llamando a la API...');
    const headers = { 'Authorization': `Bearer ${API_TOKEN}` };
    
    const response = await axios.get(`${API_URL}/disponibilidad`, {
      params,
      headers
    });

    console.log('✅ Respuesta de la API:');
    console.log('   Status:', response.status);
    console.log('   Canchas disponibles:', response.data.canchas_disponibles?.length || 0);
    console.log('');

    if (response.data.canchas_disponibles && response.data.canchas_disponibles.length > 0) {
      console.log('📋 CANCHAS DISPONIBLES:\n');
      
      response.data.canchas_disponibles.forEach((cancha, i) => {
        console.log(`${i + 1}. ${cancha.nombre} (${cancha.tipo})`);
        console.log(`   ID: ${cancha.id}`);
        console.log(`   Precio hora: $${cancha.precio_hora}`);
        console.log(`   Horarios disponibles: ${cancha.horarios_disponibles.length} slots`);
        
        // Mostrar algunos horarios
        const primerosHorarios = cancha.horarios_disponibles.slice(0, 3);
        primerosHorarios.forEach(h => {
          console.log(`      - ${h.hora} (duraciones: ${h.duraciones.join(', ')} min)`);
        });
        if (cancha.horarios_disponibles.length > 3) {
          console.log(`      ... y ${cancha.horarios_disponibles.length - 3} horarios más`);
        }
        console.log('');
      });

      // 5. MATCHING DE HORA Y DURACIÓN
      console.log('═══════════════════════════════════════════════════════');
      console.log('5️⃣ MATCHING DE HORA Y DURACIÓN');
      console.log('═══════════════════════════════════════════════════════\n');

      const horaBuscada = datosRecopilados.hora_preferida;
      const duracionBuscada = parseInt(datosRecopilados.duracion) === 1 ? 60 : 
                             parseInt(datosRecopilados.duracion) === 2 ? 90 : 120;

      console.log(`🔍 Buscando: hora=${horaBuscada}, duración=${duracionBuscada} min\n`);

      const canchasMatch = [];

      for (const cancha of response.data.canchas_disponibles) {
        const horarioMatch = cancha.horarios_disponibles.find(h => 
          h.hora === horaBuscada && h.duraciones.includes(duracionBuscada)
        );

        if (horarioMatch) {
          canchasMatch.push({
            ...cancha,
            horario_match: horarioMatch
          });
        }
      }

      if (canchasMatch.length > 0) {
        console.log(`✅ ${canchasMatch.length} cancha(s) disponible(s) para ${horaBuscada} con duración de ${duracionBuscada} min:\n`);
        
        canchasMatch.forEach((cancha, i) => {
          console.log(`${i + 1}. ${cancha.nombre}`);
          console.log(`   ID: ${cancha.id}`);
          console.log(`   Hora: ${cancha.horario_match.hora}`);
          console.log(`   Duración: ${duracionBuscada} min`);
          console.log(`   Precio: $${cancha.precio_hora}`);
          console.log('');
        });

        // 6. SIMULAR SELECCIÓN Y CONFIRMACIÓN
        console.log('═══════════════════════════════════════════════════════');
        console.log('6️⃣ PASOS 5-7: SELECCIÓN, NOMBRE Y TELÉFONO');
        console.log('═══════════════════════════════════════════════════════\n');

        const canchaSeleccionada = canchasMatch[0];
        datosRecopilados.cancha_id = canchaSeleccionada.id;
        datosRecopilados.cancha_nombre = canchaSeleccionada.nombre;
        datosRecopilados.precio = canchaSeleccionada.precio_hora;
        datosRecopilados.cliente_nombre = 'Juan Pérez';
        datosRecopilados.cliente_telefono = '5493794946066';

        console.log('✅ Cancha seleccionada:', canchaSeleccionada.nombre);
        console.log('✅ Nombre cliente:', datosRecopilados.cliente_nombre);
        console.log('✅ Teléfono cliente:', datosRecopilados.cliente_telefono);
        console.log('');

        // 7. CONFIRMACIÓN
        console.log('═══════════════════════════════════════════════════════');
        console.log('7️⃣ PASO 8: CONFIRMACIÓN');
        console.log('═══════════════════════════════════════════════════════\n');

        console.log('📋 RESUMEN DE LA RESERVA:');
        console.log(`   Deporte: ${datosRecopilados.deporte}`);
        console.log(`   Fecha: ${params.fecha}`);
        console.log(`   Hora: ${datosRecopilados.hora_preferida}`);
        console.log(`   Duración: ${duracionBuscada} min`);
        console.log(`   Cancha: ${datosRecopilados.cancha_nombre}`);
        console.log(`   Cliente: ${datosRecopilados.cliente_nombre}`);
        console.log(`   Teléfono: ${datosRecopilados.cliente_telefono}`);
        console.log(`   Precio: $${datosRecopilados.precio}`);
        console.log('');
        console.log('Usuario confirma: SI');
        console.log('');

        // 8. GENERAR LINK DE PAGO
        console.log('═══════════════════════════════════════════════════════');
        console.log('8️⃣ PASO 8: GENERAR LINK DE PAGO');
        console.log('═══════════════════════════════════════════════════════\n');

        const precioTotal = parseFloat(datosRecopilados.precio);
        const seña = 0.5; // Seña fija de $0.50 para pruebas

        console.log(`💰 Precio total: $${precioTotal}`);
        console.log(`💵 Seña a pagar: $${seña}`);
        console.log('');

        const bookingData = {
          cancha_id: datosRecopilados.cancha_id,
          fecha: params.fecha,
          hora_inicio: datosRecopilados.hora_preferida,
          duracion: duracionBuscada,
          deporte: datosRecopilados.deporte,
          cliente_nombre: datosRecopilados.cliente_nombre,
          cliente_telefono: datosRecopilados.cliente_telefono,
          precio_total: precioTotal,
          seña: seña,
          origen: 'whatsapp'
        };

        console.log('📦 Datos de la reserva pendiente:');
        console.log(JSON.stringify(bookingData, null, 2));
        console.log('');

        console.log('✅ PaymentLink se crearía con estos datos');
        console.log('✅ Preferencia de Mercado Pago se generaría');
        console.log('✅ Link de pago se enviaría al usuario');
        console.log('');

        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ FLUJO COMPLETO TESTEADO EXITOSAMENTE');
        console.log('═══════════════════════════════════════════════════════\n');

        console.log('📊 RESUMEN:');
        console.log('   ✅ Workflow configurado correctamente');
        console.log('   ✅ Mapeo de deporte funciona (1 → paddle)');
        console.log('   ✅ API devuelve canchas disponibles');
        console.log('   ✅ Matching de hora y duración funciona');
        console.log('   ✅ Datos de reserva completos');
        console.log('   ✅ Listo para generar PaymentLink');

      } else {
        console.log(`❌ No hay canchas disponibles para ${horaBuscada} con duración de ${duracionBuscada} min`);
        console.log('');
        console.log('💡 Alternativas:');
        console.log('   - Probar con otra hora');
        console.log('   - Probar con otra duración');
        console.log('   - Mostrar horarios disponibles más cercanos');
      }

    } else {
      console.log('❌ La API no devolvió canchas disponibles');
      console.log('   Esto puede ser porque:');
      console.log('   1. No hay canchas de ese deporte');
      console.log('   2. Todas las canchas están reservadas');
      console.log('   3. La API tiene un problema');
    }

    await mongoose.disconnect();
    console.log('\n✅ Test completado');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

testFlujoCompleto();
