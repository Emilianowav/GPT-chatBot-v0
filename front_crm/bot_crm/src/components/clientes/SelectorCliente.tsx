// 👤 Selector de Cliente
'use client';

import { useState, useEffect, useRef } from 'react';
import { useBuscarClientes } from '@/hooks/useClientes';
import type { Cliente } from '@/lib/clientesApi';
import styles from './SelectorCliente.module.css';

interface SelectorClienteProps {
  onSelect: (cliente: Cliente) => void;
  clienteSeleccionado?: Cliente | null;
  placeholder?: string;
  required?: boolean;
}

export default function SelectorCliente({ 
  onSelect, 
  clienteSeleccionado,
  placeholder = 'Buscar cliente por nombre, teléfono o email...',
  required = false
}: SelectorClienteProps) {
  const [termino, setTermino] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const { clientes, loading, buscar, limpiar } = useBuscarClientes();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clienteSeleccionado) {
      setTermino(`${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`);
    }
  }, [clienteSeleccionado]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (termino.length >= 2) {
        buscar(termino);
        setMostrarResultados(true);
      } else {
        limpiar();
        setMostrarResultados(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [termino, buscar, limpiar]);

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (cliente: Cliente) => {
    onSelect(cliente);
    setTermino(`${cliente.nombre} ${cliente.apellido}`);
    setMostrarResultados(false);
  };

  const handleClear = () => {
    setTermino('');
    limpiar();
    onSelect(null as any);
  };

  const formatearTelefono = (telefono: string) => {
    if (telefono.startsWith('+549')) {
      const numero = telefono.substring(4);
      if (numero.length === 10) {
        return `+54 9 ${numero.substring(0, 2)} ${numero.substring(2, 6)}-${numero.substring(6)}`;
      }
    }
    return telefono;
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <svg 
          className={styles.searchIcon} 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        
        <input
          type="text"
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          onFocus={() => termino.length >= 2 && setMostrarResultados(true)}
          placeholder={placeholder}
          className={styles.input}
          required={required}
        />

        {termino && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}

        {loading && (
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
          </div>
        )}
      </div>

      {mostrarResultados && (
        <div className={styles.resultados}>
          {clientes.length === 0 && !loading && (
            <div className={styles.noResultados}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <p>No se encontraron clientes</p>
              <small>Intenta con otro término de búsqueda</small>
            </div>
          )}

          {clientes.map((cliente) => (
            <button
              key={cliente._id}
              type="button"
              onClick={() => handleSelect(cliente)}
              className={styles.resultado}
            >
              <div className={styles.resultadoAvatar}>
                {cliente.nombre.charAt(0)}{cliente.apellido.charAt(0)}
              </div>
              <div className={styles.resultadoInfo}>
                <div className={styles.resultadoNombre}>
                  {cliente.nombre} {cliente.apellido}
                </div>
                <div className={styles.resultadoDetalles}>
                  <span>{formatearTelefono(cliente.telefono)}</span>
                  {cliente.email && (
                    <>
                      <span className={styles.separator}>•</span>
                      <span>{cliente.email}</span>
                    </>
                  )}
                </div>
              </div>
              {cliente.origen === 'chatbot' && (
                <span className={styles.badgeChatbot}>🤖</span>
              )}
            </button>
          ))}
        </div>
      )}

      {clienteSeleccionado && (
        <div className={styles.seleccionado}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>
            Cliente seleccionado: <strong>{clienteSeleccionado.nombre} {clienteSeleccionado.apellido}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
