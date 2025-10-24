// 🔄 Script de Migración: Agregar límites de usuarios a empresas existentes
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { EmpresaModel } from '../models/Empresa.js';
import { UsuarioEmpresaModel } from '../models/UsuarioEmpresa.js';
import { AdminUserModel } from '../models/AdminUser.js';

/**
 * Migra empresas existentes para agregar límites de usuarios según su plan
 */
async function migrarEmpresasUsuarios() {
  try {
    console.log('🔄 Iniciando migración de empresas...');
    
    // Conectar a la base de datos
    await connectDB();
    
    // Obtener todas las empresas
    const empresas = await EmpresaModel.find({});
    console.log(`📊 Encontradas ${empresas.length} empresas`);
    
    let migradas = 0;
    let usuariosCreados = 0;
    
    for (const empresa of empresas) {
      console.log(`\n📦 Procesando empresa: ${empresa.nombre}`);
      
      // Definir límites según el plan
      const limitesPorPlan: Record<string, { maxUsuarios: number; maxAdmins: number }> = {
        basico: { maxUsuarios: 5, maxAdmins: 1 },
        standard: { maxUsuarios: 15, maxAdmins: 3 },
        premium: { maxUsuarios: 50, maxAdmins: 10 },
        enterprise: { maxUsuarios: 999, maxAdmins: 50 }
      };
      
      const plan = empresa.plan || 'basico';
      const limites = limitesPorPlan[plan] || limitesPorPlan.basico;
      
      // Actualizar límites si no existen
      if (!empresa.limites?.maxUsuarios || !empresa.limites?.maxAdmins) {
        empresa.limites = {
          ...empresa.limites,
          maxUsuarios: limites.maxUsuarios,
          maxAdmins: limites.maxAdmins
        };
        
        await empresa.save();
        migradas++;
        console.log(`  ✅ Límites actualizados: ${limites.maxUsuarios} usuarios, ${limites.maxAdmins} admins`);
      } else {
        console.log(`  ⏭️  Ya tiene límites configurados`);
      }
      
      // Verificar si ya tiene usuarios de empresa
      const usuariosExistentes = await UsuarioEmpresaModel.countDocuments({
        empresaId: empresa.nombre
      });
      
      if (usuariosExistentes > 0) {
        console.log(`  ℹ️  Ya tiene ${usuariosExistentes} usuarios de empresa`);
        continue;
      }
      
      // Buscar usuarios admin antiguos (AdminUser)
      const adminAntiguo = await AdminUserModel.findOne({
        empresaId: empresa.nombre,
        activo: true
      });
      
      if (adminAntiguo) {
        console.log(`  🔄 Migrando admin antiguo: ${adminAntiguo.username}`);
        
        // Crear usuario de empresa basado en el admin antiguo
        const nuevoUsuario = new UsuarioEmpresaModel({
          username: adminAntiguo.username,
          password: adminAntiguo.password, // Ya está hasheado
          email: adminAntiguo.email || `${adminAntiguo.username}@${empresa.nombre}.com`,
          nombre: adminAntiguo.username,
          empresaId: empresa.nombre,
          rol: 'admin',
          permisos: [
            'usuarios.crear',
            'usuarios.editar',
            'usuarios.eliminar',
            'usuarios.ver',
            'configuracion.editar',
            'configuracion.ver',
            'modulos.activar',
            'modulos.desactivar',
            'reportes.ver',
            'reportes.exportar',
            'calendario.crear',
            'calendario.editar',
            'calendario.eliminar',
            'calendario.ver'
          ],
          activo: true,
          ultimoAcceso: adminAntiguo.ultimoAcceso,
          createdBy: 'system_migration'
        });
        
        // Guardar sin volver a hashear la contraseña
        await nuevoUsuario.save({ validateBeforeSave: false });
        usuariosCreados++;
        console.log(`  ✅ Usuario admin creado: ${nuevoUsuario.username}`);
      } else {
        console.log(`  ⚠️  No se encontró admin antiguo para migrar`);
      }
    }
    
    console.log('\n✅ Migración completada');
    console.log(`📊 Resumen:`);
    console.log(`   - Empresas actualizadas: ${migradas}`);
    console.log(`   - Usuarios creados: ${usuariosCreados}`);
    console.log(`   - Total empresas: ${empresas.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrarEmpresasUsuarios();
