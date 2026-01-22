import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function compararVariables() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('chatbot_crm');
    const flowsCollection = db.collection('flows');
    
    // Buscar flujo de Intercapital
    const intercapitalFlows = await flowsCollection.find({ 
      nombre: { $regex: /intercapital/i } 
    }).toArray();
    
    // Buscar flujo de VeoVeo
    const veoVeoId = new ObjectId('69705b05e58836243159e64e');
    const veoVeoFlow = await flowsCollection.findOne({ _id: veoVeoId });
    
    console.log('═'.repeat(80));
    console.log('📊 COMPARACIÓN: INTERCAPITAL vs VEO VEO');
    console.log('═'.repeat(80));
    
    // INTERCAPITAL
    console.log('\n🏢 INTERCAPITAL:');
    if (intercapitalFlows.length > 0) {
      const intercapital = intercapitalFlows[0];
      console.log('   Nombre:', intercapital.nombre);
      console.log('   ID:', intercapital._id.toString());
      console.log('   config existe:', !!intercapital.config);
      console.log('   config.variables_globales existe:', !!intercapital.config?.variables_globales);
      
      if (intercapital.config?.variables_globales) {
        console.log('   Total variables:', Object.keys(intercapital.config.variables_globales).length);
        console.log('\n   📋 Variables:');
        Object.entries(intercapital.config.variables_globales).forEach(([key, value]) => {
          const tipo = Array.isArray(value) ? 'array' : typeof value;
          console.log(`      ${key}: ${tipo}`);
        });
        
        console.log('\n   📄 Estructura completa de config:');
        console.log(JSON.stringify(intercapital.config, null, 2).substring(0, 500));
      } else {
        console.log('   ❌ NO tiene variables_globales');
      }
    } else {
      console.log('   ❌ No se encontró flujo de Intercapital');
    }
    
    // VEO VEO
    console.log('\n\n📚 VEO VEO:');
    if (veoVeoFlow) {
      console.log('   Nombre:', veoVeoFlow.nombre);
      console.log('   ID:', veoVeoFlow._id.toString());
      console.log('   config existe:', !!veoVeoFlow.config);
      console.log('   config.variables_globales existe:', !!veoVeoFlow.config?.variables_globales);
      
      if (veoVeoFlow.config?.variables_globales) {
        console.log('   Total variables:', Object.keys(veoVeoFlow.config.variables_globales).length);
        console.log('\n   📋 Variables:');
        Object.entries(veoVeoFlow.config.variables_globales).forEach(([key, value]) => {
          const tipo = Array.isArray(value) ? 'array' : typeof value;
          console.log(`      ${key}: ${tipo}`);
        });
        
        console.log('\n   📄 Estructura completa de config:');
        console.log(JSON.stringify(veoVeoFlow.config, null, 2).substring(0, 500));
      } else {
        console.log('   ❌ NO tiene variables_globales');
      }
    } else {
      console.log('   ❌ No se encontró flujo de VeoVeo');
    }
    
    // COMPARACIÓN
    console.log('\n\n' + '═'.repeat(80));
    console.log('🔍 ANÁLISIS');
    console.log('═'.repeat(80));
    
    if (intercapitalFlows.length > 0 && veoVeoFlow) {
      const intercapital = intercapitalFlows[0];
      
      console.log('\n📊 Diferencias estructurales:');
      
      // Comparar estructura de config
      const intercapitalKeys = Object.keys(intercapital.config || {});
      const veoVeoKeys = Object.keys(veoVeoFlow.config || {});
      
      console.log('\n   Keys en config de Intercapital:', intercapitalKeys.join(', '));
      console.log('   Keys en config de VeoVeo:', veoVeoKeys.join(', '));
      
      // Verificar si hay diferencias
      const soloIntercapital = intercapitalKeys.filter(k => !veoVeoKeys.includes(k));
      const soloVeoVeo = veoVeoKeys.filter(k => !intercapitalKeys.includes(k));
      
      if (soloIntercapital.length > 0) {
        console.log('\n   ⚠️  Solo en Intercapital:', soloIntercapital.join(', '));
      }
      if (soloVeoVeo.length > 0) {
        console.log('   ⚠️  Solo en VeoVeo:', soloVeoVeo.join(', '));
      }
      
      // Comparar tipos de variables_globales
      if (intercapital.config?.variables_globales && veoVeoFlow.config?.variables_globales) {
        console.log('\n   ✅ Ambos tienen variables_globales');
        console.log('   Tipo en Intercapital:', typeof intercapital.config.variables_globales);
        console.log('   Tipo en VeoVeo:', typeof veoVeoFlow.config.variables_globales);
      }
    }
    
    console.log('\n\n' + '═'.repeat(80));
    console.log('💡 RECOMENDACIÓN');
    console.log('═'.repeat(80));
    
    if (intercapitalFlows.length > 0 && intercapitalFlows[0].config?.variables_globales) {
      console.log('\n✅ Intercapital tiene variables_globales funcionando');
      console.log('   Copiar la misma estructura a VeoVeo');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

compararVariables();
