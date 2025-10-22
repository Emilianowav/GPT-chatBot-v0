// 📅 Hook para gestión de disponibilidad
'use client';

import { useState, useCallback } from 'react';
import * as calendarApi from '@/lib/calendarApi';

export function useDisponibilidad() {
  const [slots, setSlots] = useState<calendarApi.Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarSlots = useCallback(async (
    agenteId: string,
    fecha: string,
    duracion?: number
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await calendarApi.obtenerSlotsDisponibles(agenteId, fecha, duracion);
      setSlots(response.slots || []);
    } catch (err: any) {
      setError(err.message);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const verificarDisponibilidad = useCallback(async (
    agenteId: string,
    fechaInicio: string,
    duracion: number
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await calendarApi.verificarDisponibilidad(agenteId, fechaInicio, duracion);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    slots,
    loading,
    error,
    cargarSlots,
    verificarDisponibilidad
  };
}
