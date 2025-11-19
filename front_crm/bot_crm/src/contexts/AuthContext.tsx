'use client';

// 🔐 Contexto de Autenticación
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import type { EmpresaAuth } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  empresa: EmpresaAuth | null;
  login: (empresaId: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<EmpresaAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada
    const token = localStorage.getItem('auth_token');
    const empresaId = localStorage.getItem('empresa_id');
    const empresaMongoId = localStorage.getItem('empresa_mongo_id');
    const empresaNombre = localStorage.getItem('empresa_nombre');
    const role = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');

    if (token && empresaId && empresaNombre) {
      setEmpresa({ 
        empresaId, 
        empresaMongoId: empresaMongoId || undefined,
        empresaNombre, 
        token, 
        role: role || undefined, 
        username: username || undefined 
      });
      apiClient.setToken(token);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.login(username, password);
      
      if (!response.success) {
        throw new Error(response.message || 'Error al iniciar sesión');
      }

      const authData: EmpresaAuth = {
        empresaId: response.user.empresaId,
        empresaMongoId: response.user.empresaMongoId,
        empresaNombre: response.user.empresaNombre,
        token: response.token,
        role: response.user.role,
        username: response.user.username,
      };

      setEmpresa(authData);
      apiClient.setToken(response.token);
      
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('empresa_id', response.user.empresaId);
      localStorage.setItem('empresa_mongo_id', response.user.empresaMongoId || '');
      localStorage.setItem('empresa_nombre', response.user.empresaNombre);
      localStorage.setItem('user_role', response.user.role || '');
      localStorage.setItem('username', response.user.username || '');
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    setEmpresa(null);
    apiClient.clearToken();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('empresa_id');
    localStorage.removeItem('empresa_mongo_id');
    localStorage.removeItem('empresa_nombre');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!empresa,
        empresa,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}
