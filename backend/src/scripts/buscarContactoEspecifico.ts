// 🔍 Script para buscar un contacto específico
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';
import dotenv from 'dotenv';

dotenv.config();

async function buscarContactoEspecifico() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    const telefono = '+54 9 3794 94-6066';
    const telefonoNormalizado = normalizarTelefono(telefono);
    const empresaId = 'San Jose';

    console.log('🔍 BUSCANDO CONTACTO ESPECÍFICO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📱 Teléfono original:', telefono);
    console.log('📱 Teléfono normalizado:', telefonoNormalizado);
    console.log('🏢 Empresa:', empresaId);
    console.log('');

    const contacto = await ContactoEmpresaModel.findOne({
      telefono: telefonoNormalizado,
      empresaId
    }).sort({ creadoEn: -1 });

    if (contacto) {
      console.log('✅ CONTACTO ENCONTRADO:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🆔 ID:', contacto._id);
      console.log('👤 Nombre:', contacto.nombre, contacto.apellido);
      console.log('📞 Teléfono:', contacto.telefono);
      console.log('🏢 Empresa:', contacto.empresaId);
      console.log('📝 ProfileName:', contacto.profileName);
      console.log('🔧 Origen:', contacto.origen);
      console.log('✅ Activo:', contacto.activo);
      console.log('');
      console.log('📊 Métricas:');
      console.log('   Interacciones:', contacto.metricas?.interacciones);
      console.log('   Mensajes enviados:', contacto.metricas?.mensajesEnviados);
      console.log('   Mensajes recibidos:', contacto.metricas?.mensajesRecibidos);
      console.log('   Última interacción:', contacto.metricas?.ultimaInteraccion);
      console.log('');
      console.log('📅 Fechas:');
      console.log('   Creado:', (contacto as any).creadoEn || (contacto as any).createdAt);
      console.log('   Actualizado:', (contacto as any).actualizadoEn || (contacto as any).updatedAt);
      console.log('');
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ EL CONTACTO ESTÁ GUARDADO CORRECTAMENTE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('❌ CONTACTO NO ENCONTRADO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Buscar todos los contactos de esa empresa
      console.log('📋 Buscando todos los contactos de San Jose...\n');
      const todosContactos = await ContactoEmpresaModel.find({ empresaId }).sort({ creadoEn: -1 }).limit(10);
      
      console.log(`Encontrados ${todosContactos.length} contactos:\n`);
      todosContactos.forEach((c, i) => {
        console.log(`${i + 1}. ${c.nombre} ${c.apellido} - ${c.telefono}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

buscarContactoEspecifico();
