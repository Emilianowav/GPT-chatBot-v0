'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pause, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './flows.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface FlowListItem {
  _id: string;
  nombre: string;
  activo: boolean;
  descripcion?: string;
}

export default function FlowsPage() {
  const router = useRouter();
  const [flowsList, setFlowsList] = useState<FlowListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlowsList();
  }, []);

  const loadFlowsList = async () => {
    try {
      setLoading(true);
      const empresaId = localStorage.getItem('empresaId') || '';
      const response = await fetch(`${API_URL}/api/flows?empresaId=${empresaId}`);
      if (response.ok) {
        const data = await response.json();
        const flows = Array.isArray(data) ? data : (data.flows || []);
        console.log(`📋 Flujos cargados para empresa ${empresaId}: ${flows.length}`);
        setFlowsList(flows);
      }
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFlow = (flowId: string) => {
    router.push(`/dashboard/flow-builder?flowId=${flowId}`);
  };

  const createNewFlow = () => {
    router.push('/dashboard/flow-builder');
  };

  const toggleFlowStatus = async (flowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`${API_URL}/api/flows/${flowId}/toggle`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`${data.activo ? '▶️' : '⏸️'} Flow ${data.activo ? 'activado' : 'pausado'}`);
        loadFlowsList();
      }
    } catch (error) {
      console.error('Error toggling flow status:', error);
    }
  };

  const deleteFlow = async (flowId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este flujo?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/flows/${flowId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('✅ Flujo eliminado');
        loadFlowsList();
      }
    } catch (error) {
      console.error('Error deleting flow:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <h1>Gestión de Flujos</h1>
          <button onClick={createNewFlow} className={styles.createButton}>
            <Plus size={18} />
            Crear Flujo
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Cargando flujos...</div>
        ) : flowsList.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No hay flujos creados</h3>
            <p>Crea tu primer flujo para comenzar</p>
            <button onClick={createNewFlow} className={styles.createButton}>
              <Plus size={18} />
              Crear Primer Flujo
            </button>
          </div>
        ) : (
          <div className={styles.flowsGrid}>
            {flowsList.map((flow) => (
              <div key={flow._id} className={styles.flowCard} onClick={() => loadFlow(flow._id)}>
                <div className={styles.flowCardHeader}>
                  <h3>{flow.nombre}</h3>
                  <span className={`${styles.badge} ${flow.activo ? styles.badgeActive : styles.badgeInactive}`}>
                    {flow.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p>{flow.descripcion || 'Sin descripción'}</p>
                <div className={styles.flowCardActions}>
                  <button 
                    onClick={(e) => toggleFlowStatus(flow._id, e)}
                    className={flow.activo ? styles.pauseButton : styles.playButton}
                    title={flow.activo ? 'Pausar flujo' : 'Activar flujo'}
                  >
                    {flow.activo ? <Pause size={16} /> : <PlayCircle size={16} />}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFlow(flow._id);
                    }}
                    className={styles.deleteButton}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
