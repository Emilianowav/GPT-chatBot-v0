// 🔍 Script para verificar usuario y contraseña
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
    const testPassword = '123';

    const user = await AdminUserModel.findOne({ username: username.toLowerCase() });
    if (!user) {
      console.error('❌ Usuario no encontrado');
      process.exit(1);
    }

    console.log('👤 Usuario encontrado:', {
      id: user._id,
      username: user.username,
      empresaId: user.empresaId,
      email: user.email,
      activo: user.activo,
      passwordHash: user.password.substring(0, 20) + '...'
    });

    // Probar comparación de contraseña
    console.log('\n🔐 Probando contraseña...');
    const isValid = await user.comparePassword(testPassword);
    console.log('✅ Resultado de comparePassword:', isValid);

    // Probar comparación manual con bcrypt
    console.log('\n🔧 Probando bcrypt manual...');
    const manualCompare = await bcrypt.compare(testPassword, user.password);
    console.log('✅ Resultado de bcrypt.compare:', manualCompare);

    // Generar nuevo hash para comparar
    console.log('\n🆕 Generando nuevo hash...');
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('🔑 Nuevo hash:', newHash);
    const newCompare = await bcrypt.compare(testPassword, newHash);
    console.log('✅ Nuevo hash funciona:', newCompare);

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
