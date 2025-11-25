'use client';

// 🔄 Gestor de Flujos de API - Versión Limpia con Modal por Pasos
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getIntegrationsApiUrl } from '@/lib/integrations-api';
import ModalWorkflow from './ModalWorkflow';
import styles from './WorkflowManager.module.css';

interface Endpoint {
  _id?: string;
  id?: string;
  nombre: string;
  metodo: string;
  ruta?: string;
  path?: string;
  parametros?: any;
}

// Tipos de validación
type ValidationType = 'texto' | 'numero' | 'opcion' | 'regex';
type StepType = 'recopilar' | 'ejecutar' | 'validar';
type TriggerType = 'keyword' | 'primer_mensaje' | 'manual';

interface StepValidation {
  tipo: ValidationType;
  opciones?: string[];
  regex?: string;
  mensajeError?: string;
}

interface FlowStep {
  orden: number;
  tipo: StepType;
  
  // Para pasos de recopilación
  pregunta?: string;
  nombreVariable: string;
  validacion?: StepValidation;
  
  // Para pasos de ejecución
  endpointId?: string;
  mapeoParametros?: Record<string, string>;
  
  // Opcionales
  nombre?: string;
  descripcion?: string;
  mensajeError?: string;
  intentosMaximos?: number;
}

interface WorkflowTrigger {
  tipo: TriggerType;
  keywords?: string[];
  primeraRespuesta?: boolean;
}

interface Workflow {
  id?: string;
  _id?: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  
  // Configuración de activación
  trigger: WorkflowTrigger;
  prioridad?: number;
  
  // Pasos del workflow
  steps: FlowStep[];
  
  // Mensajes
  mensajeInicial?: string;
  mensajeFinal?: string;
  mensajeAbandonar?: string;
  respuestaTemplate?: string;
  
  // Configuración
  permitirAbandonar?: boolean;
  timeoutMinutos?: number;
  
  createdAt?: string;
  updatedAt?: string;
}

interface Props {
  apiId: string;
  endpoints: Endpoint[];
  apiBaseUrl?: string;
  apiAuth?: any;
  workflows?: Workflow[];
  onUpdate: () => void;
}

export default function WorkflowManager({ apiId, endpoints, apiBaseUrl, apiAuth, workflows = [], onUpdate }: Props) {
  const { empresa } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  const handleCreate = () => {
    setEditingWorkflow(null);
    setShowForm(true);
  };

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingWorkflow(null);
  };

  const handleSubmit = async (data: Workflow) => {
    const baseUrl = getIntegrationsApiUrl(empresa);
    const workflowId = editingWorkflow?.id || editingWorkflow?._id;
    
    const url = workflowId
      ? `${baseUrl}/apis/${apiId}/workflows/${workflowId}`
      : `${baseUrl}/apis/${apiId}/workflows`;

    const response = await fetch(url, {
      method: workflowId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (result.success) {
      handleClose();
      onUpdate();
    } else {
      throw new Error(result.message || 'Error al guardar workflow');
    }
  };

  const handleDelete = async (workflow: Workflow) => {
    if (!confirm('¿Estás seguro de eliminar este flujo?')) return;

    try {
      const baseUrl = getIntegrationsApiUrl(empresa);
      const workflowId = workflow.id || workflow._id;
      const response = await fetch(`${baseUrl}/apis/${apiId}/workflows/${workflowId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error al eliminar flujo:', error);
    }
  };

  const handleToggleActive = async (workflow: Workflow) => {
    try {
      const baseUrl = getIntegrationsApiUrl(empresa);
      const workflowId = workflow.id || workflow._id;
      const response = await fetch(`${baseUrl}/apis/${apiId}/workflows/${workflowId}/toggle`, {
        method: 'PATCH'
      });

      const result = await response.json();
      if (result.success) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const handleDuplicate = async (workflow: Workflow) => {
    try {
      // Crear copia del workflow sin IDs
      const workflowCopy: Workflow = {
        nombre: `${workflow.nombre} (Copia)`,
        descripcion: workflow.descripcion,
        activo: false, // Crear desactivado por defecto
        trigger: {
          tipo: 'keyword', // Cambiar a keyword por defecto
          keywords: [] // Sin keywords inicialmente
        },
        prioridad: workflow.prioridad,
        steps: workflow.steps.map(step => ({
          ...step,
          // Mantener toda la configuración del paso
        })),
        mensajeInicial: workflow.mensajeInicial,
        mensajeFinal: workflow.mensajeFinal,
        mensajeAbandonar: workflow.mensajeAbandonar,
        respuestaTemplate: workflow.respuestaTemplate,
        permitirAbandonar: workflow.permitirAbandonar,
        timeoutMinutos: workflow.timeoutMinutos
      };

      // Abrir modal con el workflow duplicado
      setEditingWorkflow(workflowCopy);
      setShowForm(true);
    } catch (error) {
      console.error('Error al duplicar workflow:', error);
      alert('Error al duplicar el workflow');
    }
  };

  // Si está mostrando el formulario, renderizar solo el formulario
  if (showForm) {
    return (
      <div className={styles.container}>
        <ModalWorkflow
          isOpen={true}
          onClose={handleClose}
          onSubmit={handleSubmit}
          workflowInicial={editingWorkflow}
          endpoints={endpoints}
          workflows={workflows}
          apiBaseUrl={apiBaseUrl}
          apiAuth={apiAuth}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>Workflows Conversacionales</h3>
          <p className={styles.subtitle}>
            Crea conversaciones guiadas paso a paso para recopilar información
          </p>
        </div>
        <button className={styles.primaryButton} onClick={handleCreate}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Workflow
        </button>
      </div>

      {/* Lista de Workflows */}
      {workflows.length === 0 ? (
        <div className={styles.empty}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
            <polyline points="7.5 19.79 7.5 14.6 3 12"/>
            <polyline points="21 12 16.5 14.6 16.5 19.79"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          <h4>No hay workflows configurados</h4>
          <p>Crea tu primer workflow conversacional para guiar a tus usuarios</p>
          <button className={styles.primaryButton} onClick={handleCreate}>
            Crear Primer Workflow
          </button>
        </div>
      ) : (
        <div className={styles.workflowsList}>
          {workflows.map((workflow) => (
            <div key={workflow._id} className={styles.workflowCard}>
              <div className={styles.workflowHeader}>
                <div className={styles.workflowTitle}>
                  <h4>{workflow.nombre}</h4>
                  <span className={`${styles.status} ${workflow.activo ? styles.statusActive : styles.statusInactive}`}>
                    {workflow.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className={styles.workflowActions}>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleToggleActive(workflow)}
                    title={workflow.activo ? 'Desactivar' : 'Activar'}
                  >
                    {workflow.activo ? '⏸️' : '▶️'}
                  </button>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleDuplicate(workflow)}
                    title="Duplicar workflow"
                  >
                    📋
                  </button>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleEdit(workflow)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleDelete(workflow)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {workflow.descripcion && (
                <p className={styles.workflowDescription}>{workflow.descripcion}</p>
              )}

              <div className={styles.workflowMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Trigger:</span>
                  <span className={styles.metaValue}>
                    {workflow.trigger.tipo === 'keyword' && `Keywords (${workflow.trigger.keywords?.length || 0})`}
                    {workflow.trigger.tipo === 'primer_mensaje' && 'Primer Mensaje'}
                    {workflow.trigger.tipo === 'manual' && 'Manual'}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Pasos:</span>
                  <span className={styles.metaValue}>{workflow.steps.length}</span>
                </div>
                {workflow.prioridad !== undefined && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Prioridad:</span>
                    <span className={styles.metaValue}>{workflow.prioridad}</span>
                  </div>
                )}
              </div>

              {workflow.createdAt && (
                <div className={styles.workflowFooter}>
                  Creado: {new Date(workflow.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
