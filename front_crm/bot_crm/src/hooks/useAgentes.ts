// 👨‍⚕️ Hook para gestión de agentes
'use client';

import { useState, useEffect, useCallback } from 'react';
import * as calendarApi from '@/lib/calendarApi';

export function useAgentes(soloActivos: boolean = false) {
  const [agentes, setAgentes] = useState<calendarApi.Agente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarAgentes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await calendarApi.obtenerAgentes(soloActivos);
      setAgentes(response.agentes || []);
    } catch (err: any) {
      setError(err.message);
      setAgentes([]);
    } finally {
      setLoading(false);
    }
  }, [soloActivos]);

  useEffect(() => {
    cargarAgentes();
  }, [cargarAgentes]);

  const crearAgente = useCallback(async (data: calendarApi.CrearAgenteData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await calendarApi.crearAgente(data);
      await cargarAgentes();
      return response.agente;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cargarAgentes]);

  const actualizarAgente = useCallback(async (
    agenteId: string,
    data: Partial<calendarApi.CrearAgenteData>
  ) => {
    try {
      setLoading(true);
      setError(null);
      await calendarApi.actualizarAgente(agenteId, data);
      await cargarAgentes();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cargarAgentes]);

  const configurarDisponibilidad = useCallback(async (
    agenteId: string,
    disponibilidad: calendarApi.Disponibilidad[]
  ) => {
    try {
      setLoading(true);
      setError(null);
      await calendarApi.configurarDisponibilidad(agenteId, disponibilidad);
      await cargarAgentes();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cargarAgentes]);

  const eliminarAgente = useCallback(async (agenteId: string) => {
    try {
      setLoading(true);
      setError(null);
      await calendarApi.eliminarAgente(agenteId);
      await cargarAgentes();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cargarAgentes]);

  return {
    agentes,
    loading,
    error,
    recargar: cargarAgentes,
    crearAgente,
    actualizarAgente,
    configurarDisponibilidad,
    eliminarAgente
  };
}

export function useAgente(agenteId: string | null) {
  const [agente, setAgente] = useState<calendarApi.Agente | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarAgente = useCallback(async () => {
    if (!agenteId) {
      setAgente(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await calendarApi.obtenerAgentePorId(agenteId);
      setAgente(response.agente);
    } catch (err: any) {
      setError(err.message);
      setAgente(null);
    } finally {
      setLoading(false);
    }
  }, [agenteId]);

  useEffect(() => {
    cargarAgente();
  }, [cargarAgente]);

  return {
    agente,
    loading,
    error,
    recargar: cargarAgente
  };
}
