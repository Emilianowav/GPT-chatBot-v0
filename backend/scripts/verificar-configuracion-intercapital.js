import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function verificar() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFICACIÓN COMPLETA - INTERCAPITAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. EMPRESA
    console.log('1️⃣ EMPRESA:');
    const empresa = await db.collection('empresas').findOne({ nombre: 'Intercapital' });
    if (empresa) {
      console.log('   ✅ Empresa encontrada');
      console.log(`   - Nombre: ${empresa.nombre}`);
      console.log(`   - Teléfono: ${empresa.telefono}`);
      console.log(`   - Email: ${empresa.email}`);
      console.log(`   - Phone Number ID: ${empresa.phoneNumberId || 'NO CONFIGURADO'}`);
      console.log(`   - Business Account ID: ${empresa.businessAccountId || 'NO CONFIGURADO'}`);
      console.log(`   - Comitente: ${empresa.comitente || 'NO CONFIGURADO'}`);
      console.log(`   - Plan: ${empresa.plan}`);
      console.log(`   - Categoría: ${empresa.categoria}`);
    } else {
      console.log('   ❌ Empresa NO encontrada');
    }

    // 2. USUARIO ADMIN
    console.log('\n2️⃣ USUARIO ADMINISTRADOR:');
    const usuario = await db.collection('usuarios_empresa').findOne({ 
      username: 'admin_intercapital' 
    });
    if (usuario) {
      console.log('   ✅ Usuario encontrado');
      console.log(`   - Username: ${usuario.username}`);
      console.log(`   - Email: ${usuario.email}`);
      console.log(`   - Rol: ${usuario.rol}`);
      console.log(`   - Empresa ID: ${usuario.empresaId}`);
      console.log(`   - Activo: ${usuario.activo}`);
      console.log(`   - Password hasheado: ${usuario.password?.startsWith('$2') ? 'SÍ' : 'NO'}`);
      console.log(`   - Permisos: ${usuario.permisos?.length || 0}`);
      console.log(`   - Created By: ${usuario.createdBy}`);
    } else {
      console.log('   ❌ Usuario NO encontrado');
    }

    // 3. API CONFIGURATION
    console.log('\n3️⃣ API CONFIGURATION:');
    const apiConfig = await db.collection('api_configurations').findOne({ 
      nombre: /intercapital/i 
    });
    if (apiConfig) {
      console.log('   ✅ API Configuration encontrada');
      console.log(`   - Nombre: ${apiConfig.nombre}`);
      console.log(`   - Base URL: ${apiConfig.baseUrl}`);
      console.log(`   - Tipo: ${apiConfig.tipo}`);
      console.log(`   - Estado: ${apiConfig.estado}`);
      console.log(`   - Activa: ${apiConfig.activa}`);
      console.log(`   - Empresa ID: ${apiConfig.empresaId}`);
      console.log(`   - Autenticación tipo: ${apiConfig.autenticacion?.tipo}`);
      console.log(`   - API Key configurada: ${apiConfig.autenticacion?.configuracion?.apiKey ? 'SÍ' : 'NO'}`);
      console.log(`   - Endpoints: ${apiConfig.endpoints?.length || 0}`);
      console.log(`   - Workflows: ${apiConfig.workflows?.length || 0}`);
      
      if (apiConfig.endpoints?.length > 0) {
        console.log('\n   📋 Endpoints configurados:');
        apiConfig.endpoints.forEach((ep, i) => {
          console.log(`      ${i + 1}. ${ep.id} - ${ep.method || ep.metodo} ${ep.path || ep.url}`);
        });
      }
      
      if (apiConfig.workflows?.length > 0) {
        console.log('\n   📋 Workflows configurados:');
        apiConfig.workflows.forEach((wf, i) => {
          console.log(`      ${i + 1}. ${wf.nombre || wf.id} (${wf.steps?.length || 0} pasos)`);
          console.log(`         - Activo: ${wf.activo}`);
          console.log(`         - Trigger: ${wf.trigger?.tipo}`);
          if (wf.trigger?.keywords) {
            console.log(`         - Keywords: ${wf.trigger.keywords.join(', ')}`);
          }
        });
      }
    } else {
      console.log('   ❌ API Configuration NO encontrada');
    }

    // 4. VERIFICAR RELACIONES
    console.log('\n4️⃣ VERIFICACIÓN DE RELACIONES:');
    if (empresa && usuario && apiConfig) {
      const empresaIdMatch = usuario.empresaId === empresa.nombre;
      const apiEmpresaMatch = apiConfig.empresaId.toString() === empresa._id.toString();
      
      console.log(`   - Usuario.empresaId === Empresa.nombre: ${empresaIdMatch ? '✅' : '❌'}`);
      console.log(`   - API.empresaId === Empresa._id: ${apiEmpresaMatch ? '✅' : '❌'}`);
      
      if (!empresaIdMatch) {
        console.log(`     ⚠️  Usuario tiene empresaId: "${usuario.empresaId}"`);
        console.log(`     ⚠️  Empresa tiene nombre: "${empresa.nombre}"`);
      }
      
      if (!apiEmpresaMatch) {
        console.log(`     ⚠️  API tiene empresaId: "${apiConfig.empresaId}"`);
        console.log(`     ⚠️  Empresa tiene _id: "${empresa._id}"`);
      }
    }

    // 5. CONTACTOS
    console.log('\n5️⃣ CONTACTOS:');
    const contactos = await db.collection('contactos_empresas').find({
      empresaId: empresa?._id
    }).toArray();
    console.log(`   - Total contactos: ${contactos.length}`);
    if (contactos.length > 0) {
      console.log(`   - Último contacto: ${contactos[0].telefono}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificar();
