// 👥 Servicio de Gestión de Usuarios de Empresa
import { UsuarioEmpresaModel, type RolUsuario, type IUsuarioEmpresa } from '../models/UsuarioEmpresa.js';
import { EmpresaModel } from '../models/Empresa.js';

export interface CreateUsuarioInput {
  username: string;
  password: string;
  email: string;
  nombre: string;
  apellido?: string;
  empresaId: string;
  rol: RolUsuario;
  permisos?: string[];
  telefono?: string;
  createdBy: string;
}

export interface UpdateUsuarioInput {
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: RolUsuario;
  permisos?: string[];
  telefono?: string;
  activo?: boolean;
  avatar?: string;
}

/**
 * Crea un nuevo usuario de empresa
 */
export async function crearUsuario(data: CreateUsuarioInput) {
  try {
    // Verificar que la empresa existe
    const empresa = await EmpresaModel.findOne({ nombre: data.empresaId });
    if (!empresa) {
      return {
        success: false,
        message: 'Empresa no encontrada'
      };
    }

    // Verificar límites del plan
    const usuariosActuales = await UsuarioEmpresaModel.countDocuments({
      empresaId: data.empresaId,
      activo: true
    });

    if (usuariosActuales >= (empresa.limites?.maxUsuarios || 5)) {
      return {
        success: false,
        message: `Límite de usuarios alcanzado (${empresa.limites?.maxUsuarios || 5} usuarios). Actualiza tu plan para agregar más usuarios.`
      };
    }

    // Si es admin, verificar límite de admins
    if (data.rol === 'admin') {
      const adminsActuales = await UsuarioEmpresaModel.countDocuments({
        empresaId: data.empresaId,
        rol: 'admin',
        activo: true
      });

      if (adminsActuales >= (empresa.limites?.maxAdmins || 1)) {
        return {
          success: false,
          message: `Límite de administradores alcanzado (${empresa.limites?.maxAdmins || 1}). Actualiza tu plan para agregar más administradores.`
        };
      }
    }

    // Verificar que el username no existe
    const existingUser = await UsuarioEmpresaModel.findOne({ 
      username: data.username.toLowerCase() 
    });
    if (existingUser) {
      return {
        success: false,
        message: 'El nombre de usuario ya existe'
      };
    }

    // Verificar que el email no existe en la empresa
    const existingEmail = await UsuarioEmpresaModel.findOne({ 
      email: data.email.toLowerCase(),
      empresaId: data.empresaId
    });
    if (existingEmail) {
      return {
        success: false,
        message: 'El email ya está registrado en esta empresa'
      };
    }

    // Crear usuario
    const nuevoUsuario = new UsuarioEmpresaModel({
      username: data.username.toLowerCase(),
      password: data.password,
      email: data.email.toLowerCase(),
      nombre: data.nombre,
      apellido: data.apellido,
      empresaId: data.empresaId,
      rol: data.rol,
      permisos: data.permisos || getPermisosDefault(data.rol),
      telefono: data.telefono,
      activo: true,
      createdBy: data.createdBy
    });

    await nuevoUsuario.save();

    console.log('✅ Usuario de empresa creado:', { 
      username: data.username, 
      empresaId: data.empresaId, 
      rol: data.rol 
    });

    return {
      success: true,
      message: 'Usuario creado exitosamente',
      usuario: {
        id: nuevoUsuario._id.toString(),
        username: nuevoUsuario.username,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
        rol: nuevoUsuario.rol,
        permisos: nuevoUsuario.permisos,
        activo: nuevoUsuario.activo
      }
    };
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    return {
      success: false,
      message: 'Error al crear usuario'
    };
  }
}

/**
 * Obtiene todos los usuarios de una empresa
 */
export async function obtenerUsuarios(empresaId: string, incluirInactivos: boolean = false) {
  try {
    const filtro: any = { empresaId };
    if (!incluirInactivos) {
      filtro.activo = true;
    }

    const usuarios = await UsuarioEmpresaModel.find(filtro)
      .select('-password')
      .sort({ createdAt: -1 });

    return {
      success: true,
      usuarios: usuarios.map(u => ({
        id: u._id.toString(),
        username: u.username,
        email: u.email,
        nombre: u.nombre,
        apellido: u.apellido,
        rol: u.rol,
        permisos: u.permisos,
        activo: u.activo,
        avatar: u.avatar,
        telefono: u.telefono,
        ultimoAcceso: u.ultimoAcceso,
        createdAt: u.createdAt
      }))
    };
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    return {
      success: false,
      message: 'Error al obtener usuarios',
      usuarios: []
    };
  }
}

/**
 * Obtiene un usuario por ID
 */
export async function obtenerUsuarioPorId(usuarioId: string) {
  try {
    const usuario = await UsuarioEmpresaModel.findById(usuarioId).select('-password');
    
    if (!usuario) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }

    return {
      success: true,
      usuario: {
        id: usuario._id.toString(),
        username: usuario.username,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        empresaId: usuario.empresaId,
        rol: usuario.rol,
        permisos: usuario.permisos,
        activo: usuario.activo,
        avatar: usuario.avatar,
        telefono: usuario.telefono,
        ultimoAcceso: usuario.ultimoAcceso,
        createdAt: usuario.createdAt
      }
    };
  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    return {
      success: false,
      message: 'Error al obtener usuario'
    };
  }
}

/**
 * Actualiza un usuario
 */
export async function actualizarUsuario(usuarioId: string, data: UpdateUsuarioInput, updatedBy: string) {
  try {
    const usuario = await UsuarioEmpresaModel.findById(usuarioId);
    
    if (!usuario) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }

    // Si se está cambiando el rol a admin, verificar límite
    if (data.rol === 'admin' && usuario.rol !== 'admin') {
      const empresa = await EmpresaModel.findOne({ nombre: usuario.empresaId });
      const adminsActuales = await UsuarioEmpresaModel.countDocuments({
        empresaId: usuario.empresaId,
        rol: 'admin',
        activo: true
      });

      if (adminsActuales >= (empresa?.limites?.maxAdmins || 1)) {
        return {
          success: false,
          message: `Límite de administradores alcanzado (${empresa?.limites?.maxAdmins || 1})`
        };
      }
    }

    // Actualizar campos
    if (data.nombre) usuario.nombre = data.nombre;
    if (data.apellido !== undefined) usuario.apellido = data.apellido;
    if (data.email) usuario.email = data.email.toLowerCase();
    if (data.rol) usuario.rol = data.rol;
    if (data.permisos) usuario.permisos = data.permisos;
    if (data.telefono !== undefined) usuario.telefono = data.telefono;
    if (data.activo !== undefined) usuario.activo = data.activo;
    if (data.avatar !== undefined) usuario.avatar = data.avatar;

    await usuario.save();

    console.log('✅ Usuario actualizado:', { usuarioId, updatedBy });

    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
      usuario: {
        id: usuario._id.toString(),
        username: usuario.username,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        permisos: usuario.permisos,
        activo: usuario.activo
      }
    };
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    return {
      success: false,
      message: 'Error al actualizar usuario'
    };
  }
}

/**
 * Elimina (desactiva) un usuario
 */
export async function eliminarUsuario(usuarioId: string, deletedBy: string) {
  try {
    const usuario = await UsuarioEmpresaModel.findById(usuarioId);
    
    if (!usuario) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }

    usuario.activo = false;
    await usuario.save();

    console.log('✅ Usuario desactivado:', { usuarioId, deletedBy });

    return {
      success: true,
      message: 'Usuario desactivado exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    return {
      success: false,
      message: 'Error al eliminar usuario'
    };
  }
}

/**
 * Cambia la contraseña de un usuario
 */
export async function cambiarPassword(usuarioId: string, nuevaPassword: string) {
  try {
    const usuario = await UsuarioEmpresaModel.findById(usuarioId);
    
    if (!usuario) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }

    usuario.password = nuevaPassword;
    await usuario.save();

    console.log('✅ Contraseña actualizada:', { usuarioId });

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    return {
      success: false,
      message: 'Error al cambiar contraseña'
    };
  }
}

/**
 * Obtiene estadísticas de usuarios de una empresa
 */
export async function obtenerEstadisticas(empresaId: string) {
  try {
    const [total, activos, porRol, empresa] = await Promise.all([
      UsuarioEmpresaModel.countDocuments({ empresaId }),
      UsuarioEmpresaModel.countDocuments({ empresaId, activo: true }),
      UsuarioEmpresaModel.aggregate([
        { $match: { empresaId, activo: true } },
        { $group: { _id: '$rol', count: { $sum: 1 } } }
      ]),
      EmpresaModel.findOne({ nombre: empresaId })
    ]);

    const rolesCounts = {
      admin: 0,
      manager: 0,
      agent: 0,
      viewer: 0
    };

    porRol.forEach((item: any) => {
      rolesCounts[item._id as keyof typeof rolesCounts] = item.count;
    });

    return {
      success: true,
      estadisticas: {
        total,
        activos,
        inactivos: total - activos,
        porRol: rolesCounts,
        limites: {
          maxUsuarios: empresa?.limites?.maxUsuarios || 5,
          maxAdmins: empresa?.limites?.maxAdmins || 1
        },
        disponibles: {
          usuarios: (empresa?.limites?.maxUsuarios || 5) - activos,
          admins: (empresa?.limites?.maxAdmins || 1) - rolesCounts.admin
        }
      }
    };
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    return {
      success: false,
      message: 'Error al obtener estadísticas'
    };
  }
}

/**
 * Obtiene permisos por defecto según el rol
 */
function getPermisosDefault(rol: RolUsuario): string[] {
  const permisos: Record<RolUsuario, string[]> = {
    admin: [
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
    manager: [
      'usuarios.ver',
      'configuracion.ver',
      'reportes.ver',
      'reportes.exportar',
      'calendario.crear',
      'calendario.editar',
      'calendario.ver'
    ],
    agent: [
      'calendario.crear',
      'calendario.editar',
      'calendario.ver',
      'reportes.ver'
    ],
    viewer: [
      'calendario.ver',
      'reportes.ver'
    ]
  };

  return permisos[rol] || [];
}

export { getPermisosDefault };
