// 🛠️ Script para habilitar Mercado Pago en JFC Techno
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { EmpresaModel } from '../src/models/Empresa.js';

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

async function habilitarMercadoPago() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Conectado a DB:', mongoose.connection.name);

    console.log('\n========================================');
    console.log('💳 HABILITANDO MERCADO PAGO - JFC TECHNO');
    console.log('========================================\n');

    // Buscar empresa JFC Techno
    const empresa = await EmpresaModel.findOne({ nombre: 'JFC Techno' });
    
    if (!empresa) {
      console.log('❌ Empresa JFC Techno no encontrada');
      return;
    }

    console.log('✅ Empresa encontrada:', empresa.nombre);
    console.log('📋 Estado actual:');
    console.log('   - Módulos:', empresa.modulos?.length || 0);

    // Habilitar módulo de Mercado Pago
    if (!empresa.modulos) {
      empresa.modulos = [];
    }

    // Verificar si ya existe el módulo de Mercado Pago
    const mpModuloIndex = empresa.modulos.findIndex((m: any) => m.id === 'mercadopago');
    
    const mpModulo: any = {
      id: 'mercadopago',
      nombre: 'Mercado Pago',
      descripcion: 'Integración con Mercado Pago para pagos',
      categoria: 'pagos',
      activo: true,
      fechaActivacion: new Date(),
      configuracion: {
        sellerId: '182716364',
        habilitado: true
      }
    };

    if (mpModuloIndex >= 0) {
      empresa.modulos[mpModuloIndex] = mpModulo;
    } else {
      empresa.modulos.push(mpModulo);
    }

    await empresa.save();

    console.log('\n✅ Mercado Pago habilitado exitosamente');
    console.log('📋 Módulo agregado:');
    console.log('   - ID: mercadopago');
    console.log('   - Activo: true');
    console.log('   - Seller ID: 182716364');

    console.log('\n========================================');
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
habilitarMercadoPago();
