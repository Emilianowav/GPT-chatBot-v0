// 🔧 Script para arreglar contraseña en UsuarioEmpresa
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
    const newPassword = '123';

    // Buscar usuario en UsuarioEmpresa
    const user = await UsuarioEmpresaModel.findOne({ 
      username: username.toLowerCase(),
      activo: true 
    });

    if (!user) {
      console.error('❌ Usuario no encontrado en UsuarioEmpresa');
      process.exit(1);
    }

    console.log('👤 Usuario encontrado en UsuarioEmpresa:', {
      id: user._id,
      username: user.username,
      email: user.email,
      empresaId: user.empresaId,
      rol: user.rol
    });

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar la contraseña
    await UsuarioEmpresaModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      updatedAt: new Date()
    });

    console.log('✅ Contraseña actualizada en UsuarioEmpresa');
    console.log('🔑 Nueva contraseña:', newPassword);

    // Verificar que funciona
    const updatedUser = await UsuarioEmpresaModel.findById(user._id);
    if (updatedUser) {
      const isValid = await updatedUser.comparePassword(newPassword);
      console.log('🔐 Verificación de contraseña:', isValid);
    }

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('📊 Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar directamente
main();
