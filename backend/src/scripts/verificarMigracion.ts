// 🔍 Script para verificar la migración de contactos
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { ClienteModel } from '../models/Cliente.js';
import { UsuarioModel } from '../models/Usuario.js';
import dotenv from 'dotenv';

dotenv.config();

async function verificarMigracion() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB');
    console.log(`📊 Base de datos: ${mongoose.connection.db?.databaseName}\n`);

    // Contar registros
    const usuarios = await UsuarioModel.countDocuments();
    const clientes = await ClienteModel.countDocuments();
    const contactos = await ContactoEmpresaModel.countDocuments();

    console.log('📊 CONTEO DE REGISTROS:');
    console.log(`   Usuarios (antigua): ${usuarios}`);
    console.log(`   Clientes (antigua): ${clientes}`);
    console.log(`   Contactos Empresa (nueva): ${contactos}\n`);

    // Mostrar algunos contactos de ejemplo
    console.log('👥 CONTACTOS MIGRADOS (primeros 10):');
    const contactosEjemplo = await ContactoEmpresaModel.find({}).limit(10);
    
    contactosEjemplo.forEach((c, i) => {
      console.log(`\n${i + 1}. ${c.nombre} ${c.apellido}`);
      console.log(`   Teléfono: ${c.telefono}`);
      console.log(`   Empresa: ${c.empresaId}`);
      console.log(`   Origen: ${c.origen}`);
      console.log(`   Historial: ${c.conversaciones.historial.length} mensajes`);
      console.log(`   Métricas: ${c.metricas.interacciones} interacciones`);
    });

    // Verificar normalización de teléfonos
    console.log('\n🔍 VERIFICANDO NORMALIZACIÓN DE TELÉFONOS:');
    const contactosConTelefonoRaro = await ContactoEmpresaModel.find({
      telefono: { $regex: /[\+\s\-\(\)]/ }
    });
    
    if (contactosConTelefonoRaro.length > 0) {
      console.log(`   ⚠️ ${contactosConTelefonoRaro.length} contactos con teléfonos NO normalizados:`);
      contactosConTelefonoRaro.forEach(c => {
        console.log(`      - ${c.nombre}: ${c.telefono}`);
      });
    } else {
      console.log('   ✅ Todos los teléfonos están normalizados');
    }

    // Verificar duplicados
    console.log('\n🔍 VERIFICANDO DUPLICADOS:');
    const duplicados = await ContactoEmpresaModel.aggregate([
      {
        $group: {
          _id: { telefono: '$telefono', empresaId: '$empresaId' },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicados.length > 0) {
      console.log(`   ⚠️ ${duplicados.length} duplicados encontrados:`);
      duplicados.forEach(d => {
        console.log(`      - ${d._id.telefono} (${d._id.empresaId}): ${d.count} registros`);
      });
    } else {
      console.log('   ✅ No hay duplicados');
    }

    // Resumen por empresa
    console.log('\n📊 CONTACTOS POR EMPRESA:');
    const porEmpresa = await ContactoEmpresaModel.aggregate([
      {
        $group: {
          _id: '$empresaId',
          total: { $sum: 1 },
          chatbot: { $sum: { $cond: [{ $eq: ['$origen', 'chatbot'] }, 1, 0] } },
          manual: { $sum: { $cond: [{ $eq: ['$origen', 'manual'] }, 1, 0] } }
        }
      },
      { $sort: { total: -1 } }
    ]);

    porEmpresa.forEach(e => {
      console.log(`   ${e._id}: ${e.total} contactos (${e.chatbot} chatbot, ${e.manual} manual)`);
    });

    console.log('\n✅ Verificación completada\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

verificarMigracion();
