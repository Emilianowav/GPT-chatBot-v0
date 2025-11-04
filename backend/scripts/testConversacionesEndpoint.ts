// 🧪 Test del endpoint de conversaciones
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/database.js';
import { ContactoEmpresaModel } from '../src/models/ContactoEmpresa.js';

const EMPRESA_ID = 'Paraná Lodge';

async function testConversacionesEndpoint() {
  try {
    console.log(`🧪 Probando endpoint de conversaciones para: ${EMPRESA_ID}\n`);
    await connectDB();
    
    // Simular lo que hace el endpoint getConversaciones
    console.log('1️⃣ Buscando contactos con historial...');
    const contactos = await ContactoEmpresaModel.find({ 
      empresaId: EMPRESA_ID,
      'conversaciones.historial': { $exists: true, $ne: [] }
    }).sort({ 'metricas.ultimaInteraccion': -1 });
    
    console.log(`   ✅ Encontrados: ${contactos.length} contacto(s)\n`);
    
    if (contactos.length === 0) {
      console.log('❌ No hay contactos con historial');
      process.exit(0);
    }
    
    // Mapear como lo hace el endpoint
    const conversaciones = contactos.map(contacto => {
      const historial = contacto.conversaciones?.historial || [];
      const ultimoMensaje = historial.length > 0 ? historial[historial.length - 1] : null;
      
      // Determinar el rol del último mensaje (par = user, impar = assistant)
      const ultimoRol = historial.length > 0 && historial.length % 2 === 0 ? 'assistant' : 'user';

      return {
        id: contacto._id,
        nombre: `${contacto.nombre} ${contacto.apellido}`.trim() || 'Sin nombre',
        numero: contacto.telefono,
        avatar: contacto.nombre ? contacto.nombre.charAt(0).toUpperCase() : 'U',
        ultimoMensaje: ultimoMensaje ? {
          texto: ultimoMensaje,
          rol: ultimoRol,
          fecha: contacto.conversaciones?.ultimaConversacion || contacto.metricas.ultimaInteraccion
        } : null,
        ultimaInteraccion: contacto.metricas.ultimaInteraccion,
        interacciones: contacto.metricas.interacciones || 0,
        noLeidos: 0
      };
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESULTADO DEL ENDPOINT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(JSON.stringify({
      success: true,
      conversaciones
    }, null, 2));
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 DETALLE DE CADA CONVERSACIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    conversaciones.forEach((conv, index) => {
      console.log(`[${index + 1}] ${conv.nombre} (${conv.numero})`);
      console.log(`    ID: ${conv.id}`);
      console.log(`    Avatar: ${conv.avatar}`);
      console.log(`    Interacciones: ${conv.interacciones}`);
      console.log(`    Última interacción: ${conv.ultimaInteraccion}`);
      if (conv.ultimoMensaje) {
        console.log(`    Último mensaje:`);
        console.log(`      - Rol: ${conv.ultimoMensaje.rol}`);
        console.log(`      - Texto: "${conv.ultimoMensaje.texto.substring(0, 50)}${conv.ultimoMensaje.texto.length > 50 ? '...' : ''}"`);
        console.log(`      - Fecha: ${conv.ultimoMensaje.fecha}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testConversacionesEndpoint();
