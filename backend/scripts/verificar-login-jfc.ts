import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function verificarLogin() {
  try {
    console.log('🔍 Verificando credenciales de JFC Techno...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No se pudo obtener la base de datos');

    // Buscar en admin_users
    console.log('📋 Buscando en colección admin_users...');
    const adminUsersCollection = db.collection('admin_users');
    const adminUser = await adminUsersCollection.findOne({ username: 'admin_jfc' });
    
    if (adminUser) {
      console.log('✅ Usuario encontrado en admin_users:');
      console.log('   Username:', adminUser.username);
      console.log('   Email:', adminUser.email);
      console.log('   EmpresaId:', adminUser.empresaId);
      console.log('   Role:', adminUser.role);
      console.log('   Activo:', adminUser.activo);
      console.log('   Password hash:', adminUser.password ? 'Existe' : 'NO EXISTE');
      
      // Probar contraseña
      if (adminUser.password) {
        const testPassword = 'jfc2024!';
        const isValid = await bcryptjs.compare(testPassword, adminUser.password);
        console.log(`\n🔐 Test de contraseña "${testPassword}":`, isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA');
        
        if (!isValid) {
          console.log('\n⚠️  La contraseña no coincide. Actualizando...');
          const newHash = await bcryptjs.hash(testPassword, 10);
          await adminUsersCollection.updateOne(
            { username: 'admin_jfc' },
            { $set: { password: newHash } }
          );
          console.log('✅ Contraseña actualizada correctamente');
        }
      }
    } else {
      console.log('❌ Usuario NO encontrado en admin_users');
    }

    // Buscar en usuarios_empresa
    console.log('\n📋 Buscando en colección usuarios_empresa...');
    const usuariosEmpresaCollection = db.collection('usuarios_empresa');
    const usuarioEmpresa = await usuariosEmpresaCollection.findOne({ username: 'admin_jfc' });
    
    if (usuarioEmpresa) {
      console.log('✅ Usuario encontrado en usuarios_empresa:');
      console.log('   Username:', usuarioEmpresa.username);
      console.log('   Email:', usuarioEmpresa.email);
      console.log('   EmpresaId:', usuarioEmpresa.empresaId);
      console.log('   Rol:', usuarioEmpresa.rol);
      console.log('   Activo:', usuarioEmpresa.activo);
      console.log('   Password hash:', usuarioEmpresa.password ? 'Existe' : 'NO EXISTE');
    } else {
      console.log('❌ Usuario NO encontrado en usuarios_empresa');
    }

    // Verificar empresa
    console.log('\n📋 Verificando empresa JFC Techno...');
    const empresasCollection = db.collection('empresas');
    const empresa = await empresasCollection.findOne({ nombre: 'JFC Techno' });
    
    if (empresa) {
      console.log('✅ Empresa encontrada:');
      console.log('   Nombre:', empresa.nombre);
      console.log('   _id:', empresa._id);
      console.log('   Email:', empresa.email);
      console.log('   Teléfono:', empresa.telefono);
    } else {
      console.log('❌ Empresa NO encontrada');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 CREDENCIALES PARA LOGIN:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Username: admin_jfc');
    console.log('Password: jfc2024!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

verificarLogin();
