// 🤖 Hook para configuración del bot
import { useState, useEffect } from 'react';
import * as botApi from '@/lib/botApi';

export function useConfiguracionBot(empresaId: string) {
  const [configuracion, setConfiguracion] = useState<botApi.ConfiguracionBot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    cargarConfiguracion();
  }, [empresaId]);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await botApi.obtenerConfiguracionBot(empresaId);
      setConfiguracion(config);
    } catch (err: any) {
      setError(err.message);
      console.error('Error cargando configuración del bot:', err);
    } finally {
      setLoading(false);
    }
  };

  const actualizarConfiguracion = async (datos: Partial<botApi.ConfiguracionBot>) => {
    try {
      setError(null);
      const configActualizada = await botApi.actualizarConfiguracionBot(empresaId, datos);
      setConfiguracion(configActualizada);
      return configActualizada;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const toggleBot = async (activo: boolean) => {
    try {
      setError(null);
      await botApi.toggleBot(empresaId, activo);
      if (configuracion) {
        setConfiguracion({ ...configuracion, activo });
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    configuracion,
    loading,
    error,
    cargarConfiguracion,
    actualizarConfiguracion,
    toggleBot
  };
}
