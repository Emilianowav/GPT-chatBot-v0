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
    const empresaNombre = localStorage.getItem('empresa_nombre');

    if (token && empresaId && empresaNombre) {
      setEmpresa({ empresaId, empresaNombre, token });
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
        empresaNombre: response.user.empresaNombre,
        token: response.token,
      };

      setEmpresa(authData);
      apiClient.setToken(response.token);
      
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('empresa_id', response.user.empresaId);
      localStorage.setItem('empresa_nombre', response.user.empresaNombre);
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
    localStorage.removeItem('empresa_nombre');
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
