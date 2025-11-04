// 🧹 Script para limpiar estados de confirmación antiguos con plantillas incorrectas
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

interface ConversationState {
  telefono: string;
  empresaId: string;
  estado: string;
  flujoActual?: string;
  data?: any;
  ultimaInteraccion: Date;
}

async function limpiarEstados() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    const ConversationStateModel = mongoose.model('conversation_states', new mongoose.Schema({
      telefono: String,
      empresaId: String,
      estado: String,
      flujoActual: String,
      data: mongoose.Schema.Types.Mixed,
      ultimaInteraccion: Date
    }));

    // Buscar estados con flujo de confirmación
    const estados = await ConversationStateModel.find({
      flujoActual: 'confirmacion_turnos'
    });

    console.log(`📋 Encontrados ${estados.length} estados de confirmación\n`);

    let eliminados = 0;

    for (const estado of estados) {
      const data = estado.get('data') as any;
      
      // Verificar si tiene mensajes con variables incorrectas
      if (data?.mensaje) {
        const mensaje = data.mensaje;
        
        if (mensaje.includes('{turnos}') || 
            mensaje.includes('{lista_turnos}') ||
            mensaje.includes('{todos_o_el}') ||
            mensaje.includes('{un_turno}')) {
          
          console.log(`⚠️  Estado con plantilla incorrecta:`);
          console.log(`   Teléfono: ${estado.get('telefono')}`);
          console.log(`   Empresa: ${estado.get('empresaId')}`);
          console.log(`   Mensaje: ${mensaje.substring(0, 100)}...`);
          
          await ConversationStateModel.deleteOne({ _id: estado._id });
          eliminados++;
          console.log(`   ✅ Eliminado\n`);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Proceso completado`);
    console.log(`📊 Estados eliminados: ${eliminados}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 Los nuevos mensajes de confirmación se generarán correctamente.');
    console.log('   El servicio confirmacionTurnosService.ts construye los mensajes dinámicamente.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

// Ejecutar
limpiarEstados();
