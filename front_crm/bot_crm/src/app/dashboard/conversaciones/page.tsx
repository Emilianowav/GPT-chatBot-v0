'use client';

// 💬 Página de Conversaciones - Rediseño Completo
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import { apiClient } from '@/lib/api';
import { config } from '@/lib/config';
import { useWebSocket } from '@/hooks/useWebSocket';
import styles from './conversaciones.module.css';

interface Conversacion {
  id: string;
  nombre: string;
  numero: string;
  avatar: string;
  ultimoMensaje: {
    texto: string;
    rol: string;
    fecha: string;
  } | null;
  ultimaInteraccion: string;
  interacciones: number;
  noLeidos?: number;
}

interface Mensaje {
  id: string;
  contenido: string;
  rol: 'user' | 'assistant';
  fecha: string;
  leido: boolean;
}

interface UsuarioActual {
  id: string;
  nombre: string;
  numero: string;
  avatar: string;
  ultimaInteraccion: string;
  interacciones: number;
}

export default function ConversacionesPage() {
  const { isAuthenticated, empresa, loading: authLoading } = useAuth();
  const router = useRouter();
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const mensajesContainerRef = useRef<HTMLDivElement>(null);
  
  // Estados
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [conversacionesFiltradas, setConversacionesFiltradas] = useState<Conversacion[]>([]);
  const [conversacionActual, setConversacionActual] = useState<string | null>(null);
  const [usuarioActual, setUsuarioActual] = useState<UsuarioActual | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);

  // WebSocket para actualizaciones en tiempo real
  useWebSocket({
    url: config.wsUrl,
    empresaId: empresa?.empresaId || '',
    onMessage: (data) => {
      if (data.type === 'nuevo_mensaje') {
        console.log('🔔 Nuevo mensaje recibido:', data);
        // Recargar conversaciones para actualizar la lista
        loadConversaciones();
        // Si es la conversación actual, recargar mensajes
        if (conversacionActual === data.usuarioId) {
          loadHistorial(data.usuarioId);
        }
      }
    },
    onConnect: () => console.log('✅ WebSocket conectado'),
    onDisconnect: () => console.log('🔌 WebSocket desconectado')
  });

  // Cargar conversaciones al montar
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAuthenticated && empresa) {
      loadConversaciones();
    }
  }, [isAuthenticated, authLoading, empresa, router]);

  // Filtrar conversaciones cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setConversacionesFiltradas(conversaciones);
    } else {
      const filtered = conversaciones.filter(conv =>
        conv.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.numero.includes(searchTerm)
      );
      setConversacionesFiltradas(filtered);
    }
  }, [searchTerm, conversaciones]);

  const loadConversaciones = async () => {
    if (!empresa) return;
    
    try {
      setLoading(true);
      const data = await apiClient.getConversaciones(empresa.empresaId) as { conversaciones: Conversacion[] };
      setConversaciones(data.conversaciones);
      setConversacionesFiltradas(data.conversaciones);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistorial = async (usuarioId: string) => {
    if (!empresa) return;
    
    try {
      setLoadingMensajes(true);
      setConversacionActual(usuarioId);
      
      // Solo ocultar sidebar en móvil (< 768px)
      if (window.innerWidth < 768) {
        setShowMobileList(false);
      }
      
      const data = await apiClient.getHistorialUsuario(empresa.empresaId, usuarioId) as { 
        usuario: UsuarioActual; 
        mensajes: Mensaje[] 
      };
      setUsuarioActual(data.usuario);
      
      // Debug: verificar roles y contenido completo de mensajes
      console.log('📩 Total mensajes recibidos:', data.mensajes.length);
      data.mensajes.forEach((m, i) => {
        console.log(`Mensaje ${i + 1}:`, {
          rol: m.rol,
          fecha: m.fecha,
          contenidoLength: m.contenido.length,
          contenido: m.contenido
        });
      });
      
      setMensajes(data.mensajes);
      
      // Scroll al final después de cargar
      setTimeout(() => scrollToBottom('auto'), 100);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoadingMensajes(false);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (mensajesContainerRef.current) {
      mensajesContainerRef.current.scrollTo({
        top: mensajesContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  const handleBackToList = () => {
    setShowMobileList(true);
    setConversacionActual(null);
    setUsuarioActual(null);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (date.toDateString() === hoy.toDateString()) {
      return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es', { day: '2-digit', month: '2-digit' });
    }
  };

  const formatFechaCompleta = (fecha: string) => {
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    // Comparar solo las fechas (sin hora)
    const esMismaFecha = (d1: Date, d2: Date) => 
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    if (esMismaFecha(date, hoy)) {
      return 'Hoy';
    } else if (esMismaFecha(date, ayer)) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric'
      });
    }
  };

  const truncarTexto = (texto: string, max: number = 50) => {
    if (!texto) return '';
    if (texto.length <= max) return texto;
    return texto.substring(0, max) + '...';
  };

  const limpiarMensaje = (contenido: string) => {
    if (!contenido) return '';
    // Remover prefijos como "Cliente:", "Asistente:", "Usuario:", etc.
    return contenido
      .replace(/^(Cliente|Asistente|Usuario|Bot|AI):\s*/i, '')
      .trim();
  };

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <DashboardLayout title="Conversaciones">
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <div className={styles.loader}></div>
            <p>Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout title="💬 Conversaciones">
      <div className={styles.container}>
        {/* Panel Izquierdo - Lista de Conversaciones */}
        <aside className={`${styles.sidebar} ${!showMobileList ? styles.sidebarHidden : ''}`}>
          {/* Header del Sidebar */}
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}>
              <h2>Mensajes</h2>
              <span className={styles.conversacionesCount}>
                {conversacionesFiltradas.length}
              </span>
            </div>
          </div>

          {/* Buscador */}
          <div className={styles.searchBox}>
            <div className={styles.searchInputWrapper}>
              <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar conversación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button 
                  className={styles.clearButton}
                  onClick={handleClearSearch}
                  aria-label="Limpiar búsqueda"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Lista de Conversaciones */}
          <div className={styles.conversacionesList}>
            {loading ? (
              <div className={styles.emptyState}>
                <div className={styles.loader}></div>
                <p>Cargando conversaciones...</p>
              </div>
            ) : conversacionesFiltradas.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p>{searchTerm ? 'No se encontraron conversaciones' : 'No hay conversaciones'}</p>
              </div>
            ) : (
              conversacionesFiltradas.map((conv) => (
                <div
                  key={conv.id}
                  className={`${styles.conversacionItem} ${conversacionActual === conv.id ? styles.conversacionActive : ''}`}
                  onClick={() => loadHistorial(conv.id)}
                >
                  <div className={styles.conversacionAvatar}>
                    <div className={styles.avatarCircle}>
                      {conv.avatar}
                    </div>
                  </div>
                  
                  <div className={styles.conversacionContent}>
                    <div className={styles.conversacionTop}>
                      <h3 className={styles.conversacionNombre}>{conv.nombre}</h3>
                      <span className={styles.conversacionFecha}>
                        {conv.ultimoMensaje && formatFecha(conv.ultimoMensaje.fecha)}
                      </span>
                    </div>
                    
                    <div className={styles.conversacionBottom}>
                      <p className={styles.conversacionMensaje}>
                        {conv.ultimoMensaje ? (
                          <>
                            {conv.ultimoMensaje.rol === 'assistant' && (
                              <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                            {truncarTexto(conv.ultimoMensaje.texto, 35)}
                          </>
                        ) : (
                          <span className={styles.sinMensajes}>Sin mensajes</span>
                        )}
                      </p>
                      {conv.noLeidos && conv.noLeidos > 0 && (
                        <span className={styles.badge}>{conv.noLeidos}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Panel Derecho - Chat */}
        <main className={styles.chatArea}>
          {!conversacionActual ? (
            <div className={styles.emptyChat}>
              <div className={styles.emptyChatContent}>
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  <line x1="9" y1="10" x2="15" y2="10"/>
                  <line x1="9" y1="14" x2="13" y2="14"/>
                </svg>
                <h2>Momento CRM</h2>
                <p>Selecciona una conversación para ver el historial completo de mensajes</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header del Chat */}
              <header className={styles.chatHeader}>
                <button 
                  className={styles.backButton}
                  onClick={handleBackToList}
                  aria-label="Volver a conversaciones"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                </button>

                <div className={styles.chatHeaderUser}>
                  <div className={styles.chatAvatar}>
                    {usuarioActual?.avatar}
                  </div>
                  <div className={styles.chatUserInfo}>
                    <h3>{usuarioActual?.nombre}</h3>
                    <p>{usuarioActual?.numero}</p>
                  </div>
                </div>

                <div className={styles.chatHeaderActions}>
                  <div className={styles.chatStats}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>{usuarioActual?.interacciones}</span>
                  </div>
                </div>
              </header>

              {/* Área de Mensajes */}
              <div 
                className={styles.mensajesArea}
                ref={mensajesContainerRef}
              >
                {loadingMensajes ? (
                  <div className={styles.loadingMensajes}>
                    <div className={styles.loader}></div>
                    <p>Cargando mensajes...</p>
                  </div>
                ) : mensajes.length === 0 ? (
                  <div className={styles.emptyMensajes}>
                    <p>No hay mensajes en esta conversación</p>
                  </div>
                ) : (
                  <>
                    {mensajes.map((mensaje, index) => {
                      const showDate = index === 0 || 
                        new Date(mensajes[index - 1].fecha).toDateString() !== new Date(mensaje.fecha).toDateString();
                      
                      return (
                        <div key={mensaje.id}>
                          {showDate && (
                            <div className={styles.dateDivider}>
                              <span>{formatFechaCompleta(mensaje.fecha)}</span>
                            </div>
                          )}
                          
                          <div className={`${styles.mensajeWrapper} ${mensaje.rol === 'user' ? styles.mensajeRecibido : styles.mensajeEnviado}`}>
                            <div className={styles.mensajeBubble}>
                              <p className={styles.mensajeTexto}>{limpiarMensaje(mensaje.contenido)}</p>
                              <div className={styles.mensajeMeta}>
                                <span className={styles.mensajeHora}>
                                  {new Date(mensaje.fecha).toLocaleTimeString('es', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                {mensaje.rol === 'assistant' && (
                                  <svg className={styles.checkDouble} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"/>
                                    <polyline points="20 6 9 17 4 12" transform="translate(4, 0)"/>
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={mensajesEndRef} />
                  </>
                )}
              </div>

              {/* Footer del Chat */}
              <footer className={styles.chatFooter}>
                <div className={styles.footerInfo}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>Conversación con asistente de IA</span>
                </div>
              </footer>
            </>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}
