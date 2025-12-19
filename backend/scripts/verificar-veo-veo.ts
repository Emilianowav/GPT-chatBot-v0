/**
 * Script de Verificación Completa - Veo Veo
 * Verifica configuración de empresa, seller MP y phoneNumberId para notificaciones
 */
import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';
const EMPRESA_NOMBRE = 'Veo Veo';

async function verificar() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado a DB:', mongoose.connection.db?.databaseName);
    
    console.log('\n========================================');
    console.log('🔍 VERIFICACIÓN COMPLETA - VEO VEO');
    console.log('========================================\n');
    
    // 1. EMPRESA
    console.log('📋 1. EMPRESA');
    console.log('─────────────────────────────────────');
    const empresa = await mongoose.connection.collection('empresas').findOne({ nombre: EMPRESA_NOMBRE });
    
    if (!empresa) {
      console.error('❌ EMPRESA NO ENCONTRADA');
      await mongoose.disconnect();
      return;
    }
    
    console.log('✅ Empresa encontrada');
    console.log('   ID:', empresa._id);
    console.log('   Nombre:', empresa.nombre);
    console.log('   Teléfono:', empresa.telefono);
    console.log('   PhoneNumberId:', empresa.phoneNumberId || '❌ NO CONFIGURADO');
    console.log('   Categoría:', empresa.categoria);
    console.log('   Modelo GPT:', empresa.modelo || 'gpt-3.5-turbo');
    
    const empresaIdStr = empresa._id.toString();
    
    // 2. SELLER DE MERCADO PAGO
    console.log('\n💳 2. SELLER DE MERCADO PAGO');
    console.log('─────────────────────────────────────');
    
    // Buscar por nombre de empresa en mpsellers
    let seller = await mongoose.connection.collection('mpsellers').findOne({ internalId: EMPRESA_NOMBRE });
    
    // Si no se encuentra, buscar por ObjectId
    if (!seller) {
      seller = await mongoose.connection.collection('mpsellers').findOne({ internalId: empresaIdStr });
    }
    
    // Si aún no se encuentra, buscar por userId conocido
    if (!seller) {
      seller = await mongoose.connection.collection('mpsellers').findOne({ userId: '182716364' });
    }
    
    if (!seller) {
      console.error('❌ SELLER NO ENCONTRADO');
      console.log('   La empresa no tiene Mercado Pago conectado');
      console.log('   No podrá generar links de pago ni recibir notificaciones');
    } else {
      console.log('✅ Seller encontrado');
      console.log('   MP User ID:', seller.userId);
      console.log('   Internal ID:', seller.internalId);
      console.log('   Email:', seller.email || 'N/A');
      console.log('   Access Token:', seller.accessToken ? '✅ Configurado' : '❌ NO CONFIGURADO');
      console.log('   Refresh Token:', seller.refreshToken ? '✅ Configurado' : '❌ NO CONFIGURADO');
    }
    
    // 3. PAYMENT LINKS
    console.log('\n🔗 3. PAYMENT LINKS');
    console.log('─────────────────────────────────────');
    
    if (seller) {
      const links = await mongoose.connection.collection('mppaymentlinks').find({ 
        sellerId: seller.userId 
      }).toArray();
      
      console.log(`   Total de links: ${links.length}`);
      
      if (links.length > 0) {
        console.log('   Links activos:');
        links.forEach((link: any) => {
          console.log(`   - ${link.title}: $${link.unitPrice} (${link.active ? '✅ Activo' : '❌ Inactivo'})`);
        });
      }
    } else {
      console.log('   ⚠️ No se puede verificar (seller no encontrado)');
    }
    
    // 4. PAGOS RECIENTES
    console.log('\n💰 4. PAGOS RECIENTES (últimas 24h)');
    console.log('─────────────────────────────────────');
    
    if (seller) {
      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const pagos = await mongoose.connection.collection('mppayments').find({
        sellerId: seller.userId,
        createdAt: { $gte: hace24h }
      }).sort({ createdAt: -1 }).limit(5).toArray();
      
      console.log(`   Total: ${pagos.length} pagos`);
      
      if (pagos.length > 0) {
        pagos.forEach((pago: any) => {
          console.log(`   - $${pago.amount} ${pago.currency} - ${pago.status} - ${pago.payerPhone || 'Sin teléfono'}`);
        });
      }
    } else {
      console.log('   ⚠️ No se puede verificar (seller no encontrado)');
    }
    
    // 5. CLIENTES
    console.log('\n👥 5. CLIENTES');
    console.log('─────────────────────────────────────');
    
    const clientes = await mongoose.connection.collection('clientes').find({
      empresaId: EMPRESA_NOMBRE
    }).limit(5).toArray();
    
    console.log(`   Total de clientes: ${clientes.length}`);
    
    if (clientes.length > 0) {
      console.log('   Últimos clientes:');
      clientes.forEach((cliente: any) => {
        console.log(`   - ${cliente.nombre} ${cliente.apellido || ''} - ${cliente.telefono}`);
      });
    }
    
    // 6. RESUMEN Y RECOMENDACIONES
    console.log('\n📊 6. RESUMEN Y RECOMENDACIONES');
    console.log('─────────────────────────────────────');
    
    const problemas = [];
    
    if (!empresa.phoneNumberId) {
      problemas.push('⚠️ phoneNumberId no configurado - No podrá enviar mensajes de WhatsApp');
    }
    
    if (!seller) {
      problemas.push('⚠️ Seller de MP no encontrado - No podrá generar links de pago');
    } else if (!seller.accessToken) {
      problemas.push('⚠️ Access token de MP no configurado - Links de pago no funcionarán');
    }
    
    if (problemas.length === 0) {
      console.log('✅ TODO CONFIGURADO CORRECTAMENTE');
      console.log('\nLa empresa puede:');
      console.log('  ✓ Recibir mensajes de WhatsApp');
      console.log('  ✓ Enviar mensajes de WhatsApp');
      console.log('  ✓ Generar links de pago');
      console.log('  ✓ Recibir notificaciones de pagos');
      console.log('  ✓ Confirmar pagos automáticamente por WhatsApp');
    } else {
      console.log('⚠️ PROBLEMAS ENCONTRADOS:\n');
      problemas.forEach(p => console.log(p));
      
      console.log('\n📝 SOLUCIONES:');
      
      if (!empresa.phoneNumberId) {
        console.log('\n1. Configurar phoneNumberId:');
        console.log('   - Ir al dashboard de Meta Business');
        console.log('   - Obtener el Phone Number ID de WhatsApp Business');
        console.log('   - Actualizar en la colección empresas');
      }
      
      if (!seller || !seller.accessToken) {
        console.log('\n2. Conectar Mercado Pago:');
        console.log('   - Acceder al CRM → Integraciones → Mercado Pago');
        console.log('   - Hacer clic en "Conectar con Mercado Pago"');
        console.log('   - Autorizar la aplicación');
      }
    }
    
    console.log('\n========================================');
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('========================================\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

verificar();
