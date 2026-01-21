/**
 * 🧪 PRUEBA 3: Crear cliente de prueba con agente asignado
 */

import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';

async function testCrearCliente() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    console.log('\n🧪 PRUEBA 3: Cliente con agente asignado\n');
    console.log('='.repeat(80));
    
    // 1. Obtener primer agente de San Jose
    const agente = await db.collection('agentes').findOne({ empresaId: 'San Jose' });
    
    if (!agente) {
      console.log('❌ No se encontró ningún agente');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`\n✅ Agente seleccionado: ${agente.nombre} ${agente.apellido}`);
    console.log(`   ID: ${agente._id}`);
    
    // 2. Buscar si ya existe cliente de prueba
    const telefonoPrueba = '5493794999999';
    let cliente = await db.collection('contactos_empresa').findOne({
      empresaId: 'San Jose',
      telefono: telefonoPrueba
    });
    
    if (cliente) {
      console.log('\n📝 Cliente de prueba ya existe, actualizando...');
      
      // Actualizar para asignar agente
      await db.collection('contactos_empresa').updateOne(
        { _id: cliente._id },
        { 
          $set: { 
            agentesAsignados: [agente._id],
            nombre: 'CLIENTE',
            apellido: 'PRUEBA ASIGNACION'
          } 
        }
      );
      
      cliente = await db.collection('contactos_empresa').findOne({ _id: cliente._id });
      
    } else {
      console.log('\n📝 Creando nuevo cliente de prueba...');
      
      // Crear nuevo cliente
      const resultado = await db.collection('contactos_empresa').insertOne({
        empresaId: 'San Jose',
        telefono: telefonoPrueba,
        nombre: 'CLIENTE',
        apellido: 'PRUEBA ASIGNACION',
        agentesAsignados: [agente._id],
        origen: 'manual',
        preferencias: {
          aceptaWhatsApp: true,
          aceptaSMS: false,
          aceptaEmail: true,
          recordatorioTurnos: true,
          diasAnticipacionRecordatorio: 1,
          horaRecordatorio: '10:00',
          notificacionesPromocion: false,
          notificacionesDisponibilidad: false
        },
        conversaciones: {
          historial: [],
          ultimaConversacion: new Date(),
          saludado: false,
          despedido: false,
          mensaje_ids: [],
          ultimo_status: '',
          contactoInformado: false
        },
        metricas: {
          interacciones: 0,
          mensajesEnviados: 0,
          mensajesRecibidos: 0,
          mediaRecibidos: 0,
          tokensConsumidos: 0,
          turnosRealizados: 0,
          turnosCancelados: 0,
          ultimaInteraccion: new Date()
        },
        activo: true,
        chatbotPausado: false,
        creadoEn: new Date(),
        actualizadoEn: new Date()
      });
      
      cliente = await db.collection('contactos_empresa').findOne({ _id: resultado.insertedId });
    }
    
    console.log('\n✅ Cliente configurado:');
    console.log(`   ID: ${cliente._id}`);
    console.log(`   Nombre: ${cliente.nombre} ${cliente.apellido}`);
    console.log(`   Teléfono: ${cliente.telefono}`);
    console.log(`   Agentes asignados: ${cliente.agentesAsignados?.length || 0}`);
    
    if (cliente.agentesAsignados && cliente.agentesAsignados.length > 0) {
      console.log(`   ✅ Agente asignado: ${agente.nombre} ${agente.apellido}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Cliente de prueba listo para probar asignación automática\n');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testCrearCliente();
