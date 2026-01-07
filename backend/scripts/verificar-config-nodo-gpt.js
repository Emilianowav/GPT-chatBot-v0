import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf39';

async function verificarConfigNodoGPT() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    const flow = await db.collection('flows').findOne({
      _id: new mongoose.Types.ObjectId(FLOW_ID)
    });

    if (!flow) {
      console.error('❌ Flujo no encontrado');
      return;
    }

    console.log('📊 FLUJO:', flow.nombre);
    console.log('   Nodos:', flow.nodes.length);
    console.log('   Edges:', flow.edges.length);
    console.log('');

    // Buscar nodo GPT
    const nodoGPT = flow.nodes.find(n => n.id === 'gpt-conversacional-3-bloques');
    
    if (!nodoGPT) {
      console.error('❌ Nodo GPT no encontrado');
      return;
    }

    console.log('🤖 NODO GPT ENCONTRADO:');
    console.log('   ID:', nodoGPT.id);
    console.log('   Type:', nodoGPT.type);
    console.log('   Label:', nodoGPT.data.label);
    console.log('');

    const config = nodoGPT.data.config;

    console.log('⚙️  CONFIGURACIÓN:');
    console.log('   Tipo:', config.tipo);
    console.log('   Modelo:', config.modelo);
    console.log('   Temperatura:', config.temperatura);
    console.log('   Max Tokens:', config.maxTokens);
    console.log('');

    console.log('📝 BLOQUE 1 - PERSONALIDAD:');
    if (config.personalidad) {
      console.log('   ✅ Configurada (' + config.personalidad.length + ' caracteres)');
      console.log('   Preview:', config.personalidad.substring(0, 100) + '...');
    } else {
      console.log('   ❌ NO configurada');
    }
    console.log('');

    console.log('📚 BLOQUE 2 - TÓPICOS:');
    if (config.topicos && config.topicos.length > 0) {
      console.log('   ✅ ' + config.topicos.length + ' tópicos configurados:');
      config.topicos.forEach((topico, i) => {
        console.log(`   ${i + 1}. ${topico.titulo}`);
        console.log(`      ID: ${topico.id}`);
        console.log(`      Contenido: ${topico.contenido.substring(0, 50)}...`);
        console.log(`      Keywords: ${topico.keywords?.join(', ') || 'ninguna'}`);
      });
    } else {
      console.log('   ❌ NO configurados');
    }
    console.log('');

    console.log('🔢 BLOQUE 3 - VARIABLES:');
    if (config.variablesRecopilar && config.variablesRecopilar.length > 0) {
      console.log('   ✅ ' + config.variablesRecopilar.length + ' variables configuradas:');
      config.variablesRecopilar.forEach((variable, i) => {
        console.log(`   ${i + 1}. ${variable.nombre} (${variable.tipo})`);
        console.log(`      Descripción: ${variable.descripcion}`);
        console.log(`      Obligatorio: ${variable.obligatorio ? 'SÍ' : 'NO'}`);
        if (variable.ejemplos) {
          console.log(`      Ejemplos: ${variable.ejemplos.join(', ')}`);
        }
      });
    } else {
      console.log('   ❌ NO configuradas');
    }
    console.log('');

    console.log('⚡ BLOQUE 4 - ACCIONES:');
    if (config.accionesCompletado && config.accionesCompletado.length > 0) {
      console.log('   ✅ ' + config.accionesCompletado.length + ' acciones configuradas:');
      config.accionesCompletado.forEach((accion, i) => {
        console.log(`   ${i + 1}. Tipo: ${accion.tipo}`);
        if (accion.contenido) console.log(`      Contenido: ${accion.contenido}`);
        if (accion.token) console.log(`      Token: ${accion.token}`);
        if (accion.variables) console.log(`      Variables: ${accion.variables.join(', ')}`);
      });
    } else {
      console.log('   ❌ NO configuradas');
    }
    console.log('');

    console.log('📋 RESUMEN:');
    console.log('   Personalidad:', config.personalidad ? '✅' : '❌');
    console.log('   Tópicos:', config.topicos?.length || 0);
    console.log('   Variables:', config.variablesRecopilar?.length || 0);
    console.log('   Acciones:', config.accionesCompletado?.length || 0);

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verificarConfigNodoGPT();
