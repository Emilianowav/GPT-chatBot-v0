// 🔧 Configurar plantilla COMPLETA con URL y body exacto para Meta
// Esto hace el sistema ESCALABLE - todo se configura desde MongoDB

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';

dotenv.config();

async function configurarPlantillaCompleta() {
  try {
    console.log('🔧 Configurando plantilla COMPLETA en MongoDB...\n');
    
    await connectDB();
    
    const empresaId = 'San Jose';
    const collection = mongoose.connection.collection('configuraciones_modulo');
    
    // Buscar el documento
    const doc = await collection.findOne({ empresaId });
    
    if (!doc) {
      console.log('❌ No se encontró configuración para San Jose');
      process.exit(1);
    }
    
    console.log('📋 Configurando plantilla con estructura COMPLETA de Meta\n');
    
    // ✅ NUEVA ESTRUCTURA: Guardar TODO el payload de Meta
    const plantillaCompleta = {
      // Identificación
      nombre: 'chofer_sanjose',
      idioma: 'es',
      activa: true,
      
      // 📤 URL de Meta API (con variable para phoneNumberId)
      metaApiUrl: 'https://graph.facebook.com/v22.0/{{phoneNumberId}}/messages',
      
      // 📋 BODY COMPLETO que se envía a Meta (con variables)
      metaPayload: {
        messaging_product: 'whatsapp',
        to: '{{telefono}}',  // Variable: teléfono del destinatario
        type: 'template',
        template: {
          name: 'chofer_sanjose',
          language: {
            code: 'es'
          },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: '{{agente}}' },        // Variable: nombre del agente
                { type: 'text', text: '{{lista_turnos}}' }   // Variable: lista de turnos
              ]
            }
          ]
        }
      },
      
      // 🔧 Variables que se reemplazan
      variables: [
        {
          nombre: 'phoneNumberId',
          origen: 'empresa',  // Se obtiene de EmpresaModel
          campo: 'phoneNumberId'
        },
        {
          nombre: 'telefono',
          origen: 'agente',   // Se obtiene del agente
          campo: 'telefono'
        },
        {
          nombre: 'agente',
          origen: 'calculado',  // Se calcula en el código
          formula: 'agente.nombre + " " + agente.apellido'
        },
        {
          nombre: 'lista_turnos',
          origen: 'calculado',  // Se calcula en el código
          formula: 'construirListaTurnos(turnos, config)'
        }
      ]
    };
    
    // Actualizar MongoDB
    const resultado = await collection.updateOne(
      { empresaId },
      {
        $set: {
          'notificacionDiariaAgentes.usarPlantillaMeta': true,
          'notificacionDiariaAgentes.plantillaMeta': plantillaCompleta
        }
      }
    );
    
    console.log('✅ PLANTILLA COMPLETA CONFIGURADA');
    console.log('═══════════════════════════════════════');
    console.log('Documentos modificados:', resultado.modifiedCount);
    console.log('');
    console.log('📋 Estructura guardada:');
    console.log(JSON.stringify(plantillaCompleta, null, 2));
    console.log('');
    console.log('🎯 Ahora el sistema es ESCALABLE:');
    console.log('   ✅ URL de Meta API guardada en MongoDB');
    console.log('   ✅ Body completo guardado en MongoDB');
    console.log('   ✅ Variables mapeadas desde MongoDB');
    console.log('   ✅ Sin hardcodeo en el código');
    console.log('');
    console.log('📝 Para agregar una nueva plantilla:');
    console.log('   1. Copia esta estructura');
    console.log('   2. Cambia el nombre de la plantilla');
    console.log('   3. Ajusta los componentes según Meta Business Manager');
    console.log('   4. Define las variables necesarias');
    console.log('   5. Guarda en MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
  }
}

configurarPlantillaCompleta();
