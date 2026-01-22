// 🔧 Script para migrar anticipacion al campo programacion
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixProgramacionField() {
  try {
    console.log('🔧 INICIANDO MIGRACIÓN DE ANTICIPACIÓN\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const empresaId = 'San Jose';
    const collection = mongoose.connection.db.collection('configuraciones_modulo');
    
    // 1. Leer documento actual
    console.log('📖 Leyendo configuración actual...');
    const doc = await collection.findOne({ empresaId });
    
    if (!doc) {
      console.log('❌ No se encontró configuración para', empresaId);
      return;
    }
    
    console.log('✅ Documento encontrado\n');
    
    // 2. Verificar estructura actual
    const notif = doc.plantillasMeta?.notificacionDiariaAgentes;
    console.log('📊 Estructura actual:');
    console.log('  - activa:', notif?.activa);
    console.log('  - tipo:', notif?.tipo);
    console.log('  - nombre:', notif?.nombre);
    console.log('  - programacion existe:', !!notif?.programacion);
    console.log('  - programacion.anticipacion:', notif?.programacion?.anticipacion);
    
    // 3. Si programacion no existe o no tiene anticipacion, crear/actualizar
    if (!notif?.programacion?.anticipacion) {
      console.log('\n🔄 Programacion.anticipacion no existe, creando...');
      
      // Asegurarnos de que programacion tenga todos los campos necesarios
      const programacionActualizada = {
        metodoVerificacion: notif?.programacion?.metodoVerificacion || 'hora_fija',
        horaEnvio: notif?.programacion?.horaEnvio || '22:00',
        anticipacion: notif?.programacion?.anticipacion || 1, // Default 1 día antes
        frecuencia: notif?.programacion?.frecuencia || 'diaria',
        diasSemana: notif?.programacion?.diasSemana || [1, 2, 3, 4, 5],
        rangoHorario: notif?.programacion?.rangoHorario || 'hoy',
        filtroEstado: notif?.programacion?.filtroEstado || ['pendiente', 'confirmado'],
        incluirDetalles: notif?.programacion?.incluirDetalles || {
          origen: true,
          destino: true,
          nombreCliente: true,
          telefonoCliente: false,
          horaReserva: true,
          notasInternas: false
        }
      };
      
      console.log('\n📝 Actualizando documento con programacion completa...');
      console.log(JSON.stringify(programacionActualizada, null, 2));
      
      const result = await collection.updateOne(
        { empresaId },
        {
          $set: {
            'plantillasMeta.notificacionDiariaAgentes.programacion': programacionActualizada
          }
        }
      );
      
      console.log('\n✅ Documento actualizado:');
      console.log('  - matchedCount:', result.matchedCount);
      console.log('  - modifiedCount:', result.modifiedCount);
      
      // 4. Verificar actualización
      console.log('\n🔍 Verificando actualización...');
      const docActualizado = await collection.findOne({ empresaId });
      const notifActualizada = docActualizado.plantillasMeta?.notificacionDiariaAgentes;
      
      console.log('📊 Estructura después de actualizar:');
      console.log('  - programacion existe:', !!notifActualizada?.programacion);
      console.log('  - programacion.anticipacion:', notifActualizada?.programacion?.anticipacion);
      console.log('  - programacion.diasSemana:', notifActualizada?.programacion?.diasSemana);
      console.log('  - programacion.horaEnvio:', notifActualizada?.programacion?.horaEnvio);
      
      if (notifActualizada?.programacion?.anticipacion) {
        console.log('\n✅ ¡MIGRACIÓN EXITOSA! anticipacion ahora está en programacion');
      } else {
        console.log('\n❌ La migración no funcionó correctamente');
      }
    } else {
      console.log('\n✅ programacion.anticipacion ya existe con valor:', notif.programacion.anticipacion);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

fixProgramacionField();
