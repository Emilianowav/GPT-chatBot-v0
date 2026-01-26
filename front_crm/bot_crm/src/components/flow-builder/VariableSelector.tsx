import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, Database, Workflow, MessageSquare } from 'lucide-react';
import styles from './VariableSelector.module.css';

interface Variable {
  name: string;
  value: string;
  type: 'global' | 'node' | 'system';
  nodeId?: string;
  nodeLabel?: string;
  description?: string;
}

interface VariableSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (variable: string, label?: string) => void;
  position: { x: number; y: number };
  availableNodes?: Array<{ id: string; label: string; type: string }>;
  globalVariables?: string[];
}

export const VariableSelector: React.FC<VariableSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  position,
  availableNodes = [],
  globalVariables = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'global' | 'nodes' | 'system'>('nodes');
  const selectorRef = useRef<HTMLDivElement>(null);

  // Función para enmascarar valores sensibles (API keys, tokens, etc.)
  const shouldMaskVariable = (name: string): boolean => {
    const sensitivePatterns = ['api_key', 'token', 'secret', 'password', 'bearer'];
    return sensitivePatterns.some(pattern => name.toLowerCase().includes(pattern));
  };

  // Variables del sistema
  const systemVariables: Variable[] = [
    { name: 'mensaje_usuario', value: '{{mensaje_usuario}}', type: 'system', description: 'Mensaje actual del usuario' },
    { name: 'telefono_cliente', value: '{{telefono_cliente}}', type: 'system', description: 'Teléfono del cliente' },
    { name: 'telefono_empresa', value: '{{telefono_empresa}}', type: 'system', description: 'Teléfono de la empresa' },
    { name: 'phoneNumberId', value: '{{phoneNumberId}}', type: 'system', description: 'ID del número de WhatsApp' },
    { name: 'historial_conversacion', value: '{{historial_conversacion}}', type: 'system', description: 'Historial completo de la conversación' }
  ];

  // Variables globales
  const globalVars: Variable[] = globalVariables.map(name => {
    // Asegurar que name sea string
    const varName = typeof name === 'string' ? name : String(name);
    return {
      name: varName,
      value: `{{${varName}}}`,
      type: 'global' as const,
      description: 'Variable global'
    };
  });

  // Variables de nodos
  const nodeVariables: Variable[] = availableNodes.flatMap(node => {
    const baseVars = [
      { name: 'output', value: `{{${node.id}.output}}`, nodeId: node.id, nodeLabel: node.label }
    ];

    // Variables específicas por tipo de nodo
    if (node.type === 'gpt' || node.type === 'openai') {
      return [
        { 
          name: 'topico_identificado', 
          value: `{{${node.id}.topico_identificado}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Valor extraído (output variable)`
        },
        { 
          name: 'respuesta_gpt', 
          value: `{{${node.id}.respuesta_gpt}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Respuesta completa en texto`
        },
        { 
          name: 'output', 
          value: `{{${node.id}.output}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Output genérico`
        }
      ];
    } else if (node.type === 'http') {
      return [
        { 
          name: 'response', 
          value: `{{${node.id}.response}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Respuesta HTTP completa`
        },
        { 
          name: 'data', 
          value: `{{${node.id}.data}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Datos de la respuesta`
        },
        { 
          name: 'token', 
          value: `{{${node.id}.token}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Token de autenticación`
        },
        { 
          name: 'access_token', 
          value: `{{${node.id}.access_token}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Access token`
        },
        { 
          name: 'api_key', 
          value: `{{${node.id}.api_key}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - API Key`
        },
        { 
          name: 'id', 
          value: `{{${node.id}.id}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - ID del recurso`
        },
        { 
          name: 'status', 
          value: `{{${node.id}.status}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Código de estado HTTP`
        },
        { 
          name: 'output', 
          value: `{{${node.id}.output}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Output genérico`
        }
      ];
    } else if (node.type === 'mercadopago') {
      return [
        { 
          name: 'link_pago', 
          value: `{{${node.id}.link_pago}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Link de pago`
        },
        { 
          name: 'estado_pago', 
          value: `{{${node.id}.estado_pago}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Estado del pago`
        },
        { 
          name: 'output', 
          value: `{{${node.id}.output}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Output genérico`
        }
      ];
    } else if (node.type === 'woocommerce') {
      return [
        { 
          name: 'productos', 
          value: `{{${node.id}.productos}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Lista de productos`
        },
        { 
          name: 'output', 
          value: `{{${node.id}.output}}`, 
          nodeId: node.id, 
          nodeLabel: node.label,
          type: 'node' as const,
          description: `${node.label} - Output genérico`
        }
      ];
    }

    return baseVars.map(v => ({
      ...v,
      type: 'node' as const,
      description: `${node.label} - ${v.name}`
    }));
  });

  // Combinar todas las variables
  const allVariables = [...systemVariables, ...globalVars, ...nodeVariables];

  // Filtrar variables
  const filteredVariables = allVariables.filter(v => {
    const searchLower = searchTerm.toLowerCase();
    const nameLower = v.name && typeof v.name === 'string' ? v.name.toLowerCase() : '';
    const valueLower = v.value && typeof v.value === 'string' ? v.value.toLowerCase() : '';
    const descLower = v.description && typeof v.description === 'string' ? v.description.toLowerCase() : '';
    
    const matchesSearch = nameLower.includes(searchLower) ||
                         valueLower.includes(searchLower) ||
                         descLower.includes(searchLower);
    
    // Corregir filtro: 'nodes' debe matchear con tipo 'node'
    const matchesCategory = selectedCategory === 'all' || 
                           v.type === selectedCategory ||
                           (selectedCategory === 'nodes' && v.type === 'node');
    
    return matchesSearch && matchesCategory;
  });

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (variable: Variable) => {
    // Crear label legible: "Nodo - propiedad" o solo "variable"
    const label = variable.nodeLabel 
      ? `${variable.nodeLabel} - ${variable.name}`
      : variable.name;
    onSelect(variable.value, label);
    onClose();
  };

  const getCategoryIcon = (type: Variable['type']) => {
    switch (type) {
      case 'global':
        return <Database size={10} color="#3b82f6" />;
      case 'node':
        return <Workflow size={10} color="#8b5cf6" />;
      case 'system':
        return <MessageSquare size={10} color="#10b981" />;
    }
  };

  return (
    <div
      ref={selectorRef}
      className={styles.variableSelector}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.title}>Variables</h3>
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            <X size={10} />
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchContainer}>
          <div className={styles.searchIcon}>
            <Search size={10} />
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
        </div>

        {/* Categories */}
        <div className={styles.categories}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCategory('all');
            }}
            className={`${styles.categoryButton} ${selectedCategory === 'all' ? styles.active : ''}`}
          >
            Todas
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCategory('system');
            }}
            className={`${styles.categoryButton} ${selectedCategory === 'system' ? styles.activeGreen : ''}`}
          >
            Sistema
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCategory('global');
            }}
            className={`${styles.categoryButton} ${selectedCategory === 'global' ? styles.activeBlue : ''}`}
          >
            Globales
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCategory('nodes');
            }}
            className={`${styles.categoryButton} ${selectedCategory === 'nodes' ? styles.active : ''}`}
          >
            Nodos
          </button>
        </div>
      </div>

      {/* Variables List */}
      <div className={styles.variablesList}>
        {filteredVariables.length === 0 ? (
          <div className={styles.emptyState}>
            No hay variables
          </div>
        ) : (
          <div>
            {filteredVariables.map((variable, index) => (
              <button
                key={`${variable.value}-${index}`}
                onClick={() => handleSelect(variable)}
                className={styles.variableItem}
              >
                <div className={styles.variableIcon}>
                  {getCategoryIcon(variable.type)}
                </div>
                <div className={styles.variableContent}>
                  <div className={styles.variableName}>
                    {variable.nodeLabel ? `${variable.nodeLabel} - ${variable.name}` : variable.name}
                    {shouldMaskVariable(variable.name) && (
                      <span style={{ marginLeft: '6px', fontSize: '10px', color: '#9ca3af' }}>🔒</span>
                    )}
                  </div>
                  <code className={styles.variableValue}>
                    {variable.value}
                  </code>
                </div>
                <div className={styles.chevronIcon}>
                  <ChevronRight size={10} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerText}>
          {filteredVariables.length} var{filteredVariables.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};
