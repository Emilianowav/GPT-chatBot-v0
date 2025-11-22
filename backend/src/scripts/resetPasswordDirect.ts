// 🔑 Script directo para resetear contraseña de usuario icenter_admin
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AdminUserModel } from '../models/AdminUser.js';
import { connectDB } from '../config/database.js';

// Cargar variables de entorno
dotenv.config();

async function main() {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('📊 Conectado a MongoDB');

    // Buscar usuario icenter_admin
    const username = 'icenter_admin';
    const newPassword = '123'; // Contraseña súper simple para testing

    // Buscar el usuario por username
    const user = await AdminUserModel.findOne({ username: username.toLowerCase() });
    if (!user) {
      console.error('❌ Usuario no encontrado con username:', username);
      console.log('🔍 Buscando todos los usuarios disponibles...');
      const allUsers = await AdminUserModel.find({}, 'username empresaId email');
      console.log('👥 Usuarios encontrados:', allUsers);
      process.exit(1);
    }

    console.log('👤 Usuario encontrado:', {
      username: user.username,
      empresaId: user.empresaId,
      email: user.email
    });

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar la contraseña
    await AdminUserModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      updatedAt: new Date()
    });

    console.log('✅ Contraseña actualizada exitosamente');
    console.log('🔑 Nueva contraseña temporal:', newPassword);
    console.log('⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('📊 Conexión a MongoDB cerrada');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error);
    process.exit(1);
  }
}

// Ejecutar directamente
main();
