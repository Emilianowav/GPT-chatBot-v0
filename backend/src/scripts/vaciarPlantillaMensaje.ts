import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { ConfiguracionModuloModel } from '../modules/calendar/models/ConfiguracionModulo.js';

async function vaciar() {
  await connectDB();
  
  console.log('🔍 Buscando configuración...');
  
  // Cambiar a cadena vacía
  await ConfiguracionModuloModel.updateOne(
    { empresaId: 'San Jose' },
    { $set: { 'notificacionDiariaAgentes.plantillaMensaje': '' } }
  );
  
  console.log('✅ Campo plantillaMensaje vaciado');
  
  // Verificar
  const config = await ConfiguracionModuloModel.findOne({ empresaId: 'San Jose' });
  console.log('🔍 Verificación - plantillaMensaje:', `"${config?.notificacionDiariaAgentes?.plantillaMensaje}"`);
  
  if (config?.notificacionDiariaAgentes?.plantillaMensaje === '') {
    console.log('✅ CONFIRMADO: Campo vaciado exitosamente');
  } else {
    console.log('❌ ERROR: El campo NO se vació');
  }
  
  process.exit(0);
}

vaciar();
