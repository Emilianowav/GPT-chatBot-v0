// 🔍 Script de Análisis Completo de Base de Datos
// Genera un reporte detallado de todas las colecciones, esquemas y datos

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neural_chatbot';
const DB_NAME = 'neural_chatbot'; // Nombre fijo de la BD a analizar
const OUTPUT_DIR = path.join(__dirname, '../analysis-reports');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

// ============================================================================
// UTILIDADES
// ============================================================================

function log(emoji, message, data = null) {
  console.log(`${emoji} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function saveReport(filename, content) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const filepath = path.join(OUTPUT_DIR, `${TIMESTAMP}_${filename}`);
  fs.writeFileSync(filepath, content, 'utf8');
  log('💾', `Reporte guardado: ${filepath}`);
}

// ============================================================================
// ANÁLISIS DE COLECCIONES
// ============================================================================

async function analizarColecciones() {
  log('📊', 'Analizando colecciones...');
  
  const db = mongoose.connection.useDb(DB_NAME).db;
  const collections = await db.listCollections().toArray();
  
  const reporte = {
    total_colecciones: collections.length,
    colecciones: []
  };
  
  for (const collectionInfo of collections) {
    const collectionName = collectionInfo.name;
    const collection = db.collection(collectionName);
    
    log('🔍', `Analizando: ${collectionName}`);
    
    // Contar documentos
    const count = await collection.countDocuments();
    
    // Obtener un documento de muestra
    const sample = await collection.findOne();
    
    // Analizar índices
    const indexes = await collection.indexes();
    
    // Analizar esquema (inferido de documentos)
    const schema = await inferirEsquema(collection, collectionName);
    
    reporte.colecciones.push({
      nombre: collectionName,
      total_documentos: count,
      indices: indexes.map(idx => ({
        nombre: idx.name,
        campos: idx.key,
        unico: idx.unique || false,
        sparse: idx.sparse || false
      })),
      esquema_inferido: schema,
      documento_ejemplo: sample
    });
  }
  
  return reporte;
}

// ============================================================================
// INFERIR ESQUEMA
// ============================================================================

async function inferirEsquema(collection, collectionName) {
  log('🔬', `Infiriendo esquema de: ${collectionName}`);
  
  // Tomar muestra de 100 documentos
  const muestra = await collection.find().limit(100).toArray();
  
  if (muestra.length === 0) {
    return { mensaje: 'Colección vacía' };
  }
  
  const esquema = {};
  const tiposPorCampo = {};
  
  // Analizar cada documento
  for (const doc of muestra) {
    analizarObjeto(doc, esquema, tiposPorCampo, '');
  }
  
  // Calcular tipos más comunes y porcentajes
  const esquemaFinal = {};
  for (const [campo, info] of Object.entries(esquema)) {
    const tipos = tiposPorCampo[campo] || {};
    const totalApariciones = Object.values(tipos).reduce((a, b) => a + b, 0);
    
    esquemaFinal[campo] = {
      aparece_en: `${info.count}/${muestra.length} documentos (${((info.count / muestra.length) * 100).toFixed(1)}%)`,
      tipos: Object.entries(tipos).map(([tipo, count]) => ({
        tipo,
        frecuencia: `${count}/${totalApariciones} (${((count / totalApariciones) * 100).toFixed(1)}%)`
      })),
      valores_ejemplo: info.ejemplos.slice(0, 3),
      valores_unicos: info.valoresUnicos.size,
      es_requerido: info.count === muestra.length
    };
  }
  
  return esquemaFinal;
}

function analizarObjeto(obj, esquema, tiposPorCampo, prefijo) {
  for (const [key, value] of Object.entries(obj)) {
    const campoCompleto = prefijo ? `${prefijo}.${key}` : key;
    
    // Inicializar si no existe
    if (!esquema[campoCompleto]) {
      esquema[campoCompleto] = {
        count: 0,
        ejemplos: [],
        valoresUnicos: new Set()
      };
      tiposPorCampo[campoCompleto] = {};
    }
    
    esquema[campoCompleto].count++;
    
    // Determinar tipo
    const tipo = obtenerTipo(value);
    tiposPorCampo[campoCompleto][tipo] = (tiposPorCampo[campoCompleto][tipo] || 0) + 1;
    
    // Guardar ejemplos
    if (esquema[campoCompleto].ejemplos.length < 5) {
      esquema[campoCompleto].ejemplos.push(value);
    }
    
    // Contar valores únicos (solo para primitivos)
    if (tipo !== 'Object' && tipo !== 'Array') {
      esquema[campoCompleto].valoresUnicos.add(String(value));
    }
    
    // Recursión para objetos anidados
    if (tipo === 'Object' && value !== null) {
      analizarObjeto(value, esquema, tiposPorCampo, campoCompleto);
    }
    
    // Analizar arrays
    if (tipo === 'Array' && value.length > 0) {
      const primerElemento = value[0];
      if (typeof primerElemento === 'object' && primerElemento !== null) {
        analizarObjeto(primerElemento, esquema, tiposPorCampo, `${campoCompleto}[0]`);
      }
    }
  }
}

function obtenerTipo(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'Array';
  if (value instanceof Date) return 'Date';
  if (value instanceof mongoose.Types.ObjectId) return 'ObjectId';
  if (typeof value === 'object') return 'Object';
  return typeof value;
}

// ============================================================================
// ANÁLISIS DE RELACIONES
// ============================================================================

async function analizarRelaciones() {
  log('🔗', 'Analizando relaciones entre colecciones...');
  
  const db = mongoose.connection.useDb(DB_NAME).db;
  const collections = await db.listCollections().toArray();
  const relaciones = [];
  
  for (const collectionInfo of collections) {
    const collectionName = collectionInfo.name;
    const collection = db.collection(collectionName);
    
    // Buscar campos que terminen en "Id" o contengan "id"
    const muestra = await collection.find().limit(50).toArray();
    
    for (const doc of muestra) {
      buscarReferencias(doc, collectionName, relaciones, '');
    }
  }
  
  // Agrupar y contar relaciones
  const relacionesAgrupadas = {};
  for (const rel of relaciones) {
    const key = `${rel.desde} -> ${rel.campo} -> ${rel.hacia}`;
    if (!relacionesAgrupadas[key]) {
      relacionesAgrupadas[key] = {
        desde: rel.desde,
        campo: rel.campo,
        hacia: rel.hacia,
        count: 0
      };
    }
    relacionesAgrupadas[key].count++;
  }
  
  return Object.values(relacionesAgrupadas);
}

function buscarReferencias(obj, collectionName, relaciones, prefijo) {
  for (const [key, value] of Object.entries(obj)) {
    const campoCompleto = prefijo ? `${prefijo}.${key}` : key;
    
    // Detectar ObjectId
    if (value instanceof mongoose.Types.ObjectId) {
      // Inferir colección destino del nombre del campo
      let posibleColeccion = inferirColeccionDestino(key);
      
      relaciones.push({
        desde: collectionName,
        campo: campoCompleto,
        hacia: posibleColeccion,
        tipo: 'ObjectId'
      });
    }
    
    // Detectar string que podría ser referencia
    if (typeof value === 'string' && (key.endsWith('Id') || key.includes('empresa'))) {
      relaciones.push({
        desde: collectionName,
        campo: campoCompleto,
        hacia: inferirColeccionDestino(key),
        tipo: 'String'
      });
    }
    
    // Recursión
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      buscarReferencias(value, collectionName, relaciones, campoCompleto);
    }
    
    // Arrays
    if (Array.isArray(value) && value.length > 0) {
      const primerElemento = value[0];
      if (typeof primerElemento === 'object' && primerElemento !== null) {
        buscarReferencias(primerElemento, collectionName, relaciones, `${campoCompleto}[0]`);
      }
    }
  }
}

function inferirColeccionDestino(campo) {
  // Mapeo de campos comunes
  const mapeo = {
    'empresaId': 'empresas',
    'clienteId': 'contactoempresas',
    'agenteId': 'agentes',
    'turnoId': 'turnos',
    'userId': 'users',
    'contactoId': 'contactoempresas'
  };
  
  return mapeo[campo] || campo.replace(/Id$/, 's').toLowerCase();
}

// ============================================================================
// ANÁLISIS DE CONFIGURACIONES
// ============================================================================

async function analizarConfiguraciones() {
  log('⚙️', 'Analizando configuraciones de módulos...');
  
  const db = mongoose.connection.useDb(DB_NAME).db;
  const collection = db.collection('configuracionmodulos');
  
  const configs = await collection.find().toArray();
  
  const analisis = {
    total_configuraciones: configs.length,
    empresas: [],
    campos_comunes: {},
    campos_opcionales: {}
  };
  
  for (const config of configs) {
    const empresaAnalisis = {
      empresaId: config.empresaId,
      campos_configurados: Object.keys(config).filter(k => k !== '_id' && k !== '__v'),
      tiene_plantillas_meta: !!config.plantillasMeta,
      tiene_mensajes_flujo: !!config.mensajesFlujo,
      notificaciones_activas: []
    };
    
    // Analizar notificaciones activas
    if (config.plantillasMeta) {
      if (config.plantillasMeta.notificacionDiariaAgentes?.activa) {
        empresaAnalisis.notificaciones_activas.push('notificacionDiariaAgentes');
      }
      if (config.plantillasMeta.confirmacionTurnos?.activa) {
        empresaAnalisis.notificaciones_activas.push('confirmacionTurnos');
      }
    }
    
    analisis.empresas.push(empresaAnalisis);
    
    // Contar campos comunes
    for (const campo of Object.keys(config)) {
      if (campo === '_id' || campo === '__v') continue;
      analisis.campos_comunes[campo] = (analisis.campos_comunes[campo] || 0) + 1;
    }
  }
  
  // Determinar campos opcionales vs requeridos
  for (const [campo, count] of Object.entries(analisis.campos_comunes)) {
    if (count === configs.length) {
      analisis.campos_comunes[campo] = { aparece_en: 'todas', es_requerido: true };
    } else {
      analisis.campos_opcionales[campo] = { 
        aparece_en: `${count}/${configs.length}`,
        es_requerido: false 
      };
    }
  }
  
  return analisis;
}

// ============================================================================
// ANÁLISIS DE DATOS DE PRUEBA
// ============================================================================

async function identificarDatosPrueba() {
  log('🧪', 'Identificando datos de prueba...');
  
  const db = mongoose.connection.useDb(DB_NAME).db;
  const datosPrueba = [];
  
  // Buscar en empresas
  const empresas = await db.collection('empresas').find().toArray();
  for (const empresa of empresas) {
    if (empresa.nombre?.toLowerCase().includes('test') || 
        empresa.nombre?.toLowerCase().includes('prueba') ||
        empresa.email?.includes('test')) {
      datosPrueba.push({
        coleccion: 'empresas',
        _id: empresa._id,
        nombre: empresa.nombre,
        razon: 'Nombre o email contiene "test" o "prueba"'
      });
    }
  }
  
  // Buscar en contactos
  const contactos = await db.collection('contactoempresas').find().toArray();
  for (const contacto of contactos) {
    if (contacto.nombre?.toLowerCase().includes('test') ||
        contacto.telefono?.includes('1234567890')) {
      datosPrueba.push({
        coleccion: 'contactoempresas',
        _id: contacto._id,
        nombre: contacto.nombre,
        telefono: contacto.telefono,
        razon: 'Nombre contiene "test" o teléfono es genérico'
      });
    }
  }
  
  return datosPrueba;
}

// ============================================================================
// GENERAR REPORTE MARKDOWN
// ============================================================================

function generarReporteMarkdown(analisis) {
  let md = `# 📊 Análisis de Base de Datos - ${TIMESTAMP}\n\n`;
  
  md += `## 🗂️ Resumen General\n\n`;
  md += `- **Total de colecciones:** ${analisis.colecciones.total_colecciones}\n`;
  md += `- **Total de documentos:** ${analisis.colecciones.colecciones.reduce((sum, col) => sum + col.total_documentos, 0)}\n\n`;
  
  md += `## 📋 Colecciones\n\n`;
  for (const col of analisis.colecciones.colecciones) {
    md += `### ${col.nombre}\n\n`;
    md += `- **Documentos:** ${col.total_documentos}\n`;
    md += `- **Índices:** ${col.indices.length}\n\n`;
    
    if (col.indices.length > 0) {
      md += `#### Índices\n\n`;
      md += `| Nombre | Campos | Único | Sparse |\n`;
      md += `|--------|--------|-------|--------|\n`;
      for (const idx of col.indices) {
        md += `| ${idx.nombre} | ${JSON.stringify(idx.campos)} | ${idx.unico ? '✅' : '❌'} | ${idx.sparse ? '✅' : '❌'} |\n`;
      }
      md += `\n`;
    }
    
    md += `#### Esquema Inferido\n\n`;
    md += `| Campo | Aparece en | Tipos | Requerido |\n`;
    md += `|-------|------------|-------|----------|\n`;
    for (const [campo, info] of Object.entries(col.esquema_inferido)) {
      if (campo === 'mensaje') continue; // Skip empty collection message
      const tipos = info.tipos?.map(t => t.tipo).join(', ') || 'N/A';
      md += `| ${campo} | ${info.aparece_en} | ${tipos} | ${info.es_requerido ? '✅' : '❌'} |\n`;
    }
    md += `\n`;
  }
  
  md += `## 🔗 Relaciones Detectadas\n\n`;
  md += `| Desde | Campo | Hacia | Tipo | Frecuencia |\n`;
  md += `|-------|-------|-------|------|------------|\n`;
  for (const rel of analisis.relaciones) {
    md += `| ${rel.desde} | ${rel.campo} | ${rel.hacia} | ${rel.tipo} | ${rel.count} |\n`;
  }
  md += `\n`;
  
  md += `## ⚙️ Configuraciones de Módulos\n\n`;
  md += `- **Total configuraciones:** ${analisis.configuraciones.total_configuraciones}\n\n`;
  md += `### Empresas Configuradas\n\n`;
  for (const empresa of analisis.configuraciones.empresas) {
    md += `#### ${empresa.empresaId}\n\n`;
    md += `- Plantillas Meta: ${empresa.tiene_plantillas_meta ? '✅' : '❌'}\n`;
    md += `- Mensajes Flujo: ${empresa.tiene_mensajes_flujo ? '✅' : '❌'}\n`;
    md += `- Notificaciones activas: ${empresa.notificaciones_activas.join(', ') || 'Ninguna'}\n\n`;
  }
  
  if (analisis.datosPrueba.length > 0) {
    md += `## 🧪 Datos de Prueba Detectados\n\n`;
    md += `⚠️ Se encontraron ${analisis.datosPrueba.length} registros que parecen ser de prueba:\n\n`;
    for (const dato of analisis.datosPrueba) {
      md += `- **${dato.coleccion}:** ${dato.nombre || dato._id} - ${dato.razon}\n`;
    }
    md += `\n`;
  }
  
  return md;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    log('🚀', 'Iniciando análisis de base de datos...');
    log('🔌', `Conectando a: ${MONGO_URI}`);
    
    await mongoose.connect(MONGO_URI);
    log('✅', 'Conectado a MongoDB');
    
    // Cambiar a la BD correcta
    const db = mongoose.connection.useDb(DB_NAME);
    log('📁', `Usando base de datos: ${DB_NAME}`);
    
    // Listar todas las BDs disponibles
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    log('📚', 'Bases de datos disponibles:');
    databases.forEach(database => {
      const marker = database.name === DB_NAME ? '👉' : '  ';
      console.log(`   ${marker} ${database.name} (${(database.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    const analisis = {
      colecciones: await analizarColecciones(),
      relaciones: await analizarRelaciones(),
      configuraciones: await analizarConfiguraciones(),
      datosPrueba: await identificarDatosPrueba()
    };
    
    // Guardar reportes
    saveReport('analisis-completo.json', JSON.stringify(analisis, null, 2));
    saveReport('analisis-completo.md', generarReporteMarkdown(analisis));
    
    log('✅', 'Análisis completado');
    log('📁', `Reportes guardados en: ${OUTPUT_DIR}`);
    
    // Mostrar resumen en consola
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN DEL ANÁLISIS');
    console.log('='.repeat(80));
    console.log(`Total de colecciones: ${analisis.colecciones.total_colecciones}`);
    console.log(`Total de relaciones: ${analisis.relaciones.length}`);
    console.log(`Empresas configuradas: ${analisis.configuraciones.total_configuraciones}`);
    console.log(`Datos de prueba: ${analisis.datosPrueba.length}`);
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    log('❌', 'Error en el análisis:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    log('👋', 'Desconectado de MongoDB');
  }
}

main();
