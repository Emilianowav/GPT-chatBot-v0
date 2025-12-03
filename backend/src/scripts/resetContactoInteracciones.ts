// 🔄 Script para resetear interacciones del contacto para testing
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { connectDB } from '../config/database.js';

// Cargar variables de entorno
dotenv.config();

async function main() {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('📊 Conectado a MongoDB');

    // Buscar contacto ~Emiliano
    const contacto = await ContactoEmpresaModel.findOne({
      empresaId: 'iCenter',
      telefono: '5493794946066'
    });

    if (!contacto) {
      console.error('❌ Contacto no encontrado');
      process.exit(1);
    }

    console.log('👤 Contacto antes del reset:', {
      id: contacto._id,
      nombre: contacto.nombre,
      interacciones: contacto.metricas?.interacciones || 0,
      historialLength: contacto.conversaciones?.historial?.length || 0
    });

    // Resetear métricas
    contacto.metricas.interacciones = 0;
    contacto.metricas.mensajesEnviados = 0;
    contacto.metricas.mensajesRecibidos = 0;
    
    // Limpiar historial de conversaciones
    contacto.conversaciones.historial = [];
    contacto.conversaciones.saludado = false;
    contacto.conversaciones.despedido = false;
    
    await contacto.save();

    console.log('✅ Contacto reseteado:', {
      id: contacto._id,
      nombre: contacto.nombre,
      interacciones: contacto.metricas.interacciones,
      historialLength: contacto.conversaciones.historial.length
    });

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('📊 Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar directamente
main();
