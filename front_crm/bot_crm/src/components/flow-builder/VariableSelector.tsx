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
  onSelect: (variable: string) => void;
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
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'global' | 'nodes' | 'system'>('global');
  const selectorRef = useRef<HTMLDivElement>(null);

  // Variables del sistema
  const systemVariables: Variable[] = [
    { name: 'mensaje_usuario', value: '{{mensaje_usuario}}', type: 'system', description: 'Mensaje actual del usuario' },
    { name: 'telefono_cliente', value: '{{telefono_cliente}}', type: 'system', description: 'Teléfono del cliente' },
    { name: 'telefono_empresa', value: '{{telefono_empresa}}', type: 'system', description: 'Teléfono de la empresa' },
    { name: 'phoneNumberId', value: '{{phoneNumberId}}', type: 'system', description: 'ID del número de WhatsApp' },
    { name: 'historial_conversacion', value: '{{historial_conversacion}}', type: 'system', description: 'Historial completo de la conversación' }
  ];

  // Variables globales
  const globalVars: Variable[] = globalVariables.map(name => ({
    name,
    value: `{{${name}}}`,
    type: 'global' as const,
    description: 'Variable global'
  }));

  // Variables de nodos
  const nodeVariables: Variable[] = availableNodes.flatMap(node => {
    const baseVars = [
      { name: 'output', value: `{{${node.id}.output}}`, nodeId: node.id, nodeLabel: node.label },
      { name: 'success', value: `{{${node.id}.success}}`, nodeId: node.id, nodeLabel: node.label },
      { name: 'error', value: `{{${node.id}.error}}`, nodeId: node.id, nodeLabel: node.label }
    ];

    // Variables específicas por tipo de nodo
    if (node.type === 'gpt') {
      baseVars.push(
        { name: 'respuesta_gpt', value: `{{${node.id}.respuesta_gpt}}`, nodeId: node.id, nodeLabel: node.label },
        { name: 'tokens', value: `{{${node.id}.tokens}}`, nodeId: node.id, nodeLabel: node.label },
        { name: 'costo', value: `{{${node.id}.costo}}`, nodeId: node.id, nodeLabel: node.label }
      );
    } else if (node.type === 'mercadopago') {
      baseVars.push(
        { name: 'preferencia_id', value: `{{${node.id}.preferencia_id}}`, nodeId: node.id, nodeLabel: node.label },
        { name: 'link_pago', value: `{{${node.id}.link_pago}}`, nodeId: node.id, nodeLabel: node.label },
        { name: 'estado_pago', value: `{{${node.id}.estado_pago}}`, nodeId: node.id, nodeLabel: node.label },
        { name: 'mensaje', value: `{{${node.id}.mensaje}}`, nodeId: node.id, nodeLabel: node.label }
      );
    } else if (node.type === 'woocommerce') {
      baseVars.push(
        { name: 'productos', value: `{{${node.id}.productos}}`, nodeId: node.id, nodeLabel: node.label },
        { name: 'total_productos', value: `{{${node.id}.total_productos}}`, nodeId: node.id, nodeLabel: node.label }
      );
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
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || v.type === selectedCategory;
    
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
    onSelect(variable.value);
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
            onClick={() => setSelectedCategory('all')}
            className={`${styles.categoryButton} ${selectedCategory === 'all' ? styles.active : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedCategory('system')}
            className={`${styles.categoryButton} ${selectedCategory === 'system' ? styles.activeGreen : ''}`}
          >
            Sys
          </button>
          <button
            onClick={() => setSelectedCategory('global')}
            className={`${styles.categoryButton} ${selectedCategory === 'global' ? styles.activeBlue : ''}`}
          >
            Global
          </button>
          <button
            onClick={() => setSelectedCategory('nodes')}
            className={`${styles.categoryButton} ${selectedCategory === 'nodes' ? styles.active : ''}`}
          >
            Nodes
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
                    {variable.name}
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
