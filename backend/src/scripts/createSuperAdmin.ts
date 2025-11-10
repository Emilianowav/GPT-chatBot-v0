// 🔐 Script para crear empresa MOMENTO y usuario SuperAdmin
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { EmpresaModel } from '../models/Empresa.js';
import { UsuarioEmpresaModel } from '../models/UsuarioEmpresa.js';
import mongoose from 'mongoose';

const EMPRESA_MOMENTO = {
  nombre: 'MOMENTO',
  categoria: 'administracion',
  telefono: '+5493794999999',
  email: 'admin@momentoia.co',
  prompt: 'Sos el sistema de administración de MOMENTO. Tu función es gestionar todas las empresas del sistema.',
  saludos: ['Sistema de administración MOMENTO activo'],
  catalogoPath: 'data/momento_admin.json',
  modelo: 'gpt-4' as const,
  plan: 'enterprise',
  modulos: [
    {
      id: 'super_admin_panel',
      nombre: 'Panel de Super Administración',
      descripcion: 'Panel completo de administración de empresas',
      version: '1.0.0',
      categoria: 'administracion',
      icono: '🔐',
      activo: true,
      fechaActivacion: new Date(),
      precio: 0,
      planMinimo: 'enterprise',
      dependencias: [],
      permisos: ['all'],
      configuracion: {},
      autor: 'MOMENTO',
      documentacion: 'https://docs.momentoia.co/superadmin',
      soporte: 'soporte@momentoia.co'
    }
  ],
  limites: {
    mensajesMensuales: 999999,
    usuariosActivos: 999999,
    almacenamiento: 999999,
    integraciones: -1,
    exportacionesMensuales: -1,
    agentesSimultaneos: 999,
    maxUsuarios: 100,
    maxAdmins: 10
  },
  uso: {
    mensajesEsteMes: 0,
    usuariosActivos: 0,
    almacenamientoUsado: 0,
    exportacionesEsteMes: 0,
    ultimaActualizacion: new Date()
  },
  facturacion: {
    estado: 'activo' as const,
    metodoPago: 'interno',
    ultimoPago: new Date(),
    proximoPago: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // +1 año
  }
};

const SUPER_ADMIN_USER = {
  username: 'superadmin',
  password: 'Momento2025!Admin', // Contraseña segura
  email: 'superadmin@momentoia.co',
  nombre: 'Super',
  apellido: 'Admin',
  empresaId: 'MOMENTO',
  rol: 'super_admin' as const,
  permisos: ['all'],
  activo: true,
  createdBy: 'system'
};

async function createSuperAdmin() {
  try {
    console.log('🚀 Iniciando creación de empresa MOMENTO y usuario SuperAdmin...\n');

    // Conectar a MongoDB
    await connectDB();

    // 1. Verificar si ya existe la empresa MOMENTO
    const empresaExistente = await EmpresaModel.findOne({ nombre: 'MOMENTO' });
    if (empresaExistente) {
      console.log('⚠️  La empresa MOMENTO ya existe');
    } else {
      // Crear empresa MOMENTO
      const empresaMomento = new EmpresaModel(EMPRESA_MOMENTO);
      await empresaMomento.save();
      console.log('✅ Empresa MOMENTO creada exitosamente');
      console.log(`   - Nombre: ${empresaMomento.nombre}`);
      console.log(`   - Email: ${empresaMomento.email}`);
      console.log(`   - Plan: ${empresaMomento.plan}`);
      console.log(`   - Teléfono: ${empresaMomento.telefono}\n`);
    }

    // 2. Verificar si ya existe el usuario superadmin
    const usuarioExistente = await UsuarioEmpresaModel.findOne({ username: 'superadmin' });
    if (usuarioExistente) {
      console.log('⚠️  El usuario superadmin ya existe');
      console.log(`   - Username: ${usuarioExistente.username}`);
      console.log(`   - Email: ${usuarioExistente.email}`);
      console.log(`   - Rol: ${usuarioExistente.rol}\n`);
    } else {
      // Crear usuario SuperAdmin
      const superAdmin = new UsuarioEmpresaModel(SUPER_ADMIN_USER);
      await superAdmin.save();
      console.log('✅ Usuario SuperAdmin creado exitosamente');
      console.log(`   - Username: ${superAdmin.username}`);
      console.log(`   - Password: ${SUPER_ADMIN_USER.password}`);
      console.log(`   - Email: ${superAdmin.email}`);
      console.log(`   - Rol: ${superAdmin.rol}\n`);
    }

    console.log('🎉 Proceso completado exitosamente!\n');
    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log('   ================================');
    console.log(`   Username: ${SUPER_ADMIN_USER.username}`);
    console.log(`   Password: ${SUPER_ADMIN_USER.password}`);
    console.log('   ================================\n');
    console.log('⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro\n');
    console.log('🔗 Endpoints disponibles:');
    console.log('   - POST   /api/auth/login');
    console.log('   - GET    /api/sa/empresas');
    console.log('   - POST   /api/sa/empresas');
    console.log('   - GET    /api/sa/empresas/:id');
    console.log('   - POST   /api/sa/empresas/:id/user\n');

  } catch (error) {
    console.error('❌ Error al crear SuperAdmin:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar script
createSuperAdmin();
