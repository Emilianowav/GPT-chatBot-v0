/**
 * Corrige el empresaId del usuario admin_jfc
 * Debe coincidir con el nombre de la empresa en la colección empresas
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function fixJFCEmpresaId() {
  try {
    console.log('🔧 CORRIGIENDO empresaId DE admin_jfc\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB:', mongoose.connection.name);
    console.log('');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // 1. Ver cómo está configurado momento_admin
    console.log('📋 Analizando momento_admin (que funciona)...');
    const usuariosEmpresaCollection = db.collection('usuarios_empresa');
    const momentoUser = await usuariosEmpresaCollection.findOne({ username: 'momento_admin' });
    
    if (momentoUser) {
      console.log('✅ momento_admin encontrado:');
      console.log('   empresaId:', momentoUser.empresaId);
      console.log('');
    }

    // 2. Buscar la empresa Momento IA
    const empresasCollection = db.collection('empresas');
    const momentoEmpresa = await empresasCollection.findOne({ nombre: { $regex: /momento/i } });
    
    if (momentoEmpresa) {
      console.log('✅ Empresa Momento encontrada:');
      console.log('   nombre:', momentoEmpresa.nombre);
      console.log('   _id:', momentoEmpresa._id);
      console.log('');
      console.log('⚠️  NOTA: empresaId en usuario es "' + momentoUser?.empresaId + '"');
      console.log('         pero nombre de empresa es "' + momentoEmpresa.nombre + '"');
      console.log('');
    }

    // 3. Buscar empresa JFC Techno
    console.log('📋 Buscando empresa JFC Techno...');
    const jfcEmpresa = await empresasCollection.findOne({ nombre: 'JFC Techno' });
    
    if (!jfcEmpresa) {
      console.log('❌ Empresa no encontrada');
      return;
    }

    console.log('✅ Empresa JFC Techno encontrada:');
    console.log('   nombre:', jfcEmpresa.nombre);
    console.log('   _id:', jfcEmpresa._id);
    console.log('');

    // 4. Actualizar usuario admin_jfc con el empresaId correcto
    console.log('📋 Actualizando usuario admin_jfc...');
    
    const jfcUser = await usuariosEmpresaCollection.findOne({ username: 'admin_jfc' });
    
    if (!jfcUser) {
      console.log('❌ Usuario admin_jfc no encontrado en usuarios_empresa');
      console.log('   Creando usuario...\n');
      
      const password = 'jfc2024!';
      const hashedPassword = await bcryptjs.hash(password, 10);

      await usuariosEmpresaCollection.insertOne({
        username: 'admin_jfc',
        email: 'admin@jfctechno.com',
        password: hashedPassword,
        nombre: 'Administrador',
        apellido: 'JFC Techno',
        empresaId: 'JFC Techno', // Usar el nombre exacto de la empresa
        rol: 'admin',
        activo: true,
        permisos: [
          'calendario',
          'clientes',
          'conversaciones',
          'configuracion',
          'integraciones',
          'reportes',
          'mercadopago'
        ],
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Usuario creado');
    } else {
      console.log('✅ Usuario encontrado, actualizando empresaId...');
      console.log('   empresaId actual:', jfcUser.empresaId);
      
      await usuariosEmpresaCollection.updateOne(
        { username: 'admin_jfc' },
        { 
          $set: { 
            empresaId: 'JFC Techno', // Nombre exacto de la empresa
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('   empresaId nuevo: JFC Techno');
      console.log('✅ Actualizado');
    }

    console.log('');

    // 5. Test de login
    console.log('═══════════════════════════════════════════════════════');
    console.log('🧪 TEST DE LOGIN');
    console.log('═══════════════════════════════════════════════════════\n');

    const { login } = await import('../src/services/authService.js');
    
    const loginResult = await login('admin_jfc', 'jfc2024!');
    
    console.log('Resultado:');
    console.log('  Success:', loginResult.success);
    
    if (loginResult.success) {
      console.log('  ✅ LOGIN EXITOSO');
      console.log('  Token:', loginResult.token?.substring(0, 50) + '...');
      console.log('  User:');
      console.log('    - username:', loginResult.user?.username);
      console.log('    - empresaId:', loginResult.user?.empresaId);
      console.log('    - empresaNombre:', loginResult.user?.empresaNombre);
      console.log('    - role:', loginResult.user?.role);
    } else {
      console.log('  ❌ LOGIN FALLIDO');
      console.log('  Mensaje:', loginResult.message);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ CORRECCIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🔐 CREDENCIALES:');
    console.log('   Username: admin_jfc');
    console.log('   Password: jfc2024!');
    console.log('');
    console.log('📋 CONFIGURACIÓN:');
    console.log('   Colección: usuarios_empresa');
    console.log('   EmpresaId: JFC Techno');
    console.log('   Rol: admin');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

fixJFCEmpresaId();
