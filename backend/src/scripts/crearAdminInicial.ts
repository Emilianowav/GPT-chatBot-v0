// 👤 Script para crear el primer usuario administrador
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB, disconnectDB } from '../config/database.js';
import { createAdminUser } from '../services/authService.js';
import { EmpresaModel } from '../models/Empresa.js';

async function main() {
  try {
    console.log('🚀 Iniciando creación de usuarios administradores...\n');
    
    // Conectar a MongoDB
    await connectDB();
    
    // Obtener todas las empresas
    const empresas = await EmpresaModel.find({});
    
    if (empresas.length === 0) {
      console.log('⚠️ No hay empresas en la base de datos');
      console.log('💡 Primero ejecuta el script de migración: npm run migrar');
      await disconnectDB();
      process.exit(1);
    }

    console.log(`📊 Encontradas ${empresas.length} empresas:\n`);
    
    // Crear un usuario admin para cada empresa
    for (const empresa of empresas) {
      console.log(`🏢 Empresa: ${empresa.nombre}`);
      
      // Username: primera palabra de la empresa en minúsculas
      const username = empresa.nombre.toLowerCase().split(' ')[0] + '_admin';
      const password = 'admin123'; // Contraseña por defecto (cambiar después)
      
      const result = await createAdminUser(
        username,
        password,
        empresa.nombre,
        'admin',
        empresa.email
      );
      
      if (result.success) {
        console.log(`✅ Usuario creado: ${username} / ${password}`);
      } else {
        console.log(`⚠️ ${result.message}`);
      }
      console.log('');
    }
    
    console.log('\n📋 Resumen de Credenciales:');
    console.log('═'.repeat(60));
    for (const empresa of empresas) {
      const username = empresa.nombre.toLowerCase().split(' ')[0] + '_admin';
      console.log(`🏢 ${empresa.nombre}`);
      console.log(`   Usuario: ${username}`);
      console.log(`   Contraseña: admin123`);
      console.log('');
    }
    console.log('═'.repeat(60));
    console.log('\n⚠️ IMPORTANTE: Cambia estas contraseñas en producción\n');
    
    // Desconectar
    await disconnectDB();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error durante la creación:', error);
    await disconnectDB();
    process.exit(1);
  }
}

main();
