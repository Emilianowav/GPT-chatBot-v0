import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function completarEmpresa() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    // Buscar empresa Intercapital
    const empresa = await db.collection('empresas').findOne({
      nombre: 'Intercapital'
    });

    if (!empresa) {
      console.log('❌ Empresa Intercapital no encontrada');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Empresa encontrada:', empresa.nombre);

    // Actualizar campos faltantes
    const result = await db.collection('empresas').updateOne(
      { _id: empresa._id },
      {
        $set: {
          email: 'admin@intercapital.com.ar',
          plan: 'premium',
          categoria: 'finanzas',
          prompt: 'Sos el asistente virtual de Intercapital. Tu objetivo es ayudar a los clientes con operaciones de compra/venta de activos financieros y retiros de fondos de manera profesional y segura.',
          saludos: ['¡Hola! 👋 Bienvenido a Intercapital. ¿En qué puedo ayudarte hoy?'],
          catalogoPath: 'data/intercapital_catalogo.json',
          modelo: 'gpt-3.5-turbo',
          modulos: ['workflows', 'api'],
          limites: {
            mensajesMensuales: 15000,
            usuariosActivos: 2000,
            almacenamiento: 5000,
            integraciones: 10,
            exportacionesMensuales: 50,
            agentesSimultaneos: 5,
            maxUsuarios: 25,
            maxAdmins: 5
          },
          uso: {
            mensajesEsteMes: 0,
            usuariosActivos: 0,
            almacenamientoUsado: 0,
            exportacionesEsteMes: 0,
            ultimaActualizacion: new Date()
          },
          facturacion: {
            estado: 'activo',
            ultimoPago: new Date(),
            proximoPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          updatedAt: new Date()
        }
      }
    );

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ EMPRESA COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Campos actualizados:');
    console.log(`   - Email: admin@intercapital.com.ar`);
    console.log(`   - Plan: premium`);
    console.log(`   - Categoría: finanzas`);
    console.log(`   - Modelo: gpt-3.5-turbo`);
    console.log(`   - Módulos: workflows, api`);
    console.log(`   - Límites: Plan premium configurado`);
    console.log(`   - Facturación: Activo`);
    console.log(`\n✅ Modificados: ${result.modifiedCount} documento(s)`);

    // Verificar
    const empresaActualizada = await db.collection('empresas').findOne({
      _id: empresa._id
    });

    console.log('\n📋 Empresa actualizada:');
    console.log(`   - Nombre: ${empresaActualizada.nombre}`);
    console.log(`   - Email: ${empresaActualizada.email}`);
    console.log(`   - Plan: ${empresaActualizada.plan}`);
    console.log(`   - Categoría: ${empresaActualizada.categoria}`);
    console.log(`   - Teléfono: ${empresaActualizada.telefono}`);
    console.log(`   - Phone Number ID: ${empresaActualizada.phoneNumberId}`);
    console.log(`   - Comitente: ${empresaActualizada.comitente}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

completarEmpresa();
