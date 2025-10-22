// 👤 Lista de Clientes
'use client';

import type { Cliente } from '@/lib/clientesApi';
import styles from './ListaClientes.module.css';

interface ListaClientesProps {
  clientes: Cliente[];
  onEditar?: (cliente: Cliente) => void;
  onEliminar?: (cliente: Cliente) => void;
}

export default function ListaClientes({ 
  clientes, 
  onEditar,
  onEliminar
}: ListaClientesProps) {
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
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearTelefono = (telefono: string) => {
    // Formato: +54 9 11 1234-5678
    if (telefono.startsWith('+549')) {
      const numero = telefono.substring(4);
      if (numero.length === 10) {
        return `+54 9 ${numero.substring(0, 2)} ${numero.substring(2, 6)}-${numero.substring(6)}`;
      }
    }
    return telefono;
  };

  return (
    <div className={styles.grid}>
      {clientes.map((cliente) => (
        <div key={cliente._id} className={styles.card}>
          {/* Header de la tarjeta */}
          <div className={styles.cardHeader}>
            <div className={styles.clienteInfo}>
              <div className={styles.avatar}>
                {cliente.nombre.charAt(0)}{cliente.apellido.charAt(0)}
              </div>
              <div>
                <h3 className={styles.nombre}>
                  {cliente.nombre} {cliente.apellido}
                </h3>
                <div className={styles.badges}>
                  <span className={cliente.activo ? styles.badgeActivo : styles.badgeInactivo}>
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className={cliente.origen === 'chatbot' ? styles.badgeChatbot : styles.badgeManual}>
                    {cliente.origen === 'chatbot' ? '🤖 Chatbot' : '👤 Manual'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div className={styles.cardBody}>
            <div className={styles.infoRow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>{formatearTelefono(cliente.telefono)}</span>
            </div>

            {cliente.email && (
              <div className={styles.infoRow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <span>{cliente.email}</span>
              </div>
            )}

            {cliente.direccion && (
              <div className={styles.infoRow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>
                  {cliente.direccion}
                  {cliente.ciudad && `, ${cliente.ciudad}`}
                  {cliente.provincia && `, ${cliente.provincia}`}
                </span>
              </div>
            )}

            {cliente.dni && (
              <div className={styles.infoRow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="16" rx="2"/>
                  <line x1="7" y1="8" x2="17" y2="8"/>
                  <line x1="7" y1="12" x2="17" y2="12"/>
                  <line x1="7" y1="16" x2="13" y2="16"/>
                </svg>
                <span>DNI: {cliente.dni}</span>
              </div>
            )}

            {cliente.fechaNacimiento && (
              <div className={styles.infoRow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Nacimiento: {formatearFecha(cliente.fechaNacimiento)}</span>
              </div>
            )}

            {cliente.notas && (
              <div className={styles.notas}>
                <strong>Notas:</strong> {cliente.notas}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className={styles.cardActions}>
            {onEditar && (
              <button
                onClick={() => onEditar(cliente)}
                className={styles.btnEditar}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar
              </button>
            )}
            {onEliminar && (
              <button
                onClick={() => onEliminar(cliente)}
                className={styles.btnEliminar}
                title="Eliminar permanentemente"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Eliminar
              </button>
            )}
          </div>

          {/* Footer con fecha de creación */}
          <div className={styles.cardFooter}>
            <span className={styles.fechaCreacion}>
              Registrado: {formatearFecha(cliente.creadoEn)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
