// Script para ver todos los contactos
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';

dotenv.config();

async function verContactos() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Conectado a MongoDB\n');

    const contactos = await ContactoEmpresaModel.find({
      empresaId: 'San Jose'
    });

    console.log(`📋 Total contactos: ${contactos.length}\n`);

    contactos.forEach((contacto, index) => {
      console.log(`${index + 1}. ${contacto.nombre} ${contacto.apellido || ''}`);
      console.log(`   ID: ${contacto._id}`);
      console.log(`   Teléfono: ${contacto.telefono}`);
      console.log(`   Activo: ${contacto.activo}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

verContactos();
