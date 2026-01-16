import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, Database, Workflow, MessageSquare } from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'global' | 'nodes' | 'system'>('all');
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
        return <Database className="w-4 h-4 text-blue-500" />;
      case 'node':
        return <Workflow className="w-4 h-4 text-purple-500" />;
      case 'system':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div
      ref={selectorRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-[9999] w-96 max-h-[500px] flex flex-col"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-50%)'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Seleccionar Variable</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            autoFocus
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedCategory === 'all'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setSelectedCategory('system')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedCategory === 'system'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Sistema
          </button>
          <button
            onClick={() => setSelectedCategory('global')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedCategory === 'global'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Globales
          </button>
          <button
            onClick={() => setSelectedCategory('nodes')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedCategory === 'nodes'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Nodos
          </button>
        </div>
      </div>

      {/* Variables List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredVariables.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No se encontraron variables
          </div>
        ) : (
          <div className="space-y-1">
            {filteredVariables.map((variable, index) => (
              <button
                key={`${variable.value}-${index}`}
                onClick={() => handleSelect(variable)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getCategoryIcon(variable.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {variable.name}
                      </span>
                      {variable.nodeLabel && (
                        <span className="text-xs text-gray-500 truncate">
                          ({variable.nodeLabel})
                        </span>
                      )}
                    </div>
                    <code className="text-xs text-purple-600 font-mono">
                      {variable.value}
                    </code>
                    {variable.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {variable.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          {filteredVariables.length} variable{filteredVariables.length !== 1 ? 's' : ''} disponible{filteredVariables.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};
