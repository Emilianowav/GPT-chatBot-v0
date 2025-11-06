// 🔐 Servicio de Super Administrador
import { EmpresaModel } from '../models/Empresa.js';
import { UsuarioEmpresaModel } from '../models/UsuarioEmpresa.js';
import { UsuarioModel } from '../models/Usuario.js';
import bcrypt from 'bcryptjs';

/**
 * Crea una nueva empresa (onboarding)
 */
export async function crearEmpresa(data: {
  nombre: string;
  email: string;
  telefono?: string;
  plan?: string;
  categoria?: string;
}) {
  try {
    const { nombre, email, telefono, plan = 'standard', categoria = 'general' } = data;

    // Validar que el nombre no exista
    const empresaExistente = await EmpresaModel.findOne({ nombre });
    if (empresaExistente) {
      return {
        success: false,
        message: 'Ya existe una empresa con ese nombre'
      };
    }

    // Validar que el teléfono no exista (si se proporciona)
    if (telefono) {
      const empresaConTelefono = await EmpresaModel.findOne({ telefono });
      if (empresaConTelefono) {
        return {
          success: false,
          message: 'Ya existe una empresa con ese teléfono'
        };
      }
    }

    // Definir límites según el plan
    const limitesPorPlan: any = {
      basico: {
        mensajesMensuales: 1000,
        usuariosActivos: 100,
        almacenamiento: 250,
        integraciones: 1,
        exportacionesMensuales: 0,
        agentesSimultaneos: 0,
        maxUsuarios: 5,
        maxAdmins: 1
      },
      standard: {
        mensajesMensuales: 5000,
        usuariosActivos: 500,
        almacenamiento: 1000,
        integraciones: 3,
        exportacionesMensuales: 10,
        agentesSimultaneos: 2,
        maxUsuarios: 10,
        maxAdmins: 2
      },
      premium: {
        mensajesMensuales: 15000,
        usuariosActivos: 2000,
        almacenamiento: 5000,
        integraciones: 10,
        exportacionesMensuales: 50,
        agentesSimultaneos: 5,
        maxUsuarios: 25,
        maxAdmins: 5
      },
      enterprise: {
        mensajesMensuales: 50000,
        usuariosActivos: 10000,
        almacenamiento: 20000,
        integraciones: -1, // ilimitado
        exportacionesMensuales: -1,
        agentesSimultaneos: 20,
        maxUsuarios: 100,
        maxAdmins: 10
      }
    };

    // Crear empresa
    const nuevaEmpresa = new EmpresaModel({
      nombre,
      categoria,
      telefono: telefono || `+549${Date.now()}`, // Teléfono temporal si no se proporciona
      email,
      prompt: `Sos el asistente virtual de ${nombre}. Tu objetivo es ayudar a los clientes de manera amable y profesional.`,
      saludos: [`¡Hola! 👋 Bienvenido a ${nombre}. ¿En qué puedo ayudarte hoy?`],
      catalogoPath: `data/${nombre.toLowerCase().replace(/\s+/g, '_')}_catalogo.json`,
      modelo: 'gpt-3.5-turbo',
      plan,
      modulos: [],
      limites: limitesPorPlan[plan] || limitesPorPlan.standard,
      uso: {
        mensajesEsteMes: 0,
        usuariosActivos: 0,
        almacenamientoUsado: 0,
        exportacionesEsteMes: 0,
        ultimaActualizacion: new Date()
      },
      facturacion: {
        estado: 'activo',
        ultimoPago: new Date(),
        proximoPago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 días
      }
    });

    await nuevaEmpresa.save();

    console.log('✅ Empresa creada por SuperAdmin:', nombre);

    return {
      success: true,
      message: 'Empresa creada exitosamente',
      empresa: {
        id: nuevaEmpresa._id,
        nombre: nuevaEmpresa.nombre,
        email: nuevaEmpresa.email,
        telefono: nuevaEmpresa.telefono,
        plan: nuevaEmpresa.plan
      }
    };
  } catch (error) {
    console.error('❌ Error al crear empresa:', error);
    return {
      success: false,
      message: 'Error al crear empresa'
    };
  }
}

/**
 * Obtiene todas las empresas con filtros
 */
export async function obtenerTodasLasEmpresas(filtros: {
  nombre?: string;
  email?: string;
  categoria?: string;
  plan?: string;
  estadoFacturacion?: string;
  sinUso?: boolean;
  cercaLimite?: boolean;
  conWhatsApp?: boolean;
}) {
  try {
    const query: any = {};

    // Filtro por texto libre (nombre o email)
    if (filtros.nombre) {
      query.$or = [
        { nombre: { $regex: filtros.nombre, $options: 'i' } },
        { email: { $regex: filtros.nombre, $options: 'i' } }
      ];
    }

    // Filtro por categoría
    if (filtros.categoria) {
      query.categoria = filtros.categoria;
    }

    // Filtro por plan
    if (filtros.plan) {
      query.plan = filtros.plan;
    }

    // Filtro por estado de facturación
    if (filtros.estadoFacturacion) {
      query['facturacion.estado'] = filtros.estadoFacturacion;
    }

    // Filtro por conexión WhatsApp
    if (filtros.conWhatsApp !== undefined) {
      query.phoneNumberId = filtros.conWhatsApp ? { $exists: true, $ne: null } : { $exists: false };
    }

    const empresas = await EmpresaModel.find(query).sort({ createdAt: -1 });

    // Aplicar filtros adicionales que requieren cálculos
    let empresasFiltradas = empresas;

    if (filtros.sinUso) {
      empresasFiltradas = empresasFiltradas.filter(e => e.uso?.mensajesEsteMes === 0);
    }

    if (filtros.cercaLimite) {
      empresasFiltradas = empresasFiltradas.filter(e => {
        const uso = e.uso?.mensajesEsteMes || 0;
        const limite = e.limites?.mensajesMensuales || 1;
        return (uso / limite) > 0.8;
      });
    }

    // Calcular métricas para cada empresa
    const empresasConMetricas = empresasFiltradas.map(empresa => {
      const uso = empresa.uso?.mensajesEsteMes || 0;
      const limite = empresa.limites?.mensajesMensuales || 1;
      const porcentajeUso = ((uso / limite) * 100).toFixed(1);

      const usuariosActivos = empresa.uso?.usuariosActivos || 0;
      const limiteUsuarios = empresa.limites?.usuariosActivos || 1;
      const porcentajeUsuarios = ((usuariosActivos / limiteUsuarios) * 100).toFixed(1);

      return {
        id: empresa._id,
        nombre: empresa.nombre,
        email: empresa.email,
        telefono: empresa.telefono,
        categoria: empresa.categoria,
        plan: empresa.plan,
        estadoFacturacion: empresa.facturacion?.estado,
        mensajesEsteMes: uso,
        limitesMensajes: limite,
        porcentajeUso: `${porcentajeUso}%`,
        usuariosActivos,
        limiteUsuarios,
        porcentajeUsuarios: `${porcentajeUsuarios}%`,
        whatsappConectado: !!empresa.phoneNumberId,
        fechaCreacion: (empresa as any).createdAt,
        ultimoPago: empresa.facturacion?.ultimoPago,
        proximoPago: empresa.facturacion?.proximoPago
      };
    });

    return {
      success: true,
      total: empresasConMetricas.length,
      empresas: empresasConMetricas
    };
  } catch (error) {
    console.error('❌ Error al obtener empresas:', error);
    return {
      success: false,
      message: 'Error al obtener empresas'
    };
  }
}

/**
 * Obtiene detalle completo de una empresa con métricas
 */
export async function obtenerDetalleEmpresa(empresaId: string) {
  try {
    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    
    if (!empresa) {
      return {
        success: false,
        message: 'Empresa no encontrada'
      };
    }

    // Obtener usuarios (clientes) de la empresa
    const usuarios = await UsuarioModel.find({ empresaId });
    
    // Obtener usuarios de empresa (staff)
    const staff = await UsuarioEmpresaModel.find({ empresaId });

    // Calcular métricas
    const uso = empresa.uso?.mensajesEsteMes || 0;
    const limite = empresa.limites?.mensajesMensuales || 1;
    const porcentajeUso = ((uso / limite) * 100).toFixed(1);

    const usuariosActivos = empresa.uso?.usuariosActivos || 0;
    const limiteUsuarios = empresa.limites?.usuariosActivos || 1;
    const porcentajeUsuarios = ((usuariosActivos / limiteUsuarios) * 100).toFixed(1);

    // Alertas
    const alertas = [];
    if (uso === 0) {
      alertas.push({ tipo: 'info', mensaje: 'La empresa aún no tiene uso' });
    }
    if (uso / limite > 0.8) {
      alertas.push({ tipo: 'warning', mensaje: 'Cerca del límite de mensajes mensuales' });
    }
    if (empresa.facturacion?.estado === 'suspendido') {
      alertas.push({ tipo: 'error', mensaje: 'Facturación suspendida' });
    }
    if (!empresa.phoneNumberId) {
      alertas.push({ tipo: 'warning', mensaje: 'WhatsApp no conectado' });
    }

    return {
      success: true,
      empresa: {
        // Datos base
        id: empresa._id,
        nombre: empresa.nombre,
        categoria: empresa.categoria,
        email: empresa.email,
        telefono: empresa.telefono,
        modelo: empresa.modelo,
        prompt: empresa.prompt,
        saludos: empresa.saludos,
        
        // Plan y módulos
        plan: empresa.plan,
        modulos: empresa.modulos,
        
        // Límites y uso
        limites: empresa.limites,
        uso: empresa.uso,
        
        // Métricas derivadas
        metricas: {
          porcentajeUsoMensajes: `${porcentajeUso}%`,
          porcentajeUsoUsuarios: `${porcentajeUsuarios}%`,
          totalClientes: usuarios.length,
          totalStaff: staff.length,
          whatsappConectado: !!empresa.phoneNumberId
        },
        
        // Facturación
        facturacion: empresa.facturacion,
        
        // Alertas
        alertas,
        
        // Fechas
        fechaCreacion: (empresa as any).createdAt,
        fechaActualizacion: (empresa as any).updatedAt
      }
    };
  } catch (error) {
    console.error('❌ Error al obtener detalle de empresa:', error);
    return {
      success: false,
      message: 'Error al obtener detalle de empresa'
    };
  }
}

/**
 * Crea un usuario admin para una empresa
 */
export async function crearUsuarioAdmin(empresaId: string, data: {
  username: string;
  password: string;
  email: string;
  nombre: string;
  apellido?: string;
}) {
  try {
    const { username, password, email, nombre, apellido } = data;

    // Verificar que la empresa existe
    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    if (!empresa) {
      return {
        success: false,
        message: 'Empresa no encontrada'
      };
    }

    // Verificar que el username no existe
    const usuarioExistente = await UsuarioEmpresaModel.findOne({ 
      username: username.toLowerCase() 
    });
    if (usuarioExistente) {
      return {
        success: false,
        message: 'El nombre de usuario ya existe'
      };
    }

    // Crear usuario admin
    const nuevoUsuario = new UsuarioEmpresaModel({
      username: username.toLowerCase(),
      password,
      email,
      nombre,
      apellido,
      empresaId,
      rol: 'admin',
      permisos: ['all'],
      activo: true,
      createdBy: 'super_admin'
    });

    await nuevoUsuario.save();

    console.log('✅ Usuario admin creado por SuperAdmin:', username);

    return {
      success: true,
      message: 'Usuario admin creado exitosamente',
      usuario: {
        id: nuevoUsuario._id,
        username: nuevoUsuario.username,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol
      }
    };
  } catch (error) {
    console.error('❌ Error al crear usuario admin:', error);
    return {
      success: false,
      message: 'Error al crear usuario admin'
    };
  }
}

/**
 * Elimina una empresa y todos sus datos relacionados
 */
export async function eliminarEmpresa(empresaId: string) {
  try {
    // Verificar que la empresa existe
    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    if (!empresa) {
      return {
        success: false,
        message: 'Empresa no encontrada'
      };
    }

    console.log('🗑️ Eliminando empresa:', empresaId);

    // Eliminar todos los usuarios de la empresa
    await UsuarioEmpresaModel.deleteMany({ empresaId });
    console.log('   ✅ Usuarios eliminados');

    // Eliminar todos los usuarios del modelo antiguo
    await UsuarioModel.deleteMany({ empresaId });
    console.log('   ✅ Usuarios (modelo antiguo) eliminados');

    // Eliminar la empresa
    await EmpresaModel.deleteOne({ nombre: empresaId });
    console.log('   ✅ Empresa eliminada');

    return {
      success: true,
      message: 'Empresa eliminada exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al eliminar empresa:', error);
    return {
      success: false,
      message: 'Error al eliminar empresa'
    };
  }
}
