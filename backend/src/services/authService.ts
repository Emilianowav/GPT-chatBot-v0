// 🔐 Servicio de Autenticación
import jwt from 'jsonwebtoken';
import { AdminUserModel } from '../models/AdminUser.js';
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

    // Buscar usuario
    const user = await AdminUserModel.findOne({ 
      username: username.toLowerCase(),
      activo: true 
    });

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

    // Generar token
    const payload: TokenPayload = {
      userId: user._id.toString(),
      username: user.username,
      empresaId: user.empresaId,
      role: user.role
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
        empresaNombre: empresa.nombre,
        role: user.role,
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
