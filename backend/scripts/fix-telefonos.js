/**
 * Script para normalizar números de teléfono en la base de datos
 * 
 * Convierte formatos como:
 *   3794936489   -> 543794936489
 *   03794352405  -> 543794352405
 * 
 * Uso: node scripts/fix-telefonos.js [--dry-run]
 * 
 * --dry-run: Solo muestra los cambios sin aplicarlos
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const DRY_RUN = process.argv.includes('--dry-run');

if (!MONGODB_URI) {
  console.error('❌ Error: No se encontró MONGODB_URI en las variables de entorno');
  process.exit(1);
}

/**
 * Normaliza un número de teléfono argentino
 * - Elimina el 0 inicial si existe
 * - Agrega el prefijo 54 si no lo tiene
 */
function normalizarTelefono(telefono) {
  if (!telefono) return null;
  
  // Limpiar caracteres no numéricos
  let limpio = telefono.replace(/\D/g, '');
  
  // Si ya empieza con 54, está bien
  if (limpio.startsWith('54')) {
    return limpio;
  }
  
  // Si empieza con 0, quitarlo
  if (limpio.startsWith('0')) {
    limpio = limpio.substring(1);
  }
  
  // Agregar 54 al inicio
  return '54' + limpio;
}

async function main() {
  console.log('🔧 Script de normalización de teléfonos');
  console.log('========================================');
  
  if (DRY_RUN) {
    console.log('⚠️  MODO DRY-RUN: No se aplicarán cambios\n');
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    
    // Colecciones que pueden tener teléfonos
    const colecciones = [
      { nombre: 'contactos_empresa', campo: 'telefono' }
    ];

    let totalActualizados = 0;

    for (const col of colecciones) {
      const collection = db.collection(col.nombre);
      
      // Verificar si la colección existe
      const existe = await db.listCollections({ name: col.nombre }).hasNext();
      if (!existe) {
        console.log(`⏭️  Colección '${col.nombre}' no existe, saltando...`);
        continue;
      }

      console.log(`\n📋 Procesando colección: ${col.nombre}`);
      console.log('-'.repeat(50));

      // Buscar documentos que necesitan corrección
      // Teléfonos que NO empiezan con 54
      const query = {
        [col.campo]: { 
          $exists: true, 
          $ne: null,
          $not: /^54/ 
        }
      };

      const documentos = await collection.find(query).toArray();
      console.log(`   Encontrados ${documentos.length} registros para corregir`);

      let actualizados = 0;
      let omitidos = 0;
      const cambios = [];
      const errores = [];

      for (const doc of documentos) {
        const telefonoOriginal = doc[col.campo];
        const telefonoNormalizado = normalizarTelefono(telefonoOriginal);

        if (telefonoNormalizado && telefonoNormalizado !== telefonoOriginal) {
          cambios.push({
            id: doc._id,
            empresaId: doc.empresaId,
            original: telefonoOriginal,
            nuevo: telefonoNormalizado
          });

          if (!DRY_RUN) {
            try {
              // Verificar si ya existe un registro con el teléfono normalizado
              const existente = await collection.findOne({
                empresaId: doc.empresaId,
                [col.campo]: telefonoNormalizado,
                _id: { $ne: doc._id }
              });

              if (existente) {
                // Ya existe un registro con este teléfono normalizado
                omitidos++;
                errores.push({
                  original: telefonoOriginal,
                  normalizado: telefonoNormalizado,
                  empresaId: doc.empresaId,
                  razon: 'Ya existe un registro con este teléfono'
                });
              } else {
                // No existe, podemos actualizar
                await collection.updateOne(
                  { _id: doc._id },
                  { $set: { [col.campo]: telefonoNormalizado } }
                );
                actualizados++;
              }
            } catch (error) {
              omitidos++;
              errores.push({
                original: telefonoOriginal,
                normalizado: telefonoNormalizado,
                empresaId: doc.empresaId,
                razon: error.message
              });
            }
          } else {
            // En dry-run, solo verificar si existiría duplicado
            const existente = await collection.findOne({
              empresaId: doc.empresaId,
              [col.campo]: telefonoNormalizado,
              _id: { $ne: doc._id }
            });
            
            if (existente) {
              omitidos++;
              errores.push({
                original: telefonoOriginal,
                normalizado: telefonoNormalizado,
                empresaId: doc.empresaId,
                razon: 'Ya existe un registro con este teléfono'
              });
            } else {
              actualizados++;
            }
          }
        }
      }

      // Mostrar algunos ejemplos de cambios exitosos
      const cambiosExitosos = cambios.filter(c => {
        return !errores.some(e => e.original === c.original && e.empresaId === c.empresaId);
      });

      if (cambiosExitosos.length > 0) {
        console.log('\n   Ejemplos de cambios exitosos:');
        cambiosExitosos.slice(0, 5).forEach(c => {
          console.log(`   ${c.original} -> ${c.nuevo}`);
        });
        if (cambiosExitosos.length > 5) {
          console.log(`   ... y ${cambiosExitosos.length - 5} más`);
        }
      }

      // Mostrar duplicados omitidos
      if (errores.length > 0) {
        console.log(`\n   ⚠️  ${omitidos} registros omitidos (duplicados):`);
        errores.slice(0, 3).forEach(e => {
          console.log(`   ${e.original} -> ${e.normalizado} (${e.empresaId})`);
        });
        if (errores.length > 3) {
          console.log(`   ... y ${errores.length - 3} más`);
        }
      }

      console.log(`\n   ✅ ${actualizados} registros ${DRY_RUN ? 'a actualizar' : 'actualizados'}`);
      if (omitidos > 0) {
        console.log(`   ⏭️  ${omitidos} registros omitidos por duplicados`);
      }
      totalActualizados += actualizados;
    }

    console.log('\n========================================');
    console.log(`🎉 Total: ${totalActualizados} registros ${DRY_RUN ? 'a actualizar' : 'actualizados'}`);
    
    if (DRY_RUN) {
      console.log('\n💡 Ejecuta sin --dry-run para aplicar los cambios');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

main();
