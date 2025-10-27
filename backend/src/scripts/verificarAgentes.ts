// 🔍 Script para verificar agentes por empresa
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { AgenteModel } from '../modules/calendar/models/Agente.js';
import { EmpresaModel } from '../models/Empresa.js';

async function verificarAgentes() {
  try {
    console.log('🔍 Verificando agentes en la base de datos...\n');
    await connectDB();
    
    // Obtener todas las empresas
    const empresas = await EmpresaModel.find({}, 'nombre');
    console.log(`📊 Total de empresas: ${empresas.length}\n`);
    
    // Obtener todos los agentes
    const todosLosAgentes = await AgenteModel.find({});
    console.log(`👥 Total de agentes: ${todosLosAgentes.length}\n`);
    
    // Agrupar agentes por empresa
    console.log('📋 AGENTES POR EMPRESA:\n');
    console.log('='.repeat(60));
    
    for (const empresa of empresas) {
      const agentesEmpresa = await AgenteModel.find({ empresaId: empresa.nombre });
      
      console.log(`\n🏢 ${empresa.nombre}`);
      console.log(`   Total de agentes: ${agentesEmpresa.length}`);
      
      if (agentesEmpresa.length > 0) {
        agentesEmpresa.forEach((agente: any) => {
          console.log(`   - ${agente.nombre} ${agente.apellido}`);
          console.log(`     ID: ${agente._id}`);
          console.log(`     Email: ${agente.email}`);
          console.log(`     Activo: ${agente.activo ? '✅' : '❌'}`);
          if (agente.especialidad) {
            console.log(`     Especialidad: ${agente.especialidad}`);
          }
        });
      } else {
        console.log('   ⚠️  No hay agentes');
      }
    }
    
    // Verificar agentes sin empresa válida
    console.log('\n' + '='.repeat(60));
    console.log('\n🔍 VERIFICANDO INTEGRIDAD:\n');
    
    const empresaIds = empresas.map(e => e.nombre);
    const agentesSinEmpresa = todosLosAgentes.filter(
      (agente: any) => !empresaIds.includes(agente.empresaId)
    );
    
    if (agentesSinEmpresa.length > 0) {
      console.log(`⚠️  Agentes con empresaId inválido: ${agentesSinEmpresa.length}`);
      agentesSinEmpresa.forEach((agente: any) => {
        console.log(`   - ${agente.nombre} ${agente.apellido} (empresaId: ${agente.empresaId})`);
      });
    } else {
      console.log('✅ Todos los agentes tienen un empresaId válido');
    }
    
    console.log('\n' + '='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

verificarAgentes();
