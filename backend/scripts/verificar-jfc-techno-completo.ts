// 🔍 Script de verificación completa de JFC Techno para producción
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { EmpresaModel } from '../src/models/Empresa.js';
import { Seller } from '../src/modules/mercadopago/models/Seller.js';
import { PaymentLink } from '../src/modules/mercadopago/models/PaymentLink.js';

dotenv.config();

let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI no está configurada en .env');
  process.exit(1);
}

// Agregar el nombre de la base de datos si no está presente
if (!MONGODB_URI.includes('mongodb.net/') || MONGODB_URI.includes('mongodb.net/?')) {
  MONGODB_URI = MONGODB_URI.replace('mongodb.net/?', 'mongodb.net/neural_chatbot?');
  MONGODB_URI = MONGODB_URI.replace('mongodb.net?', 'mongodb.net/neural_chatbot?');
}

async function verificarJFCTechno() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Conectado a DB:', mongoose.connection.name);

    console.log('\n========================================');
    console.log('🔍 VERIFICACIÓN COMPLETA - JFC TECHNO');
    console.log('========================================\n');

    let erroresEncontrados = 0;
    let advertencias = 0;

    // 1. VERIFICAR EMPRESA
    console.log('📋 1. VERIFICANDO EMPRESA');
    console.log('─────────────────────────────────────');
    
    const empresa = await EmpresaModel.findOne({ nombre: 'JFC Techno' });
    
    if (!empresa) {
      console.log('❌ ERROR: Empresa JFC Techno no encontrada');
      erroresEncontrados++;
    } else {
      console.log('✅ Empresa encontrada');
      console.log('   Nombre:', empresa.nombre);
      console.log('   Teléfono:', empresa.telefono);
      console.log('   Email:', empresa.email);
      console.log('   Categoría:', empresa.categoria);
      console.log('   Modelo GPT:', empresa.modelo);
      
      // Verificar phoneNumberId
      if (!empresa.phoneNumberId) {
        console.log('❌ ERROR: phoneNumberId no configurado');
        erroresEncontrados++;
      } else {
        console.log('   PhoneNumberId:', empresa.phoneNumberId);
      }
      
      // Verificar prompt
      if (!empresa.prompt) {
        console.log('❌ ERROR: Prompt del sistema no configurado');
        erroresEncontrados++;
      } else {
        console.log('   Prompt: ✅ Configurado');
        console.log('   Longitud:', empresa.prompt.length, 'caracteres');
      }
    }

    // 2. VERIFICAR MÓDULO DE MERCADO PAGO
    console.log('\n💳 2. VERIFICANDO MÓDULO DE MERCADO PAGO');
    console.log('─────────────────────────────────────');
    
    if (!empresa) {
      console.log('❌ No se puede verificar (empresa no encontrada)');
      erroresEncontrados++;
    } else {
      const moduloMP = empresa.modulos?.find((m: any) => m.id === 'mercadopago');
      
      if (!moduloMP) {
        console.log('❌ ERROR: Módulo de Mercado Pago no encontrado');
        erroresEncontrados++;
      } else {
        console.log('✅ Módulo encontrado');
        console.log('   ID:', moduloMP.id);
        console.log('   Nombre:', moduloMP.nombre);
        console.log('   Activo:', moduloMP.activo);
        console.log('   Configuración:', moduloMP.configuracion);
        
        if (!moduloMP.activo) {
          console.log('❌ ERROR: Módulo no está activo');
          erroresEncontrados++;
        }
      }
    }

    // 3. VERIFICAR SELLER DE MERCADO PAGO
    console.log('\n💰 3. VERIFICANDO SELLER DE MERCADO PAGO');
    console.log('─────────────────────────────────────');
    
    const seller = await Seller.findOne({ internalId: 'JFC Techno' });
    
    if (!seller) {
      console.log('❌ ERROR: Seller no encontrado');
      erroresEncontrados++;
    } else {
      console.log('✅ Seller encontrado');
      console.log('   Internal ID:', seller.internalId);
      console.log('   User ID:', seller.userId);
      console.log('   Email:', seller.email);
      console.log('   Activo:', seller.active);
      
      if (!seller.accessToken) {
        console.log('❌ ERROR: Access Token no configurado');
        erroresEncontrados++;
      } else {
        console.log('   Access Token: ✅ Configurado');
      }
      
      if (!seller.refreshToken) {
        console.log('❌ ERROR: Refresh Token no configurado');
        erroresEncontrados++;
      } else {
        console.log('   Refresh Token: ✅ Configurado');
      }
    }

    // 4. VERIFICAR PAYMENT LINKS
    console.log('\n🔗 4. VERIFICANDO PAYMENT LINKS');
    console.log('─────────────────────────────────────');
    
    if (!seller) {
      console.log('❌ No se puede verificar (seller no encontrado)');
      erroresEncontrados++;
    } else {
      const paymentLinks = await PaymentLink.find({ 
        sellerId: seller.userId,
        slug: /^jfc-/
      });
      
      console.log(`   Total de links JFC: ${paymentLinks.length}`);
      
      if (paymentLinks.length === 0) {
        console.log('❌ ERROR: No hay payment links creados para JFC Techno');
        erroresEncontrados++;
      } else {
        console.log('✅ Payment links encontrados:');
        paymentLinks.forEach(link => {
          console.log(`   - ${link.title}: $${link.unitPrice} ARS (${link.slug})`);
          if (!link.active) {
            console.log(`     ⚠️  ADVERTENCIA: Link inactivo`);
            advertencias++;
          }
        });
      }
    }

    // 5. VERIFICAR CONFIGURACIÓN DE WHATSAPP
    console.log('\n📱 5. VERIFICANDO CONFIGURACIÓN DE WHATSAPP');
    console.log('─────────────────────────────────────');
    
    if (!empresa) {
      console.log('❌ No se puede verificar (empresa no encontrada)');
      erroresEncontrados++;
    } else {
      if (!empresa.phoneNumberId) {
        console.log('❌ ERROR CRÍTICO: phoneNumberId no configurado');
        console.log('   Sin esto, el bot NO puede enviar mensajes');
        erroresEncontrados++;
      } else {
        console.log('✅ PhoneNumberId configurado:', empresa.phoneNumberId);
      }
      
      // El accessToken se usa globalmente desde .env (META_WHATSAPP_TOKEN)
      console.log('✅ Access Token: Se usa globalmente desde META_WHATSAPP_TOKEN');
    }

    // 6. VERIFICAR VARIABLES DE ENTORNO
    console.log('\n🔐 6. VERIFICANDO VARIABLES DE ENTORNO');
    console.log('─────────────────────────────────────');
    
    const envVars = [
      'OPENAI_API_KEY',
      'META_APP_ID',
      'META_APP_SECRET',
      'META_WHATSAPP_TOKEN',
      'MP_ACCESS_TOKEN',
      'MP_PUBLIC_KEY'
    ];
    
    envVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: Configurado`);
      } else {
        console.log(`❌ ERROR: ${varName} no configurado`);
        erroresEncontrados++;
      }
    });

    // RESUMEN FINAL
    console.log('\n========================================');
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('========================================');
    
    if (erroresEncontrados === 0 && advertencias === 0) {
      console.log('✅ ¡TODO PERFECTO! Sistema listo para producción');
      console.log('\n🎯 FLUJO DE PAGO DINÁMICO:');
      console.log('   1. Cliente menciona producto (ej: "mouse gamer")');
      console.log('   2. Bot reconoce producto y confirma');
      console.log('   3. Cliente confirma compra ("sí, quiero pagar")');
      console.log('   4. Bot genera link de pago de $1 ARS');
      console.log('   5. Cliente paga en Mercado Pago');
      console.log('   6. Webhook recibe notificación');
      console.log('   7. Bot envía confirmación por WhatsApp');
    } else {
      console.log(`\n⚠️  ESTADO: ${erroresEncontrados > 0 ? 'NO LISTO PARA PRODUCCIÓN' : 'LISTO CON ADVERTENCIAS'}`);
      console.log(`   ❌ Errores críticos: ${erroresEncontrados}`);
      console.log(`   ⚠️  Advertencias: ${advertencias}`);
      
      if (erroresEncontrados > 0) {
        console.log('\n🔧 ACCIONES REQUERIDAS:');
        if (!empresa?.phoneNumberId) {
          console.log('   1. Configurar phoneNumberId de WhatsApp');
          console.log('      - Ir al panel de super admin');
          console.log('      - Editar empresa JFC Techno');
          console.log('      - Agregar phoneNumberId de WhatsApp Business API');
        }
      }
    }

    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ Error durante verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
verificarJFCTechno();
