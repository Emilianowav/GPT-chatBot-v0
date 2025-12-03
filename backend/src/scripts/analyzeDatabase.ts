// 🗄️ SCRIPT DE ANÁLISIS DE BASE DE DATOS
// Analiza todas las colecciones de MongoDB para identificar cuáles están en uso

import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';

// Importar todos los modelos para registrarlos
import '../models/AdminUser.js';
import '../models/Chatbot.js';
import '../models/Cliente.js';
import '../models/ContactoEmpresa.js';
import '../models/ConversationState.js';
import '../models/Empresa.js';
import '../models/Usuario.js';
import '../models/UsuarioEmpresa.js';

// Modelos del módulo calendar
import '../modules/calendar/models/Agente.js';
import '../modules/calendar/models/BloqueoHorario.js';
import '../modules/calendar/models/ConfiguracionBot.js';
import '../modules/calendar/models/ConfiguracionCalendario.js';
import '../modules/calendar/models/ConfiguracionModulo.js';
import '../modules/calendar/models/ConversacionBot.js';
import '../modules/calendar/models/Turno.js';

// Modelos del módulo integrations
import '../modules/integrations/models/ApiConfiguration.js';
import '../modules/integrations/models/ApiRequestLog.js';
import '../modules/integrations/models/IntegrationConfig.js';
import '../modules/integrations/models/WebhookConfig.js';

interface CollectionInfo {
  name: string;
  documentCount: number;
  avgDocSize: number;
  totalSize: number;
  hasModel: boolean;
  modelName?: string;
  isEmpty: boolean;
  isOrphan: boolean;
}

/**
 * Analiza todas las colecciones de la base de datos
 */
async function analyzeDatabase(): Promise<void> {
  try {
    console.log('🔍 Iniciando análisis de base de datos...\n');
    
    // Conectar a MongoDB
    await connectDB();
    
    // Obtener todas las colecciones
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No hay conexión a la base de datos');
    }
    
    const collections = await db.listCollections().toArray();
    console.log(`📊 Total de colecciones encontradas: ${collections.length}\n`);
    
    // Obtener modelos registrados en Mongoose
    const registeredModels = mongoose.modelNames();
    console.log(`🏷️ Modelos registrados en Mongoose: ${registeredModels.length}`);
    console.log(`   ${registeredModels.join(', ')}\n`);
    
    const collectionAnalysis: CollectionInfo[] = [];
    
    // Analizar cada colección
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`🔍 Analizando colección: ${collectionName}`);
      
      try {
        // Obtener estadísticas de la colección
        const collection = db.collection(collectionName);
        const documentCount = await collection.countDocuments();
        
        // Obtener estadísticas usando el comando stats de MongoDB
        let avgDocSize = 0;
        let totalSize = 0;
        try {
          const stats = await db.command({ collStats: collectionName });
          avgDocSize = stats.avgObjSize || 0;
          totalSize = stats.size || 0;
        } catch (error) {
          // Si no se pueden obtener estadísticas, usar valores por defecto
          avgDocSize = 0;
          totalSize = 0;
        }
        
        // Verificar si hay un modelo registrado para esta colección
        const hasModel = registeredModels.some(modelName => {
          const model = mongoose.model(modelName);
          return model.collection.name === collectionName;
        });
        
        const modelName = hasModel ? registeredModels.find(modelName => {
          const model = mongoose.model(modelName);
          return model.collection.name === collectionName;
        }) : undefined;
        
        const isEmpty = documentCount === 0;
        const isOrphan = !hasModel;
        
        collectionAnalysis.push({
          name: collectionName,
          documentCount,
          avgDocSize,
          totalSize,
          hasModel,
          modelName,
          isEmpty,
          isOrphan
        });
        
        console.log(`   📋 Documentos: ${documentCount}`);
        console.log(`   📏 Tamaño promedio: ${avgDocSize} bytes`);
        console.log(`   💾 Tamaño total: ${totalSize} bytes`);
        console.log(`   🏷️ Tiene modelo: ${hasModel ? `✅ (${modelName})` : '❌'}`);
        console.log(`   📊 Estado: ${isEmpty ? '🗂️ VACÍA' : '📄 CON DATOS'}`);
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Error obteniendo estadísticas: ${error}`);
        console.log('');
      }
    }
    
    // Generar resumen
    console.log('📈 ========== RESUMEN DEL ANÁLISIS ==========\n');
    
    const emptyCollections = collectionAnalysis.filter(c => c.isEmpty);
    const orphanCollections = collectionAnalysis.filter(c => c.isOrphan);
    const activeCollections = collectionAnalysis.filter(c => !c.isEmpty && c.hasModel);
    const candidatesForDeletion = collectionAnalysis.filter(c => c.isEmpty || c.isOrphan);
    
    console.log(`📊 Total de colecciones: ${collectionAnalysis.length}`);
    console.log(`✅ Colecciones activas (con datos y modelo): ${activeCollections.length}`);
    console.log(`🗂️ Colecciones vacías: ${emptyCollections.length}`);
    console.log(`👻 Colecciones huérfanas (sin modelo): ${orphanCollections.length}`);
    console.log(`🗑️ Candidatas para eliminación: ${candidatesForDeletion.length}\n`);
    
    if (activeCollections.length > 0) {
      console.log('✅ COLECCIONES ACTIVAS (MANTENER):');
      activeCollections.forEach(c => {
        console.log(`   📄 ${c.name} (${c.documentCount} docs, modelo: ${c.modelName})`);
      });
      console.log('');
    }
    
    if (emptyCollections.length > 0) {
      console.log('🗂️ COLECCIONES VACÍAS (CANDIDATAS PARA ELIMINACIÓN):');
      emptyCollections.forEach(c => {
        console.log(`   📭 ${c.name} (modelo: ${c.modelName || 'N/A'})`);
      });
      console.log('');
    }
    
    if (orphanCollections.length > 0) {
      console.log('👻 COLECCIONES HUÉRFANAS (SIN MODELO, ELIMINAR):');
      orphanCollections.forEach(c => {
        console.log(`   🚫 ${c.name} (${c.documentCount} docs)`);
      });
      console.log('');
    }
    
    if (candidatesForDeletion.length > 0) {
      console.log('🗑️ PLAN DE LIMPIEZA RECOMENDADO:');
      console.log('   1. Eliminar colecciones huérfanas (sin modelo)');
      console.log('   2. Eliminar colecciones vacías (opcional)');
      console.log('   3. Verificar colecciones con pocos documentos\n');
      
      console.log('💡 Para ejecutar la limpieza, usar:');
      console.log('   npm run clean-database');
    }
    
  } catch (error) {
    console.error('❌ Error analizando base de datos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar análisis si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeDatabase();
}

export { analyzeDatabase };
