// 🧹 SCRIPT DE LIMPIEZA DE BASE DE DATOS
// Elimina colecciones vacías y huérfanas por etapas

import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { analyzeDatabase } from './analyzeDatabase.js';

interface CleanupOptions {
  dryRun?: boolean;
  deleteEmpty?: boolean;
  deleteOrphans?: boolean;
  confirmAll?: boolean;
}

/**
 * Limpia la base de datos eliminando colecciones no utilizadas
 */
async function cleanDatabase(options: CleanupOptions = {}): Promise<void> {
  const {
    dryRun = false,
    deleteEmpty = true,
    deleteOrphans = true,
    confirmAll = false
  } = options;
  
  try {
    console.log('🧹 Iniciando limpieza de base de datos...\n');
    
    if (dryRun) {
      console.log('🔍 MODO DRY-RUN: Solo se mostrarán las acciones, no se ejecutarán\n');
    }
    
    // Conectar a MongoDB
    await connectDB();
    
    // Importar modelos para registrarlos
    await import('../models/AdminUser.js');
    await import('../models/Chatbot.js');
    await import('../models/Cliente.js');
    await import('../models/ContactoEmpresa.js');
    await import('../models/ConversationState.js');
    await import('../models/Empresa.js');
    await import('../models/Usuario.js');
    await import('../models/UsuarioEmpresa.js');
    await import('../modules/calendar/models/Agente.js');
    await import('../modules/calendar/models/BloqueoHorario.js');
    await import('../modules/calendar/models/ConfiguracionBot.js');
    await import('../modules/calendar/models/ConfiguracionCalendario.js');
    await import('../modules/calendar/models/ConfiguracionModulo.js');
    await import('../modules/calendar/models/ConversacionBot.js');
    await import('../modules/calendar/models/Turno.js');
    await import('../modules/integrations/models/ApiConfiguration.js');
    await import('../modules/integrations/models/ApiRequestLog.js');
    await import('../modules/integrations/models/IntegrationConfig.js');
    await import('../modules/integrations/models/WebhookConfig.js');
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No hay conexión a la base de datos');
    }
    
    const collections = await db.listCollections().toArray();
    const registeredModels = mongoose.modelNames();
    
    let deletedCount = 0;
    let skippedCount = 0;
    
    console.log('🔍 ETAPA 1: IDENTIFICANDO COLECCIONES PARA LIMPIEZA\n');
    
    const collectionsToDelete: string[] = [];
    const emptyCollections: string[] = [];
    const orphanCollections: string[] = [];
    
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      
      try {
        const collection = db.collection(collectionName);
        const documentCount = await collection.countDocuments();
        
        // Verificar si hay un modelo registrado
        const hasModel = registeredModels.some(modelName => {
          const model = mongoose.model(modelName);
          return model.collection.name === collectionName;
        });
        
        const isEmpty = documentCount === 0;
        const isOrphan = !hasModel;
        
        if (isOrphan && deleteOrphans) {
          orphanCollections.push(collectionName);
          collectionsToDelete.push(collectionName);
          console.log(`👻 Huérfana: ${collectionName} (${documentCount} docs) - ELIMINAR`);
        } else if (isEmpty && hasModel && deleteEmpty) {
          emptyCollections.push(collectionName);
          collectionsToDelete.push(collectionName);
          console.log(`🗂️ Vacía: ${collectionName} - ELIMINAR`);
        } else {
          console.log(`✅ Mantener: ${collectionName} (${documentCount} docs, modelo: ${hasModel ? '✅' : '❌'})`);
        }
        
      } catch (error) {
        console.log(`❌ Error analizando ${collectionName}: ${error}`);
      }
    }
    
    console.log(`\n📊 RESUMEN DE LIMPIEZA:`);
    console.log(`   🗑️ Colecciones a eliminar: ${collectionsToDelete.length}`);
    console.log(`   👻 Huérfanas: ${orphanCollections.length}`);
    console.log(`   🗂️ Vacías: ${emptyCollections.length}\n`);
    
    if (collectionsToDelete.length === 0) {
      console.log('✅ No hay colecciones para eliminar. Base de datos limpia.');
      return;
    }
    
    if (dryRun) {
      console.log('🔍 DRY-RUN COMPLETADO. Para ejecutar la limpieza real, usar:');
      console.log('   npm run clean-database -- --execute\n');
      return;
    }
    
    console.log('🧹 ETAPA 2: EJECUTANDO LIMPIEZA\n');
    
    for (const collectionName of collectionsToDelete) {
      try {
        if (!confirmAll) {
          // En un entorno real, aquí podrías agregar confirmación interactiva
          console.log(`🗑️ Eliminando colección: ${collectionName}`);
        }
        
        await db.collection(collectionName).drop();
        deletedCount++;
        console.log(`✅ Eliminada: ${collectionName}`);
        
      } catch (error) {
        console.log(`❌ Error eliminando ${collectionName}: ${error}`);
        skippedCount++;
      }
    }
    
    console.log(`\n✅ LIMPIEZA COMPLETADA:`);
    console.log(`   🗑️ Colecciones eliminadas: ${deletedCount}`);
    console.log(`   ⚠️ Colecciones omitidas: ${skippedCount}`);
    
    if (deletedCount > 0) {
      console.log('\n🎉 Base de datos limpiada exitosamente!');
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar limpieza si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const deleteEmpty = !args.includes('--keep-empty');
  const deleteOrphans = !args.includes('--keep-orphans');
  
  cleanDatabase({
    dryRun,
    deleteEmpty,
    deleteOrphans,
    confirmAll: args.includes('--yes')
  });
}

export { cleanDatabase };
