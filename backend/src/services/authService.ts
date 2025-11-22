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
    empresaMongoId?: string; // ID de MongoDB de la empresa
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

    // Buscar empresa
    const empresa = await EmpresaModel.findOne({ nombre: user.empresaId });
    if (!empresa) {
      console.log('⚠️ Empresa no encontrada:', user.empresaId);
      return {
        success: false,
        message: 'Empresa no encontrada'
      };
    }

    // Actualizar último acceso
    user.ultimoAcceso = new Date();
    await user.save();

    // Generar token (mantener nombre en empresaId para compatibilidad)
    const payload: TokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      empresaId: user.empresaId, // Mantener nombre para compatibilidad con sistema existente
      role: (user as any).rol || (user as any).role // Compatibilidad con ambos modelos
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    console.log('✅ Login exitoso:', { username, empresaId: user.empresaId, empresaMongoId: empresa._id.toString(), empresaNombre: empresa.nombre });

    return {
      success: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        empresaId: user.empresaId, // Nombre de la empresa (para compatibilidad)
        empresaMongoId: empresa._id.toString(), // ✅ ID de MongoDB (para módulo de integraciones)
        empresaNombre: empresa.nombre,
        role: (user as any).rol || (user as any).role,
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
  role: 'admin' | 'viewer' = 'viewer',
  email?: string
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Verificar que la empresa existe
    const empresa = await EmpresaModel.findOne({ nombre: empresaId });
    if (!empresa) {
      return {
        success: false,
        message: 'Empresa no encontrada'
      };
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
    const newUser = new AdminUserModel({
      username: username.toLowerCase(),
      password,
      empresaId,
      role,
      email,
      activo: true
    });

    await newUser.save();

    console.log('✅ Usuario administrador creado:', { username, empresaId, role });

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
 * Genera un token de recuperación de contraseña
 */
export async function generatePasswordResetToken(email: string): Promise<{ success: boolean; message: string; resetToken?: string }> {
  try {
    // Buscar usuario por email
    const user = await AdminUserModel.findOne({ 
      email: email.toLowerCase(),
      activo: true 
    });

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return {
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación'
      };
    }

    // Generar token temporal (válido por 1 hora)
    const resetToken = jwt.sign(
      { 
        userId: user._id.toString(),
        type: 'password_reset',
        timestamp: Date.now()
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('🔑 Token de recuperación generado para:', { email, username: user.username });

    return {
      success: true,
      message: 'Token de recuperación generado',
      resetToken
    };
  } catch (error) {
    console.error('❌ Error al generar token de recuperación:', error);
    return {
      success: false,
      message: 'Error en el servidor'
    };
  }
}

/**
 * Resetea la contraseña usando un token de recuperación
 */
export async function resetPasswordWithToken(
  resetToken: string, 
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Verificar token
    const decoded = jwt.verify(resetToken, JWT_SECRET) as any;
    
    if (decoded.type !== 'password_reset') {
      return {
        success: false,
        message: 'Token inválido'
      };
    }

    // Verificar que el token no sea muy antiguo (máximo 1 hora)
    const tokenAge = Date.now() - decoded.timestamp;
    if (tokenAge > 3600000) { // 1 hora en milisegundos
      return {
        success: false,
        message: 'Token expirado'
      };
    }

    // Buscar usuario
    const user = await AdminUserModel.findById(decoded.userId);
    if (!user || !user.activo) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }

    // Actualizar contraseña
    user.password = newPassword; // El pre-save hook se encargará del hash
    user.updatedAt = new Date();
    await user.save();

    console.log('✅ Contraseña reseteada para:', { username: user.username, email: user.email });

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente'
    };
  } catch (error) {
    console.error('❌ Error al resetear contraseña:', error);
    return {
      success: false,
      message: 'Token inválido o expirado'
    };
  }
}
