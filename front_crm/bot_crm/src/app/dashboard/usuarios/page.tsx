'use client';

// 👥 Página de Usuarios
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './usuarios.module.css';

interface Usuario {
  id: string;
  nombre: string;
  empresaId: string;
  telefono: string;
  interacciones: number;
  ultimaInteraccion: string;
  tokens_consumidos: number;
}

export default function UsuariosPage() {
  const { isAuthenticated, empresa, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nombre' | 'interacciones' | 'fecha'>('fecha');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated) {
      loadUsuarios();
    }
  }, [isAuthenticated, authLoading, router]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getUsuarios();
      setUsuarios(data.usuarios);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsuarios = usuarios
    .filter(u => 
      u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.telefono?.includes(searchTerm) ||
      u.empresaId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'nombre') return (a.nombre || '').localeCompare(b.nombre || '');
      if (sortBy === 'interacciones') return b.interacciones - a.interacciones;
      return new Date(b.ultimaInteraccion).getTime() - new Date(a.ultimaInteraccion).getTime();
    });

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout title="Usuarios">
        <div className={styles.toolbar}>
          <h2>Gestión de Usuarios</h2>
          <div className={styles.toolbarActions}>
            <div style={{position: 'relative', flex: 1}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5}}>
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
                style={{paddingLeft: '40px'}}
              />
            </div>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className={styles.sortSelect}
            >
              <option value="fecha">Más recientes</option>
              <option value="interacciones">Más interacciones</option>
              <option value="nombre">Nombre A-Z</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Cargando usuarios...</p>
          </div>
        ) : (
          <>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total:</span>
                <span className={styles.statValue}>{usuarios.length}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Filtrados:</span>
                <span className={styles.statValue}>{filteredUsuarios.length}</span>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Empresa</th>
                    <th>Interacciones</th>
                    <th>Tokens</th>
                    <th>Última Interacción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>
                        <div className={styles.userName}>
                          <span className={styles.userAvatar}>
                            {(usuario.nombre || 'U')[0].toUpperCase()}
                          </span>
                          {usuario.nombre || 'Sin nombre'}
                        </div>
                      </td>
                      <td>{usuario.telefono}</td>
                      <td>
                        <span className={styles.empresaBadge}>
                          {usuario.empresaId}
                        </span>
                      </td>
                      <td>
                        <span className={styles.interactionsBadge}>
                          {usuario.interacciones}
                        </span>
                      </td>
                      <td>{usuario.tokens_consumidos?.toLocaleString() || 0}</td>
                      <td>{new Date(usuario.ultimaInteraccion).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsuarios.length === 0 && (
              <div className={styles.empty}>
                <p>No se encontraron usuarios</p>
              </div>
            )}
          </>
        )}
    </DashboardLayout>
  );
}
