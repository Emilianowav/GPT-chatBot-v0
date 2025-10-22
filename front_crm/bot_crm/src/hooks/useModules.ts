// 📦 Hook para gestión de módulos
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Modulo } from '@/types/modules';

export function useModules() {
  const { empresa } = useAuth();
  const [modules, setModules] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (empresa) {
      // Por ahora, obtenemos los módulos del contexto de auth
      // Más adelante haremos una llamada a la API
      loadModules();
    }
  }, [empresa]);

  const loadModules = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Hacer llamada a API cuando esté implementada
      // const response = await apiClient.getModules(empresa.empresaId);
      // setModules(response.modulos);
      
      // Por ahora, usamos módulos mock o del localStorage
      const mockModules: Modulo[] = [
        {
          id: 'calendar_booking',
          nombre: 'Calendario de Turnos',
          descripcion: 'Sistema completo de gestión de turnos y reservas',
          version: '1.0.0',
          categoria: 'booking' as any,
          icono: '📅',
          activo: true,
          fechaActivacion: new Date(),
          precio: 39,
          planMinimo: 'standard' as any,
          dependencias: [],
          permisos: [
            'calendar:turnos:read',
            'calendar:turnos:write',
            'calendar:agentes:read',
            'calendar:agentes:write'
          ],
          configuracion: {
            duracionTurnoPorDefecto: 30,
            recordatorio24h: true,
            recordatorio1h: true
          },
          autor: 'Neural Team',
          documentacion: 'https://docs.neural-crm.com/modules/calendar',
          soporte: 'soporte@neural-crm.com'
        }
      ];
      
      setModules(mockModules);
    } catch (error) {
      console.error('Error al cargar módulos:', error);
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [empresa]);

  /**
   * Verifica si un módulo está activo
   */
  const hasModule = useCallback((moduleId: string): boolean => {
    return modules.some(m => m.id === moduleId && m.activo);
  }, [modules]);

  /**
   * Obtiene la configuración de un módulo
   */
  const getModuleConfig = useCallback((moduleId: string): any => {
    const module = modules.find(m => m.id === moduleId);
    return module?.configuracion || {};
  }, [modules]);

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = useCallback((permission: string): boolean => {
    return modules.some(m => 
      m.activo && m.permisos.includes(permission)
    );
  }, [modules]);

  /**
   * Obtiene todos los módulos activos
   */
  const getActiveModules = useCallback((): Modulo[] => {
    return modules.filter(m => m.activo);
  }, [modules]);

  /**
   * Obtiene un módulo por ID
   */
  const getModule = useCallback((moduleId: string): Modulo | undefined => {
    return modules.find(m => m.id === moduleId);
  }, [modules]);

  return {
    modules,
    loading,
    hasModule,
    getModuleConfig,
    hasPermission,
    getActiveModules,
    getModule,
    reload: loadModules
  };
}
