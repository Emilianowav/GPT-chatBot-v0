'use client';

// 🔧 Gestor de Endpoints CRUD
import { useState } from 'react';
import styles from './detalle.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Endpoint {
  id?: string; // El backend usa 'id' no '_id'
  nombre: string;
  descripcion?: string;
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string; // El backend usa 'path' no 'ruta'
  parametros?: any; // Puede ser array (frontend) u objeto (backend)
  headers?: Record<string, string>;
  body?: any;
  bodyPrueba?: string; // JSON de prueba para POST/PUT/PATCH
  respuestaEjemplo?: any;
}

interface Parameter {
  nombre: string;
  tipo: 'string' | 'number' | 'boolean' | 'object' | 'array';
  requerido: boolean;
  ubicacion: 'query' | 'path' | 'body' | 'header';
  descripcion?: string;
  valorPorDefecto?: any;
}

interface Props {
  api: any;
  onUpdate: () => void;
  onTest: (endpoint: Endpoint) => void;
}

export default function EndpointManager({ api, onUpdate, onTest }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [formData, setFormData] = useState<Endpoint>({
    nombre: '',
    metodo: 'GET',
    path: '',
    parametros: [],
    headers: {},
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    setEditingEndpoint(null);
    setFormData({
      nombre: '',
      metodo: 'GET',
      path: '',
      parametros: [],
      headers: {},
      bodyPrueba: '',
    });
    setShowForm(true);
  };

  const handleEdit = (endpoint: Endpoint) => {
    setEditingEndpoint(endpoint);
    // Convertir parametros de objeto a array para el formulario
    let parametrosArray = endpoint.parametros?.path || [];
    
    // Asegurar que cada parámetro tenga el campo 'ubicacion'
    parametrosArray = parametrosArray.map((param: any) => ({
      ...param,
      ubicacion: param.ubicacion || 'query' // Default a 'query' si no existe
    }));
    
    setFormData({
      ...endpoint,
      parametros: parametrosArray,
      bodyPrueba: endpoint.bodyPrueba || ''
    });
    setShowForm(true);
  };

  const handleAddParameter = () => {
    const currentParams = Array.isArray(formData.parametros) 
      ? formData.parametros 
      : [];
    
    setFormData({
      ...formData,
      parametros: [
        ...currentParams,
        {
          nombre: '',
          tipo: 'string',
          requerido: false,
          ubicacion: 'query',
        },
      ],
    });
  };

  const handleRemoveParameter = (index: number) => {
    const currentParams = Array.isArray(formData.parametros) 
      ? formData.parametros 
      : [];
    const newParams = [...currentParams];
    newParams.splice(index, 1);
    setFormData({ ...formData, parametros: newParams });
  };

  const handleParameterChange = (index: number, field: keyof Parameter, value: any) => {
    const currentParams = Array.isArray(formData.parametros) 
      ? formData.parametros 
      : [];
    const newParams = [...currentParams];
    newParams[index] = { ...newParams[index], [field]: value };
    setFormData({ ...formData, parametros: newParams });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingEndpoint
        ? `${API_BASE_URL}/api/modules/integrations/${api.empresaId}/apis/${api._id}/endpoints/${editingEndpoint.id}`
        : `${API_BASE_URL}/api/modules/integrations/${api.empresaId}/apis/${api._id}/endpoints`;

      const method = editingEndpoint ? 'PUT' : 'POST';

      // Transformar parametros de array a objeto organizando por ubicación
      const parametrosArray = Array.isArray(formData.parametros) 
        ? formData.parametros 
        : [];
      
      // Organizar parámetros por su ubicación
      const bodyParams = parametrosArray.filter((p: Parameter) => p.ubicacion === 'body');
      
      const parametrosTransformados: any = {
        path: parametrosArray.filter((p: Parameter) => p.ubicacion === 'path'),
        query: parametrosArray.filter((p: Parameter) => p.ubicacion === 'query'),
        headers: parametrosArray
          .filter((p: Parameter) => p.ubicacion === 'header')
          .reduce((acc: Record<string, string>, p: Parameter) => {
            acc[p.nombre] = p.valorPorDefecto || '';
            return acc;
          }, {})
      };
      
      // Solo agregar body si hay parámetros de body (como undefined, no como array vacío)
      if (bodyParams.length > 0) {
        parametrosTransformados.body = {
          tipo: 'json',
          schema: bodyParams.reduce((acc: any, p: Parameter) => {
            acc[p.nombre] = {
              tipo: p.tipo,
              requerido: p.requerido,
              descripcion: p.descripcion
            };
            return acc;
          }, {})
        };
      }

      const dataToSend = {
        ...formData,
        parametros: parametrosTransformados
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (result.success) {
        setShowForm(false);
        onUpdate();
      }
    } catch (err) {
      console.error('Error al guardar endpoint:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (endpointId: string) => {
    if (!confirm('¿Estás seguro de eliminar este endpoint?')) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/modules/integrations/${api.empresaId}/apis/${api._id}/endpoints/${endpointId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();
      if (result.success) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error al eliminar endpoint:', err);
    }
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: '#4CAF50',
      POST: '#2196F3',
      PUT: '#FF9800',
      DELETE: '#F44336',
      PATCH: '#9C27B0',
    };
    return colors[method] || '#666';
  };

  return (
    <div className={styles.endpointManager}>
      <div className={styles.managerHeader}>
        <h3>Endpoints Configurados</h3>
        <button className={styles.primaryButton} onClick={handleCreate}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Endpoint
        </button>
      </div>

      {/* Lista de Endpoints */}
      {api.endpoints.length === 0 ? (
        <div className={styles.emptyEndpoints}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <h4>No hay endpoints configurados</h4>
          <p>Crea tu primer endpoint para comenzar a usar esta API</p>
          <button className={styles.primaryButton} onClick={handleCreate}>
            Crear Primer Endpoint
          </button>
        </div>
      ) : (
        <div className={styles.endpointsList}>
          {api.endpoints.map((endpoint: Endpoint) => (
            <div key={endpoint.id} className={styles.endpointCard}>
              <div className={styles.endpointHeader}>
                <div className={styles.endpointTitle}>
                  <span
                    className={styles.methodBadge}
                    style={{ backgroundColor: getMethodColor(endpoint.metodo) }}
                  >
                    {endpoint.metodo}
                  </span>
                  <h4>{endpoint.nombre}</h4>
                </div>
                <div className={styles.endpointActions}>
                  <button
                    className={styles.testButton}
                    onClick={() => onTest(endpoint)}
                    title="Probar endpoint"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </button>
                  <button
                    className={styles.editIconButton}
                    onClick={() => handleEdit(endpoint)}
                    title="Editar"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    className={styles.deleteIconButton}
                    onClick={() => handleDelete(endpoint.id!)}
                    title="Eliminar"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className={styles.endpointPath}>
                <code>{api.baseUrl}{endpoint.path}</code>
              </div>

              {endpoint.descripcion && (
                <p className={styles.endpointDescription}>{endpoint.descripcion}</p>
              )}

              {endpoint.parametros && endpoint.parametros.length > 0 && (
                <div className={styles.endpointParams}>
                  <strong>Parámetros:</strong>
                  <div className={styles.paramsList}>
                    {endpoint.parametros.map((param: any, idx: number) => (
                      <span key={idx} className={styles.paramTag}>
                        {param.nombre}
                        {param.requerido && <span className={styles.required}>*</span>}
                        <span className={styles.paramType}>({param.tipo})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulario Modal */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingEndpoint ? 'Editar Endpoint' : 'Nuevo Endpoint'}</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowForm(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.endpointForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Obtener Productos"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Método *</label>
                  <select
                    value={formData.metodo}
                    onChange={(e) => setFormData({ ...formData, metodo: e.target.value as any })}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Ruta *</label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="/products"
                  required
                />
                <small>Ruta relativa a la URL base</small>
              </div>

              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del endpoint"
                  rows={2}
                />
              </div>

              {/* Body de Prueba - Solo para POST/PUT/PATCH */}
              {['POST', 'PUT', 'PATCH'].includes(formData.metodo) && (
                <div className={styles.formGroup}>
                  <label>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Body de Prueba (JSON)
                  </label>
                  <textarea
                    value={formData.bodyPrueba || ''}
                    onChange={(e) => setFormData({ ...formData, bodyPrueba: e.target.value })}
                    placeholder={`{\n  "campo": "valor",\n  "otro_campo": 123\n}`}
                    rows={8}
                    style={{ 
                      fontFamily: 'Monaco, Menlo, monospace', 
                      fontSize: '0.8rem',
                      lineHeight: '1.5'
                    }}
                  />
                  <small>JSON que se pre-cargará automáticamente al probar este endpoint</small>
                </div>
              )}

              {/* Parámetros */}
              <div className={styles.parametersSection}>
                <div className={styles.sectionHeader}>
                  <label>Parámetros</label>
                  <button
                    type="button"
                    className={styles.addParamButton}
                    onClick={handleAddParameter}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Agregar Parámetro
                  </button>
                </div>

                {formData.parametros && formData.parametros.length > 0 && (
                  <div className={styles.parametersList}>
                    {formData.parametros.map((param: Parameter, index: number) => (
                      <div key={index} className={styles.parameterCard}>
                        <div className={styles.parameterHeader}>
                          <h5>Parámetro {index + 1}</h5>
                          <button
                            type="button"
                            className={styles.removeParamButton}
                            onClick={() => handleRemoveParameter(index)}
                            title="Eliminar parámetro"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                        
                        <div className={styles.parameterFields}>
                          <div className={styles.paramField}>
                            <label>Nombre *</label>
                            <input
                              type="text"
                              value={param.nombre}
                              onChange={(e) => handleParameterChange(index, 'nombre', e.target.value)}
                              placeholder="search"
                              required
                            />
                          </div>
                          
                          <div className={styles.paramField}>
                            <label>Tipo *</label>
                            <select
                              value={param.tipo}
                              onChange={(e) => handleParameterChange(index, 'tipo', e.target.value)}
                            >
                              <option value="string">String</option>
                              <option value="number">Number</option>
                              <option value="boolean">Boolean</option>
                              <option value="object">Object</option>
                              <option value="array">Array</option>
                            </select>
                          </div>
                          
                          <div className={styles.paramField}>
                            <label>Ubicación *</label>
                            <select
                              value={param.ubicacion}
                              onChange={(e) => handleParameterChange(index, 'ubicacion', e.target.value)}
                            >
                              <option value="query">Query</option>
                              <option value="path">Path</option>
                              <option value="body">Body</option>
                              <option value="header">Header</option>
                            </select>
                          </div>
                          
                          <div className={styles.paramField}>
                            <label className={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={param.requerido}
                                onChange={(e) => handleParameterChange(index, 'requerido', e.target.checked)}
                              />
                              <span>Requerido</span>
                            </label>
                          </div>
                          
                          <div className={styles.paramFieldFull}>
                            <label>Descripción</label>
                            <textarea
                              value={param.descripcion || ''}
                              onChange={(e) => handleParameterChange(index, 'descripcion', e.target.value)}
                              placeholder="Término de búsqueda (nombre o SKU). Búsqueda inteligente con normalización"
                              rows={2}
                            />
                          </div>
                          
                          <div className={styles.paramField}>
                            <label>Valor por defecto</label>
                            <input
                              type="text"
                              value={param.valorPorDefecto || ''}
                              onChange={(e) => handleParameterChange(index, 'valorPorDefecto', e.target.value)}
                              placeholder="10"
                            />
                            <small>Opcional. Ejemplo: 10, true, "default"</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : editingEndpoint ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
