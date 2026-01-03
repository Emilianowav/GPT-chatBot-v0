'use client';

import { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';

interface FlowNode {
  _id?: string;
  empresaId?: string;
  flowId?: string;
  id: string;
  type: string;
  name: string;
  message?: string;
  options?: Array<{ text: string; value?: string; next?: string; url?: string }>;
  validation?: {
    type: string;
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage?: string;
  };
  conditions?: Array<{
    if?: string;
    else?: string;
    next?: string;
    operator?: string;
    value?: any;
  }>;
  action?: {
    type: string;
    config?: any;
    onSuccess?: string;
    onError?: string;
  };
  next?: string;
  activo: boolean;
}

interface NodeEditorProps {
  node: FlowNode | null;
  nodes: FlowNode[];
  onSave: (node: FlowNode) => void;
  onCancel: () => void;
}

const nodeTypes = [
  { value: 'menu', label: 'Menú', description: 'Opciones múltiples' },
  { value: 'input', label: 'Input', description: 'Captura de datos' },
  { value: 'message', label: 'Mensaje', description: 'Mensaje simple' },
  { value: 'condition', label: 'Condición', description: 'Lógica condicional' },
  { value: 'action', label: 'Acción', description: 'Ejecutar acción' },
  { value: 'api_call', label: 'API Call', description: 'Llamada a API' },
  { value: 'gpt', label: 'GPT', description: 'Respuesta con IA' }
];

const validationTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'date', label: 'Fecha' },
  { value: 'regex', label: 'Regex' }
];

const actionTypes = [
  { value: 'create_payment_link', label: 'Generar Link de Pago' },
  { value: 'api_call', label: 'Llamar API' },
  { value: 'save_data', label: 'Guardar Datos' },
  { value: 'send_email', label: 'Enviar Email' },
  { value: 'gpt_response', label: 'Respuesta GPT' }
];

const conditionOperators = [
  { value: 'eq', label: 'Igual (=)' },
  { value: 'neq', label: 'Diferente (≠)' },
  { value: 'gt', label: 'Mayor (>)' },
  { value: 'lt', label: 'Menor (<)' },
  { value: 'gte', label: 'Mayor o igual (≥)' },
  { value: 'lte', label: 'Menor o igual (≤)' },
  { value: 'contains', label: 'Contiene' },
  { value: 'exists', label: 'Existe' }
];

export default function NodeEditor({ node, nodes, onSave, onCancel }: NodeEditorProps) {
  const [nodeData, setNodeData] = useState<FlowNode>(node || {
    id: '',
    type: 'menu',
    name: '',
    message: '',
    activo: true
  });

  useEffect(() => {
    if (node) {
      setNodeData(node);
    }
  }, [node]);

  const handleAddOption = () => {
    const options = nodeData.options || [];
    setNodeData({
      ...nodeData,
      options: [...options, { text: '', next: '' }]
    });
  };

  const handleRemoveOption = (index: number) => {
    const options = [...(nodeData.options || [])];
    options.splice(index, 1);
    setNodeData({ ...nodeData, options });
  };

  const handleUpdateOption = (index: number, field: string, value: string) => {
    const options = [...(nodeData.options || [])];
    options[index] = { ...options[index], [field]: value };
    setNodeData({ ...nodeData, options });
  };

  const handleAddCondition = () => {
    const conditions = nodeData.conditions || [];
    setNodeData({
      ...nodeData,
      conditions: [...conditions, { if: '', operator: 'eq', value: '', next: '' }]
    });
  };

  const handleRemoveCondition = (index: number) => {
    const conditions = [...(nodeData.conditions || [])];
    conditions.splice(index, 1);
    setNodeData({ ...nodeData, conditions });
  };

  const handleUpdateCondition = (index: number, field: string, value: any) => {
    const conditions = [...(nodeData.conditions || [])];
    conditions[index] = { ...conditions[index], [field]: value };
    setNodeData({ ...nodeData, conditions });
  };

  const handleSave = () => {
    if (!nodeData.id || !nodeData.name) {
      alert('Por favor completa el ID y el nombre del nodo');
      return;
    }
    onSave(nodeData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 h-[calc(100vh-16rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-900">
          {node ? 'Editar Nodo' : 'Nuevo Nodo'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button
            onClick={onCancel}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Información Básica */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ID del Nodo *
            </label>
            <input
              type="text"
              value={nodeData.id}
              onChange={(e) => setNodeData({ ...nodeData, id: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: main_menu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre del Nodo *
            </label>
            <input
              type="text"
              value={nodeData.name}
              onChange={(e) => setNodeData({ ...nodeData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Menú Principal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Nodo *
            </label>
            <select
              value={nodeData.type}
              onChange={(e) => setNodeData({ ...nodeData, type: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {nodeTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mensaje */}
        {['menu', 'input', 'message', 'gpt'].includes(nodeData.type) && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mensaje
            </label>
            <textarea
              value={nodeData.message || ''}
              onChange={(e) => setNodeData({ ...nodeData, message: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Escribe el mensaje que verá el usuario..."
            />
            <p className="mt-2 text-xs text-slate-500">
              Puedes usar variables con {'{{'} variable {'}}'}
            </p>
          </div>
        )}

        {/* Opciones (para menu) */}
        {nodeData.type === 'menu' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Opciones</label>
              <button
                onClick={handleAddOption}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
            <div className="space-y-3">
              {(nodeData.options || []).map((option, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Opción {index + 1}</span>
                    <button
                      onClick={() => handleRemoveOption(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleUpdateOption(index, 'text', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Texto de la opción"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={option.value || ''}
                      onChange={(e) => handleUpdateOption(index, 'value', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Valor (opcional)"
                    />
                    <select
                      value={option.next || ''}
                      onChange={(e) => handleUpdateOption(index, 'next', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">Siguiente nodo...</option>
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={option.url || ''}
                    onChange={(e) => handleUpdateOption(index, 'url', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="URL (opcional)"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validación (para input) */}
        {nodeData.type === 'input' && (
          <div className="space-y-4">
            <label className="text-sm font-medium text-slate-700">Validación</label>
            <select
              value={nodeData.validation?.type || 'text'}
              onChange={(e) => setNodeData({
                ...nodeData,
                validation: { ...nodeData.validation, type: e.target.value }
              })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
            >
              {validationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={nodeData.validation?.min || ''}
                onChange={(e) => setNodeData({
                  ...nodeData,
                  validation: { ...nodeData.validation, type: nodeData.validation?.type || 'text', min: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                placeholder="Mínimo"
              />
              <input
                type="number"
                value={nodeData.validation?.max || ''}
                onChange={(e) => setNodeData({
                  ...nodeData,
                  validation: { ...nodeData.validation, type: nodeData.validation?.type || 'text', max: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
                placeholder="Máximo"
              />
            </div>

            <input
              type="text"
              value={nodeData.validation?.errorMessage || ''}
              onChange={(e) => setNodeData({
                ...nodeData,
                validation: { ...nodeData.validation, type: nodeData.validation?.type || 'text', errorMessage: e.target.value }
              })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
              placeholder="Mensaje de error"
            />
          </div>
        )}

        {/* Condiciones */}
        {nodeData.type === 'condition' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Condiciones</label>
              <button
                onClick={handleAddCondition}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>
            <div className="space-y-3">
              {(nodeData.conditions || []).map((condition, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Condición {index + 1}</span>
                    <button
                      onClick={() => handleRemoveCondition(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={condition.if || ''}
                    onChange={(e) => handleUpdateCondition(index, 'if', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Variable a evaluar"
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={condition.operator || 'eq'}
                      onChange={(e) => handleUpdateCondition(index, 'operator', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      {conditionOperators.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      value={condition.value || ''}
                      onChange={(e) => handleUpdateCondition(index, 'value', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Valor"
                    />
                  </div>
                  
                  <select
                    value={condition.next || ''}
                    onChange={(e) => handleUpdateCondition(index, 'next', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="">Si cumple, ir a...</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acción */}
        {nodeData.type === 'action' && (
          <div className="space-y-4">
            <label className="text-sm font-medium text-slate-700">Acción</label>
            <select
              value={nodeData.action?.type || ''}
              onChange={(e) => setNodeData({
                ...nodeData,
                action: { ...nodeData.action, type: e.target.value }
              })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
            >
              <option value="">Seleccionar acción...</option>
              {actionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <textarea
              value={JSON.stringify(nodeData.action?.config || {}, null, 2)}
              onChange={(e) => {
                try {
                  const config = JSON.parse(e.target.value);
                  setNodeData({
                    ...nodeData,
                    action: { ...nodeData.action, type: nodeData.action?.type || '', config }
                  });
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg font-mono text-sm"
              rows={6}
              placeholder='{"key": "value"}'
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Si tiene éxito</label>
                <select
                  value={nodeData.action?.onSuccess || ''}
                  onChange={(e) => setNodeData({
                    ...nodeData,
                    action: { ...nodeData.action, type: nodeData.action?.type || '', onSuccess: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">Siguiente nodo...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Si falla</label>
                <select
                  value={nodeData.action?.onError || ''}
                  onChange={(e) => setNodeData({
                    ...nodeData,
                    action: { ...nodeData.action, type: nodeData.action?.type || '', onError: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">Siguiente nodo...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Siguiente Nodo */}
        {!['menu', 'condition', 'action'].includes(nodeData.type) && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Siguiente Nodo
            </label>
            <select
              value={nodeData.next || ''}
              onChange={(e) => setNodeData({ ...nodeData, next: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
            >
              <option value="">Seleccionar nodo...</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Estado */}
        <div className="border-t border-slate-200 pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={nodeData.activo}
              onChange={(e) => setNodeData({ ...nodeData, activo: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-900">Nodo Activo</span>
              <p className="text-xs text-slate-600">El nodo estará disponible en el flujo</p>
            </div>
          </label>
        </div>

        {/* Ayuda */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Tip:</p>
              <p>Usa variables con {'{{'} nombreVariable {'}}'} en los mensajes para personalizar las respuestas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
