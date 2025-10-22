// Script para crear empresa de prueba con módulo de calendario
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/database.js';
import { EmpresaModel } from '../models/Empresa.js';
import { AdminUserModel } from '../models/AdminUser.js';

interface Modulo {
  id: string;
  nombre: string;
  descripcion: string;
  version: string;
  categoria: string;
  icono: string;
  activo: boolean;
  fechaActivacion: Date;
  precio: number;
  planMinimo: string;
  dependencias: string[];
  permisos: string[];
  configuracion: any;
  autor: string;
  documentacion: string;
  soporte: string;
}

async function seedEmpresaConModulo() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await connectDB();
    
    // Definir el módulo de calendario
    const moduloCalendario: Modulo = {
      id: 'calendar_booking',
      nombre: 'Calendario de Turnos',
      descripcion: 'Sistema completo de gestión de turnos y reservas con integración al chatbot',
      version: '1.0.0',
      categoria: 'booking',
      icono: '📅',
      activo: true,
      fechaActivacion: new Date(),
      precio: 39,
      planMinimo: 'standard',
      dependencias: [],
      permisos: [
        'calendar:turnos:read',
        'calendar:turnos:write',
        'calendar:turnos:delete',
        'calendar:agentes:read',
        'calendar:agentes:write',
        'calendar:config:admin'
      ],
      configuracion: {
        duracionTurnoPorDefecto: 30,
        bufferEntreturnos: 5,
        anticipacionMinima: 2,
        anticipacionMaxima: 30,
        horaAperturaGlobal: '08:00',
        horaCierreGlobal: '20:00',
        requiereConfirmacionAgente: false,
        tiempoLimiteConfirmacion: 60,
        recordatorio24h: true,
        recordatorio1h: true,
        permiteCancelacion: true,
        tiempoLimiteCancelacion: 24,
        notificarAgenteNuevoTurno: true,
        notificarAgenteCancelacion: true
      },
      autor: 'Neural Team',
      documentacion: 'https://docs.neural-crm.com/modules/calendar',
      soporte: 'soporte@neural-crm.com'
    };
    
    // Verificar si ya existe la empresa
    const empresaExistente = await EmpresaModel.findOne({ nombre: 'EmpresaDemo' });
    
    if (empresaExistente) {
      console.log('⚠️  La empresa EmpresaDemo ya existe. Actualizando...');
      
      // Agregar módulo si no existe
      if (!empresaExistente.modulos) {
        empresaExistente.modulos = [];
      }
      
      const tieneModulo = empresaExistente.modulos.some(m => m.id === 'calendar_booking');
      
      if (!tieneModulo) {
        empresaExistente.modulos.push(moduloCalendario as any);
        empresaExistente.plan = 'standard';
        
        // Actualizar límites
        empresaExistente.limites = {
          mensajesMensuales: 5000,
          usuariosActivos: 500,
          almacenamiento: 1000,
          integraciones: 3,
          exportacionesMensuales: 10,
          agentesSimultaneos: 3
        };
        
        // Inicializar uso
        empresaExistente.uso = {
          mensajesEsteMes: 0,
          usuariosActivos: 0,
          almacenamientoUsado: 0,
          exportacionesEsteMes: 0,
          ultimaActualizacion: new Date()
        };
        
        await empresaExistente.save();
        console.log('✅ Módulo de calendario agregado a EmpresaDemo');
      } else {
        console.log('ℹ️  EmpresaDemo ya tiene el módulo de calendario');
      }
    } else {
      console.log('📝 Creando nueva empresa EmpresaDemo...');
      
      // Crear nueva empresa con módulo
      const nuevaEmpresa = new EmpresaModel({
        nombre: 'EmpresaDemo',
        categoria: 'servicios',
        telefono: '+5491112345678',
        email: 'demo@neural-crm.com',
        prompt: 'Sos un asistente virtual de EmpresaDemo. Ayudá a los clientes con información y gestión de turnos.',
        saludos: [
          '¡Hola! Bienvenido a EmpresaDemo. ¿En qué puedo ayudarte?',
          '¡Hola! ¿Querés agendar un turno o necesitás información?'
        ],
        catalogoPath: 'data/catalogos/demo_servicios.txt',
        linkCatalogo: 'https://empresademo.com/servicios',
        modelo: 'gpt-3.5-turbo',
        phoneNumberId: '123456789',
        
        // Plan y módulos
        plan: 'standard',
        modulos: [moduloCalendario as any],
        
        // Límites del plan standard
        limites: {
          mensajesMensuales: 5000,
          usuariosActivos: 500,
          almacenamiento: 1000,
          integraciones: 3,
          exportacionesMensuales: 10,
          agentesSimultaneos: 3
        },
        
        // Uso inicial
        uso: {
          mensajesEsteMes: 0,
          usuariosActivos: 0,
          almacenamientoUsado: 0,
          exportacionesEsteMes: 0,
          ultimaActualizacion: new Date()
        },
        
        // Facturación
        facturacion: {
          estado: 'activo',
          ultimoPago: new Date(),
          proximoPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      
      await nuevaEmpresa.save();
      console.log('✅ Empresa EmpresaDemo creada exitosamente');
    }
    
    // Verificar/crear usuario admin para la empresa
    const adminExistente = await AdminUserModel.findOne({ 
      username: 'demo',
      empresaId: 'EmpresaDemo'
    });
    
    if (!adminExistente) {
      console.log('📝 Creando usuario admin para EmpresaDemo...');
      
      const adminUser = new AdminUserModel({
        username: 'demo',
        password: 'Demo123!', // Se hasheará automáticamente
        empresaId: 'EmpresaDemo',
        role: 'admin',
        email: 'admin@empresademo.com',
        activo: true
      });
      
      await adminUser.save();
      console.log('✅ Usuario admin creado');
      console.log('   Username: demo');
      console.log('   Password: Demo123!');
    } else {
      console.log('ℹ️  Usuario admin ya existe para EmpresaDemo');
      console.log('   Username: demo');
      console.log('   Password: Demo123!');
    }
    
    console.log('\n✅ Seed completado exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('   Empresa: EmpresaDemo');
    console.log('   Plan: Standard');
    console.log('   Módulo: Calendario de Turnos (Activo)');
    console.log('   Login: demo / Demo123!');
    console.log('\n🚀 Puedes hacer login en el dashboard con estas credenciales');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

// Ejecutar
seedEmpresaConModulo();
