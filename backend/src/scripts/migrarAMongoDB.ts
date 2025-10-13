// 🔄 Script para migrar datos de JSON a MongoDB
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz del proyecto
const envPath = path.resolve(__dirname, '../../.env');
console.log('🔍 Cargando .env desde:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Error cargando .env:', result.error);
} else {
  console.log('✅ .env cargado correctamente');
  console.log('🔑 MONGODB_URI:', process.env.MONGODB_URI ? 'Definida' : 'NO DEFINIDA');
}

import { connectDB, disconnectDB } from '../config/database.js';
import { UsuarioModel } from '../models/Usuario.js';
import { EmpresaModel } from '../models/Empresa.js';
import type { Usuario } from '../types/Types.js';
import type { EmpresaConfig } from '../types/Types.js';

const RUTA_USUARIOS = path.resolve('data/usuarios.json');
const RUTA_EMPRESAS = path.resolve('data/empresas.json');

async function migrarUsuarios() {
  try {
    console.log('📂 Leyendo usuarios.json...');
    const contenido = await fs.readFile(RUTA_USUARIOS, 'utf-8');
    const usuarios: Usuario[] = JSON.parse(contenido);
    
    console.log(`📊 Encontrados ${usuarios.length} usuarios`);
    
    let migrados = 0;
    let errores = 0;
    
    for (const usuario of usuarios) {
      try {
        await UsuarioModel.findOneAndUpdate(
          { numero: usuario.id, empresaId: usuario.empresaId },
          {
            numero: usuario.numero,
            nombre: usuario.nombre,
            empresaId: usuario.empresaId,
            empresaTelefono: usuario.empresaTelefono,
            historial: usuario.historial,
            interacciones: usuario.interacciones,
            ultimaInteraccion: usuario.ultimaInteraccion,
            ultima_actualizacion: usuario.ultima_actualizacion,
            saludado: usuario.saludado,
            despedido: usuario.despedido,
            ultima_saludo: usuario.ultima_saludo,
            resumen: usuario.resumen,
            num_mensajes_enviados: usuario.num_mensajes_enviados,
            num_mensajes_recibidos: usuario.num_mensajes_recibidos,
            num_media_recibidos: usuario.num_media_recibidos,
            mensaje_ids: usuario.mensaje_ids,
            ultimo_status: usuario.ultimo_status,
            tokens_consumidos: usuario.tokens_consumidos,
            contactoInformado: usuario.contactoInformado
          },
          { upsert: true, new: true }
        );
        migrados++;
        console.log(`✅ Usuario migrado: ${usuario.nombre || usuario.numero} (${usuario.empresaId})`);
      } catch (error) {
        errores++;
        console.error(`❌ Error al migrar usuario ${usuario.numero}:`, error);
      }
    }
    
    console.log(`\n📊 Resumen de migración de usuarios:`);
    console.log(`   ✅ Migrados: ${migrados}`);
    console.log(`   ❌ Errores: ${errores}`);
    
  } catch (error) {
    console.error('❌ Error al leer usuarios.json:', error);
  }
}

async function migrarEmpresas() {
  try {
    console.log('\n📂 Leyendo empresas.json...');
    const contenido = await fs.readFile(RUTA_EMPRESAS, 'utf-8');
    const empresas: EmpresaConfig[] = JSON.parse(contenido);
    
    console.log(`📊 Encontradas ${empresas.length} empresas`);
    
    let migradas = 0;
    let errores = 0;
    
    for (const empresa of empresas) {
      try {
        await EmpresaModel.findOneAndUpdate(
          { nombre: empresa.nombre },
          empresa,
          { upsert: true, new: true }
        );
        migradas++;
        console.log(`✅ Empresa migrada: ${empresa.nombre}`);
      } catch (error) {
        errores++;
        console.error(`❌ Error al migrar empresa ${empresa.nombre}:`, error);
      }
    }
    
    console.log(`\n📊 Resumen de migración de empresas:`);
    console.log(`   ✅ Migradas: ${migradas}`);
    console.log(`   ❌ Errores: ${errores}`);
    
  } catch (error) {
    console.error('❌ Error al leer empresas.json:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando migración a MongoDB...\n');
    
    // Conectar a MongoDB
    await connectDB();
    
    // Migrar empresas primero
    await migrarEmpresas();
    
    // Luego migrar usuarios
    await migrarUsuarios();
    
    console.log('\n✅ Migración completada exitosamente');
    
    // Desconectar
    await disconnectDB();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    await disconnectDB();
    process.exit(1);
  }
}

main();
