import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Obtener argumentos de línea de comandos
const args = process.argv.slice(2);
const nuevoFlujoId = args[0];
const desactivarOtros = args.includes('--desactivar-otros');

if (!nuevoFlujoId) {
  console.log('❌ Error: Debes proporcionar el ID del flujo a activar');
  console.log('\nUso:');
  console.log('  node scripts/cambiar-flujo-activo.js <ID_FLUJO>');
  console.log('  node scripts/cambiar-flujo-activo.js <ID_FLUJO> --desactivar-otros');
  console.log('\nEjemplo:');
  console.log('  node scripts/cambiar-flujo-activo.js 507f1f77bcf86cd799439011');
  process.exit(1);
}

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, '❌ Error de conexión:'));
db.once('open', async () => {
  console.log('✅ Conectado a MongoDB\n');
  
  try {
    // Buscar el flujo a activar
    const flujo = await db.collection('flows').findOne({ _id: new mongoose.Types.ObjectId(nuevoFlujoId) });
    
    if (!flujo) {
      console.log(`❌ No se encontró el flujo con ID: ${nuevoFlujoId}`);
      process.exit(1);
    }
    
    console.log('📋 FLUJO ENCONTRADO:');
    console.log(`   Nombre: ${flujo.nombre || 'Sin nombre'}`);
    console.log(`   Empresa: ${flujo.empresaId || 'Sin empresa'}`);
    console.log(`   Estado actual: ${flujo.activo ? '✅ ACTIVO' : '❌ INACTIVO'}`);
    console.log(`   Nodos: ${flujo.nodes?.length || 0}`);
    console.log(`   Conexiones: ${flujo.edges?.length || 0}\n`);
    
    // Si se solicita desactivar otros flujos de la misma empresa
    if (desactivarOtros && flujo.empresaId) {
      console.log('🔄 Desactivando otros flujos de la misma empresa...');
      
      const resultado = await db.collection('flows').updateMany(
        { 
          empresaId: flujo.empresaId,
          _id: { $ne: new mongoose.Types.ObjectId(nuevoFlujoId) }
        },
        { 
          $set: { activo: false }
        }
      );
      
      console.log(`   ✅ ${resultado.modifiedCount} flujo(s) desactivado(s)\n`);
    }
    
    // Activar el nuevo flujo
    console.log('🔄 Activando flujo...');
    
    await db.collection('flows').updateOne(
      { _id: new mongoose.Types.ObjectId(nuevoFlujoId) },
      { 
        $set: { 
          activo: true,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('   ✅ Flujo activado correctamente\n');
    
    // Verificar estado final
    console.log('📊 ESTADO FINAL:');
    console.log('='.repeat(80));
    
    const flujosActivos = await db.collection('flows').find({ 
      empresaId: flujo.empresaId,
      activo: true 
    }).toArray();
    
    console.log(`\nFlujos activos para ${flujo.empresaId}:\n`);
    
    flujosActivos.forEach(f => {
      const esNuevo = f._id.toString() === nuevoFlujoId;
      const marca = esNuevo ? '🎯' : '  ';
      console.log(`${marca} ${f.nombre || 'Sin nombre'}`);
      console.log(`   ID: ${f._id}`);
      console.log(`   Nodos: ${f.nodes?.length || 0}\n`);
    });
    
    console.log('✅ Cambio completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
  }
});
