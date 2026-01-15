require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';

/**
 * Simular qué debería extraer el GPT Formateador con el historial real
 */

async function testGPTFormateadorExtraction() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db();
    const contactosCollection = db.collection('contactos_empresa');
    const flowsCollection = db.collection('flows');
    
    // Obtener historial real
    const contacto = await contactosCollection.findOne({ telefono: '5493794946066' });
    const historial = contacto?.conversaciones?.historial || [];
    
    // Obtener configuración del GPT Formateador
    const flowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const flow = await flowsCollection.findOne({ _id: flowId });
    const formateadorNode = flow.nodes.find(n => n.id === 'gpt-formateador');
    const config = formateadorNode.data.config;
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('TEST DE EXTRACCIÓN - GPT FORMATEADOR');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📚 HISTORIAL COMPLETO:\n');
    historial.forEach((msg, i) => {
      const role = i % 2 === 0 ? '👤 Usuario' : '🤖 Bot';
      console.log(`${i + 1}. ${role}: ${msg}`);
    });
    
    console.log('\n───────────────────────────────────────────────────────────\n');
    
    // Construir contexto como lo hace FlowExecutor
    let contexto = '';
    const fuenteDatos = config.configuracionExtraccion?.fuenteDatos || 'historial_completo';
    
    console.log(`🔧 Fuente de datos: ${fuenteDatos}\n`);
    
    if (fuenteDatos === 'historial_completo' && historial.length > 0) {
      for (let i = 0; i < historial.length; i += 2) {
        contexto += `Usuario: ${historial[i]}\n`;
        if (historial[i + 1]) {
          contexto += `Asistente: ${historial[i + 1]}\n`;
        }
      }
    }
    
    console.log('📝 CONTEXTO QUE RECIBE EL GPT FORMATEADOR:\n');
    console.log(contexto);
    console.log('\n───────────────────────────────────────────────────────────\n');
    
    // Mostrar configuración de extracción
    console.log('⚙️  CONFIGURACIÓN DE EXTRACCIÓN:\n');
    
    if (config.configuracionExtraccion) {
      console.log('Instrucciones de extracción:');
      console.log(config.configuracionExtraccion.instruccionesExtraccion);
      console.log('');
      
      console.log('Campos esperados:');
      if (config.configuracionExtraccion.camposEsperados) {
        config.configuracionExtraccion.camposEsperados.forEach(campo => {
          console.log(`  - ${campo.nombre} (${campo.tipoDato}) ${campo.requerido ? '- REQUERIDO' : '- OPCIONAL'}`);
          console.log(`    Descripción: ${campo.descripcion}`);
        });
      }
      console.log('');
      
      console.log('Formato de salida:');
      if (config.configuracionExtraccion.formatoSalida) {
        console.log(`  Tipo: ${config.configuracionExtraccion.formatoSalida.tipo || config.configuracionExtraccion.formatoSalida}`);
        if (config.configuracionExtraccion.formatoSalida.estructura) {
          console.log(`  Estructura: ${config.configuracionExtraccion.formatoSalida.estructura}`);
        }
        if (config.configuracionExtraccion.formatoSalida.ejemplo) {
          console.log(`  Ejemplo: ${config.configuracionExtraccion.formatoSalida.ejemplo}`);
        }
      }
    } else if (config.variablesRecopilar) {
      console.log('Variables a recopilar (modo legacy):');
      config.variablesRecopilar.forEach(v => {
        console.log(`  - ${v.nombre} (${v.tipo}) ${v.obligatorio ? '- OBLIGATORIO' : ''}`);
      });
    }
    
    console.log('\n───────────────────────────────────────────────────────────\n');
    
    // Análisis manual de lo que DEBERÍA extraerse
    console.log('🎯 ANÁLISIS MANUAL - QUÉ DEBERÍA EXTRAERSE:\n');
    
    const mensajesUsuario = [];
    for (let i = 0; i < historial.length; i += 2) {
      mensajesUsuario.push(historial[i]);
    }
    
    console.log('Mensajes del usuario:');
    mensajesUsuario.forEach((msg, i) => {
      console.log(`  ${i + 1}. "${msg}"`);
    });
    console.log('');
    
    // Buscar título mencionado
    let tituloEncontrado = null;
    let editorialEncontrada = null;
    let edicionEncontrada = null;
    
    // Buscar en mensajes del usuario
    mensajesUsuario.forEach(msg => {
      if (msg.toLowerCase().includes('harry potter')) {
        tituloEncontrado = msg;
      }
    });
    
    // Buscar en respuestas del bot (puede haber interpretado el título)
    for (let i = 1; i < historial.length; i += 2) {
      const respuestaBot = historial[i];
      if (respuestaBot.includes('Harry Potter y el Prisionero de Azkaban')) {
        tituloEncontrado = 'Harry Potter y el Prisionero de Azkaban';
      }
    }
    
    console.log('📊 RESULTADO ESPERADO DE LA EXTRACCIÓN:\n');
    console.log(JSON.stringify({
      titulo: tituloEncontrado,
      editorial: editorialEncontrada,
      edicion: edicionEncontrada
    }, null, 2));
    
    console.log('\n───────────────────────────────────────────────────────────\n');
    
    console.log('🔍 VERIFICACIÓN:\n');
    
    if (tituloEncontrado) {
      console.log(`✅ Título encontrado: "${tituloEncontrado}"`);
      console.log('   → Router debería evaluar {{titulo}} exists → TRUE');
      console.log('   → Debería ir a WooCommerce (route-2) ✅');
    } else {
      console.log('❌ Título NO encontrado');
      console.log('   → Router debería evaluar {{titulo}} not exists → TRUE');
      console.log('   → Debería ir a gpt-pedir-datos (route-1)');
    }
    
    if (!editorialEncontrada) {
      console.log('⚠️  Editorial NO encontrada (esperado)');
    }
    
    if (!edicionEncontrada) {
      console.log('⚠️  Edición NO encontrada (esperado)');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('CONCLUSIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (tituloEncontrado) {
      console.log('✅ El GPT Formateador DEBERÍA extraer el título del historial');
      console.log('✅ El Router DEBERÍA ir a WooCommerce');
      console.log('');
      console.log('🔴 PROBLEMA: Si el flujo fue a gpt-pedir-datos, significa que:');
      console.log('   1. El GPT Formateador NO extrajo el título correctamente, O');
      console.log('   2. El GPT Formateador extrajo el título pero NO lo guardó como variable global, O');
      console.log('   3. El Router NO encontró la variable global {{titulo}}');
    } else {
      console.log('⚠️  El historial no contiene suficiente información para extraer el título');
      console.log('✅ El flujo fue correctamente a gpt-pedir-datos');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

testGPTFormateadorExtraction();
