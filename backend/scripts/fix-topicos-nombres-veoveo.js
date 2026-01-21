import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixTopicosNombres() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas\n');
    
    const db = mongoose.connection.db;
    
    // Buscar el flujo de VeoVeo
    const flow = await db.collection('flows').findOne({ 
      activo: true,
      $or: [
        { nombre: /veo veo/i },
        { id: /veo-veo/i },
        { empresaId: /veo veo/i }
      ]
    });
    
    if (!flow) {
      console.log('❌ No se encontró el flujo de VeoVeo');
      return;
    }
    
    console.log(`✅ Flujo encontrado: ${flow.nombre || flow.id}\n`);
    
    // Reestructurar tópicos: convertir nombres con guiones a estructura anidada
    const topicosActualizados = {
      empresa: flow.config.topicos.empresa || {
        nombre: "Librería Veo Veo",
        ubicacion: "San Juan 1037, Corrientes Capital",
        whatsapp: "5493794732177",
        whatsapp_link: "https://wa.me/5493794732177"
      },
      horarios: {
        descripcion: flow.config.topicos['ubicacion-horarios']?.contenido || ""
      },
      medios_pago: {
        descripcion: flow.config.topicos['promociones-bancarias']?.contenido || ""
      },
      productos: {
        libros_ingles: {
          descripcion: flow.config.topicos['libros-ingles']?.contenido || ""
        }
      },
      politicas: {
        descripcion: [
          flow.config.topicos['politica-retiro']?.contenido,
          flow.config.topicos['politica-envios']?.contenido,
          flow.config.topicos['cambios-devoluciones']?.contenido,
          flow.config.topicos['fallas-fabrica']?.contenido
        ].filter(Boolean).join('\n\n')
      },
      // Mantener los originales también para compatibilidad
      'tono-comunicacion': flow.config.topicos['tono-comunicacion'],
      'ubicacion-horarios': flow.config.topicos['ubicacion-horarios'],
      'atencion-personalizada': flow.config.topicos['atencion-personalizada'],
      'promociones-bancarias': flow.config.topicos['promociones-bancarias'],
      'politica-retiro': flow.config.topicos['politica-retiro'],
      'politica-envios': flow.config.topicos['politica-envios'],
      'cambios-devoluciones': flow.config.topicos['cambios-devoluciones'],
      'fallas-fabrica': flow.config.topicos['fallas-fabrica'],
      'libros-ingles': flow.config.topicos['libros-ingles']
    };
    
    console.log('📝 Actualizando estructura de tópicos...\n');
    console.log('Nueva estructura:');
    console.log('  - topicos.empresa.whatsapp_link');
    console.log('  - topicos.horarios.descripcion');
    console.log('  - topicos.medios_pago.descripcion');
    console.log('  - topicos.productos.libros_ingles.descripcion');
    console.log('  - topicos.politicas.descripcion\n');
    
    // Actualizar el flujo
    const result = await db.collection('flows').updateOne(
      { _id: flow._id },
      { 
        $set: { 
          'config.topicos': topicosActualizados,
          'config.topicos_habilitados': true,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ Flujo actualizado (${result.modifiedCount} documento modificado)\n`);
    
    // Verificar
    const flowActualizado = await db.collection('flows').findOne({ _id: flow._id });
    
    console.log('🔍 VERIFICACIÓN:');
    console.log(`   topicos.empresa.whatsapp_link: ${flowActualizado.config.topicos.empresa?.whatsapp_link || '❌'}`);
    console.log(`   topicos.horarios.descripcion existe: ${!!flowActualizado.config.topicos.horarios?.descripcion}`);
    console.log(`   topicos.medios_pago.descripcion existe: ${!!flowActualizado.config.topicos.medios_pago?.descripcion}`);
    console.log(`   topicos.productos.libros_ingles.descripcion existe: ${!!flowActualizado.config.topicos.productos?.libros_ingles?.descripcion}`);
    console.log(`   topicos.politicas.descripcion existe: ${!!flowActualizado.config.topicos.politicas?.descripcion}`);
    
    console.log('\n✅ ESTRUCTURA CORREGIDA EXITOSAMENTE\n');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixTopicosNombres();
