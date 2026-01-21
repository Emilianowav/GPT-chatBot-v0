import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixRouterEdges() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas\n');
    
    const db = mongoose.connection.db;
    
    // Buscar el flujo de VeoVeo
    const flow = await db.collection('flows').findOne({ 
      activo: true,
      $or: [
        { nombre: /veo veo/i },
        { id: /veo-veo/i },
        { empresaId: /veo veo/i }
      ]
    });
    
    if (!flow) {
      console.log('❌ No se encontró el flujo de VeoVeo');
      return;
    }
    
    console.log(`✅ Flujo encontrado: ${flow.nombre || flow.id}\n`);
    
    // Filtrar edges problemáticos
    const edgesCorregidos = flow.edges.map(edge => {
      // Si es un edge desde router a woocommerce sin condición, corregirlo
      if (edge.source === 'router' && 
          edge.target === 'woocommerce' && 
          !edge.data?.condition) {
        
        console.log(`🔧 Corrigiendo edge: ${edge.id}`);
        console.log(`   Antes: sourceHandle=${edge.sourceHandle}, condition=${edge.data?.condition}`);
        
        return {
          ...edge,
          sourceHandle: 'route-2',
          data: {
            ...edge.data,
            condition: '{{gpt-formateador.variables_completas}} equals true',
            label: 'Buscar en WooCommerce'
          }
        };
      }
      
      return edge;
    });
    
    // Eliminar edges duplicados (mantener solo uno a woocommerce)
    const edgesUnicos = [];
    const seenTargets = new Set();
    
    for (const edge of edgesCorregidos) {
      if (edge.source === 'router') {
        const key = `${edge.source}-${edge.target}-${edge.sourceHandle}`;
        if (!seenTargets.has(key)) {
          seenTargets.add(key);
          edgesUnicos.push(edge);
        } else {
          console.log(`🗑️  Eliminando edge duplicado: ${edge.id}`);
        }
      } else {
        edgesUnicos.push(edge);
      }
    }
    
    console.log(`\n📊 Edges antes: ${flow.edges.length}`);
    console.log(`📊 Edges después: ${edgesUnicos.length}\n`);
    
    // Actualizar el flujo
    const result = await db.collection('flows').updateOne(
      { _id: flow._id },
      { 
        $set: { 
          edges: edgesUnicos,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ Flujo actualizado (${result.modifiedCount} documento modificado)\n`);
    
    // Verificar
    const flowActualizado = await db.collection('flows').findOne({ _id: flow._id });
    const routerEdges = flowActualizado.edges.filter(e => e.source === 'router');
    
    console.log('🔍 VERIFICACIÓN - Edges desde router:');
    routerEdges.forEach((edge, i) => {
      console.log(`\n   ${i + 1}. ${edge.source} → ${edge.target}`);
      console.log(`      SourceHandle: ${edge.sourceHandle}`);
      console.log(`      Condition: ${edge.data?.condition || 'SIN CONDICIÓN'}`);
      console.log(`      Label: ${edge.data?.label || 'Sin label'}`);
    });
    
    console.log('\n✅ ROUTER CORREGIDO EXITOSAMENTE\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixRouterEdges();
