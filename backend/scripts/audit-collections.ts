/**
 * Auditoría de colecciones en la base de datos neural_chatbot
 * Identifica colecciones usadas vs deprecadas
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function auditCollections() {
  try {
    console.log('🔍 AUDITORÍA DE COLECCIONES - neural_chatbot\n');
    
    await mongoose.connect(MONGODB_URI, { dbName: 'neural_chatbot' });
    console.log('✅ Conectado a MongoDB: neural_chatbot\n');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // Obtener todas las colecciones
    const collections = await db.listCollections().toArray();
    
    console.log(`📋 Total de colecciones: ${collections.length}\n`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 DETALLE DE COLECCIONES');
    console.log('═══════════════════════════════════════════════════════\n');

    const collectionStats: any[] = [];

    for (const col of collections) {
      const collection = db.collection(col.name);
      const count = await collection.countDocuments();
      const sample = await collection.findOne();
      
      collectionStats.push({
        name: col.name,
        count,
        sample,
        fields: sample ? Object.keys(sample) : []
      });
    }

    // Ordenar por cantidad de documentos
    collectionStats.sort((a, b) => b.count - a.count);

    for (const stat of collectionStats) {
      console.log(`📁 ${stat.name}`);
      console.log(`   Documentos: ${stat.count}`);
      console.log(`   Campos: ${stat.fields.join(', ')}`);
      console.log('');
    }

    // Análisis de colecciones
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 ANÁLISIS DE USO');
    console.log('═══════════════════════════════════════════════════════\n');

    // Colecciones conocidas y su propósito
    const knownCollections: Record<string, { purpose: string; status: 'active' | 'deprecated' | 'review' }> = {
      // Core
      'empresas': { purpose: 'Empresas/clientes del sistema', status: 'active' },
      'admin_users': { purpose: 'Usuarios admin (sistema antiguo)', status: 'review' },
      'usuarios_empresa': { purpose: 'Usuarios de empresas (sistema nuevo)', status: 'active' },
      'adminusers': { purpose: 'Posible duplicado de admin_users', status: 'review' },
      
      // Conversaciones
      'conversaciones': { purpose: 'Conversaciones de WhatsApp', status: 'active' },
      'mensajes': { purpose: 'Mensajes de conversaciones', status: 'active' },
      'messages': { purpose: 'Posible duplicado de mensajes', status: 'review' },
      
      // Clientes
      'clientes': { purpose: 'Clientes de las empresas', status: 'active' },
      'contactos': { purpose: 'Contactos de WhatsApp', status: 'review' },
      
      // Turnos/Reservas
      'turnos': { purpose: 'Turnos/citas agendadas', status: 'active' },
      'reservas': { purpose: 'Reservas (posible duplicado)', status: 'review' },
      
      // Pagos
      'pagos': { purpose: 'Pagos de Mercado Pago', status: 'active' },
      'payments': { purpose: 'Posible duplicado de pagos', status: 'review' },
      'payment_links': { purpose: 'Links de pago', status: 'active' },
      'paymentlinks': { purpose: 'Posible duplicado', status: 'review' },
      
      // Mercado Pago
      'sellers': { purpose: 'Vendedores conectados a MP', status: 'active' },
      'subscriptions': { purpose: 'Suscripciones de MP', status: 'active' },
      
      // Configuración
      'configuraciones': { purpose: 'Configuraciones de empresas', status: 'active' },
      'notificaciones': { purpose: 'Notificaciones del sistema', status: 'active' },
      'notification_configs': { purpose: 'Configuración de notificaciones', status: 'active' },
      
      // Flujos
      'flujos': { purpose: 'Flujos de conversación', status: 'active' },
      'flows': { purpose: 'Posible duplicado de flujos', status: 'review' },
      
      // Productos
      'productos': { purpose: 'Productos de empresas', status: 'active' },
      'catalogos': { purpose: 'Catálogos de productos', status: 'active' },
      
      // APIs/Integraciones
      'apis': { purpose: 'APIs externas configuradas', status: 'active' },
      'integrations': { purpose: 'Integraciones', status: 'review' },
      
      // Logs
      'logs': { purpose: 'Logs del sistema', status: 'review' },
      'webhooks': { purpose: 'Webhooks recibidos', status: 'active' },
      
      // Otros
      'sessions': { purpose: 'Sesiones de usuario', status: 'review' },
      'tokens': { purpose: 'Tokens de autenticación', status: 'review' },
    };

    const activeCollections: string[] = [];
    const deprecatedCollections: string[] = [];
    const reviewCollections: string[] = [];
    const unknownCollections: string[] = [];

    for (const stat of collectionStats) {
      const known = knownCollections[stat.name];
      
      if (known) {
        if (known.status === 'active') {
          activeCollections.push(stat.name);
        } else if (known.status === 'deprecated') {
          deprecatedCollections.push(stat.name);
        } else {
          reviewCollections.push(stat.name);
        }
        console.log(`${known.status === 'active' ? '✅' : known.status === 'deprecated' ? '❌' : '⚠️'} ${stat.name}`);
        console.log(`   Propósito: ${known.purpose}`);
        console.log(`   Estado: ${known.status.toUpperCase()}`);
        console.log(`   Documentos: ${stat.count}`);
      } else {
        unknownCollections.push(stat.name);
        console.log(`❓ ${stat.name}`);
        console.log(`   Propósito: DESCONOCIDO`);
        console.log(`   Documentos: ${stat.count}`);
      }
      console.log('');
    }

    // Resumen
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 RESUMEN');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`✅ ACTIVAS (${activeCollections.length}):`);
    activeCollections.forEach(c => console.log(`   - ${c}`));
    console.log('');

    console.log(`⚠️  REVISAR (${reviewCollections.length}):`);
    reviewCollections.forEach(c => console.log(`   - ${c}`));
    console.log('');

    console.log(`❓ DESCONOCIDAS (${unknownCollections.length}):`);
    unknownCollections.forEach(c => console.log(`   - ${c}`));
    console.log('');

    console.log(`❌ DEPRECADAS (${deprecatedCollections.length}):`);
    deprecatedCollections.forEach(c => console.log(`   - ${c}`));
    console.log('');

    // Colecciones vacías
    const emptyCollections = collectionStats.filter(c => c.count === 0);
    if (emptyCollections.length > 0) {
      console.log(`🗑️  VACÍAS (candidatas a eliminar):`);
      emptyCollections.forEach(c => console.log(`   - ${c.name}`));
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

auditCollections();
