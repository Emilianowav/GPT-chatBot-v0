'use client';

import { useState, useEffect } from 'react';
import { Plus, Bot, Workflow, Settings, Play, Pause, Trash2, Copy, Edit3 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import FlowEditor from '@/components/flows/FlowEditor';
import styles from './flows.module.css';

interface Flow {
  _id: string;
  empresaId: string;
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  startNode: string;
  activo: boolean;
  variables: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string>('');

  useEffect(() => {
    const storedEmpresa = localStorage.getItem('empresaId') || 'Veo Veo';
    setEmpresaId(storedEmpresa);
    loadFlows(storedEmpresa);
  }, []);

  const loadFlows = async (empresa: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/flows?empresaId=${empresa}`);
      if (response.ok) {
        const data = await response.json();
        setFlows(data);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlow = () => {
    setIsCreating(true);
    setSelectedFlow(null);
  };

  const handleSelectFlow = (flow: Flow) => {
    setSelectedFlow(flow);
    setIsCreating(false);
  };

  const handleCloseEditor = () => {
    setSelectedFlow(null);
    setIsCreating(false);
    loadFlows(empresaId);
  };

  const handleToggleActive = async (flowId: string, currentState: boolean) => {
    try {
      const response = await fetch(`http://localhost:3000/api/flows/${flowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !currentState })
      });
      
      if (response.ok) {
        loadFlows(empresaId);
      }
    } catch (error) {
      console.error('Error toggling flow:', error);
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm('¿Estás seguro de eliminar este flujo?')) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/flows/${flowId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadFlows(empresaId);
      }
    } catch (error) {
      console.error('Error deleting flow:', error);
    }
  };

  const handleDuplicateFlow = async (flow: Flow) => {
    try {
      const response = await fetch(`http://localhost:3000/api/flows/${flow._id}/duplicate`, {
        method: 'POST'
      });
      
      if (response.ok) {
        loadFlows(empresaId);
      }
    } catch (error) {
      console.error('Error duplicating flow:', error);
    }
  };

  if (selectedFlow || isCreating) {
    return (
      <DashboardLayout title="Editor de Flujos">
        <FlowEditor
          flow={selectedFlow}
          empresaId={empresaId}
          onClose={handleCloseEditor}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gestión de Flujos">
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBox}>
              <Workflow style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            <div className={styles.headerInfo}>
              <h1>Gestión de Flujos</h1>
              <p>Administra los flujos conversacionales de tu bot</p>
            </div>
          </div>
          
          <button onClick={handleCreateFlow} className={styles.createButton}>
            <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
            Crear Flujo
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      ) : flows.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Bot style={{ width: '2.5rem', height: '2.5rem', color: '#94a3b8' }} />
          </div>
          <h3>No hay flujos creados</h3>
          <p>Crea tu primer flujo para comenzar</p>
          <button onClick={handleCreateFlow} className={styles.createButton}>
            <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
            Crear Primer Flujo
          </button>
        </div>
      ) : (
        <div className={styles.flowsGrid}>
          {flows.map((flow) => (
            <div key={flow._id} className={styles.flowCard}>
              <div className={styles.flowCardHeader}>
                <div className={styles.flowCardTop}>
                  <div className={styles.flowCardInfo}>
                    <h3>{flow.nombre}</h3>
                    <p>{flow.descripcion || 'Sin descripción'}</p>
                  </div>
                  <span className={`${styles.badge} ${flow.activo ? styles.badgeActive : styles.badgeInactive}`}>
                    {flow.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                <div className={styles.flowCardMeta}>
                  <span>
                    <Workflow style={{ width: '1rem', height: '1rem' }} />
                    {flow.categoria}
                  </span>
                  <span>
                    <Settings style={{ width: '1rem', height: '1rem' }} />
                    {flow.startNode}
                  </span>
                </div>
              </div>

              <div className={styles.flowCardActions}>
                <button onClick={() => handleSelectFlow(flow)} className={styles.editButton}>
                  <Edit3 style={{ width: '1rem', height: '1rem' }} />
                  Editar
                </button>
                
                <div className={styles.actionButtons}>
                  <button
                    onClick={() => handleToggleActive(flow._id, flow.activo)}
                    className={`${styles.actionButton} ${flow.activo ? styles.actionButtonActive : styles.actionButtonInactive}`}
                    title={flow.activo ? 'Desactivar' : 'Activar'}
                  >
                    {flow.activo ? <Pause style={{ width: '1rem', height: '1rem' }} /> : <Play style={{ width: '1rem', height: '1rem' }} />}
                  </button>
                  
                  <button
                    onClick={() => handleDuplicateFlow(flow)}
                    className={`${styles.actionButton} ${styles.actionButtonDuplicate}`}
                    title="Duplicar"
                  >
                    <Copy style={{ width: '1rem', height: '1rem' }} />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteFlow(flow._id)}
                    className={`${styles.actionButton} ${styles.actionButtonDelete}`}
                    title="Eliminar"
                  >
                    <Trash2 style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
