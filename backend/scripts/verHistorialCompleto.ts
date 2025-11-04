// 📚 Script para ver el historial completo de un contacto
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/database.js';
import { ContactoEmpresaModel } from '../src/models/ContactoEmpresa.js';

const TELEFONO = '5493794946066';
const EMPRESA_NOMBRE = 'Paraná Lodge';

async function verHistorialCompleto() {
  try {
    console.log(`📚 Consultando historial completo...\n`);
    await connectDB();
    
    const contacto = await ContactoEmpresaModel.findOne({ 
      telefono: TELEFONO,
      empresaId: EMPRESA_NOMBRE
    });
    
    if (!contacto) {
      console.log('❌ No se encontró el contacto');
      process.exit(0);
    }
    
    console.log('✅ Contacto encontrado:');
    console.log(`   ID: ${contacto._id}`);
    console.log(`   Nombre: ${contacto.nombre} ${contacto.apellido}`);
    console.log(`   Teléfono: ${contacto.telefono}`);
    console.log(`   Empresa: ${contacto.empresaId}`);
    console.log('');
    
    const historial = contacto.conversaciones.historial;
    console.log(`📊 Total de mensajes en historial: ${historial.length}`);
    console.log('');
    
    if (historial.length === 0) {
      console.log('ℹ️ El historial está vacío');
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📜 HISTORIAL COMPLETO DE CONVERSACIÓN');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      for (let i = 0; i < historial.length; i++) {
        const rol = i % 2 === 0 ? '👤 Usuario' : '🤖 Asistente';
        const numero = String(i + 1).padStart(3, '0');
        console.log(`[${numero}] ${rol}:`);
        console.log(`${historial[i]}`);
        console.log('');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    // Métricas
    console.log('\n📊 MÉTRICAS:');
    console.log(`   Interacciones: ${contacto.metricas.interacciones}`);
    console.log(`   Mensajes enviados: ${contacto.metricas.mensajesEnviados}`);
    console.log(`   Mensajes recibidos: ${contacto.metricas.mensajesRecibidos}`);
    console.log(`   Tokens consumidos: ${contacto.metricas.tokensConsumidos}`);
    console.log(`   Última interacción: ${contacto.metricas.ultimaInteraccion}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verHistorialCompleto();
