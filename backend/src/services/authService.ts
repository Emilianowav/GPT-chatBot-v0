// 🔐 Servicio de Autenticación
import jwt from 'jsonwebtoken';
import { AdminUserModel } from '../models/AdminUser.js';
import { UsuarioEmpresaModel } from '../models/UsuarioEmpresa.js';
import { EmpresaModel } from '../models/Empresa.js';

const JWT_SECRET = process.env.JWT_SECRET || 'neural_secret_key_change_in_production';
const JWT_EXPIRES_IN = '7d'; // Token válido por 7 días

export interface TokenPayload {
  userId: string;
  username: string;
  empresaId: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    empresaId: string;
    empresaNombre: string;
    role: string;
    email?: string;
  };
  message?: string;
}

/**
 * Autentica un usuario y genera un token JWT
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    console.log('🔐 Intento de login:', { username });

    // Buscar primero en UsuarioEmpresa (nuevo sistema)
    let user = await UsuarioEmpresaModel.findOne({ 
      username: username.toLowerCase(),
      activo: true 
    });

    // Si no se encuentra, buscar en AdminUser (sistema antiguo)
    if (!user) {
      const adminUser = await AdminUserModel.findOne({ 
        username: username.toLowerCase(),
        activo: true 
      });

      if (!adminUser) {
        console.log('❌ Usuario no encontrado:', username);
        return {
          success: false,
          message: 'Usuario o contraseña incorrectos'
        };
      }

      // Convertir AdminUser a formato compatible
      user = adminUser as any;
    }

    if (!user) {
      console.log('❌ Usuario no encontrado:', username);
      return {
        success: false,
        message: 'Usuario o contraseña incorrectos'
      };
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Contraseña incorrecta para:', username);
      return {
        success: false,
        message: 'Usuario o contraseña incorrectos'
      };
    }

    // Buscar empresa (excepto para super_admin)
    const userRole = (user as any).rol || (user as any).role;
    let empresaNombre = user.empresaId;
    
    if (userRole !== 'super_admin') {
      const empresa = await EmpresaModel.findOne({ nombre: user.empresaId });
      if (!empresa) {
        console.log('⚠️ Empresa no encontrada:', user.empresaId);
        return {
          success: false,
          message: 'Empresa no encontrada'
        };
      }
      empresaNombre = empresa.nombre;
    } else {
      empresaNombre = 'SUPER_ADMIN';
    }

    // Actualizar último acceso
    user.ultimoAcceso = new Date();
    await user.save();

    // Generar token
    const payload: TokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      empresaId: user.empresaId,
      role: (user as any).rol || (user as any).role // Compatibilidad con ambos modelos
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    console.log('✅ Login exitoso:', { username, empresaId: user.empresaId });

    return {
      success: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        empresaId: user.empresaId,
        empresaNombre: empresaNombre,
        role: userRole,
        email: user.email
      }
    };
  } catch (error) {
    console.error('❌ Error en login:', error);
    return {
      success: false,
      message: 'Error en el servidor'
    };
  }
}

/**
 * Verifica un token JWT
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('❌ Token inválido:', error);
    return null;
  }
}

/**
 * Crea un nuevo usuario administrador
 */
export async function createAdminUser(
  username: string,
  password: string,
  empresaId: string,
  role: 'admin' | 'viewer' | 'super_admin' = 'viewer',
  email?: string
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Para super_admin, no verificar empresa
    if (role !== 'super_admin') {
      // Verificar que la empresa existe
      const empresa = await EmpresaModel.findOne({ nombre: empresaId });
      if (!empresa) {
        return {
          success: false,
          message: 'Empresa no encontrada'
        };
      }
    }

    // Verificar que el username no existe
    const existingUser = await AdminUserModel.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return {
        success: false,
        message: 'El nombre de usuario ya existe'
      };
    }

    // Crear usuario
    const finalEmpresaId = role === 'super_admin' ? 'SUPER_ADMIN' : empresaId;
    
    const newUser = new AdminUserModel({
      username: username.toLowerCase(),
      password,
      empresaId: finalEmpresaId,
      role,
      email,
      activo: true
    });

    await newUser.save();

    console.log('✅ Usuario administrador creado:', { username, empresaId: finalEmpresaId, role });

    return {
      success: true,
      message: 'Usuario creado exitosamente',
      userId: newUser._id.toString()
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
 * Crea el usuario SuperAdmin inicial (solo si no existe)
 */
export async function createSuperAdminIfNotExists(): Promise<void> {
  try {
    // Verificar si ya existe un SuperAdmin válido en AdminUser
    const existingSuperAdmin = await AdminUserModel.findOne({ 
      username: 'superadmin',
      role: 'super_admin'
    });
    
    if (existingSuperAdmin) {
      console.log('✅ SuperAdmin ya existe');
      return;
    }

    // Limpiar cualquier usuario 'superadmin' en otras colecciones o con rol incorrecto
    await AdminUserModel.deleteMany({ username: 'superadmin' });
    await UsuarioEmpresaModel.deleteMany({ username: 'superadmin' });

    // Crear SuperAdmin
    const result = await createAdminUser(
      'superadmin',
      'admin123', // Contraseña por defecto
      'SUPER_ADMIN',
      'super_admin',
      'superadmin@momento.com'
    );

    if (result.success) {
      console.log('🎉 SuperAdmin creado exitosamente!');
      console.log('   Username: superadmin');
      console.log('   Password: admin123');
      console.log('   ⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    } else {
      console.error('❌ Error al crear SuperAdmin:', result.message);
    }
  } catch (error) {
    console.error('❌ Error al verificar/crear SuperAdmin:', error);
  }
}
