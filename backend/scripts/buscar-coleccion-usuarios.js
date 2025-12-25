import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function buscarColeccionUsuarios() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    console.log('📍 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

    const db = mongoose.connection.db;

    // Listar todas las colecciones
    console.log('\n📋 COLECCIONES DISPONIBLES:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log('   -', col.name);
    });

    // Buscar en colecciones comunes de usuarios
    const posiblesColecciones = [
      'admin_users',
      'adminusers',
      'usuarios',
      'usuarios_empresa',
      'usuarioempresas',
      'users'
    ];

    console.log('\n🔍 BUSCANDO USUARIOS EN COLECCIONES COMUNES:\n');

    for (const colName of posiblesColecciones) {
      try {
        const col = db.collection(colName);
        const count = await col.countDocuments();
        
        if (count > 0) {
          console.log(`\n📦 ${colName} (${count} documentos):`);
          const usuarios = await col.find({}).limit(5).toArray();
          usuarios.forEach(u => {
            console.log(`   - Username: ${u.username || u.email || u.nombre || 'N/A'}`);
            console.log(`     Email: ${u.email || 'N/A'}`);
            console.log(`     EmpresaId: ${u.empresaId || 'N/A'}`);
            console.log(`     Rol: ${u.rol || u.role || 'N/A'}`);
            console.log('');
          });
        }
      } catch (err) {
        // Colección no existe
      }
    }

    // Buscar específicamente usuarios con empresaId de Juventus
    console.log('\n🎾 BUSCANDO USUARIOS DE JUVENTUS:\n');
    
    const empresa = await db.collection('empresas').findOne({ 
      nombre: /juventus/i 
    });

    if (empresa) {
      console.log('✅ Empresa encontrada:', empresa.nombre);
      console.log('   ID:', empresa._id);
      console.log('   ID (string):', empresa._id.toString());

      for (const colName of posiblesColecciones) {
        try {
          const col = db.collection(colName);
          
          // Buscar con ObjectId
          let usuarios = await col.find({ 
            empresaId: empresa._id 
          }).toArray();
          
          // Si no encuentra, buscar con string
          if (usuarios.length === 0) {
            usuarios = await col.find({ 
              empresaId: empresa._id.toString() 
            }).toArray();
          }

          if (usuarios.length > 0) {
            console.log(`\n   ✅ Encontrados en ${colName}:`);
            usuarios.forEach(u => {
              console.log(`      - Username: ${u.username || u.email || 'N/A'}`);
              console.log(`        Email: ${u.email || 'N/A'}`);
              console.log(`        Rol: ${u.rol || u.role || 'N/A'}`);
            });
          }
        } catch (err) {
          // Colección no existe
        }
      }
    } else {
      console.log('❌ Empresa Juventus no encontrada');
    }

    await mongoose.disconnect();
    console.log('\n✅ Proceso completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

buscarColeccionUsuarios();
