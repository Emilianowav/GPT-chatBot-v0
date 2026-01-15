require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function compararConfig() {
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

    const woocommerce = flow.nodes.find(n => n.id === 'woocommerce');
    const formateador = flow.nodes.find(n => n.id === 'gpt-formateador');

    console.log('📊 COMPARACIÓN: CONFIGURACIÓN vs REALIDAD DE VEOVEO');
    console.log('═══════════════════════════════════════\n');

    console.log('🛍️  NODO WOOCOMMERCE:');
    console.log('─────────────────────────────────────');
    console.log(`   Módulo: ${woocommerce.data.config.module}`);
    console.log(`   Parámetro search: ${woocommerce.data.config.params.search}`);
    console.log(`   Per page: ${woocommerce.data.config.params.per_page}`);
    console.log('');

    console.log('📝 NODO FORMATEADOR:');
    console.log('─────────────────────────────────────');
    console.log(`   Tipo: ${formateador.data.config.tipo}`);
    console.log(`   Extraction enabled: ${formateador.data.config.extractionConfig?.enabled}`);
    console.log('');

    console.log('🔍 REALIDAD DE VEOVEO:');
    console.log('─────────────────────────────────────');
    console.log('   Productos Harry Potter encontrados:');
    console.log('   1. HARRY POTTER Y LA ORDEN DEL FENIX (sin tilde)');
    console.log('   2. HARRY POTTER 03 PRISIONERO DE AZKABAN');
    console.log('   3. HARRY POTTER 01 LA PIEDRA FILOSOFAL');
    console.log('   4. HARRY POTTER 04 EL CALIZ DE FUEGO');
    console.log('');
    console.log('   Búsquedas que FUNCIONAN:');
    console.log('   ✅ "Harry Potter" → 7 productos');
    console.log('   ✅ "Harry Potter y la Orden del Fenix" → 1 producto');
    console.log('');
    console.log('   Búsquedas que NO FUNCIONAN:');
    console.log('   ❌ "harry potter 5" → 0 productos');
    console.log('   ❌ "Harry Potter y la Orden del Fénix" (con tilde) → 0 productos');
    console.log('');

    console.log('💡 PROBLEMA IDENTIFICADO:');
    console.log('─────────────────────────────────────');
    console.log('   1. El formateador normaliza "harry potter 5" a:');
    console.log('      "Harry Potter y la Orden del Fénix" (con tilde)');
    console.log('');
    console.log('   2. Pero en VeoVeo el producto se llama:');
    console.log('      "HARRY POTTER Y LA ORDEN DEL FENIX" (sin tilde)');
    console.log('');
    console.log('   3. WooCommerce no encuentra coincidencia exacta');
    console.log('');

    console.log('✅ SOLUCIÓN PROPUESTA:');
    console.log('─────────────────────────────────────');
    console.log('   Opción 1: Buscar solo "Harry Potter" (genérico)');
    console.log('   → Encuentra 7 productos, GPT puede filtrar después');
    console.log('');
    console.log('   Opción 2: Mapear números a títulos SIN tildes');
    console.log('   → "harry potter 5" → "Harry Potter Orden Fenix"');
    console.log('');
    console.log('   Opción 3: Buscar con palabras clave principales');
    console.log('   → "harry potter 5" → "Harry Potter 5"');
    console.log('   → Confiar en la búsqueda fuzzy de WooCommerce');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Desconectado');
  }
}

compararConfig();
