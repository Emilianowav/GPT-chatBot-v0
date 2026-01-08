import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const COUNTRY_METADATA = {
  AR: { countryCode: '54', mobilePrefix: '9' },
  BR: { countryCode: '55', mobilePrefix: '' },
  CL: { countryCode: '56', mobilePrefix: '' },
  CO: { countryCode: '57', mobilePrefix: '' },
  MX: { countryCode: '52', mobilePrefix: '' },
  PE: { countryCode: '51', mobilePrefix: '' },
  UY: { countryCode: '598', mobilePrefix: '' },
  VE: { countryCode: '58', mobilePrefix: '' },
  US: { countryCode: '1', mobilePrefix: '' },
  ES: { countryCode: '34', mobilePrefix: '' },
  EC: { countryCode: '593', mobilePrefix: '' },
  BO: { countryCode: '591', mobilePrefix: '' },
  PY: { countryCode: '595', mobilePrefix: '' },
  CR: { countryCode: '506', mobilePrefix: '' },
  PA: { countryCode: '507', mobilePrefix: '' }
};

function detectCountryAndFormat(telefono) {
  if (!telefono || typeof telefono !== 'string') {
    return null;
  }

  const cleanPhone = telefono.trim().replace(/[\s\-\(\)]/g, '');
  
  // Detectar país por código
  for (const [countryCode, metadata] of Object.entries(COUNTRY_METADATA)) {
    const { countryCode: code, mobilePrefix } = metadata;
    
    // Caso 1: Ya tiene el formato correcto (código + prefijo móvil + número)
    if (cleanPhone.startsWith(code + mobilePrefix) && cleanPhone.length > code.length + mobilePrefix.length) {
      return cleanPhone;
    }
    
    // Caso 2: Tiene código pero sin prefijo móvil (ej: 543794763523 -> 5493794763523)
    if (cleanPhone.startsWith(code) && !cleanPhone.startsWith(code + mobilePrefix)) {
      const phoneWithoutCode = cleanPhone.substring(code.length);
      // Si el número después del código no empieza con el prefijo móvil, agregarlo
      if (mobilePrefix && !phoneWithoutCode.startsWith(mobilePrefix)) {
        return code + mobilePrefix + phoneWithoutCode;
      }
    }
  }
  
  // Si no detectamos el país, asumimos Argentina por defecto
  // Caso: número sin código (ej: 3794763523 -> 5493794763523)
  if (cleanPhone.length >= 10 && !cleanPhone.startsWith('54')) {
    return '549' + cleanPhone.replace(/^0+/, ''); // Remover ceros iniciales
  }
  
  return cleanPhone;
}

async function fixPhoneNumbers() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('contactos_empresa');

    console.log('📊 Analizando números de teléfono...\n');

    const contactos = await collection.find({}).toArray();
    console.log(`📱 Total de contactos encontrados: ${contactos.length}\n`);

    let updated = 0;
    let alreadyCorrect = 0;
    let errors = 0;
    const updates = [];

    for (const contacto of contactos) {
      const telefonoOriginal = contacto.telefono;
      const telefonoFormateado = detectCountryAndFormat(telefonoOriginal);

      if (!telefonoFormateado) {
        console.log(`⚠️  [${contacto._id}] Teléfono inválido: "${telefonoOriginal}"`);
        errors++;
        continue;
      }

      if (telefonoOriginal !== telefonoFormateado) {
        updates.push({
          _id: contacto._id,
          original: telefonoOriginal,
          formatted: telefonoFormateado,
          nombre: contacto.nombre,
          apellido: contacto.apellido
        });
      } else {
        alreadyCorrect++;
      }
    }

    console.log('📋 RESUMEN DE CAMBIOS:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (updates.length > 0) {
      console.log(`🔄 Números a actualizar: ${updates.length}\n`);
      
      // Mostrar primeros 10 ejemplos
      const ejemplos = updates.slice(0, 10);
      console.log('📝 Ejemplos de cambios:');
      ejemplos.forEach((u, idx) => {
        console.log(`${idx + 1}. ${u.nombre} ${u.apellido}`);
        console.log(`   Antes: ${u.original}`);
        console.log(`   Después: ${u.formatted}\n`);
      });

      if (updates.length > 10) {
        console.log(`   ... y ${updates.length - 10} más\n`);
      }

      // Realizar actualizaciones
      console.log('💾 Aplicando cambios...\n');
      
      for (const update of updates) {
        try {
          await collection.updateOne(
            { _id: update._id },
            { 
              $set: { 
                telefono: update.formatted,
                actualizadoEn: new Date()
              } 
            }
          );
          updated++;
          process.stdout.write(`\r✅ Actualizados: ${updated}/${updates.length}`);
        } catch (err) {
          console.error(`\n❌ Error actualizando ${update._id}:`, err.message);
          errors++;
        }
      }
      console.log('\n');
    } else {
      console.log('✅ Todos los números ya tienen el formato correcto\n');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 ESTADÍSTICAS FINALES:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Números actualizados: ${updated}`);
    console.log(`✓  Ya correctos: ${alreadyCorrect}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📱 Total procesados: ${contactos.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (updated > 0) {
      console.log('🎉 ¡Migración completada exitosamente!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Desconectado de MongoDB');
  }
}

fixPhoneNumbers();
