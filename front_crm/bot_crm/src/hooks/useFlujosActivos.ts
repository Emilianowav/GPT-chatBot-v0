// 🔄 Hook para gestionar flujos activos
'use client';

import { useState, useEffect, useCallback } from 'react';
import * as flowsApi from '@/lib/flowsApi';

export function useFlujosActivos(empresaId: string, autoRefresh = true) {
  const [flujos, setFlujos] = useState<flowsApi.FlujoActivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarFlujos = useCallback(async () => {
    if (!empresaId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await flowsApi.obtenerFlujosActivos(empresaId);
      setFlujos(data);
    } catch (err: any) {
      console.error('Error cargando flujos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  const pausarFlujo = async (telefono: string) => {
    try {
      await flowsApi.pausarFlujo(empresaId, telefono);
      await cargarFlujos(); // Recargar lista
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const reanudarFlujo = async (telefono: string) => {
    try {
      await flowsApi.reanudarFlujo(empresaId, telefono);
      await cargarFlujos(); // Recargar lista
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const cancelarFlujo = async (telefono: string) => {
    try {
      await flowsApi.cancelarFlujo(empresaId, telefono);
      await cargarFlujos(); // Recargar lista
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  useEffect(() => {
    cargarFlujos();

    // Auto-refresh cada 10 segundos si está habilitado
    if (autoRefresh) {
      const interval = setInterval(cargarFlujos, 10000);
      return () => clearInterval(interval);
    }
  }, [cargarFlujos, autoRefresh]);

  return {
    flujos,
    loading,
    error,
    cargarFlujos,
    pausarFlujo,
    reanudarFlujo,
    cancelarFlujo
  };
}
