// 🔍 Script para verificar configuración del workflow
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ApiConfigurationModel } from '../modules/integrations/models/ApiConfiguration.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { EmpresaModel } from '../models/Empresa.js';
import { connectDB } from '../config/database.js';

// Cargar variables de entorno
dotenv.config();

async function main() {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('📊 Conectado a MongoDB');

    // Buscar empresa iCenter
    const empresa = await EmpresaModel.findOne({ nombre: 'iCenter' });
    if (!empresa) {
      console.error('❌ Empresa iCenter no encontrada');
      process.exit(1);
    }

    console.log('🏢 Empresa encontrada:', {
      id: empresa._id,
      nombre: empresa.nombre
    });

    // Buscar APIs con workflows
    const apisConWorkflows = await ApiConfigurationModel.find({
      empresaId: empresa._id,
      'workflows.0': { $exists: true }
    });

    console.log(`\n🔄 APIs con workflows: ${apisConWorkflows.length}`);

    for (const api of apisConWorkflows) {
      console.log(`\n📋 API: ${api.nombre}`);
      console.log(`   Workflows: ${api.workflows?.length || 0}`);
      
      if (api.workflows) {
        for (const workflow of api.workflows) {
          const wf = workflow as any;
          console.log(`\n   🔧 Workflow: ${wf.nombre}`);
          console.log(`      ID: ${wf.id}`);
          console.log(`      Activo: ${wf.activo}`);
          console.log(`      Trigger tipo: ${wf.trigger?.tipo}`);
          console.log(`      Trigger primeraRespuesta: ${wf.trigger?.primeraRespuesta}`);
          console.log(`      Trigger keywords: ${JSON.stringify(wf.trigger?.keywords)}`);
          console.log(`      Prioridad: ${wf.prioridad || 0}`);
          console.log(`      Steps: ${wf.steps?.length || 0}`);
        }
      }
    }

    // Buscar contacto ~Emiliano
    console.log('\n👤 Buscando contacto ~Emiliano...');
    const contacto = await ContactoEmpresaModel.findOne({
      empresaId: 'iCenter',
      telefono: '5493794946066'
    });

    if (contacto) {
      console.log('✅ Contacto encontrado:', {
        id: contacto._id,
        nombre: contacto.nombre,
        telefono: contacto.telefono,
        interacciones: contacto.metricas?.interacciones || 0,
        historialLength: contacto.conversaciones?.historial?.length || 0,
        ultimaInteraccion: contacto.metricas?.ultimaInteraccion
      });
    } else {
      console.log('❌ Contacto no encontrado');
    }

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
