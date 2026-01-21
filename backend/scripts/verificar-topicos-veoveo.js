import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verificarTopicos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    console.log('🔍 Buscando TODOS los flujos activos...\n');
    
    const flows = await db.collection('flows').find({ 
      activo: true
    }).toArray();
    
    console.log(`📊 Encontrados ${flows.length} flujos activos\n`);
    
    flows.forEach((flow, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`FLUJO ${index + 1}: ${flow.nombre || flow.id}`);
      console.log('='.repeat(80));
      console.log(`ID: ${flow._id}`);
      console.log(`Nombre: ${flow.nombre}`);
      console.log(`Activo: ${flow.activo}`);
      
      console.log('\n📋 CONFIGURACIÓN:');
      console.log(`   flow.config existe: ${!!flow.config}`);
      
      if (flow.config) {
        console.log(`   topicos_habilitados: ${flow.config.topicos_habilitados}`);
        console.log(`   topicos existe: ${!!flow.config.topicos}`);
        
        if (flow.config.topicos) {
          console.log('\n📚 ESTRUCTURA DE TÓPICOS:');
          console.log(JSON.stringify(flow.config.topicos, null, 2));
          
          // Verificar estructura específica
          if (flow.config.topicos.empresa) {
            console.log('\n✅ topicos.empresa existe');
            console.log(`   whatsapp_link: ${flow.config.topicos.empresa.whatsapp_link || '❌ NO EXISTE'}`);
          } else {
            console.log('\n❌ topicos.empresa NO EXISTE');
          }
        } else {
          console.log('\n❌ NO HAY TÓPICOS CONFIGURADOS');
        }
      } else {
        console.log('\n❌ NO HAY CONFIG EN EL FLUJO');
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('DIAGNÓSTICO COMPLETADO');
    console.log('='.repeat(80) + '\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarTopicos();
