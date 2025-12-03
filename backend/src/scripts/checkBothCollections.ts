// 🔍 Script para verificar usuario en ambas colecciones
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { AdminUserModel } from '../models/AdminUser.js';
import { UsuarioEmpresaModel } from '../models/UsuarioEmpresa.js';
import { connectDB } from '../config/database.js';

// Cargar variables de entorno
dotenv.config();

async function main() {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('📊 Conectado a MongoDB');

    const username = 'icenter_admin';

    // Buscar en UsuarioEmpresa (nuevo sistema)
    console.log('\n🔍 Buscando en UsuarioEmpresa...');
    const usuarioEmpresa = await UsuarioEmpresaModel.findOne({ 
      username: username.toLowerCase(),
      activo: true 
    });
    
    if (usuarioEmpresa) {
      console.log('✅ Encontrado en UsuarioEmpresa:', {
        id: usuarioEmpresa._id,
        username: usuarioEmpresa.username,
        email: usuarioEmpresa.email,
        empresaId: usuarioEmpresa.empresaId,
        rol: usuarioEmpresa.rol,
        activo: usuarioEmpresa.activo
      });

      // Probar contraseña
      const isValid = await usuarioEmpresa.comparePassword('123');
      console.log('🔐 Contraseña válida en UsuarioEmpresa:', isValid);
    } else {
      console.log('❌ No encontrado en UsuarioEmpresa');
    }

    // Buscar en AdminUser (sistema antiguo)
    console.log('\n🔍 Buscando en AdminUser...');
    const adminUser = await AdminUserModel.findOne({ 
      username: username.toLowerCase(),
      activo: true 
    });
    
    if (adminUser) {
      console.log('✅ Encontrado en AdminUser:', {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        empresaId: adminUser.empresaId,
        role: adminUser.role,
        activo: adminUser.activo
      });

      // Probar contraseña
      const isValid = await adminUser.comparePassword('123');
      console.log('🔐 Contraseña válida en AdminUser:', isValid);
    } else {
      console.log('❌ No encontrado en AdminUser');
    }

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n📊 Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar directamente
main();
