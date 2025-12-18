// 📱 Script para normalizar teléfonos de clientes de San Jose
// Formato objetivo: 5493794946066 (sin +, sin espacios, sin guiones)
// Ejecutar con: npx ts-node scripts/normalizar-telefonos-sanjose.ts

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { ClienteModel } from '../src/models/Cliente.js';

// Configuración
const EMPRESA_NOMBRE = 'San Jose'; // Nombre de la empresa a buscar
const DRY_RUN = process.argv.includes('--dry-run'); // Si true, solo muestra cambios sin aplicar

/**
 * Normaliza un número de teléfono al formato: 5493794XXXXXX
 * - Elimina +, espacios, guiones, paréntesis
 * - Agrega 549 si no tiene código de país
 * - Elimina el 0 después del código de país si existe
 * - Elimina el 15 si existe después del código de área
 */
function normalizarTelefono(telefono: string): string {
  if (!telefono) return telefono;
  
  // Limpiar caracteres no numéricos
  let limpio = telefono.replace(/[^\d]/g, '');
  
  // Si ya tiene el formato correcto (empieza con 549 y tiene 13 dígitos), retornar
  if (limpio.startsWith('549') && limpio.length === 13) {
    return limpio;
  }
  
  // Si empieza con 54 pero no con 549, insertar el 9
  if (limpio.startsWith('54') && !limpio.startsWith('549')) {
    // 54 3794 -> 549 3794
    limpio = '549' + limpio.substring(2);
  }
  
  // Si empieza con 0 (ej: 03794...), quitar el 0 y agregar 549
  if (limpio.startsWith('0')) {
    limpio = '549' + limpio.substring(1);
  }
  
  // Si empieza con 15 (número local), agregar código de área por defecto (379 para Corrientes)
  if (limpio.startsWith('15') && limpio.length <= 10) {
    limpio = '5493794' + limpio.substring(2);
  }
  
  // Si no tiene código de país (menos de 11 dígitos o no empieza con 54)
  if (!limpio.startsWith('54') && limpio.length <= 10) {
    // Asumir que es un número argentino de Corrientes
    if (limpio.startsWith('379')) {
      limpio = '549' + limpio;
    } else {
      // Agregar código de área de Corrientes
      limpio = '5493794' + limpio;
    }
  }
  
  // Eliminar el 15 después del código de área si existe
  // Ej: 5493794156789 -> 54937946789 (incorrecto, debería ser 549379456789)
  // Patrón: 549 + código área (3 dígitos) + 15 + número
  const match = limpio.match(/^(549\d{3,4})15(\d+)$/);
  if (match) {
    limpio = match[1] + match[2];
  }
  
  return limpio;
}

async function main() {
  console.log('🔄 Iniciando normalización de teléfonos...');
  console.log(`📋 Modo: ${DRY_RUN ? 'DRY RUN (solo mostrar cambios)' : 'APLICAR CAMBIOS'}`);
  console.log('');
  
  // Conectar a MongoDB
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI no configurado en .env');
    process.exit(1);
  }
  
  await mongoose.connect(mongoUri);
  console.log('✅ Conectado a MongoDB');
  
  // Buscar la empresa San Jose
  const EmpresaModel = mongoose.model('Empresa', new mongoose.Schema({
    nombre: String,
    slug: String
  }));
  
  const empresa = await EmpresaModel.findOne({ 
    $or: [
      { nombre: { $regex: /san\s*jose/i } },
      { slug: { $regex: /san.*jose/i } }
    ]
  });
  
  if (!empresa) {
    console.error('❌ No se encontró la empresa "San Jose"');
    console.log('📋 Empresas disponibles:');
    const empresas = await EmpresaModel.find({}, { nombre: 1, slug: 1 }).limit(20);
    empresas.forEach(e => console.log(`   - ${e.nombre} (${e._id})`));
    await mongoose.disconnect();
    process.exit(1);
  }
  
  console.log(`✅ Empresa encontrada: ${empresa.nombre} (ID: ${empresa._id})`);
  
  // Buscar clientes de esa empresa
  const clientes = await ClienteModel.find({ empresaId: empresa._id.toString() });
  console.log(`📊 Total de clientes: ${clientes.length}`);
  console.log('');
  
  // Analizar y normalizar
  const formatoCorrecto = /^549\d{10}$/; // 549 + 10 dígitos = 13 total
  let clientesAModificar = 0;
  let clientesCorrectos = 0;
  const cambios: { id: string; nombre: string; antes: string; despues: string }[] = [];
  
  for (const cliente of clientes) {
    const telefonoOriginal = cliente.telefono;
    const telefonoNormalizado = normalizarTelefono(telefonoOriginal);
    
    if (formatoCorrecto.test(telefonoNormalizado) && telefonoOriginal === telefonoNormalizado) {
      clientesCorrectos++;
    } else {
      clientesAModificar++;
      cambios.push({
        id: cliente._id.toString(),
        nombre: `${cliente.nombre} ${cliente.apellido}`,
        antes: telefonoOriginal,
        despues: telefonoNormalizado
      });
    }
  }
  
  console.log(`✅ Clientes con formato correcto: ${clientesCorrectos}`);
  console.log(`⚠️  Clientes a modificar: ${clientesAModificar}`);
  console.log('');
  
  if (cambios.length === 0) {
    console.log('🎉 Todos los teléfonos ya tienen el formato correcto!');
    await mongoose.disconnect();
    return;
  }
  
  // Mostrar cambios
  console.log('📝 Cambios a realizar:');
  console.log('─'.repeat(80));
  for (const cambio of cambios) {
    console.log(`   ${cambio.nombre}`);
    console.log(`   Antes:   ${cambio.antes}`);
    console.log(`   Después: ${cambio.despues}`);
    console.log('');
  }
  
  // Aplicar cambios si no es dry run
  if (!DRY_RUN) {
    console.log('🔄 Aplicando cambios...');
    let actualizados = 0;
    let errores = 0;
    
    for (const cambio of cambios) {
      try {
        await ClienteModel.updateOne(
          { _id: cambio.id },
          { $set: { telefono: cambio.despues, actualizadoEn: new Date() } }
        );
        actualizados++;
      } catch (err) {
        console.error(`❌ Error actualizando ${cambio.nombre}: ${err}`);
        errores++;
      }
    }
    
    console.log('');
    console.log(`✅ Actualizados: ${actualizados}`);
    if (errores > 0) {
      console.log(`❌ Errores: ${errores}`);
    }
  } else {
    console.log('ℹ️  Ejecuta sin --dry-run para aplicar los cambios');
  }
  
  await mongoose.disconnect();
  console.log('');
  console.log('✅ Proceso completado');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
