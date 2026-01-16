/**
 * Script para Corregir Configuración de gpt-armar-carrito
 * 
 * PROBLEMA:
 * El nodo tiene:
 *   config.tipo = "formateador"
 *   config.systemPrompt = "..." (mal ubicado)
 *   config.extractionConfig.systemPrompt = undefined
 * 
 * SOLUCIÓN:
 * Mover systemPrompt a extractionConfig.systemPrompt
 * Agregar variablesToExtract para el carrito
 * 
 * FECHA: 2026-01-16
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function fixArmarCarrito() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('neural_chatbot');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    console.log('═'.repeat(80));
    console.log('🔧 CORRIGIENDO NODO gpt-armar-carrito');
    console.log('═'.repeat(80));
    
    const indexCarrito = flow.nodes.findIndex(n => n.id === 'gpt-armar-carrito');
    
    if (indexCarrito === -1) {
      console.log('❌ Nodo gpt-armar-carrito no encontrado');
      return;
    }
    
    const nodo = flow.nodes[indexCarrito];
    const config = nodo.data.config;
    
    console.log('\n📋 CONFIGURACIÓN ACTUAL:');
    console.log(`   tipo: ${config.tipo}`);
    console.log(`   systemPrompt: ${config.systemPrompt ? 'EXISTE' : 'NO EXISTE'}`);
    console.log(`   extractionConfig: ${config.extractionConfig ? 'EXISTE' : 'NO EXISTE'}`);
    console.log(`   extractionConfig.systemPrompt: ${config.extractionConfig?.systemPrompt ? 'EXISTE' : 'NO EXISTE'}`);
    
    // Verificar si ya está correcto
    if (config.extractionConfig?.systemPrompt) {
      console.log('\n✅ Ya está correcto, no hay cambios necesarios');
      return;
    }
    
    // Mover systemPrompt a extractionConfig
    console.log('\n🔧 MOVIENDO systemPrompt a extractionConfig...');
    
    if (!config.extractionConfig) {
      config.extractionConfig = {};
    }
    
    // Mover el systemPrompt
    config.extractionConfig.systemPrompt = config.systemPrompt;
    
    // Agregar variables a extraer para el carrito
    config.extractionConfig.variablesToExtract = [
      {
        nombre: 'productos_carrito',
        tipo: 'array',
        requerido: true,
        descripcion: 'Array de productos que el usuario quiere comprar'
      },
      {
        nombre: 'total',
        tipo: 'number',
        requerido: true,
        descripcion: 'Total del carrito'
      },
      {
        nombre: 'confirmacion_compra',
        tipo: 'boolean',
        requerido: true,
        descripcion: 'Si el usuario confirmó la compra'
      },
      {
        nombre: 'nombre_cliente',
        tipo: 'string',
        requerido: false,
        descripcion: 'Nombre del cliente'
      },
      {
        nombre: 'email_cliente',
        tipo: 'string',
        requerido: false,
        descripcion: 'Email del cliente'
      },
      {
        nombre: 'telefono_cliente',
        tipo: 'string',
        requerido: false,
        descripcion: 'Teléfono del cliente'
      }
    ];
    
    config.extractionConfig.contextSource = 'historial_completo';
    
    // Eliminar systemPrompt del nivel superior (opcional, para limpiar)
    // delete config.systemPrompt;
    
    console.log('\n✅ CONFIGURACIÓN ACTUALIZADA:');
    console.log(`   extractionConfig.systemPrompt: EXISTE (${config.extractionConfig.systemPrompt.length} chars)`);
    console.log(`   extractionConfig.variablesToExtract: ${config.extractionConfig.variablesToExtract.length} variables`);
    console.log(`   extractionConfig.contextSource: ${config.extractionConfig.contextSource}`);
    
    // Guardar
    console.log('\n💾 Guardando cambios...');
    
    flow.nodes[indexCarrito].data.config = config;
    
    await db.collection('flows').updateOne(
      { _id: new ObjectId(FLOW_ID) },
      { $set: { nodes: flow.nodes } }
    );
    
    console.log('\n' + '═'.repeat(80));
    console.log('✅ NODO gpt-armar-carrito CORREGIDO');
    console.log('═'.repeat(80));
    
    console.log('\n📋 Variables que extraerá:');
    config.extractionConfig.variablesToExtract.forEach(v => {
      console.log(`   - ${v.nombre} (${v.tipo}, ${v.requerido ? 'requerido' : 'opcional'})`);
    });
    
    console.log('\n🧪 TESTING:');
    console.log('   1. NO hay deploy pendiente (cambio solo en BD)');
    console.log('   2. Limpiar estado: node scripts/limpiar-mi-numero.js');
    console.log('   3. Probar: "Busco Harry Potter 3" → "lo quiero"');
    console.log('   4. Verificar en logs:');
    console.log('      ✅ gpt-armar-carrito extrae: productos_carrito, total, confirmacion_compra');
    console.log('      ✅ Router Carrito evalúa las variables extraídas');
    console.log('      ✅ Si confirmacion_compra=true → MercadoPago');
    console.log('      ✅ Si confirmacion_compra=false → Solicitar datos');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar
fixArmarCarrito()
  .then(() => {
    console.log('\n✅ Script completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
