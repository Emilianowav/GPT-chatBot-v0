// 🔍 Script para analizar la estructura de la base de datos
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Importar todos los modelos
import { UsuarioModel } from '../models/Usuario.js';
import { EmpresaModel } from '../models/Empresa.js';
import { UsuarioEmpresaModel } from '../models/UsuarioEmpresa.js';
import { ClienteModel } from '../models/Cliente.js';
import { AdminUserModel } from '../models/AdminUser.js';
import { ContactoEmpresaModel } from '../models/ContactoEmpresa.js';
import { ConversationStateModel } from '../models/ConversationState.js';

interface CollectionStats {
  name: string;
  count: number;
  indexes: any[];
  sampleDocument: any;
  schema: any;
}

interface RelationshipInfo {
  from: string;
  to: string;
  field: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

async function conectarDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('❌ MONGODB_URI no está definida en .env');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

async function analizarColeccion(model: any, nombre: string): Promise<CollectionStats> {
  const count = await model.countDocuments();
  const indexes = await model.collection.getIndexes();
  const sampleDoc = await model.findOne().lean();
  
  return {
    name: nombre,
    count,
    indexes,
    sampleDocument: sampleDoc,
    schema: model.schema.obj
  };
}

function extraerRelaciones(stats: CollectionStats[]): RelationshipInfo[] {
  const relaciones: RelationshipInfo[] = [];

  stats.forEach(stat => {
    const schema = stat.schema;
    
    // Buscar campos que terminen en 'Id' o contengan referencias
    Object.keys(schema).forEach(field => {
      if (field.endsWith('Id') || field.endsWith('_id')) {
        const targetCollection = field.replace(/Id$/, '').replace(/_id$/, '');
        relaciones.push({
          from: stat.name,
          to: targetCollection,
          field: field,
          type: 'one-to-many'
        });
      }
    });
  });

  return relaciones;
}

function imprimirEstadisticas(stats: CollectionStats[]) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 ESTADÍSTICAS DE COLECCIONES');
  console.log('═══════════════════════════════════════════════════════════════\n');

  stats.forEach(stat => {
    console.log(`📦 Colección: ${stat.name}`);
    console.log(`   📈 Documentos: ${stat.count}`);
    console.log(`   🔑 Índices: ${Object.keys(stat.indexes).length}`);
    
    if (stat.count > 0 && stat.sampleDocument) {
      console.log(`   📋 Campos principales:`);
      Object.keys(stat.sampleDocument).forEach(key => {
        if (!key.startsWith('_') && key !== '__v') {
          const value = stat.sampleDocument[key];
          const tipo = Array.isArray(value) ? 'Array' : typeof value;
          console.log(`      • ${key}: ${tipo}`);
        }
      });
    }
    console.log('');
  });
}

function imprimirSchema(stats: CollectionStats[]) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🏗️  ESTRUCTURA DE SCHEMAS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  stats.forEach(stat => {
    console.log(`📐 Schema: ${stat.name}`);
    console.log('─────────────────────────────────────────────────────────────');
    
    Object.entries(stat.schema).forEach(([field, config]: [string, any]) => {
      let tipo = 'Mixed';
      let requerido = '';
      let unico = '';
      let index = '';
      
      if (config.type) {
        if (config.type.name) {
          tipo = config.type.name;
        } else if (Array.isArray(config.type)) {
          tipo = `[${config.type[0]?.name || 'Mixed'}]`;
        } else {
          tipo = config.type.toString();
        }
      }
      
      if (config.required) requerido = ' ✓required';
      if (config.unique) unico = ' ⚡unique';
      if (config.index) index = ' 🔍indexed';
      
      console.log(`   ${field}: ${tipo}${requerido}${unico}${index}`);
    });
    console.log('');
  });
}

function imprimirRelaciones(relaciones: RelationshipInfo[]) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔗 RELACIONES DETECTADAS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const relacionesAgrupadas = relaciones.reduce((acc, rel) => {
    if (!acc[rel.from]) acc[rel.from] = [];
    acc[rel.from].push(rel);
    return acc;
  }, {} as Record<string, RelationshipInfo[]>);

  Object.entries(relacionesAgrupadas).forEach(([from, rels]) => {
    console.log(`📌 ${from}:`);
    rels.forEach(rel => {
      console.log(`   └─> ${rel.to} (via ${rel.field})`);
    });
    console.log('');
  });
}

function imprimirIndices(stats: CollectionStats[]) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 ÍNDICES DE BASE DE DATOS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  stats.forEach(stat => {
    console.log(`📇 ${stat.name}:`);
    Object.entries(stat.indexes).forEach(([name, index]: [string, any]) => {
      const keys = Object.keys(index.key || {}).join(', ');
      const unique = index.unique ? ' [UNIQUE]' : '';
      console.log(`   • ${name}: {${keys}}${unique}`);
    });
    console.log('');
  });
}

function generarDiagramaMermaid(stats: CollectionStats[], relaciones: RelationshipInfo[]) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 DIAGRAMA MERMAID (Copiar en mermaid.live)');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('```mermaid');
  console.log('erDiagram');
  
  // Definir entidades
  stats.forEach(stat => {
    const campos = Object.keys(stat.schema)
      .filter(k => !k.startsWith('_'))
      .slice(0, 8) // Limitar a 8 campos principales
      .map(k => {
        const config = stat.schema[k];
        let tipo = 'string';
        if (config.type?.name) tipo = config.type.name.toLowerCase();
        return `    ${tipo} ${k}`;
      })
      .join('\n');
    
    console.log(`  ${stat.name} {`);
    console.log(campos);
    console.log('  }');
  });
  
  console.log('');
  
  // Definir relaciones
  relaciones.forEach(rel => {
    const toCapitalized = rel.to.charAt(0).toUpperCase() + rel.to.slice(0);
    console.log(`  ${rel.from} ||--o{ ${toCapitalized} : "${rel.field}"`);
  });
  
  console.log('```\n');
}

function imprimirRecomendaciones(stats: CollectionStats[]) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('💡 RECOMENDACIONES PARA MARKETPLACE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📋 Para el módulo de Marketplace, recomiendo:');
  console.log('');
  console.log('1️⃣  Crear modelo: MarketplaceIntegration');
  console.log('   Campos clave:');
  console.log('   • usuarioEmpresaId: ObjectId (ref: UsuarioEmpresa)');
  console.log('   • empresaId: string (ref: Empresa.nombre)');
  console.log('   • provider: string (google_calendar, outlook, etc.)');
  console.log('   • credentials: { access_token, refresh_token, expires_at }');
  console.log('   • status: string (active, expired, revoked)');
  console.log('');
  
  console.log('2️⃣  Relaciones identificadas:');
  const empresaStats = stats.find(s => s.name === 'Empresa');
  const usuarioEmpresaStats = stats.find(s => s.name === 'UsuarioEmpresa');
  
  if (empresaStats) {
    console.log(`   • Empresa usa: "${empresaStats.schema.nombre?.type?.name || 'String'}" como ID único`);
  }
  if (usuarioEmpresaStats) {
    console.log(`   • UsuarioEmpresa referencia Empresa via: "empresaId"`);
  }
  console.log('');
  
  console.log('3️⃣  Consideraciones de seguridad:');
  console.log('   • Encriptar tokens OAuth en la BD');
  console.log('   • Almacenar client_id y client_secret en .env');
  console.log('   • Implementar refresh automático de tokens');
  console.log('');
}

async function main() {
  try {
    console.clear();
    console.log('🚀 Iniciando análisis de base de datos...\n');
    
    await conectarDB();

    // Analizar todas las colecciones
    const modelos = [
      { model: UsuarioModel, name: 'Usuario' },
      { model: EmpresaModel, name: 'Empresa' },
      { model: UsuarioEmpresaModel, name: 'UsuarioEmpresa' },
      { model: ClienteModel, name: 'Cliente' },
      { model: AdminUserModel, name: 'AdminUser' },
      { model: ContactoEmpresaModel, name: 'ContactoEmpresa' },
      { model: ConversationStateModel, name: 'ConversationState' }
    ];

    console.log('📥 Recopilando información de las colecciones...\n');
    
    const stats: CollectionStats[] = [];
    for (const { model, name } of modelos) {
      try {
        const stat = await analizarColeccion(model, name);
        stats.push(stat);
        console.log(`   ✓ ${name} analizado`);
      } catch (error) {
        console.log(`   ⚠ ${name} no disponible`);
      }
    }
    
    console.log('\n');

    // Generar reportes
    imprimirEstadisticas(stats);
    imprimirSchema(stats);
    
    const relaciones = extraerRelaciones(stats);
    imprimirRelaciones(relaciones);
    
    imprimirIndices(stats);
    generarDiagramaMermaid(stats, relaciones);
    imprimirRecomendaciones(stats);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Análisis completado exitosamente');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error en el análisis:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada\n');
    process.exit(0);
  }
}

// Ejecutar
main();
