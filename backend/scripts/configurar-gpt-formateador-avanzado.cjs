const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function configurarGPTFormateadorAvanzado() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');

    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    console.log('📊 Flujo encontrado:', flow.nombre);

    // Encontrar el nodo gpt-formateador
    const gptFormateadorNode = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    if (!gptFormateadorNode) {
      console.log('❌ Nodo gpt-formateador no encontrado');
      return;
    }

    console.log('\n📝 Nodo gpt-formateador encontrado');
    console.log('   Tipo actual:', gptFormateadorNode.data.config.tipo);

    // NUEVA CONFIGURACIÓN AVANZADA
    const nuevaConfiguracion = {
      tipo: 'formateador',
      module: 'gpt-formateador',
      modelo: 'gpt-3.5-turbo',
      temperatura: 0.1,
      maxTokens: 500,
      outputFormat: 'json',
      
      // CONFIGURACIÓN AVANZADA DE EXTRACCIÓN
      configuracionExtraccion: {
        instruccionesExtraccion: `Analiza la conversación entre el usuario y el asistente de la librería.
Extrae la información sobre el libro que el usuario está buscando:

1. TÍTULO DEL LIBRO: Identifica el título completo o parcial que el usuario mencionó
2. EDITORIAL: Si el usuario mencionó una editorial específica, extráela. Si dijo "cualquiera", "cualquier editorial", o no mencionó nada, deja este campo como null
3. EDICIÓN: Si el usuario mencionó una edición específica, extráela. Si dijo "cualquiera", "cualquier edición", o no mencionó nada, deja este campo como null

IMPORTANTE:
- Si el usuario dice "cualquiera", "cualquier", "no importa", "da igual", etc., ese campo debe ser null
- Extrae el título tal como lo mencionó el usuario (ej: "Harry Potter 3", "tercer libro de harry potter")
- No inventes información que no esté en la conversación`,

        fuenteDatos: 'historial_completo',
        
        formatoSalida: {
          tipo: 'json',
          estructura: '{ "titulo_libro": string, "editorial": string | null, "edicion": string | null }',
          ejemplo: '{ "titulo_libro": "Harry Potter 3", "editorial": null, "edicion": null }'
        },
        
        camposEsperados: [
          {
            nombre: 'titulo_libro',
            descripcion: 'Título del libro que el usuario mencionó (completo o parcial)',
            tipoDato: 'string',
            requerido: true,
            valorPorDefecto: null
          },
          {
            nombre: 'editorial',
            descripcion: 'Editorial del libro si la mencionó específicamente, null si dijo "cualquiera" o no mencionó',
            tipoDato: 'string',
            requerido: false,
            valorPorDefecto: null
          },
          {
            nombre: 'edicion',
            descripcion: 'Edición del libro si la mencionó específicamente, null si dijo "cualquiera" o no mencionó',
            tipoDato: 'string',
            requerido: false,
            valorPorDefecto: null
          }
        ]
      },
      
      globalVariablesOutput: ['titulo_libro', 'editorial', 'edicion']
    };

    // Actualizar configuración del nodo
    gptFormateadorNode.data.config = nuevaConfiguracion;

    console.log('\n🔧 Actualizando configuración...');

    // Actualizar en MongoDB
    const resultado = await flowsCollection.updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { 
        $set: { 
          'nodes': flow.nodes
        } 
      }
    );

    if (resultado.modifiedCount > 0) {
      console.log('\n✅ NODO GPT-FORMATEADOR ACTUALIZADO EXITOSAMENTE');
      console.log('\n📋 NUEVA CONFIGURACIÓN:');
      console.log('   ✅ Tipo: formateador');
      console.log('   ✅ Modelo: gpt-3.5-turbo (temperatura 0.1)');
      console.log('   ✅ Fuente de datos: historial_completo');
      console.log('   ✅ Formato salida: JSON');
      console.log('   ✅ Campos a extraer:');
      console.log('      - titulo_libro (requerido)');
      console.log('      - editorial (opcional)');
      console.log('      - edicion (opcional)');
      console.log('\n💡 INSTRUCCIONES PERSONALIZADAS:');
      console.log('   - Analiza conversación completa');
      console.log('   - Detecta "cualquiera" como null');
      console.log('   - Extrae título tal como lo mencionó el usuario');
      console.log('\n🎯 PRÓXIMO PASO:');
      console.log('   Espera ~3 min para que Render termine el deploy');
      console.log('   Luego ejecuta: node scripts/limpiar-mi-numero.js');
      console.log('   Y prueba con: "Quiero Harry Potter 3"');
    } else {
      console.log('\n⚠️  No se realizaron cambios');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

configurarGPTFormateadorAvanzado();
