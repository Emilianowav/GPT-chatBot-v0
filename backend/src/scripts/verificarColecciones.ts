// 🔍 Script para verificar todas las colecciones y bases de datos
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';
import dotenv from 'dotenv';

dotenv.config();

async function verificarColecciones() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    const uri = process.env.MONGODB_URI || '';
    console.log('📍 URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@'));
    
    await mongoose.connect(uri, {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    // 1. Listar todas las bases de datos
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣ BASES DE DATOS DISPONIBLES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    
    databases.forEach((db: any) => {
      console.log(`📦 ${db.name}`);
      console.log(`   Tamaño: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
      console.log('');
    });

    // 2. Verificar colecciones en neural_chatbot
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣ COLECCIONES EN neural_chatbot:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`📁 ${col.name}`);
      console.log(`   Documentos: ${count}`);
      console.log('');
    }

    // 3. Verificar si existe base de datos "test"
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣ VERIFICANDO BASE DE DATOS "test":');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const testDbExists = databases.find((db: any) => db.name === 'test');
    
    if (testDbExists) {
      console.log('⚠️ BASE DE DATOS "test" ENCONTRADA\n');
      
      // Conectar a test y listar colecciones
      await mongoose.disconnect();
      await mongoose.connect(uri, { dbName: 'test' });
      
      const testCollections = await mongoose.connection.db.listCollections().toArray();
      
      console.log('📋 Colecciones en "test":');
      for (const col of testCollections) {
        const count = await mongoose.connection.db.collection(col.name).countDocuments();
        console.log(`   - ${col.name}: ${count} documentos`);
      }
      console.log('');
      
      // Reconectar a neural_chatbot
      await mongoose.disconnect();
      await mongoose.connect(uri, { dbName: 'neural_chatbot' });
    } else {
      console.log('✅ No existe base de datos "test"\n');
    }

    // 4. Buscar el contacto específico
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4️⃣ BUSCANDO CONTACTO +54 9 3794 94-6066:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const telefono = '+54 9 3794 94-6066';
    const telefonoNormalizado = normalizarTelefono(telefono);
    
    console.log('📞 Teléfono normalizado:', telefonoNormalizado);
    console.log('');
    
    const contacto = await ContactoEmpresaModel.findOne({
      telefono: telefonoNormalizado,
      empresaId: 'San Jose'
    });
    
    if (contacto) {
      console.log('✅ CONTACTO ENCONTRADO:');
      console.log('   ID:', contacto._id);
      console.log('   Nombre:', contacto.nombre);
      console.log('   Teléfono:', contacto.telefono);
      console.log('   Empresa:', contacto.empresaId);
      console.log('');
    } else {
      console.log('❌ CONTACTO NO ENCONTRADO\n');
    }

    // 5. Verificar configuración de conexión
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('5️⃣ CONFIGURACIÓN DE CONEXIÓN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Base de datos actual:', mongoose.connection.db.databaseName);
    console.log('Estado de conexión:', mongoose.connection.readyState);
    console.log('Host:', mongoose.connection.host);
    console.log('');

    // 6. Verificar en app.js qué base de datos usa
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('6️⃣ RECOMENDACIONES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (testDbExists) {
      console.log('⚠️ PROBLEMA DETECTADO:');
      console.log('   Existe una base de datos "test" que puede estar interfiriendo');
      console.log('');
      console.log('✅ SOLUCIÓN:');
      console.log('   1. Verificar que app.js use dbName: "neural_chatbot"');
      console.log('   2. Migrar datos de "test" a "neural_chatbot" si es necesario');
      console.log('   3. Eliminar base de datos "test"');
    } else {
      console.log('✅ Todo parece estar configurado correctamente');
      console.log('');
      console.log('🔍 Si el contacto no se guarda, revisar:');
      console.log('   1. Logs del servidor al recibir mensaje');
      console.log('   2. Errores en buscarOCrearContacto()');
      console.log('   3. Que la conexión use neural_chatbot');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

verificarColecciones();
