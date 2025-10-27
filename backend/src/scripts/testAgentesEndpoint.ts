// 🧪 Test del endpoint de agentes
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { AdminUserModel } from '../models/AdminUser.js';
import jwt from 'jsonwebtoken';
import { AgenteModel } from '../modules/calendar/models/Agente.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_aqui';

async function testAgentesEndpoint() {
  try {
    console.log('🧪 Probando endpoint de agentes...\n');
    await connectDB();
    
    // 1. Obtener usuarios de ambas empresas
    console.log('1️⃣ Obteniendo usuarios...\n');
    
    const userDemo = await AdminUserModel.findOne({ username: 'demo' });
    const userSanJose = await AdminUserModel.findOne({ username: 'sanjose_admin' });
    
    if (!userDemo || !userSanJose) {
      console.error('❌ No se encontraron los usuarios');
      process.exit(1);
    }
    
    console.log('✅ Usuario Demo:', {
      username: userDemo.username,
      empresaId: userDemo.empresaId
    });
    
    console.log('✅ Usuario San Jose:', {
      username: userSanJose.username,
      empresaId: userSanJose.empresaId
    });
    
    // 2. Generar tokens
    console.log('\n2️⃣ Generando tokens JWT...\n');
    
    const tokenDemo = jwt.sign({
      userId: userDemo._id.toString(),
      username: userDemo.username,
      empresaId: userDemo.empresaId,
      role: userDemo.role
    }, JWT_SECRET);
    
    const tokenSanJose = jwt.sign({
      userId: userSanJose._id.toString(),
      username: userSanJose.username,
      empresaId: userSanJose.empresaId,
      role: userSanJose.role
    }, JWT_SECRET);
    
    console.log('✅ Token Demo generado');
    console.log('✅ Token San Jose generado');
    
    // 3. Decodificar tokens para verificar
    console.log('\n3️⃣ Verificando contenido de tokens...\n');
    
    const decodedDemo = jwt.verify(tokenDemo, JWT_SECRET) as any;
    const decodedSanJose = jwt.verify(tokenSanJose, JWT_SECRET) as any;
    
    console.log('Token Demo contiene:', {
      empresaId: decodedDemo.empresaId,
      username: decodedDemo.username
    });
    
    console.log('Token San Jose contiene:', {
      empresaId: decodedSanJose.empresaId,
      username: decodedSanJose.username
    });
    
    // 4. Simular consulta de agentes con cada empresaId
    console.log('\n4️⃣ Consultando agentes por empresa...\n');
    
    const agentesDemo = await AgenteModel.find({ empresaId: decodedDemo.empresaId });
    const agentesSanJose = await AgenteModel.find({ empresaId: decodedSanJose.empresaId });
    
    console.log('📊 Resultados:\n');
    
    console.log(`🏢 EmpresaDemo (empresaId: "${decodedDemo.empresaId}"):`);
    console.log(`   Agentes encontrados: ${agentesDemo.length}`);
    agentesDemo.forEach((agente: any) => {
      console.log(`   - ${agente.nombre} ${agente.apellido} (${agente.email})`);
    });
    
    console.log(`\n🏢 San Jose (empresaId: "${decodedSanJose.empresaId}"):`);
    console.log(`   Agentes encontrados: ${agentesSanJose.length}`);
    agentesSanJose.forEach((agente: any) => {
      console.log(`   - ${agente.nombre} ${agente.apellido} (${agente.email})`);
    });
    
    // 5. Verificar si hay problema de case-sensitivity
    console.log('\n5️⃣ Verificando case-sensitivity...\n');
    
    const todosLosAgentes = await AgenteModel.find({});
    console.log('Todos los agentes en la BD:');
    todosLosAgentes.forEach((agente: any) => {
      console.log(`   - ${agente.nombre} ${agente.apellido}`);
      console.log(`     empresaId: "${agente.empresaId}"`);
      console.log(`     Match con Demo: ${agente.empresaId === decodedDemo.empresaId}`);
      console.log(`     Match con San Jose: ${agente.empresaId === decodedSanJose.empresaId}`);
    });
    
    // 6. Conclusión
    console.log('\n' + '='.repeat(60));
    console.log('📋 CONCLUSIÓN:\n');
    
    if (agentesDemo.length === 1 && agentesSanJose.length === 2) {
      console.log('✅ El filtrado está funcionando CORRECTAMENTE');
      console.log('   - EmpresaDemo ve solo 1 agente');
      console.log('   - San Jose ve solo 2 agentes');
      console.log('\n💡 Si ves agentes de otra empresa en el frontend:');
      console.log('   1. Verifica que estés usando el token correcto');
      console.log('   2. Limpia el localStorage completamente');
      console.log('   3. Haz logout y login nuevamente');
      console.log('   4. Verifica en DevTools que el token tenga el empresaId correcto');
    } else {
      console.log('❌ HAY UN PROBLEMA con el filtrado');
      console.log(`   - EmpresaDemo debería ver 1 agente, ve ${agentesDemo.length}`);
      console.log(`   - San Jose debería ver 2 agentes, ve ${agentesSanJose.length}`);
    }
    
    console.log('='.repeat(60));
    
    // 7. Generar tokens para copiar y pegar
    console.log('\n🔑 TOKENS PARA PRUEBA MANUAL:\n');
    console.log('Token EmpresaDemo (copiar y pegar en localStorage):');
    console.log(tokenDemo);
    console.log('\nToken San Jose (copiar y pegar en localStorage):');
    console.log(tokenSanJose);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

testAgentesEndpoint();
