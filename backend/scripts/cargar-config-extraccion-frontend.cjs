require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function cargarConfigExtraccion() {
  try {
    console.log('✅ Conectando a MongoDB...\n');
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');

    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId(FLOW_ID) });

    if (!flow) {
      console.log('❌ Flujo no encontrado');
      return;
    }

    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    if (!formateador) {
      console.log('❌ Formateador no encontrado');
      return;
    }

    console.log('📊 CARGANDO CONFIGURACIÓN DE EXTRACCIÓN EN BD');
    console.log('═══════════════════════════════════════\n');

    // Configuración genérica para el frontend
    const configuracionExtraccion = {
      instruccionesExtraccion: `Analiza el historial de la conversación y extrae las variables solicitadas.

REGLAS GENERALES:
- Tolera errores ortográficos en el input del usuario
- Entiende abreviaciones comunes
- Normaliza el texto a formato estándar
- Si el usuario dice "cualquiera", aplícalo solo a variables opcionales
- Extrae información del historial completo, no solo del último mensaje

IMPORTANTE:
- Responde ÚNICAMENTE con un objeto JSON válido
- Si una variable no está presente, usa null
- No inventes información que el usuario no mencionó`,
      
      fuenteDatos: 'historial_completo',
      
      formatoSalida: {
        tipo: 'json',
        estructura: '{ "titulo": "string", "editorial": "string | null", "edicion": "string | null" }',
        ejemplo: '{ "titulo": "Harry Potter", "editorial": "Salamandra", "edicion": "2023" }'
      },
      
      camposEsperados: [
        {
          nombre: 'titulo',
          tipoDato: 'string',
          requerido: true,
          descripcion: 'Título del libro',
          valorPorDefecto: null
        },
        {
          nombre: 'editorial',
          tipoDato: 'string',
          requerido: false,
          descripcion: 'Editorial del libro',
          valorPorDefecto: null
        },
        {
          nombre: 'edicion',
          tipoDato: 'string',
          requerido: false,
          descripcion: 'Edición o año del libro',
          valorPorDefecto: null
        }
      ]
    };

    // Actualizar el nodo con la configuración
    formateador.data.config.configuracionExtraccion = configuracionExtraccion;

    // También actualizar extractionConfig para compatibilidad con backend
    formateador.data.config.extractionConfig = {
      enabled: true,
      method: 'advanced',
      contextSource: 'historial_completo',
      systemPrompt: configuracionExtraccion.instruccionesExtraccion,
      schema: {
        titulo: {
          type: 'string',
          required: true
        },
        editorial: {
          type: 'string',
          required: false
        },
        edicion: {
          type: 'string',
          required: false
        }
      },
      variables: configuracionExtraccion.camposEsperados.map(campo => ({
        nombre: campo.nombre,
        tipo: campo.tipoDato,
        requerido: campo.requerido,
        descripcion: campo.descripcion
      }))
    };

    console.log('💾 Guardando en MongoDB...\n');

    await flowsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );

    console.log('✅ Configuración cargada exitosamente\n');
    console.log('📋 CONFIGURACIÓN GUARDADA:');
    console.log('─────────────────────────────────────');
    console.log('✅ configuracionExtraccion (para frontend)');
    console.log('✅ extractionConfig (para backend)');
    console.log('');
    console.log('🎯 Ahora puedes:');
    console.log('   1. Abrir el Flow Builder en el frontend');
    console.log('   2. Click en el nodo gpt-formateador');
    console.log('   3. Ver la pestaña "Extracción"');
    console.log('   4. Editar las instrucciones desde el frontend');
    console.log('   5. Guardar y el backend usará esa configuración');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

cargarConfigExtraccion();
