// 👤 Lista de Clientes - Formato Tabla
'use client';

import { useState, useMemo } from 'react';
import type { Cliente } from '@/lib/clientesApi';
import Pagination from '@/components/ui/Pagination';
import styles from './ListaClientes.module.css';

interface ListaClientesProps {
  clientes: Cliente[];
  onEditar?: (cliente: Cliente) => void;
  onEliminar?: (cliente: Cliente) => void;
  itemsPerPage?: number;
}

export default function ListaClientes({ 
  clientes, 
  onEditar,
  onEliminar,
  itemsPerPage = 10
}: ListaClientesProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Paginación
  const totalPages = Math.ceil(clientes.length / itemsPerPage);
  const clientesPaginados = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return clientes.slice(start, start + itemsPerPage);
  }, [clientes, currentPage, itemsPerPage]);

  if (clientes.length === 0) {
    return (
      <div className={styles.empty}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <h3>No hay clientes registrados</h3>
        <p>Comienza agregando tu primer cliente</p>
      </div>
    );
  }

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Estado</th>
            <th>Origen</th>
            <th>Registrado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientesPaginados.map((cliente) => (
            <tr key={cliente._id}>
              <td>
                <div className={styles.clienteCell}>
                  <div className={styles.avatar}>
                    {cliente.nombre.charAt(0)}{cliente.apellido.charAt(0)}
                  </div>
                  <div className={styles.clienteInfo}>
                    <span className={styles.nombre}>{cliente.nombre} {cliente.apellido}</span>
                    {cliente.dni && <span className={styles.dni}>DNI: {cliente.dni}</span>}
                  </div>
                </div>
              </td>
              <td>{formatearTelefono(cliente.telefono)}</td>
              <td>{cliente.email || '-'}</td>
              <td>
                <span className={cliente.activo ? styles.badgeActivo : styles.badgeInactivo}>
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <span className={cliente.origen === 'chatbot' ? styles.badgeChatbot : styles.badgeManual}>
                  {cliente.origen === 'chatbot' ? '🤖 Chatbot' : '👤 Manual'}
                </span>
              </td>
              <td>{formatearFecha(cliente.creadoEn)}</td>
              <td>
                <div className={styles.actions}>
                  {onEditar && (
                    <button
                      onClick={() => onEditar(cliente)}
                      className={styles.btnEditar}
                      title="Editar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
                  {onEliminar && (
                    <button
                      onClick={() => onEliminar(cliente)}
                      className={styles.btnEliminar}
                      title="Eliminar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={clientes.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}
