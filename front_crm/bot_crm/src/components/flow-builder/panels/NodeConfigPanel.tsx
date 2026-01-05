import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './NodeConfigPanel.module.css';

interface NodeConfigPanelProps {
  node: any;
  onClose: () => void;
  onSave: (nodeId: string, config: any) => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onClose, onSave }) => {
  const [config, setConfig] = useState(node?.data?.config || {});
  const [label, setLabel] = useState(node?.data?.label || '');

  useEffect(() => {
    setConfig(node?.data?.config || {});
    setLabel(node?.data?.label || '');
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    onSave(node.id, { ...config, label });
    onClose();
  };

  const renderGPTConfig = () => (
    <>
      <div className={styles.formGroup}>
        <label>Tipo de GPT</label>
        <select 
          value={config.tipo || 'conversacional'}
          onChange={(e) => setConfig({ ...config, tipo: e.target.value })}
        >
          <option value="conversacional">Conversacional</option>
          <option value="formateador">Formateador</option>
          <option value="procesador">Procesador</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Modelo</label>
        <select 
          value={config.modelo || 'gpt-4'}
          onChange={(e) => setConfig({ ...config, modelo: e.target.value })}
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Temperatura (0-1)</label>
        <input 
          type="number" 
          min="0" 
          max="1" 
          step="0.1"
          value={config.temperatura || 0.7}
          onChange={(e) => setConfig({ ...config, temperatura: parseFloat(e.target.value) })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Max Tokens</label>
        <input 
          type="number"
          value={config.max_tokens || 500}
          onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Prompt del Sistema</label>
        <textarea 
          rows={6}
          value={config.prompt_sistema || ''}
          onChange={(e) => setConfig({ ...config, prompt_sistema: e.target.value })}
          placeholder="Instrucciones para el modelo..."
        />
      </div>

      <div className={styles.formGroup}>
        <label>Variables de Entrada (separadas por coma)</label>
        <input 
          type="text"
          value={config.variables_entrada?.join(', ') || ''}
          onChange={(e) => setConfig({ 
            ...config, 
            variables_entrada: e.target.value.split(',').map(v => v.trim()).filter(v => v)
          })}
          placeholder="titulo, editorial, edicion"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Variables de Salida (separadas por coma)</label>
        <input 
          type="text"
          value={config.variables_salida?.join(', ') || ''}
          onChange={(e) => setConfig({ 
            ...config, 
            variables_salida: e.target.value.split(',').map(v => v.trim()).filter(v => v)
          })}
          placeholder="search_query, filters"
        />
      </div>
    </>
  );

  const renderWhatsAppConfig = () => (
    <>
      <div className={styles.formGroup}>
        <label>Tipo</label>
        <select 
          value={config.tipo || 'enviar_mensaje'}
          onChange={(e) => setConfig({ ...config, tipo: e.target.value })}
        >
          <option value="trigger">Trigger</option>
          <option value="enviar_mensaje">Enviar Mensaje</option>
          <option value="recopilar">Recopilar Datos</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Mensaje</label>
        <textarea 
          rows={4}
          value={config.mensaje || config.pregunta || ''}
          onChange={(e) => setConfig({ ...config, mensaje: e.target.value, pregunta: e.target.value })}
          placeholder="Mensaje a enviar o pregunta a hacer..."
        />
      </div>

      {config.tipo === 'recopilar' && (
        <>
          <div className={styles.formGroup}>
            <label>Nombre de Variable</label>
            <input 
              type="text"
              value={config.nombreVariable || ''}
              onChange={(e) => setConfig({ ...config, nombreVariable: e.target.value })}
              placeholder="nombre_variable"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tipo de Validación</label>
            <select 
              value={config.validacion?.tipo || 'texto'}
              onChange={(e) => setConfig({ 
                ...config, 
                validacion: { ...config.validacion, tipo: e.target.value }
              })}
            >
              <option value="texto">Texto</option>
              <option value="numero">Número</option>
              <option value="opcion">Opción</option>
            </select>
          </div>
        </>
      )}
    </>
  );

  const renderWooCommerceConfig = () => (
    <>
      <div className={styles.formGroup}>
        <label>Tipo</label>
        <select 
          value={config.tipo || 'buscar_productos'}
          onChange={(e) => setConfig({ ...config, tipo: e.target.value })}
        >
          <option value="buscar_productos">Buscar Productos</option>
          <option value="obtener_producto">Obtener Producto</option>
          <option value="crear_orden">Crear Orden</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Endpoint ID</label>
        <input 
          type="text"
          value={config.endpointId || config.endpoint || ''}
          onChange={(e) => setConfig({ ...config, endpointId: e.target.value, endpoint: e.target.value })}
          placeholder="buscar-productos"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Variable de Salida</label>
        <input 
          type="text"
          value={config.nombreVariable || ''}
          onChange={(e) => setConfig({ ...config, nombreVariable: e.target.value })}
          placeholder="productos_encontrados"
        />
      </div>
    </>
  );

  const renderMercadoPagoConfig = () => (
    <>
      <div className={styles.formGroup}>
        <label>Tipo</label>
        <select 
          value={config.tipo || 'crear_preferencia'}
          onChange={(e) => setConfig({ ...config, tipo: e.target.value })}
        >
          <option value="crear_preferencia">Crear Preferencia (Link de Pago)</option>
          <option value="verificar_pago">Verificar Pago</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Endpoint</label>
        <input 
          type="text"
          value={config.endpoint || '/checkout/preferences'}
          onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Variable de Salida</label>
        <input 
          type="text"
          value={config.nombreVariable || 'link_pago'}
          onChange={(e) => setConfig({ ...config, nombreVariable: e.target.value })}
          placeholder="link_pago, preference_id"
        />
      </div>
    </>
  );

  const renderWebhookConfig = () => (
    <>
      <div className={styles.formGroup}>
        <label>Tipo</label>
        <select 
          value={config.tipo || 'listener'}
          onChange={(e) => setConfig({ ...config, tipo: e.target.value })}
        >
          <option value="listener">Listener (Escuchar)</option>
          <option value="trigger">Trigger (Activar)</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Endpoint</label>
        <input 
          type="text"
          value={config.endpoint || ''}
          onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
          placeholder="/webhooks/mercadopago"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Método</label>
        <select 
          value={config.metodo || 'POST'}
          onChange={(e) => setConfig({ ...config, metodo: e.target.value })}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Timeout (segundos)</label>
        <input 
          type="number"
          value={config.timeout || 900}
          onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
        />
      </div>
    </>
  );

  const renderRouterConfig = () => (
    <>
      <div className={styles.formGroup}>
        <label>Tipo</label>
        <select 
          value={config.tipo || 'condicional'}
          onChange={(e) => setConfig({ ...config, tipo: e.target.value })}
        >
          <option value="condicional">Condicional</option>
          <option value="switch">Switch</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Condiciones (JSON)</label>
        <textarea 
          rows={6}
          value={JSON.stringify(config.condiciones || [], null, 2)}
          onChange={(e) => {
            try {
              setConfig({ ...config, condiciones: JSON.parse(e.target.value) });
            } catch (err) {
              // Mantener el valor actual si el JSON es inválido
            }
          }}
          placeholder='[{"nombre": "con_resultados", "expresion": "total > 0"}]'
        />
      </div>
    </>
  );

  const renderConfigByType = () => {
    switch (node.type) {
      case 'gpt':
        return renderGPTConfig();
      case 'whatsapp':
        return renderWhatsAppConfig();
      case 'woocommerce':
        return renderWooCommerceConfig();
      case 'mercadopago':
        return renderMercadoPagoConfig();
      case 'webhook':
        return renderWebhookConfig();
      case 'router':
        return renderRouterConfig();
      default:
        return <p>Tipo de nodo no soportado para edición</p>;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Configurar Nodo</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label>Nombre del Nodo</label>
            <input 
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nombre descriptivo..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tipo de Nodo</label>
            <input 
              type="text"
              value={node.type}
              disabled
              className={styles.disabled}
            />
          </div>

          <hr className={styles.divider} />

          {renderConfigByType()}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
