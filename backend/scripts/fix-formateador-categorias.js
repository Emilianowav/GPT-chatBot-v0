import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixFormateadorCategorias() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const flowsCollection = db.collection('flows');
    
    const flow = await flowsCollection.findOne({ _id: new mongoose.Types.ObjectId('695a156681f6d67f0ae9cf40') });
    
    if (!flow) {
      console.log('❌ Flow no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');
    
    if (!formateador) {
      console.log('❌ Nodo gpt-formateador no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n🔧 Actualizando extractionConfig del formateador...\n');
    
    const nuevoSystemPrompt = `Eres un extractor de datos de búsqueda de libros.

TAREA: Extraer información del mensaje del usuario sobre el libro que busca.

VARIABLES A EXTRAER:
- titulo: El título del libro, autor, o CATEGORÍA (autoayuda, novela, infantil, etc.)
- autor: El autor del libro (puede ser null)
- editorial: La editorial del libro (OPCIONAL, puede ser null)
- edicion: La edición del libro (OPCIONAL, puede ser null)

⚠️ REGLA CRÍTICA - CATEGORÍAS:
Si el usuario menciona una CATEGORÍA o GÉNERO (autoayuda, novela, infantil, ficción, etc.):
→ Guardar la categoría en "titulo"
→ Marcar variables_completas = true
→ Esto permitirá buscar en WooCommerce por categoría

EJEMPLOS:

Usuario: "Busco libros de autoayuda"
→ {
  "titulo": "autoayuda",
  "autor": null,
  "editorial": null,
  "edicion": null,
  "variables_completas": true,
  "variables_faltantes": []
}

Usuario: "Autoayuda"
→ {
  "titulo": "autoayuda",
  "autor": null,
  "editorial": null,
  "edicion": null,
  "variables_completas": true,
  "variables_faltantes": []
}

Usuario: "Novelas"
→ {
  "titulo": "novela",
  "autor": null,
  "editorial": null,
  "edicion": null,
  "variables_completas": true,
  "variables_faltantes": []
}

Usuario: "Libros infantiles"
→ {
  "titulo": "infantil",
  "autor": null,
  "editorial": null,
  "edicion": null,
  "variables_completas": true,
  "variables_faltantes": []
}

Usuario: "García Márquez"
→ {
  "titulo": null,
  "autor": "Gabriel García Márquez",
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

Usuario: "Hola"
→ {
  "titulo": null,
  "autor": null,
  "editorial": null,
  "edicion": null,
  "variables_completas": false,
  "variables_faltantes": ["titulo", "autor"]
}

REGLAS IMPORTANTES:
1. Si el usuario menciona un TÍTULO, AUTOR o CATEGORÍA → variables_completas = true
2. Si el usuario NO menciona nada específico → variables_completas = false
3. Las variables editorial y edicion son OPCIONALES
4. CATEGORÍAS comunes: autoayuda, novela, infantil, ficción, romance, thriller, fantasía, ciencia ficción, poesía, biografía, historia, etc.

IMPORTANTE: 
- Solo marca variables_completas = false si NO tienes ni título, ni autor, ni categoría
- Si tienes título O autor O categoría, marca variables_completas = true para buscar en WooCommerce`;

    formateador.data.config.extractionConfig.systemPrompt = nuevoSystemPrompt;
    
    await flowsCollection.updateOne(
      { _id: flow._id },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('✅ ExtractionConfig actualizado exitosamente');
    console.log('\n📋 Cambios principales:');
    console.log('   ✅ Ahora reconoce CATEGORÍAS (autoayuda, novela, infantil, etc.)');
    console.log('   ✅ Guarda categorías en "titulo" para buscar en WooCommerce');
    console.log('   ✅ Marca variables_completas = true cuando hay categoría');
    console.log('\n🔧 Ahora cuando usuario diga "Autoayuda":');
    console.log('   1. Formateador extrae: titulo = "autoayuda", variables_completas = true');
    console.log('   2. Router ve variables_completas = true → Va a WooCommerce');
    console.log('   3. WooCommerce busca "autoayuda" → Encuentra productos reales');
    console.log('   4. GPT Asistente recibe productos reales → NO inventa');
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixFormateadorCategorias();
