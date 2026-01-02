import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/momento-ia';

async function corregirModulos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;

    const empresa = await db.collection('empresas').findOne({
      nombre: 'Intercapital'
    });

    if (!empresa) {
      console.log('❌ Empresa Intercapital no encontrada');
      await mongoose.disconnect();
      return;
    }

    console.log('📋 Empresa encontrada:', empresa.nombre);
    console.log('   Módulos actuales:', empresa.modulos);

    // Corregir módulos con estructura completa
    const result = await db.collection('empresas').updateOne(
      { _id: empresa._id },
      {
        $set: {
          modulos: [
            {
              id: 'workflows',
              nombre: 'Workflows Conversacionales',
              descripcion: 'Sistema de workflows para operaciones financieras',
              version: '1.0.0',
              categoria: 'automatizacion',
              icono: '🔄',
              activo: true,
              fechaActivacion: new Date(),
              precio: 0,
              planMinimo: 'premium',
              dependencias: [],
              permisos: ['workflows.ver', 'workflows.crear', 'workflows.editar'],
              configuracion: {},
              autor: 'MOMENTO',
              documentacion: 'https://docs.momentoia.co/workflows',
              soporte: 'soporte@momentoia.co'
            },
            {
              id: 'api',
              nombre: 'Integraciones API',
              descripcion: 'Integración con API externa de Intercapital',
              version: '1.0.0',
              categoria: 'integraciones',
              icono: '🔌',
              activo: true,
              fechaActivacion: new Date(),
              precio: 0,
              planMinimo: 'premium',
              dependencias: [],
              permisos: ['api.ver', 'api.ejecutar'],
              configuracion: {},
              autor: 'MOMENTO',
              documentacion: 'https://docs.momentoia.co/api',
              soporte: 'soporte@momentoia.co'
            }
          ],
          updatedAt: new Date()
        }
      }
    );

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MÓDULOS CORREGIDOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`✅ Modificados: ${result.modifiedCount} documento(s)`);

    // Verificar
    const empresaActualizada = await db.collection('empresas').findOne({
      _id: empresa._id
    });

    console.log('\n📋 Módulos actualizados:');
    empresaActualizada.modulos?.forEach((mod, i) => {
      console.log(`   ${i + 1}. ${mod.nombre} (${mod.id})`);
      console.log(`      - Activo: ${mod.activo}`);
      console.log(`      - Categoría: ${mod.categoria}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

corregirModulos();
