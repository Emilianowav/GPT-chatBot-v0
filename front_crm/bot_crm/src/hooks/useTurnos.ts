// 📋 Hook para gestión de turnos
'use client';

import { useState, useEffect, useCallback } from 'react';
import * as calendarApi from '@/lib/calendarApi';

export function useTurnos() {
  const [turnos, setTurnos] = useState<calendarApi.Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarTurnos = useCallback(async (filtros?: {
    agenteId?: string;
    clienteId?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await calendarApi.obtenerTurnos(filtros);
      setTurnos(response.turnos || []);
    } catch (err: any) {
      setError(err.message);
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarTurnosDelDia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await calendarApi.obtenerTurnosDelDia();
      setTurnos(response.turnos || []);
    } catch (err: any) {
      setError(err.message);
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearTurno = useCallback(async (data: calendarApi.CrearTurnoData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await calendarApi.crearTurno(data);
      // Recargar turnos después de crear
      await cargarTurnos();
      return response.turno;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cargarTurnos]);

  const cancelarTurno = useCallback(async (turnoId: string, motivo: string) => {
    try {
      setLoading(true);
      setError(null);
      await calendarApi.cancelarTurno(turnoId, motivo);
      // Recargar turnos después de cancelar
      await cargarTurnos();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cargarTurnos]);

  const actualizarEstado = useCallback(async (
    turnoId: string,
    estado: string,
    motivoCancelacion?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      await calendarApi.actualizarEstadoTurno(turnoId, estado, motivoCancelacion);
      // Recargar turnos después de actualizar
      await cargarTurnos();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cargarTurnos]);

  return {
    turnos,
    loading,
    error,
    cargarTurnos,
    cargarTurnosDelDia,
    crearTurno,
    cancelarTurno,
    actualizarEstado
  };
}

export function useEstadisticas() {
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarEstadisticas = useCallback(async (
    fechaDesde?: string,
    fechaHasta?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await calendarApi.obtenerEstadisticas(fechaDesde, fechaHasta);
      setEstadisticas(response.estadisticas);
    } catch (err: any) {
      setError(err.message);
      setEstadisticas(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  return {
    estadisticas,
    loading,
    error,
    recargar: cargarEstadisticas
  };
}
