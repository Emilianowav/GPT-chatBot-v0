'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Copy, ChevronRight, ChevronDown } from 'lucide-react';
import styles from './EndpointFieldSelector.module.css';

interface Props {
  endpointId: string;
  endpoints: any[];
  apiBaseUrl?: string;
  apiAuth?: any;
  onFieldSelect: (field: string) => void;
  selectedField?: string;
  label?: string;
}

interface FieldNode {
  path: string;
  type: string;
  isArray: boolean;
  children?: FieldNode[];
  sample?: any;
}

export default function EndpointFieldSelector({ 
  endpointId, 
  endpoints,
  apiBaseUrl,
  apiAuth,
  onFieldSelect, 
  selectedField,
  label = "Campo"
}: Props) {
  const [loading, setLoading] = useState(false);
  const [fieldTree, setFieldTree] = useState<FieldNode[]>([]);
  const [sampleData, setSampleData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const endpoint = endpoints.find(e => (e._id || e.id) === endpointId);

  // Log al montar el componente
  console.log('🔵 EndpointFieldSelector montado con:');
  console.log('  - endpointId:', endpointId);
  console.log('  - apiBaseUrl:', apiBaseUrl);
  console.log('  - apiAuth:', apiAuth);
  console.log('  - endpoint encontrado:', endpoint);

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const extractFieldsRecursive = (data: any, parentPath: string = '', maxDepth: number = 5, currentDepth: number = 0): FieldNode[] => {
    if (currentDepth >= maxDepth || data === null || data === undefined) {
      return [];
    }

    const nodes: FieldNode[] = [];

    if (Array.isArray(data)) {
      // Si es un array vacío, no hay nada que extraer
      if (data.length === 0) {
        return [{
          path: parentPath || '[empty array]',
          type: 'array',
          isArray: true,
          sample: []
        }];
      }

      // Analizar el primer elemento del array
      const firstItem = data[0];
      const itemType = getValueType(firstItem);

      if (typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)) {
        // Array de objetos: extraer campos de los objetos
        const children = extractFieldsRecursive(firstItem, parentPath ? `${parentPath}[0]` : '[0]', maxDepth, currentDepth + 1);
        return children;
      } else {
        // Array de primitivos
        return [{
          path: parentPath || '[array]',
          type: `array<${itemType}>`,
          isArray: true,
          sample: data.slice(0, 3)
        }];
      }
    }

    if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        const value = data[key];
        const currentPath = parentPath ? `${parentPath}.${key}` : key;
        const valueType = getValueType(value);

        if (Array.isArray(value)) {
          if (value.length === 0) {
            nodes.push({
              path: currentPath,
              type: 'array',
              isArray: true,
              sample: []
            });
          } else {
            const firstItem = value[0];
            if (typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)) {
              // Array de objetos
              const children = extractFieldsRecursive(firstItem, `${currentPath}[0]`, maxDepth, currentDepth + 1);
              nodes.push({
                path: currentPath,
                type: 'array<object>',
                isArray: true,
                children,
                sample: value.slice(0, 2)
              });
            } else {
              // Array de primitivos
              nodes.push({
                path: currentPath,
                type: `array<${getValueType(firstItem)}>`,
                isArray: true,
                sample: value.slice(0, 3)
              });
            }
          }
        } else if (typeof value === 'object' && value !== null) {
          // Objeto anidado
          const children = extractFieldsRecursive(value, currentPath, maxDepth, currentDepth + 1);
          nodes.push({
            path: currentPath,
            type: 'object',
            isArray: false,
            children,
            sample: value
          });
        } else {
          // Primitivo
          nodes.push({
            path: currentPath,
            type: valueType,
            isArray: false,
            sample: value
          });
        }
      }
    }

    return nodes;
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const copyToClipboard = async () => {
    if (!sampleData) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(sampleData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const testEndpoint = async () => {
    if (!endpoint) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 DEBUG - Datos recibidos:');
      console.log('  - endpoint:', endpoint);
      console.log('  - apiBaseUrl:', apiBaseUrl);
      
      if (!endpoint.path) {
        throw new Error('El endpoint no tiene una ruta configurada');
      }

      // Usar el proxy del backend para evitar CORS
      const empresaId = localStorage.getItem('empresa_mongo_id');
      if (!empresaId) {
        throw new Error('No se encontró la empresa en localStorage');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Obtener el ID de la API desde la URL actual
      const apiId = window.location.pathname.split('/').pop();
      
      const proxyUrl = `${baseUrl}/api/modules/integrations/${empresaId}/apis/${apiId}/endpoints/${endpoint.id}/proxy`;

      console.log('🚀 Llamando al proxy del backend:');
      console.log('  URL:', proxyUrl);
      console.log('  Endpoint destino:', `${apiBaseUrl}${endpoint.path}`);
      console.log('');

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Respuesta recibida:');
      console.log('  Status:', response.status);
      console.log('  Status Text:', response.statusText);
      console.log('  Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Intentar leer el cuerpo del error
        let errorBody = '';
        try {
          errorBody = await response.text();
          console.log('  Error Body:', errorBody);
        } catch (e) {
          console.log('  No se pudo leer el cuerpo del error');
        }
        
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Respuesta exitosa del endpoint:', data);
      setSampleData(data);
      
      // Extraer campos recursivamente
      const extractedFields = extractFieldsRecursive(data);
      setFieldTree(extractedFields);
      
      // Auto-expandir el primer nivel
      const firstLevelPaths = extractedFields
        .filter(f => f.children && f.children.length > 0)
        .map(f => f.path);
      setExpandedPaths(new Set(firstLevelPaths));
      
      if (extractedFields.length === 0) {
        setError('No se encontraron campos en la respuesta');
      }
    } catch (err: any) {
      setError(err.message || 'Error al obtener datos del endpoint');
      console.error('❌ Error calling endpoint:', err);
    } finally {
      setLoading(false);
    }
  };

  // No llamar automáticamente, solo cuando el usuario haga click
  // useEffect(() => {
  //   if (endpointId) {
  //     testEndpoint();
  //   }
  // }, [endpointId]);

  if (!endpoint) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <AlertCircle size={16} />
          Selecciona un endpoint primero
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.labelGroup}>
          <label>{label}</label>
          {endpoint && (
            <span className={styles.endpointName}>
              {endpoint.metodo} {endpoint.nombre}
            </span>
          )}
        </div>
        <button 
          onClick={testEndpoint} 
          disabled={loading}
          className={styles.refreshBtn}
          title="Llamar al endpoint y obtener campos"
        >
          <RefreshCw size={14} className={loading ? styles.spinning : ''} />
          {!loading && 'Llamar'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <RefreshCw size={16} className={styles.spinning} />
          Llamando al endpoint...
        </div>
      )}

      {!loading && !sampleData && !error && (
        <div className={styles.info}>
          Haz click en "Llamar" para obtener los campos disponibles del endpoint
        </div>
      )}

      {!loading && fieldTree.length > 0 && (
        <>
          <div className={styles.fieldsHeader}>
            <span>Selecciona un campo:</span>
          </div>
          <div className={styles.fieldTree}>
            {renderFieldTree(fieldTree, 0)}
          </div>
        </>
      )}

      {!loading && fieldTree.length === 0 && !error && sampleData && (
        <div className={styles.empty}>
          No se encontraron campos en la respuesta
        </div>
      )}

      {sampleData && (
        <details className={styles.sample}>
          <summary>
            📄 Ver respuesta completa del endpoint
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard();
              }}
              className={styles.copyBtn}
              title="Copiar JSON"
            >
              <Copy size={14} />
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </summary>
          <pre>{JSON.stringify(sampleData, null, 2)}</pre>
        </details>
      )}
    </div>
  );

  function renderFieldTree(nodes: FieldNode[], depth: number): React.ReactElement[] {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedPaths.has(node.path);
      const isSelected = selectedField === node.path;

      return (
        <div key={node.path} className={styles.fieldNode} style={{ paddingLeft: `${depth * 16}px` }}>
          <div className={styles.fieldRow}>
            {hasChildren && (
              <button
                onClick={() => toggleExpand(node.path)}
                className={styles.expandBtn}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            {!hasChildren && <span className={styles.expandSpacer} />}
            
            <button
              onClick={() => onFieldSelect(node.path)}
              className={`${styles.fieldBtn} ${isSelected ? styles.selected : ''}`}
              title={`Tipo: ${node.type}${node.sample !== undefined ? ` | Ejemplo: ${JSON.stringify(node.sample)}` : ''}`}
            >
              {isSelected && <CheckCircle size={14} />}
              <code className={styles.fieldPath}>{node.path.split('.').pop()}</code>
              <span className={styles.fieldType}>{node.type}</span>
              {node.sample !== undefined && (
                <span className={styles.fieldSample}>
                  {typeof node.sample === 'object' 
                    ? JSON.stringify(node.sample).slice(0, 50) + '...'
                    : String(node.sample).slice(0, 30)}
                </span>
              )}
            </button>
          </div>
          
          {hasChildren && isExpanded && (
            <div className={styles.fieldChildren}>
              {renderFieldTree(node.children!, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  }
}
