import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './NodeConfigPanel.module.css';
import GPTConfigPanel from './GPTConfigPanel';

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

  const renderGPTConfig = () => {
    // Inicializar config con valores por defecto si no existen
    const gptConfig = {
      tipo: config.tipo || 'conversacional',
      module: config.module || 'conversacional',
      modelo: config.modelo || 'gpt-4',
      temperatura: config.temperatura !== undefined ? config.temperatura : 0.7,
      maxTokens: config.maxTokens || 500,
      instrucciones: config.instrucciones || '',
      personalidad: config.personalidad || '',
      topicos: config.topicos || [],
      variablesRecopilar: config.variablesRecopilar || [],
      accionesCompletado: config.accionesCompletado || [],
      variablesEntrada: config.variablesEntrada || [],
      variablesSalida: config.variablesSalida || [],
      globalVariablesOutput: config.globalVariablesOutput || [],
      outputFormat: config.outputFormat || 'text',
      jsonSchema: config.jsonSchema,
      systemPrompt: config.systemPrompt,
      configuracionExtraccion: config.configuracionExtraccion || undefined
    };

    return (
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <GPTConfigPanel 
          config={gptConfig}
          onChange={(newConfig) => setConfig(newConfig)}
        />
      </div>
    );
  };

  const renderWhatsAppConfig = () => {
    // Si es Watch Events, mostrar configuración simplificada
    if (config.module === 'watch-events') {
      return (
        <>
          <div className={styles.section}>
            <h3>WhatsApp Watch Events (Listener)</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              Este nodo escucha automáticamente los mensajes entrantes de WhatsApp.
            </p>
            
            <div className={styles.formGroup}>
              <label>Phone Number ID</label>
              <input 
                type="text"
                value={config.phoneNumberId || ''}
                onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                placeholder="906667632531979"
              />
              <small>ID del número de WhatsApp Business</small>
            </div>

            <div className={styles.formGroup}>
              <label>Empresa ID</label>
              <input 
                type="text"
                value={config.empresaId || ''}
                onChange={(e) => setConfig({ ...config, empresaId: e.target.value })}
                placeholder="6940a9a181b92bfce970fdb5"
              />
              <small>ID de la empresa en la base de datos</small>
            </div>
          </div>
        </>
      );
    }

    // Configuración normal de WhatsApp (Send Message, etc.)
    return (
      <>
        <div className={styles.formGroup}>
          <label>Phone Number ID</label>
          <input 
            type="text"
            value={config.phoneNumberId || ''}
            onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
            placeholder="906667632531979"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Destinatario (To)</label>
          <input 
            type="text"
            value={config.to || ''}
            onChange={(e) => setConfig({ ...config, to: e.target.value })}
            placeholder="{{1.from}}"
          />
          <small>Usar variables como {`{{1.from}}`} para responder al remitente</small>
        </div>

        <div className={styles.formGroup}>
          <label>Mensaje</label>
          <textarea 
            rows={6}
            value={config.message || ''}
            onChange={(e) => setConfig({ ...config, message: e.target.value })}
            placeholder="Mensaje a enviar. Usa variables como {{gpt-conversacional.respuesta_gpt}}"
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
          <small>Puedes usar variables de nodos anteriores: {`{{nodeId.variable}}`}</small>
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
  };

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

  const renderRouterConfig = () => {
    const routes = config.routes || [];
    
    return (
      <>
        <div className={styles.formGroup}>
          <label>Rutas del Router</label>
          <small>Cada ruta representa un camino posible basado en condiciones</small>
        </div>

        {routes.map((route: any, index: number) => (
          <div key={index} className={styles.routeConfig}>
            <h4>Ruta {index + 1}: {route.label}</h4>
            
            <div className={styles.formGroup}>
              <label>ID de Ruta</label>
              <input 
                type="text"
                value={route.id || ''}
                onChange={(e) => {
                  const newRoutes = [...routes];
                  newRoutes[index] = { ...route, id: e.target.value };
                  setConfig({ ...config, routes: newRoutes });
                }}
                placeholder="info-completa"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Label</label>
              <input 
                type="text"
                value={route.label || ''}
                onChange={(e) => {
                  const newRoutes = [...routes];
                  newRoutes[index] = { ...route, label: e.target.value };
                  setConfig({ ...config, routes: newRoutes });
                }}
                placeholder="Información Completa"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Campo a Evaluar</label>
              <input 
                type="text"
                value={route.condition?.field || ''}
                onChange={(e) => {
                  const newRoutes = [...routes];
                  newRoutes[index] = { 
                    ...route, 
                    condition: { ...route.condition, field: e.target.value }
                  };
                  setConfig({ ...config, routes: newRoutes });
                }}
                placeholder="gpt-conversacional.respuesta_gpt"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Operador</label>
              <select 
                value={route.condition?.operator || 'contains'}
                onChange={(e) => {
                  const newRoutes = [...routes];
                  newRoutes[index] = { 
                    ...route, 
                    condition: { ...route.condition, operator: e.target.value }
                  };
                  setConfig({ ...config, routes: newRoutes });
                }}
              >
                <option value="contains">Contains</option>
                <option value="not_contains">Not Contains</option>
                <option value="equal">Equal</option>
                <option value="not_equal">Not Equal</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="is_empty">Is Empty</option>
                <option value="not_empty">Not Empty</option>
                <option value="regex">Regex</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Valor</label>
              <input 
                type="text"
                value={route.condition?.value || ''}
                onChange={(e) => {
                  const newRoutes = [...routes];
                  newRoutes[index] = { 
                    ...route, 
                    condition: { ...route.condition, value: e.target.value }
                  };
                  setConfig({ ...config, routes: newRoutes });
                }}
                placeholder="[INFO_COMPLETA]"
              />
            </div>
          </div>
        ))}
      </>
    );
  };

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
