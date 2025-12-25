import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function resetAdminJuventus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;

    // 1. Buscar empresa Juventus
    const empresa = await db.collection('empresas').findOne({ 
      nombre: /juventus/i 
    });

    if (!empresa) {
      console.error('❌ No se encontró empresa Juventus');
      process.exit(1);
    }

    console.log('\n📋 EMPRESA ENCONTRADA:');
    console.log('   Nombre:', empresa.nombre);
    console.log('   ID:', empresa._id);

    // 2. Buscar usuario admin de esta empresa
    let admin = await db.collection('usuarios').findOne({
      empresaId: empresa._id,
      rol: 'admin'
    });

    const nuevaContraseña = 'Juventus2025!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaContraseña, salt);

    if (!admin) {
      console.log('⚠️ No se encontró usuario admin, creando uno nuevo...');
      
      // Crear nuevo usuario admin
      const nuevoAdmin = {
        _id: new mongoose.Types.ObjectId(),
        email: 'admin@juventus.com',
        password: hashedPassword,
        nombre: 'Admin Juventus',
        rol: 'admin',
        empresaId: empresa._id,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('usuarios').insertOne(nuevoAdmin);
      admin = nuevoAdmin;
      
      console.log('\n✅ USUARIO ADMIN CREADO:');
    } else {
      console.log('\n👤 ADMIN ENCONTRADO:');
      console.log('   Email:', admin.email);
      console.log('   Nombre:', admin.nombre);
      console.log('   ID:', admin._id);

      // Actualizar contraseña
      await db.collection('usuarios').updateOne(
        { _id: admin._id },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('\n✅ CONTRASEÑA ACTUALIZADA:');
    }

    console.log('\n📋 CREDENCIALES DE ACCESO:');
    console.log('   Email:', admin.email);
    console.log('   Contraseña:', nuevaContraseña);
    console.log('\n🔗 URL de acceso: http://localhost:3001/login');

    await mongoose.disconnect();
    console.log('\n✅ Proceso completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminJuventus();
