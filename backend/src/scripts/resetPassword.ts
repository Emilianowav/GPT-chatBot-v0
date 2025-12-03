// 🔑 Script para resetear contraseña de usuario
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AdminUserModel } from '../models/AdminUser.js';
import { connectDB } from '../config/database.js';

async function resetUserPassword() {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('📊 Conectado a MongoDB');

    // ID del usuario icenter_admin
    const userId = '68fb8a4468905e027d7e9660';
    const newPassword = 'icenter2024'; // Nueva contraseña temporal

    // Buscar el usuario
    const user = await AdminUserModel.findById(userId);
    if (!user) {
      console.error('❌ Usuario no encontrado con ID:', userId);
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
    await AdminUserModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      updatedAt: new Date()
    });

    console.log('✅ Contraseña actualizada exitosamente');
    console.log('🔑 Nueva contraseña temporal:', newPassword);
    console.log('⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  resetUserPassword();
}

export { resetUserPassword };
