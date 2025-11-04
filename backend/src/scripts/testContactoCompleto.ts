// 🔍 Script para probar creación de contacto paso a paso
import mongoose from 'mongoose';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { buscarOCrearContacto } from '../services/contactoService.js';
import { normalizarTelefono } from '../utils/telefonoUtils.js';
import dotenv from 'dotenv';

dotenv.config();

async function testContactoCompleto() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'neural_chatbot'
    });
    console.log('✅ Conectado a MongoDB\n');

    const telefonoOriginal = '+54 9 3794 94-6066';
    const empresaId = 'San Jose';

    console.log('🧪 TEST COMPLETO DE CREACIÓN DE CONTACTO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📱 Teléfono original:', telefonoOriginal);
    console.log('🏢 Empresa:', empresaId);
    console.log('');

    // 1. Normalizar teléfono
    console.log('1️⃣ NORMALIZANDO TELÉFONO...');
    const telefonoNormalizado = normalizarTelefono(telefonoOriginal);
    console.log('   Original:', telefonoOriginal);
    console.log('   Normalizado:', telefonoNormalizado);
    console.log('');

    // 2. Buscar contacto existente
    console.log('2️⃣ BUSCANDO CONTACTO EXISTENTE...');
    const contactoExistente = await ContactoEmpresaModel.findOne({
      empresaId,
      telefono: telefonoNormalizado
    });
    
    if (contactoExistente) {
      console.log('❌ CONTACTO YA EXISTE:');
      console.log('   ID:', contactoExistente._id);
      console.log('   Nombre:', contactoExistente.nombre);
      console.log('   Teléfono:', contactoExistente.telefono);
      console.log('');
      console.log('⚠️ Eliminando contacto existente para la prueba...');
      await ContactoEmpresaModel.deleteOne({ _id: contactoExistente._id });
      console.log('✅ Contacto eliminado');
    } else {
      console.log('✅ No existe contacto previo');
    }
    console.log('');

    // 3. Crear contacto usando el servicio
    console.log('3️⃣ CREANDO CONTACTO CON buscarOCrearContacto()...');
    try {
      const nuevoContacto = await buscarOCrearContacto({
        telefono: telefonoOriginal,
        profileName: '~Emiliano Test',
        empresaId
      });

      console.log('✅ CONTACTO CREADO EXITOSAMENTE:');
      console.log('   ID:', nuevoContacto._id);
      console.log('   Nombre:', nuevoContacto.nombre);
      console.log('   Apellido:', nuevoContacto.apellido);
      console.log('   Teléfono:', nuevoContacto.telefono);
      console.log('   ProfileName:', nuevoContacto.profileName);
      console.log('   EmpresaId:', nuevoContacto.empresaId);
      console.log('   Origen:', nuevoContacto.origen);
      console.log('   Activo:', nuevoContacto.activo);
      console.log('');

      // 4. Verificar que se puede buscar
      console.log('4️⃣ VERIFICANDO QUE SE PUEDE BUSCAR...');
      const contactoBuscado = await ContactoEmpresaModel.findOne({
        empresaId,
        telefono: telefonoNormalizado
      });

      if (contactoBuscado) {
        console.log('✅ Contacto encontrado en la BD');
        console.log('   ID:', contactoBuscado._id);
        console.log('   Teléfono:', contactoBuscado.telefono);
      } else {
        console.log('❌ ERROR: No se puede encontrar el contacto');
      }
      console.log('');

      // 5. Verificar estructura completa
      console.log('5️⃣ VERIFICANDO ESTRUCTURA COMPLETA...');
      const errores = [];

      if (!contactoBuscado?.empresaId) errores.push('empresaId faltante');
      if (!contactoBuscado?.telefono) errores.push('telefono faltante');
      if (!contactoBuscado?.nombre) errores.push('nombre faltante');
      if (!contactoBuscado?.preferencias) errores.push('preferencias faltantes');
      if (!contactoBuscado?.conversaciones) errores.push('conversaciones faltantes');
      if (!contactoBuscado?.metricas) errores.push('metricas faltantes');

      if (errores.length > 0) {
        console.log('❌ ERRORES ENCONTRADOS:');
        errores.forEach(e => console.log('   -', e));
      } else {
        console.log('✅ Estructura completa y correcta');
      }
      console.log('');

      // 6. Mostrar JSON completo
      console.log('6️⃣ JSON COMPLETO DEL CONTACTO:');
      console.log(JSON.stringify(contactoBuscado?.toObject(), null, 2));

    } catch (errorCreacion) {
      console.error('❌ ERROR AL CREAR CONTACTO:');
      console.error('   Mensaje:', (errorCreacion as Error).message);
      console.error('   Stack:', (errorCreacion as Error).stack);
      
      if ((errorCreacion as any).errors) {
        console.error('   Errores de validación:');
        Object.keys((errorCreacion as any).errors).forEach(campo => {
          console.error(`      - ${campo}:`, (errorCreacion as any).errors[campo].message);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

testContactoCompleto();
