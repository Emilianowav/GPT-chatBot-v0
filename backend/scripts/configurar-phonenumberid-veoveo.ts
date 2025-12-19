/**
 * Configurar phoneNumberId para Veo Veo
 * Este ID es necesario para enviar mensajes de WhatsApp
 */
import mongoose from 'mongoose';

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';
const EMPRESA_NOMBRE = 'Veo Veo';

// Phone Number ID de WhatsApp Business (obtener de Meta Business Manager)
// Este es el ID que aparece en los logs: 906667632531979
const PHONE_NUMBER_ID = '906667632531979';

async function configurar() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado a DB:', mongoose.connection.db?.databaseName);
    
    console.log('\n========================================');
    console.log('⚙️  CONFIGURANDO PHONENUMBERID - VEO VEO');
    console.log('========================================\n');
    
    // Verificar empresa actual
    const empresaAntes = await mongoose.connection.collection('empresas').findOne({ 
      nombre: EMPRESA_NOMBRE 
    });
    
    if (!empresaAntes) {
      console.error('❌ Empresa no encontrada');
      await mongoose.disconnect();
      return;
    }
    
    console.log('📋 ESTADO ACTUAL:');
    console.log('  Empresa:', empresaAntes.nombre);
    console.log('  Teléfono:', empresaAntes.telefono);
    console.log('  PhoneNumberId:', empresaAntes.phoneNumberId || '❌ NO CONFIGURADO');
    
    // Actualizar phoneNumberId
    console.log('\n🔧 ACTUALIZANDO...\n');
    
    const resultado = await mongoose.connection.collection('empresas').updateOne(
      { nombre: EMPRESA_NOMBRE },
      { 
        $set: { 
          phoneNumberId: PHONE_NUMBER_ID,
          updatedAt: new Date()
        } 
      }
    );
    
    if (resultado.modifiedCount > 0) {
      console.log('✅ PhoneNumberId actualizado correctamente');
    } else {
      console.log('⚠️ No se realizaron cambios (puede que ya estuviera configurado)');
    }
    
    // Verificar cambio
    const empresaDespues = await mongoose.connection.collection('empresas').findOne({ 
      nombre: EMPRESA_NOMBRE 
    });
    
    console.log('\n📋 ESTADO FINAL:');
    console.log('  Empresa:', empresaDespues?.nombre);
    console.log('  Teléfono:', empresaDespues?.telefono);
    console.log('  PhoneNumberId:', empresaDespues?.phoneNumberId || '❌ NO CONFIGURADO');
    
    // Verificar seller
    console.log('\n💳 VERIFICANDO SELLER DE MP:');
    const seller = await mongoose.connection.collection('mpsellers').findOne({ 
      userId: '182716364' 
    });
    
    if (seller) {
      console.log('  ✅ Seller encontrado');
      console.log('  userId:', seller.userId);
      console.log('  internalId:', seller.internalId || 'NO CONFIGURADO');
      console.log('  accessToken:', seller.accessToken ? 'Configurado' : 'NO');
      
      // Actualizar internalId del seller si no está configurado
      if (!seller.internalId || seller.internalId !== EMPRESA_NOMBRE) {
        console.log('\n🔧 Actualizando internalId del seller...');
        await mongoose.connection.collection('mpsellers').updateOne(
          { userId: '182716364' },
          { 
            $set: { 
              internalId: EMPRESA_NOMBRE,
              updatedAt: new Date()
            } 
          }
        );
        console.log('  ✅ internalId actualizado a:', EMPRESA_NOMBRE);
      }
    } else {
      console.log('  ❌ Seller no encontrado');
    }
    
    console.log('\n========================================');
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('========================================');
    console.log('\n📱 Ahora la empresa puede:');
    console.log('  ✓ Enviar mensajes de WhatsApp');
    console.log('  ✓ Recibir notificaciones de pagos');
    console.log('  ✓ Confirmar pagos automáticamente\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

configurar();
