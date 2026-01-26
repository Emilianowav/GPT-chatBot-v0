import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function verificarValidacionFrontend() {
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
    
    console.log('\n🔍 VERIFICACIÓN DE COMPATIBILIDAD CON FRONTEND\n');
    console.log('═'.repeat(80));
    
    const edgePago = flow.edges.find(e => e.source === 'router-carrito' && e.target === 'mercadopago-crear-preference');
    
    if (!edgePago) {
      console.log('❌ Edge hacia mercadopago-crear-preference no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n📋 EDGE ACTUAL:\n');
    console.log(JSON.stringify(edgePago, null, 2));
    
    console.log('\n\n🔍 ANÁLISIS:\n');
    
    // Verificar formato de condición
    const condition = edgePago.data?.condition || '';
    console.log(`Condición: "${condition}"`);
    
    // Verificar si usa operadores soportados por el frontend
    const operadoresFrontend = ['==', '!=', '>', '<', '>=', '<=', 'contains', 'not_contains', 'exists', 'not_exists', 'empty', 'not_empty', 'equals', 'greater_than'];
    
    console.log('\n✅ Operadores soportados por el frontend:');
    operadoresFrontend.forEach(op => console.log(`   - ${op}`));
    
    // Analizar la condición actual
    console.log('\n📊 Análisis de la condición actual:');
    
    if (condition.includes('AND')) {
      console.log('   ✅ Usa operador AND (soportado)');
      
      const parts = condition.split(' AND ');
      console.log(`   📝 Partes de la condición: ${parts.length}`);
      
      parts.forEach((part, i) => {
        console.log(`\n   Parte ${i + 1}: "${part.trim()}"`);
        
        // Verificar operadores
        if (part.includes('equals')) {
          console.log('      ✅ Operador "equals" detectado');
        }
        if (part.includes('greater_than')) {
          console.log('      ✅ Operador "greater_than" detectado');
        }
        if (part.includes('>')) {
          console.log('      ⚠️  Operador ">" detectado (debería ser "greater_than")');
        }
      });
    }
    
    // Verificar si el edge tiene el array conditions
    if (edgePago.data?.conditions) {
      console.log('\n✅ Edge tiene array "conditions" (formato frontend)');
      console.log(JSON.stringify(edgePago.data.conditions, null, 2));
    } else {
      console.log('\n⚠️  Edge NO tiene array "conditions" (solo string)');
      console.log('   El frontend espera un array de objetos con:');
      console.log('   - id: string');
      console.log('   - variable: string');
      console.log('   - operator: string');
      console.log('   - value: string');
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📋 RECOMENDACIÓN:\n');
    console.log('Para que el frontend muestre correctamente la validación:');
    console.log('1. El edge debe tener data.conditions como array de objetos');
    console.log('2. Cada condición debe tener: id, variable, operator, value');
    console.log('3. El string data.condition se genera automáticamente del array');
    
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarValidacionFrontend();
