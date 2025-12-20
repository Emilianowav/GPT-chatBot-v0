/**
 * Script de Setup para PRODUCCIÓN: JFC Techno
 * Este script debe ejecutarse DESPUÉS del deploy para crear el usuario en la DB de producción
 * 
 * Ejecutar en producción:
 * npx tsx scripts/setup-jfc-techno-production.ts
 * 
 * O localmente apuntando a producción:
 * MONGODB_URI="mongodb+srv://..." npx tsx scripts/setup-jfc-techno-production.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function setupProduction() {
  try {
    console.log('🚀 Setup JFC Techno en PRODUCCIÓN\n');
    console.log('📊 Conectando a MongoDB...');
    
    if (!MONGODB_URI) {
      throw new Error('❌ MONGODB_URI no está configurado');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // 1. Verificar/Crear Empresa
    console.log('📦 Verificando empresa JFC Techno...');
    const empresasCollection = db.collection('empresas');
    
    let empresa = await empresasCollection.findOne({ nombre: 'JFC Techno' });
    
    if (!empresa) {
      console.log('   ⚠️  Empresa no existe, creando...');
      const result = await empresasCollection.insertOne({
        nombre: 'JFC Techno',
        telefono: '5493794000000',
        email: 'contacto@jfctechno.com',
        categoria: 'comercio',
        modelo: 'gpt-3.5-turbo',
        prompt: 'Sos el asistente virtual de JFC Techno, una tienda de tecnología...',
        modulos: [
          { id: 'conversaciones', nombre: 'Conversaciones', activo: true },
          { id: 'clientes', nombre: 'Clientes', activo: true },
          { id: 'productos', nombre: 'Productos', activo: true },
          { id: 'mercadopago', nombre: 'Mercado Pago', activo: true },
          { id: 'estadisticas', nombre: 'Estadísticas', activo: true },
          { id: 'configuracion', nombre: 'Configuración', activo: true }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('   ✅ Empresa creada');
      empresa = await empresasCollection.findOne({ _id: result.insertedId });
    } else {
      console.log('   ✅ Empresa ya existe');
    }

    // 2. Verificar/Crear Usuario Admin
    console.log('\n👤 Verificando usuario admin_jfc...');
    const adminUsersCollection = db.collection('admin_users');
    
    let adminUser = await adminUsersCollection.findOne({ username: 'admin_jfc' });
    
    if (!adminUser) {
      console.log('   ⚠️  Usuario no existe, creando...');
      
      const password = 'jfc2024!';
      const hashedPassword = await bcryptjs.hash(password, 10);
      
      const result = await adminUsersCollection.insertOne({
        username: 'admin_jfc',
        password: hashedPassword,
        empresaId: 'JFC Techno',
        role: 'admin',
        email: 'admin@jfctechno.com',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('   ✅ Usuario admin creado');
      adminUser = await adminUsersCollection.findOne({ _id: result.insertedId });
    } else {
      console.log('   ✅ Usuario ya existe');
      
      // Verificar contraseña
      const testPassword = 'jfc2024!';
      const isValid = await bcryptjs.compare(testPassword, adminUser.password);
      
      if (!isValid) {
        console.log('   ⚠️  Contraseña incorrecta, actualizando...');
        const hashedPassword = await bcryptjs.hash(testPassword, 10);
        await adminUsersCollection.updateOne(
          { username: 'admin_jfc' },
          { 
            $set: { 
              password: hashedPassword,
              updatedAt: new Date()
            } 
          }
        );
        console.log('   ✅ Contraseña actualizada');
      } else {
        console.log('   ✅ Contraseña válida');
      }
    }

    // 3. Verificar Seller de Mercado Pago
    console.log('\n💳 Verificando seller de Mercado Pago...');
    const sellersCollection = db.collection('sellers');
    
    let seller = await sellersCollection.findOne({ userId: 'jfc_techno' });
    
    if (!seller) {
      console.log('   ⚠️  Seller no existe, creando...');
      await sellersCollection.insertOne({
        userId: 'jfc_techno',
        name: 'JFC Techno',
        email: 'contacto@jfctechno.com',
        active: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('   ✅ Seller creado (requiere OAuth para activar)');
    } else {
      console.log('   ✅ Seller ya existe');
      console.log('   Estado:', seller.active ? 'Activo' : 'Inactivo (requiere OAuth)');
    }

    // 4. Resumen
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ SETUP COMPLETADO EN PRODUCCIÓN');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('🔐 CREDENCIALES DE ACCESO:');
    console.log('   Username: admin_jfc');
    console.log('   Password: jfc2024!');
    console.log('');
    console.log('📋 EMPRESA:');
    console.log('   Nombre:', empresa?.nombre);
    console.log('   Email:', empresa?.email);
    console.log('   Teléfono:', empresa?.telefono);
    console.log('');
    console.log('👤 USUARIO:');
    console.log('   Username:', adminUser?.username);
    console.log('   Email:', adminUser?.email);
    console.log('   Role:', adminUser?.role);
    console.log('   Activo:', adminUser?.activo);
    console.log('');
    console.log('⚠️  PRÓXIMOS PASOS:');
    console.log('   1. Probar login en producción');
    console.log('   2. Conectar cuenta de Mercado Pago (OAuth)');
    console.log('   3. Configurar WhatsApp Business API');
    console.log('   4. Crear payment links de productos');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

setupProduction();
