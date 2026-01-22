import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function actualizarFormateadorWooCommerce() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flowsCollection = db.collection('flows');
    
    const wooFlowId = new ObjectId('695a156681f6d67f0ae9cf40');
    const wooFlow = await flowsCollection.findOne({ _id: wooFlowId });
    
    if (!wooFlow) {
      console.log('❌ WooCommerce Flow no encontrado');
      return;
    }
    
    console.log('═'.repeat(80));
    console.log('🔧 ACTUALIZAR NODO FORMATEADOR');
    console.log('═'.repeat(80));
    
    const formateadorIndex = wooFlow.nodes.findIndex(n => n.id === 'gpt-formateador');
    
    if (formateadorIndex === -1) {
      console.log('❌ Nodo gpt-formateador no encontrado');
      return;
    }
    
    const nuevoSystemPrompt = `Eres un extractor de datos de búsqueda de libros.

TAREA: Extraer información del mensaje del usuario sobre el libro que busca.

VARIABLES A EXTRAER:
- titulo: El título del libro (puede ser null si solo menciona autor)
- autor: El autor del libro (puede ser null si solo menciona título)
- editorial: La editorial del libro (OPCIONAL, puede ser null)
- edicion: La edición del libro (OPCIONAL, puede ser null)

REGLAS IMPORTANTES:
1. Si el usuario menciona un TÍTULO o un AUTOR → Extraerlo y marcar variables_completas = true
2. Si el usuario NO menciona ni título ni autor → variables_completas = false
3. Las variables editorial y edicion son OPCIONALES (pueden ser null)
4. Con solo el título O solo el autor, es suficiente para buscar → variables_completas = true

EJEMPLOS:

Usuario: "Busco García Márquez"
→ {
  "titulo": null,
  "autor": "Gabriel García Márquez",
  "editorial": null,
  "edicion": null,
  "variables_completas": true,
  "variables_faltantes": []
}

Usuario: "Cien años de soledad"
→ {
  "titulo": "Cien años de soledad",
  "autor": null,
  "editorial": null,
  "edicion": null,
  "variables_completas": true,
  "variables_faltantes": []
}

Usuario: "Harry Potter"
→ {
  "titulo": "Harry Potter",
  "autor": null,
  "editorial": null,
  "edicion": null,
  "variables_completas": true,
  "variables_faltantes": []
}

Usuario: "Algo de garcia marques tenes?"
→ {
  "titulo": null,
  "autor": "Gabriel García Márquez",
  "editorial": null,
  "edicion": null,
  "variables_completas": true,
  "variables_faltantes": []
}

Usuario: "Hola"
→ {
  "titulo": null,
  "autor": null,
  "editorial": null,
  "edicion": null,
  "variables_completas": false,
  "variables_faltantes": ["titulo", "autor"]
}

IMPORTANTE: 
- Solo marca variables_completas = false si NO tienes ni título ni autor
- Si tienes título O autor, marca variables_completas = true para buscar en WooCommerce`;

    const extractionConfig = {
      enabled: true,
      method: 'advanced',
      contextSource: 'ultimo_mensaje',
      systemPrompt: nuevoSystemPrompt,
      variables: [
        {
          nombre: 'titulo',
          tipo: 'string',
          requerido: false,
          descripcion: 'Título del libro'
        },
        {
          nombre: 'autor',
          tipo: 'string',
          requerido: false,
          descripcion: 'Autor del libro'
        },
        {
          nombre: 'editorial',
          tipo: 'string',
          requerido: false,
          descripcion: 'Editorial del libro'
        },
        {
          nombre: 'edicion',
          tipo: 'string',
          requerido: false,
          descripcion: 'Edición del libro'
        },
        {
          nombre: 'variables_completas',
          tipo: 'boolean',
          requerido: true,
          descripcion: 'True si tiene al menos titulo o autor'
        },
        {
          nombre: 'variables_faltantes',
          tipo: 'array',
          requerido: true,
          descripcion: 'Array de variables faltantes'
        }
      ]
    };
    
    console.log('\n📝 Configuración anterior:');
    console.log('  extractionConfig:', wooFlow.nodes[formateadorIndex].data.config.extractionConfig ? 'Existe' : 'No existe');
    
    // Actualizar nodo
    wooFlow.nodes[formateadorIndex].data.config.extractionConfig = extractionConfig;
    wooFlow.nodes[formateadorIndex].data.config.tipo = 'formateador';
    wooFlow.nodes[formateadorIndex].data.config.outputFormat = 'json_object';
    
    console.log('\n✅ Nueva configuración:');
    console.log('  extractionConfig.enabled:', extractionConfig.enabled);
    console.log('  extractionConfig.method:', extractionConfig.method);
    console.log('  extractionConfig.variables:', extractionConfig.variables.length);
    console.log('  systemPrompt (primeros 100 chars):', nuevoSystemPrompt.substring(0, 100) + '...');
    
    // Guardar cambios
    console.log('\n💾 Guardando cambios...');
    
    const result = await flowsCollection.updateOne(
      { _id: wooFlowId },
      { 
        $set: { 
          nodes: wooFlow.nodes,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Cambios guardados');
    console.log(`   Modified count: ${result.modifiedCount}`);
    
    console.log('\n' + '═'.repeat(80));
    console.log('📋 RESUMEN');
    console.log('═'.repeat(80));
    
    console.log('\n✅ AHORA EL FLUJO FUNCIONARÁ ASÍ:');
    console.log('1. Usuario: "Algo de garcia marques tenes?"');
    console.log('2. Formateador extrae: autor = "Gabriel García Márquez", variables_completas = true');
    console.log('3. Router ve variables_completas = true → Va a WooCommerce');
    console.log('4. WooCommerce busca por autor y devuelve productos REALES');
    console.log('5. GPT presenta los productos reales con links');
    
    console.log('\n⚠️  ANTES (INCORRECTO):');
    console.log('1. Usuario: "Algo de garcia marques tenes?"');
    console.log('2. Formateador marcaba variables_completas = false');
    console.log('3. Router iba a "Faltan variables" → gpt-pedir-datos');
    console.log('4. GPT INVENTABA productos ficticios');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

actualizarFormateadorWooCommerce();
