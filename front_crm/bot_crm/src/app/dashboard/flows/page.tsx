'use client';

import { useState, useEffect } from 'react';
import { Plus, Bot, Workflow, Settings, Play, Pause, Trash2, Copy, Edit3 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import FlowEditor from '@/components/flows/FlowEditor';

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
    // Obtener empresa del usuario actual desde localStorage
    const storedEmpresa = localStorage.getItem('empresaId') || 'Veo Veo';
    setEmpresaId(storedEmpresa);
    loadFlows(storedEmpresa);
  }, []);

  const loadFlows = async (empresa: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/api/flows?empresaId=${empresa}`);
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
      const response = await fetch(`http://localhost:4000/api/flows/${flowId}`, {
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
      const response = await fetch(`http://localhost:4000/api/flows/${flowId}`, {
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
      const response = await fetch(`http://localhost:4000/api/flows/${flow._id}/duplicate`, {
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
      {/* Header */}
      <div style={{ 
        background: 'white', 
        border: '1px solid #e2e8f0', 
        borderRadius: '1rem', 
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', 
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              padding: '0.75rem', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', 
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}>
              <Workflow style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                Gestión de Flujos
              </h1>
              <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                Administra los flujos conversacionales de tu bot
              </p>
            </div>
          </div>
          
          <button
            onClick={handleCreateFlow}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
            }}
          >
            <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
            Crear Flujo
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              border: '2px solid #e2e8f0',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : flows.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            border: '1px solid #e2e8f0',
            padding: '3rem',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '5rem',
              height: '5rem',
              background: '#f1f5f9',
              borderRadius: '50%',
              marginBottom: '1.5rem'
            }}>
              <Bot style={{ width: '2.5rem', height: '2.5rem', color: '#94a3b8' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem' }}>
              No hay flujos creados
            </h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Crea tu primer flujo para comenzar
            </p>
            <button
              onClick={handleCreateFlow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            >
              <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
              Crear Primer Flujo
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {flows.map((flow) => (
              <div
                key={flow._id}
                style={{
                  background: 'white',
                  borderRadius: '1rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
                }}
              >
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                        {flow.nombre}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {flow.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      background: flow.activo ? '#dcfce7' : '#f1f5f9',
                      color: flow.activo ? '#15803d' : '#475569'
                    }}>
                      {flow.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Workflow style={{ width: '1rem', height: '1rem' }} />
                      {flow.categoria}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Settings style={{ width: '1rem', height: '1rem' }} />
                      {flow.startNode}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '1rem', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => handleSelectFlow(flow)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: 'white',
                      color: '#3b82f6',
                      border: '1px solid #bfdbfe',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    <Edit3 style={{ width: '1rem', height: '1rem' }} />
                    Editar
                  </button>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleToggleActive(flow._id, flow.activo)}
                      style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: flow.activo ? '#16a34a' : '#94a3b8'
                      }}
                      title={flow.activo ? 'Desactivar' : 'Activar'}
                    >
                      {flow.activo ? <Pause style={{ width: '1rem', height: '1rem' }} /> : <Play style={{ width: '1rem', height: '1rem' }} />}
                    </button>
                    
                    <button
                      onClick={() => handleDuplicateFlow(flow)}
                      style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                      title="Duplicar"
                    >
                      <Copy style={{ width: '1rem', height: '1rem' }} />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteFlow(flow._id)}
                      style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: '#dc2626'
                      }}
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
      </div>
    </DashboardLayout>
  );
}
