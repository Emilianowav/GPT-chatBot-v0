// 🔧 Script para corregir JFC Techno - eliminar duplicado y configurar correctamente
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { EmpresaModel } from '../src/models/Empresa.js';
import { Seller } from '../src/modules/mercadopago/models/Seller.js';

dotenv.config();

let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está configurada en .env');
  process.exit(1);
}

if (!MONGODB_URI.includes('mongodb.net/') || MONGODB_URI.includes('mongodb.net/?')) {
  MONGODB_URI = MONGODB_URI.replace('mongodb.net/?', 'mongodb.net/neural_chatbot?');
  MONGODB_URI = MONGODB_URI.replace('mongodb.net?', 'mongodb.net/neural_chatbot?');
}

async function corregirJFCTechno() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Conectado a DB:', mongoose.connection.name);

    console.log('\n========================================');
    console.log('🔧 CORRIGIENDO JFC TECHNO');
    console.log('========================================\n');

    // 1. Buscar ambas empresas
    const jfsTechno = await EmpresaModel.findOne({ nombre: 'JFS Techno' });
    const jfcTechno = await EmpresaModel.findOne({ nombre: 'JFC Techno' });

    if (!jfsTechno && !jfcTechno) {
      console.log('❌ No se encontró ninguna empresa JFS/JFC Techno');
      return;
    }

    console.log('📋 Estado actual:');
    if (jfsTechno) {
      console.log('\n❌ JFS Techno (DUPLICADO - ELIMINAR):');
      console.log('   ID:', jfsTechno._id);
      console.log('   Teléfono:', jfsTechno.telefono);
      console.log('   PhoneNumberId:', jfsTechno.phoneNumberId || 'No configurado');
      console.log('   Módulos MP:', jfsTechno.modulos?.find((m: any) => m.id === 'mercadopago') ? 'Sí' : 'No');
    }

    if (jfcTechno) {
      console.log('\n✅ JFC Techno (CORRECTO):');
      console.log('   ID:', jfcTechno._id);
      console.log('   Teléfono:', jfcTechno.telefono);
      console.log('   PhoneNumberId:', jfcTechno.phoneNumberId || 'No configurado');
      console.log('   Módulos MP:', jfcTechno.modulos?.find((m: any) => m.id === 'mercadopago') ? 'Sí' : 'No');
    }

    // 2. Guardar el teléfono de JFS antes de eliminarlo
    const telefonoWhatsApp = jfsTechno?.telefono;
    const phoneNumberIdWA = jfsTechno?.phoneNumberId;

    // 3. Eliminar JFS Techno (duplicado) PRIMERO para liberar el teléfono
    if (jfsTechno) {
      console.log('\n🗑️  Eliminando JFS Techno (duplicado)...');
      await EmpresaModel.deleteOne({ _id: jfsTechno._id });
      console.log('✅ JFS Techno eliminado');
    }

    // 4. Actualizar JFC Techno con el teléfono correcto de WhatsApp
    if (jfcTechno && telefonoWhatsApp) {
      console.log('\n🔧 Actualizando JFC Techno con teléfono de WhatsApp correcto...');
      
      // Copiar el teléfono de JFS a JFC (es el que está recibiendo mensajes)
      jfcTechno.telefono = telefonoWhatsApp; // +5493794056886
      
      // Copiar phoneNumberId si existe
      if (phoneNumberIdWA) {
        jfcTechno.phoneNumberId = phoneNumberIdWA;
      }
      
      await jfcTechno.save();
      console.log('✅ JFC Techno actualizado:');
      console.log('   Nuevo teléfono:', jfcTechno.telefono);
      console.log('   PhoneNumberId:', jfcTechno.phoneNumberId);
    }

    // 4. Verificar seller
    console.log('\n💰 Verificando seller de Mercado Pago...');
    const seller = await Seller.findOne({ internalId: 'JFC Techno' });
    
    if (seller) {
      console.log('✅ Seller encontrado:');
      console.log('   Internal ID:', seller.internalId);
      console.log('   User ID:', seller.userId);
    } else {
      console.log('❌ Seller no encontrado');
    }

    console.log('\n========================================');
    console.log('✅ CORRECCIÓN COMPLETADA');
    console.log('========================================');
    console.log('\n📋 Configuración final de JFC Techno:');
    
    const jfcFinal = await EmpresaModel.findOne({ nombre: 'JFC Techno' });
    if (jfcFinal) {
      console.log('   Nombre:', jfcFinal.nombre);
      console.log('   Teléfono:', jfcFinal.telefono);
      console.log('   PhoneNumberId:', jfcFinal.phoneNumberId);
      console.log('   Email:', jfcFinal.email);
      const moduloMP = jfcFinal.modulos?.find((m: any) => m.id === 'mercadopago');
      console.log('   Mercado Pago:', moduloMP ? '✅ Activo' : '❌ No configurado');
    }

    console.log('\n');

    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

corregirJFCTechno();
