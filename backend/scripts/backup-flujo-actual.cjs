/**
 * Script de Backup del Flujo Actual Funcional
 * 
 * PROPÓSITO: Crear backup completo del flujo antes de agregar funcionalidad de carrito
 * FECHA: 2026-01-15
 * 
 * IMPORTANTE: Ejecutar ANTES de hacer cualquier modificación al flujo
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';
const FLOW_ID = '695a156681f6d67f0ae9cf40';

async function backupFlujo() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    
    // 1. Backup del flujo
    console.log('\n📦 Haciendo backup del flujo...');
    const flow = await db.collection('flows').findOne({ _id: new ObjectId(FLOW_ID) });
    
    if (!flow) {
      throw new Error(`Flujo ${FLOW_ID} no encontrado`);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // Crear directorio de backups si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFile = path.join(backupDir, `flujo-backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(flow, null, 2));
    
    console.log(`   ✅ Flujo guardado en: ${backupFile}`);
    console.log(`   📊 Nodos: ${flow.nodes.length}`);
    console.log(`   🔗 Edges: ${flow.edges.length}`);
    
    // 2. Backup de configuraciones de API
    console.log('\n📦 Haciendo backup de configuraciones de API...');
    const apiConfigs = await db.collection('api_configurations').find({
      empresaId: '5493794732177'
    }).toArray();
    
    const apiConfigFile = path.join(backupDir, `api-configs-backup-${timestamp}.json`);
    fs.writeFileSync(apiConfigFile, JSON.stringify(apiConfigs, null, 2));
    
    console.log(`   ✅ Configuraciones guardadas en: ${apiConfigFile}`);
    console.log(`   📊 Configuraciones: ${apiConfigs.length}`);
    
    // 3. Resumen del backup
    console.log('\n' + '='.repeat(60));
    console.log('✅ BACKUP COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📋 Resumen:');
    console.log(`   Flujo ID: ${FLOW_ID}`);
    console.log(`   Nombre: ${flow.nombre}`);
    console.log(`   Empresa: ${flow.empresaId}`);
    console.log(`   Estado: ${flow.activo ? 'Activo' : 'Inactivo'}`);
    console.log(`   Nodos: ${flow.nodes.length}`);
    console.log(`   Edges: ${flow.edges.length}`);
    console.log(`   Tópicos habilitados: ${flow.config?.topicos_habilitados ? 'Sí' : 'No'}`);
    
    console.log('\n📁 Archivos de backup:');
    console.log(`   1. ${backupFile}`);
    console.log(`   2. ${apiConfigFile}`);
    
    console.log('\n🔄 Para restaurar este backup:');
    console.log(`   node scripts/restore-flujo-backup.cjs ${timestamp}`);
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - Guarda estos archivos en un lugar seguro');
    console.log('   - No modifiques el flujo sin antes crear un backup');
    console.log('   - Prueba los cambios en un ambiente de desarrollo primero');
    
  } catch (error) {
    console.error('❌ Error al hacer backup:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Ejecutar backup
backupFlujo()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
