// ⚙️ Hook de Configuración del Módulo
'use client';

import { useState, useEffect, useCallback } from 'react';
import * as configuracionApi from '@/lib/configuracionApi';

export function useConfiguracion(empresaId: string | null) {
  const [configuracion, setConfiguracion] = useState<configuracionApi.ConfiguracionModulo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarConfiguracion = useCallback(async () => {
    if (!empresaId) {
      setConfiguracion(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await configuracionApi.obtenerConfiguracion(empresaId);
      setConfiguracion(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error al cargar configuración:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  const guardarConfiguracion = useCallback(async (
    datos: Partial<configuracionApi.ConfiguracionModulo>
  ) => {
    if (!empresaId) {
      throw new Error('No hay empresa seleccionada');
    }

    try {
      setLoading(true);
      setError(null);
      const data = await configuracionApi.guardarConfiguracion(empresaId, datos);
      setConfiguracion(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  return {
    configuracion,
    loading,
    error,
    recargar: cargarConfiguracion,
    guardarConfiguracion
  };
}

export function usePlantillas() {
  const [plantillas, setPlantillas] = useState<Record<string, configuracionApi.PlantillaConfiguracion> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarPlantillas = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await configuracionApi.obtenerPlantillas();
        setPlantillas(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Error al cargar plantillas:', err);
      } finally {
        setLoading(false);
      }
    };

    cargarPlantillas();
  }, []);

  return {
    plantillas,
    loading,
    error
  };
}
