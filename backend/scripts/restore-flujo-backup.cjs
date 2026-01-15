/**
 * Script de Restauración del Flujo desde Backup
 * 
 * PROPÓSITO: Restaurar el flujo desde un backup en caso de problemas
 * FECHA: 2026-01-15
 * 
 * USO: node scripts/restore-flujo-backup.cjs [timestamp]
 * Ejemplo: node scripts/restore-flujo-backup.cjs 2026-01-15T10-10-00-000Z
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot';

async function restoreFlujo(timestamp) {
  if (!timestamp) {
    console.error('❌ Error: Debes proporcionar el timestamp del backup');
    console.log('\nUso: node scripts/restore-flujo-backup.cjs [timestamp]');
    console.log('Ejemplo: node scripts/restore-flujo-backup.cjs 2026-01-15T10-10-00-000Z');
    console.log('\n📁 Backups disponibles:');
    
    const backupDir = path.join(__dirname, '..', 'backups');
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('flujo-backup-'))
        .sort()
        .reverse();
      
      files.forEach(file => {
        const ts = file.replace('flujo-backup-', '').replace('.json', '');
        console.log(`   - ${ts}`);
      });
    }
    
    process.exit(1);
  }
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db('neural_chatbot');
    
    // 1. Leer archivo de backup
    console.log('\n📦 Leyendo backup...');
    const backupDir = path.join(__dirname, '..', 'backups');
    const backupFile = path.join(backupDir, `flujo-backup-${timestamp}.json`);
    
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Archivo de backup no encontrado: ${backupFile}`);
    }
    
    const flowBackup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    console.log(`   ✅ Backup leído: ${flowBackup.nombre}`);
    console.log(`   📊 Nodos: ${flowBackup.nodes.length}`);
    console.log(`   🔗 Edges: ${flowBackup.edges.length}`);
    
    // 2. Confirmar restauración
    console.log('\n⚠️  ADVERTENCIA: Esta acción sobrescribirá el flujo actual');
    console.log(`   Flujo a restaurar: ${flowBackup.nombre}`);
    console.log(`   ID: ${flowBackup._id}`);
    
    // En producción, aquí podrías pedir confirmación del usuario
    // Para este script, asumimos que el usuario ya confirmó
    
    // 3. Restaurar flujo
    console.log('\n🔄 Restaurando flujo...');
    
    const result = await db.collection('flows').replaceOne(
      { _id: new ObjectId(flowBackup._id) },
      flowBackup,
      { upsert: true }
    );
    
    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      console.log('   ✅ Flujo restaurado exitosamente');
    } else {
      console.log('   ⚠️  No se realizaron cambios (el flujo ya estaba en ese estado)');
    }
    
    // 4. Restaurar configuraciones de API (si existen)
    const apiConfigFile = path.join(backupDir, `api-configs-backup-${timestamp}.json`);
    
    if (fs.existsSync(apiConfigFile)) {
      console.log('\n🔄 Restaurando configuraciones de API...');
      const apiConfigs = JSON.parse(fs.readFileSync(apiConfigFile, 'utf8'));
      
      for (const config of apiConfigs) {
        await db.collection('api_configurations').replaceOne(
          { _id: new ObjectId(config._id) },
          config,
          { upsert: true }
        );
      }
      
      console.log(`   ✅ ${apiConfigs.length} configuración(es) restaurada(s)`);
    }
    
    // 5. Resumen
    console.log('\n' + '='.repeat(60));
    console.log('✅ RESTAURACIÓN COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📋 Flujo restaurado:');
    console.log(`   Nombre: ${flowBackup.nombre}`);
    console.log(`   ID: ${flowBackup._id}`);
    console.log(`   Nodos: ${flowBackup.nodes.length}`);
    console.log(`   Edges: ${flowBackup.edges.length}`);
    
    console.log('\n🧪 Próximos pasos:');
    console.log('   1. Limpiar estado del teléfono de prueba:');
    console.log('      node scripts/limpiar-mi-numero.js');
    console.log('   2. Probar el flujo enviando un mensaje de prueba');
    console.log('   3. Verificar que todo funciona correctamente');
    
  } catch (error) {
    console.error('❌ Error al restaurar backup:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Obtener timestamp del argumento
const timestamp = process.argv[2];

// Ejecutar restauración
restoreFlujo(timestamp)
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
