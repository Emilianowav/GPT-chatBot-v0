'use client';

// 🤖 Componente Selector de Chatbots - Reutilizable
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './ChatbotSelector.module.css';

export interface Chatbot {
  _id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  whatsapp: {
    numeroTelefono: string;
    phoneNumberId: string;
  };
  estadisticas: {
    conversacionesTotales: number;
    conversacionesActivas: number;
  };
}

interface ChatbotSelectorProps {
  value?: string;                    // ID del chatbot seleccionado
  onChange: (chatbotId: string) => void;
  label?: string;
  required?: boolean;
  showStats?: boolean;               // Mostrar estadísticas
  filterActive?: boolean;            // Filtrar solo activos
  placeholder?: string;
}

export default function ChatbotSelector({
  value,
  onChange,
  label = 'Seleccionar Chatbot',
  required = false,
  showStats = false,
  filterActive = true,
  placeholder = 'Elige un chatbot...'
}: ChatbotSelectorProps) {
  const { empresa } = useAuth();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (empresa) {
      loadChatbots();
    }
  }, [empresa, filterActive]);

  const loadChatbots = async () => {
    if (!empresa) return;
    
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Extraer el ID correcto de empresa
      let empresaId: string;
      if (typeof empresa === 'string') {
        empresaId = empresa;
      } else {
        // Intentar obtener empresaMongoId primero, luego _id, luego empresaId
        empresaId = (empresa as any).empresaMongoId || (empresa as any)._id || (empresa as any).empresaId || '';
      }
      
      console.log('🔍 ChatbotSelector - empresa:', empresa);
      console.log('🔍 ChatbotSelector - empresaId extraído:', empresaId);
      
      const url = `${baseUrl}/api/chatbots?empresaId=${empresaId}${filterActive ? '&activo=true' : ''}`;
      console.log('🔍 ChatbotSelector - URL:', url);
      
      const response = await fetch(url);
      const result = await response.json();
      
      console.log('🔍 ChatbotSelector - resultado:', result);

      if (result.success) {
        setChatbots(result.data);
      } else {
        setError(result.message || 'Error al cargar chatbots');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar chatbots');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.loading}>Cargando chatbots...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (chatbots.length === 0) {
    return (
      <div className={styles.container}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.empty}>
          No hay chatbots disponibles. 
          <a href="/dashboard/chatbots/nuevo" className={styles.createLink}>
            Crear uno
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
        required={required}
      >
        <option value="">{placeholder}</option>
        {chatbots.map((chatbot) => (
          <option key={chatbot._id} value={chatbot._id}>
            {chatbot.nombre} - {chatbot.whatsapp.numeroTelefono}
            {!chatbot.activo && ' (Inactivo)'}
          </option>
        ))}
      </select>

      {showStats && value && (
        <div className={styles.stats}>
          {(() => {
            const selected = chatbots.find(c => c._id === value);
            if (!selected) return null;
            
            return (
              <div className={styles.statsContent}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Conversaciones:</span>
                  <span className={styles.statValue}>
                    {selected.estadisticas.conversacionesTotales}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Activas:</span>
                  <span className={styles.statValue}>
                    {selected.estadisticas.conversacionesActivas}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
