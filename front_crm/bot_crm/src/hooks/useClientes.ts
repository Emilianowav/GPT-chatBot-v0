// 👤 Hook de Clientes
'use client';

import { useState, useEffect, useCallback } from 'react';
import * as clientesApi from '@/lib/clientesApi';

export function useClientes(soloActivos: boolean = false) {
  const [clientes, setClientes] = useState<clientesApi.Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarClientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientesApi.obtenerClientes(soloActivos);
      setClientes(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
    }
  }, [soloActivos]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const crearCliente = useCallback(async (data: clientesApi.CrearClienteData) => {
    try {
      setLoading(true);
      setError(null);
      await clientesApi.crearCliente(data);
      await cargarClientes();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cargarClientes]);

  const actualizarCliente = useCallback(async (
    clienteId: string,
    data: Partial<clientesApi.CrearClienteData>
  ) => {
    try {
      setLoading(true);
      setError(null);
      await clientesApi.actualizarCliente(clienteId, data);
      await cargarClientes();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cargarClientes]);

  const eliminarCliente = useCallback(async (clienteId: string) => {
    try {
      setLoading(true);
      setError(null);
      await clientesApi.eliminarCliente(clienteId);
      await cargarClientes();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cargarClientes]);

  return {
    clientes,
    loading,
    error,
    recargar: cargarClientes,
    crearCliente,
    actualizarCliente,
    eliminarCliente
  };
}

export function useCliente(clienteId: string | null) {
  const [cliente, setCliente] = useState<clientesApi.Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarCliente = useCallback(async () => {
    if (!clienteId) {
      setCliente(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await clientesApi.obtenerClientePorId(clienteId);
      setCliente(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error al cargar cliente:', err);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    cargarCliente();
  }, [cargarCliente]);

  return {
    cliente,
    loading,
    error,
    recargar: cargarCliente
  };
}

export function useBuscarClientes() {
  const [clientes, setClientes] = useState<clientesApi.Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async (termino: string) => {
    if (!termino || termino.trim().length < 2) {
      setClientes([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await clientesApi.buscarClientes(termino);
      setClientes(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error al buscar clientes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const limpiar = useCallback(() => {
    setClientes([]);
    setError(null);
  }, []);

  return {
    clientes,
    loading,
    error,
    buscar,
    limpiar
  };
}
