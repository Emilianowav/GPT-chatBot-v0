'use client';

// 👥 Página de Gestión de Usuarios de Empresa
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import Modal from '@/components/common/Modal';
import styles from './usuarios.module.css';

interface UsuarioEmpresa {
  id: string;
  username: string;
  email: string;
  nombre: string;
  apellido?: string;
  rol: 'admin' | 'manager' | 'agent' | 'viewer';
  activo: boolean;
  ultimoAcceso?: string;
  createdAt: string;
}

interface Estadisticas {
  total: number;
  activos: number;
  inactivos: number;
  porRol: {
    admin: number;
    manager: number;
    agent: number;
    viewer: number;
  };
  limites: {
    maxUsuarios: number;
    maxAdmins: number;
  };
  disponibles: {
    usuarios: number;
    admins: number;
  };
}

export default function UsuariosPage() {
  const { isAuthenticated, empresa, loading: authLoading } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<UsuarioEmpresa | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    nombre: '',
    apellido: '',
    rol: 'viewer' as 'admin' | 'manager' | 'agent' | 'viewer',
    telefono: ''
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Verificar que sea admin
    if (isAuthenticated && empresa?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    if (isAuthenticated && empresa?.role === 'admin') {
      loadUsuarios();
      loadEstadisticas();
    }
  }, [isAuthenticated, authLoading, empresa, router]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/usuarios-empresa', {
        headers: {
          'Authorization': `Bearer ${empresa?.token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsuarios(data.usuarios);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      mostrarMensaje('error', 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadEstadisticas = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/usuarios-empresa/estadisticas', {
        headers: {
          'Authorization': `Bearer ${empresa?.token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setEstadisticas(data.estadisticas);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/usuarios-empresa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${empresa?.token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        mostrarMensaje('success', 'Usuario creado exitosamente');
        setModalCrear(false);
        resetForm();
        loadUsuarios();
        loadEstadisticas();
      } else {
        mostrarMensaje('error', data.message || 'Error al crear usuario');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al crear usuario');
    }
  };

  const handleEditarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditar) return;
    
    try {
      const updateData: any = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        rol: formData.rol,
        telefono: formData.telefono
      };

      // Solo incluir password si se ingresó una nueva
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      const response = await fetch(`http://localhost:3000/api/usuarios-empresa/${usuarioEditar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${empresa?.token}`
        },
        body: JSON.stringify(updateData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        mostrarMensaje('success', 'Usuario actualizado exitosamente');
        setModalEditar(false);
        setUsuarioEditar(null);
        resetForm();
        loadUsuarios();
        loadEstadisticas();
      } else {
        mostrarMensaje('error', data.message || 'Error al actualizar usuario');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al actualizar usuario');
    }
  };

  const handleEliminarUsuario = async (id: string) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/usuarios-empresa/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${empresa?.token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        mostrarMensaje('success', 'Usuario desactivado exitosamente');
        loadUsuarios();
        loadEstadisticas();
      } else {
        mostrarMensaje('error', data.message || 'Error al desactivar usuario');
      }
    } catch (error) {
      mostrarMensaje('error', 'Error al desactivar usuario');
    }
  };

  const abrirModalEditar = (usuario: UsuarioEmpresa) => {
    setUsuarioEditar(usuario);
    setFormData({
      username: usuario.username,
      password: '',
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido || '',
      rol: usuario.rol,
      telefono: ''
    });
    setModalEditar(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      nombre: '',
      apellido: '',
      rol: 'viewer',
      telefono: ''
    });
  };

  const getRolBadgeClass = (rol: string) => {
    const classes: Record<string, string> = {
      admin: styles.badgeAdmin,
      manager: styles.badgeManager,
      agent: styles.badgeAgent,
      viewer: styles.badgeViewer
    };
    return classes[rol] || styles.badgeViewer;
  };

  const getRolLabel = (rol: string) => {
    const labels: Record<string, string> = {
      admin: '👑 Admin',
      manager: '👔 Manager',
      agent: '👨‍💼 Agent',
      viewer: '👁️ Viewer'
    };
    return labels[rol] || rol;
  };

  if (!isAuthenticated || empresa?.role !== 'admin') return null;

  return (
    <DashboardLayout title="Gestión de Usuarios">
      <div className={styles.container}>
        {mensaje && (
          <div className={`${styles.mensaje} ${styles[mensaje.tipo]}`}>
            {mensaje.texto}
          </div>
        )}

        <div className={styles.header}>
          <div>
            <h1>👥 Gestión de Usuarios</h1>
            <p>Administra los usuarios de tu empresa</p>
          </div>
          <button 
            className={styles.btnPrimary}
            onClick={() => {
              resetForm();
              setModalCrear(true);
            }}
          >
            + Crear Usuario
          </button>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Total Usuarios</h3>
              <p className={styles.statNumber}>{estadisticas.total}</p>
              <small>{estadisticas.activos} activos</small>
            </div>
            <div className={styles.statCard}>
              <h3>Admins</h3>
              <p className={styles.statNumber}>{estadisticas.porRol.admin}</p>
              <small>Sin límite</small>
            </div>
            <div className={styles.statCard}>
              <h3>Managers</h3>
              <p className={styles.statNumber}>{estadisticas.porRol.manager}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Agents</h3>
              <p className={styles.statNumber}>{estadisticas.porRol.agent}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Límite</h3>
              <p className={styles.statNumber}>{estadisticas.limites.maxUsuarios}</p>
              <small>{estadisticas.disponibles.usuarios} disponibles</small>
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Cargando...</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Último Acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                          {usuario.nombre[0].toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.userName}>{usuario.nombre} {usuario.apellido}</div>
                          <div className={styles.username}>@{usuario.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{usuario.email}</td>
                    <td>
                      <span className={getRolBadgeClass(usuario.rol)}>
                        {getRolLabel(usuario.rol)}
                      </span>
                    </td>
                    <td>
                      <span className={usuario.activo ? styles.badgeActivo : styles.badgeInactivo}>
                        {usuario.activo ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </td>
                    <td>
                      {usuario.ultimoAcceso 
                        ? new Date(usuario.ultimoAcceso).toLocaleString()
                        : 'Nunca'
                      }
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => abrirModalEditar(usuario)}
                          className={styles.btnEditar}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        {usuario.activo && (
                          <button
                            onClick={() => handleEliminarUsuario(usuario.id)}
                            className={styles.btnEliminar}
                            title="Desactivar"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Crear Usuario */}
        <Modal
          isOpen={modalCrear}
          onClose={() => {
            setModalCrear(false);
            resetForm();
          }}
          title="Crear Nuevo Usuario"
        >
          <form onSubmit={handleCrearUsuario} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Apellido</label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>Rol *</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({...formData, rol: e.target.value as any})}
                required
              >
                <option value="viewer">👁️ Viewer - Solo lectura</option>
                <option value="agent">👨‍💼 Agent - Operación</option>
                <option value="manager">👔 Manager - Gestión</option>
                <option value="admin">👑 Admin - Control total</option>
              </select>
            </div>
            <div className={styles.formActions}>
              <button type="button" onClick={() => setModalCrear(false)} className={styles.btnSecondary}>
                Cancelar
              </button>
              <button type="submit" className={styles.btnPrimary}>
                Crear Usuario
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal Editar Usuario */}
        <Modal
          isOpen={modalEditar}
          onClose={() => {
            setModalEditar(false);
            setUsuarioEditar(null);
            resetForm();
          }}
          title="Editar Usuario"
        >
          <form onSubmit={handleEditarUsuario} className={styles.form}>
            <div className={styles.field}>
              <label>Username</label>
              <input
                type="text"
                value={formData.username}
                disabled
                className={styles.inputDisabled}
              />
              <small style={{color: '#999', fontSize: '0.85rem'}}>El username no se puede modificar</small>
            </div>
            <div className={styles.field}>
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Apellido</label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>Rol *</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({...formData, rol: e.target.value as any})}
                required
              >
                <option value="viewer">👁️ Viewer</option>
                <option value="agent">👨‍💼 Agent</option>
                <option value="manager">👔 Manager</option>
                <option value="admin">👑 Admin</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Nueva Contraseña (opcional)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Dejar vacío para mantener la actual"
                minLength={6}
              />
              <small style={{color: '#999', fontSize: '0.85rem'}}>Solo completa si deseas cambiar la contraseña (mínimo 6 caracteres)</small>
            </div>
            <div className={styles.formActions}>
              <button type="button" onClick={() => setModalEditar(false)} className={styles.btnSecondary}>
                Cancelar
              </button>
              <button type="submit" className={styles.btnPrimary}>
                Guardar Cambios
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
