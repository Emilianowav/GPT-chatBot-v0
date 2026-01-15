/**
 * 🔍 AUDITORÍA COMPLETA DE COLECCIONES MONGODB
 * 
 * Este script analiza todas las colecciones en la base de datos y genera:
 * - Lista de todas las colecciones
 * - Conteo de documentos en cada una
 * - Estructura/schema de cada colección
 * - Ejemplos de documentos
 * - Índices configurados
 * 
 * Uso: node scripts/auditar-todas-colecciones.js
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = 'mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/neural_chatbot?retryWrites=true&w=majority';

/**
 * Analiza la estructura de un documento y genera un schema
 */
function analizarEstructura(doc, profundidad = 0) {
  const schema = {};
  const indent = '  '.repeat(profundidad);
  
  for (const [key, value] of Object.entries(doc)) {
    if (value === null) {
      schema[key] = 'null';
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        const primerElemento = value[0];
        if (typeof primerElemento === 'object' && primerElemento !== null) {
          schema[key] = ['Object'];
        } else {
          schema[key] = [typeof primerElemento];
        }
      } else {
        schema[key] = ['Array vacío'];
      }
    } else if (typeof value === 'object') {
      schema[key] = 'Object';
    } else {
      schema[key] = typeof value;
    }
  }
  
  return schema;
}

/**
 * Formatea un objeto para mostrar de forma legible
 */
function formatearObjeto(obj, profundidad = 0) {
  const indent = '  '.repeat(profundidad);
  let resultado = '';
  
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      resultado += `${indent}${key}: [${value.join(', ')}]\n`;
    } else if (typeof value === 'object' && value !== null) {
      resultado += `${indent}${key}: Object\n`;
    } else {
      resultado += `${indent}${key}: ${value}\n`;
    }
  }
  
  return resultado;
}

/**
 * Analiza una colección completa
 */
async function analizarColeccion(db, nombreColeccion) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📦 COLECCIÓN: ${nombreColeccion}`);
  console.log('='.repeat(80));
  
  const coleccion = db.collection(nombreColeccion);
  
  // 1. Conteo de documentos
  const count = await coleccion.countDocuments();
  console.log(`\n📊 Total de documentos: ${count}`);
  
  if (count === 0) {
    console.log('⚠️  Colección vacía');
    return {
      nombre: nombreColeccion,
      count: 0,
      schema: null,
      indices: []
    };
  }
  
  // 2. Obtener índices
  const indices = await coleccion.indexes();
  console.log(`\n🔑 Índices (${indices.length}):`);
  indices.forEach((index, i) => {
    console.log(`   ${i + 1}. ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : ''}`);
  });
  
  // 3. Obtener muestra de documentos (primeros 3)
  const muestras = await coleccion.find({}).limit(3).toArray();
  
  // 4. Analizar estructura del primer documento
  if (muestras.length > 0) {
    const schema = analizarEstructura(muestras[0]);
    console.log(`\n📋 Estructura del schema:`);
    console.log(formatearObjeto(schema, 1));
  }
  
  // 5. Mostrar ejemplo completo del primer documento
  console.log(`\n📄 Ejemplo de documento (primero):`);
  console.log(JSON.stringify(muestras[0], null, 2).substring(0, 1000));
  if (JSON.stringify(muestras[0], null, 2).length > 1000) {
    console.log('   ... (truncado)');
  }
  
  // 6. Campos únicos encontrados en todos los documentos
  const todosLosCampos = new Set();
  muestras.forEach(doc => {
    Object.keys(doc).forEach(key => todosLosCampos.add(key));
  });
  
  console.log(`\n🏷️  Campos encontrados (${todosLosCampos.size}):`);
  console.log(`   ${Array.from(todosLosCampos).join(', ')}`);
  
  return {
    nombre: nombreColeccion,
    count,
    schema: muestras.length > 0 ? analizarEstructura(muestras[0]) : null,
    campos: Array.from(todosLosCampos),
    indices: indices.map(i => ({ key: i.key, unique: i.unique || false }))
  };
}

/**
 * Función principal
 */
async function auditarBaseDatos() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Conectado exitosamente\n');
    
    const db = mongoose.connection.db;
    
    // Obtener lista de todas las colecciones
    const colecciones = await db.listCollections().toArray();
    const nombresColecciones = colecciones.map(c => c.name).sort();
    
    console.log('📚 COLECCIONES ENCONTRADAS:');
    console.log('='.repeat(80));
    nombresColecciones.forEach((nombre, i) => {
      console.log(`   ${i + 1}. ${nombre}`);
    });
    console.log(`\nTotal: ${nombresColecciones.length} colecciones\n`);
    
    // Analizar cada colección
    const resultados = [];
    for (const nombreColeccion of nombresColecciones) {
      const resultado = await analizarColeccion(db, nombreColeccion);
      resultados.push(resultado);
    }
    
    // Resumen final
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('📊 RESUMEN GENERAL');
    console.log('='.repeat(80));
    console.log(`\nTotal de colecciones: ${resultados.length}`);
    console.log(`\nColecciones con datos:`);
    
    const conDatos = resultados.filter(r => r.count > 0);
    conDatos.forEach(r => {
      console.log(`   • ${r.nombre}: ${r.count} documentos`);
    });
    
    const vacias = resultados.filter(r => r.count === 0);
    if (vacias.length > 0) {
      console.log(`\nColecciones vacías (${vacias.length}):`);
      vacias.forEach(r => {
        console.log(`   • ${r.nombre}`);
      });
    }
    
    // Guardar resultados en JSON para documentación
    const outputPath = path.join(__dirname, '..', 'docs', 'AUDITORIA-COLECCIONES.json');
    fs.writeFileSync(outputPath, JSON.stringify(resultados, null, 2));
    console.log(`\n💾 Resultados guardados en: ${outputPath}`);
    
    // Generar documentación Markdown
    const mdPath = path.join(__dirname, '..', 'docs', 'AUDITORIA-COLECCIONES.md');
    let markdown = '# 📊 Auditoría de Colecciones MongoDB\n\n';
    markdown += `**Fecha:** ${new Date().toLocaleString('es-AR')}\n`;
    markdown += `**Base de datos:** neural_chatbot\n`;
    markdown += `**Total de colecciones:** ${resultados.length}\n\n`;
    markdown += '---\n\n';
    
    markdown += '## 📋 Resumen\n\n';
    markdown += '| Colección | Documentos | Índices |\n';
    markdown += '|-----------|------------|----------|\n';
    resultados.forEach(r => {
      markdown += `| ${r.nombre} | ${r.count} | ${r.indices.length} |\n`;
    });
    markdown += '\n---\n\n';
    
    // Detalles de cada colección
    markdown += '## 📦 Detalle de Colecciones\n\n';
    
    for (const r of conDatos) {
      markdown += `### ${r.nombre}\n\n`;
      markdown += `**Documentos:** ${r.count}\n\n`;
      
      if (r.indices.length > 0) {
        markdown += '**Índices:**\n';
        r.indices.forEach(idx => {
          const keys = Object.keys(idx.key).join(', ');
          markdown += `- \`${keys}\` ${idx.unique ? '(UNIQUE)' : ''}\n`;
        });
        markdown += '\n';
      }
      
      if (r.campos && r.campos.length > 0) {
        markdown += '**Campos:**\n';
        markdown += `\`\`\`\n${r.campos.join(', ')}\n\`\`\`\n\n`;
      }
      
      if (r.schema) {
        markdown += '**Schema:**\n```json\n';
        markdown += JSON.stringify(r.schema, null, 2);
        markdown += '\n```\n\n';
      }
      
      markdown += '---\n\n';
    }
    
    fs.writeFileSync(mdPath, markdown);
    console.log(`📝 Documentación Markdown generada en: ${mdPath}`);
    
    console.log('\n✅ Auditoría completada exitosamente\n');
    
  } catch (error) {
    console.error('❌ Error durante la auditoría:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar auditoría
auditarBaseDatos().catch(console.error);
