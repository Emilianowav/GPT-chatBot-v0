# 🔌 Guía de Implementación de Integraciones en Marketplace

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura General](#arquitectura-general)
3. [Checklist de Implementación](#checklist-de-implementación)
4. [Paso a Paso](#paso-a-paso)
5. [Patrones de Autenticación](#patrones-de-autenticación)
6. [Ejemplos por Tipo](#ejemplos-por-tipo)
7. [Best Practices](#best-practices)

---

## 🎯 Introducción

Esta guía establece los lineamientos para desarrollar nuevas integraciones en el módulo de Marketplace siguiendo el patrón de Google Calendar.

### Principios Fundamentales

1. **Seguridad First**: Todas las credenciales encriptadas
2. **Consistencia**: Seguir estructura existente
3. **Escalabilidad**: Soportar múltiples empresas
4. **Mantenibilidad**: Código limpio y documentado
5. **Resiliencia**: Manejo robusto de errores

---

## 🏗️ Arquitectura General

### Estructura de Archivos

```
backend/src/
├── models/
│   └── MarketplaceIntegration.ts          # Modelo único
├── services/
│   ├── encryptionService.ts               # Compartido
│   ├── {provider}Service.ts               # Específico
│   └── marketplaceSyncService.ts          # Jobs
├── controllers/
│   └── marketplaceController.ts           # Agregar métodos
├── routes/
│   └── marketplaceRoutes.ts               # Agregar rutas
└── utils/
    └── asyncHandler.ts                    # Compartido
```

---

## ✅ Checklist de Implementación

### Fase 1: Planificación
- [ ] Investigar API del proveedor
- [ ] Definir casos de uso
- [ ] Identificar datos a almacenar
- [ ] Definir configuración específica

### Fase 2: Modelo
- [ ] Agregar tipo en `IntegrationProvider`
- [ ] Definir interface de configuración
- [ ] Documentar estructura

### Fase 3: Servicio
- [ ] Crear `{provider}Service.ts`
- [ ] Implementar autenticación
- [ ] Implementar métodos CRUD
- [ ] Implementar refresh (si aplica)
- [ ] Manejo de errores

### Fase 4: Controlador
- [ ] Agregar métodos en controller
- [ ] Validar inputs
- [ ] Manejar errores
- [ ] Respuestas consistentes

### Fase 5: Rutas
- [ ] Agregar rutas
- [ ] Aplicar `authenticate`
- [ ] Envolver con `asyncHandler`
- [ ] Documentar endpoints

### Fase 6: Testing
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Pruebas end-to-end

---

## 📝 Paso a Paso

### 1. Agregar Tipo de Provider

**Archivo**: `src/models/MarketplaceIntegration.ts`

```typescript
export type IntegrationProvider = 
  | 'google_calendar' 
  | 'woocommerce'      // ← Agregar
  | 'zapier'           // ← Agregar
  | 'slack';
```

### 2. Definir Configuración

```typescript
export interface WooCommerceConfig {
  store_url: string;
  sync_products?: boolean;
  sync_orders?: boolean;
  order_statuses?: string[];
}

export interface IntegrationConfig {
  google_calendar?: GoogleCalendarConfig;
  woocommerce?: WooCommerceConfig;  // ← Agregar
  [key: string]: any;
}
```

### 3. Crear Servicio

**Archivo**: `src/services/woocommerceService.ts`

```typescript
import axios from 'axios';
import { encryptCredentials, decryptCredentials } from './encryptionService.js';
import { MarketplaceIntegrationModel } from '../models/MarketplaceIntegration.js';

/**
 * Guarda integración de WooCommerce
 */
export async function saveWooCommerceIntegration(
  empresaId: string,
  usuarioEmpresaId: string,
  storeUrl: string,
  consumerKey: string,
  consumerSecret: string
) {
  const encryptedCredentials = encryptCredentials({
    access_token: consumerKey,
    refresh_token: consumerSecret,
    token_type: 'basic',
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    scope: 'read_write'
  });
  
  const integration = new MarketplaceIntegrationModel({
    empresaId,
    usuarioEmpresaId,
    provider: 'woocommerce',
    provider_name: 'WooCommerce',
    credentials: encryptedCredentials,
    status: 'active',
    connected_account: storeUrl,
    config: {
      woocommerce: {
        store_url: storeUrl,
        sync_products: true,
        sync_orders: true
      }
    },
    createdBy: usuarioEmpresaId
  });
  
  await integration.save();
  return integration;
}

/**
 * Lista productos
 */
export async function listProducts(integration, params) {
  const credentials = decryptCredentials(integration.credentials);
  const storeUrl = integration.config.woocommerce?.store_url;
  
  const response = await axios.get(
    `${storeUrl}/wp-json/wc/v3/products`,
    {
      auth: {
        username: credentials.access_token,
        password: credentials.refresh_token
      },
      params
    }
  );
  
  return response.data;
}
```

### 4. Agregar Controladores

**Archivo**: `src/controllers/marketplaceController.ts`

```typescript
export async function connectWooCommerce(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const { storeUrl, consumerKey, consumerSecret } = req.body;
    const usuarioEmpresaId = (req as any).user?.id;

    await woocommerceService.saveWooCommerceIntegration(
      empresaId,
      usuarioEmpresaId,
      storeUrl,
      consumerKey,
      consumerSecret
    );

    res.json({
      success: true,
      message: 'WooCommerce conectado exitosamente'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

export async function listWooCommerceProducts(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;

    const integration = await MarketplaceIntegrationModel.findOne({
      empresaId,
      provider: 'woocommerce',
      status: 'active'
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'No hay integración activa'
      });
    }

    const products = await woocommerceService.listProducts(
      integration,
      req.query
    );

    res.json({
      success: true,
      products
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
```

### 5. Agregar Rutas

**Archivo**: `src/routes/marketplaceRoutes.ts`

```typescript
// WooCommerce
router.post(
  '/:empresaId/woocommerce/connect',
  authenticate,
  asyncHandler(marketplaceController.connectWooCommerce)
);

router.get(
  '/:empresaId/woocommerce/products',
  authenticate,
  asyncHandler(marketplaceController.listWooCommerceProducts)
);
```

### 6. Variables de Entorno

```bash
# .env
WOOCOMMERCE_CALLBACK_URL=http://localhost:3000/api/marketplace/woocommerce/callback
```

---

## 🔐 Patrones de Autenticación

### OAuth 2.0 (Google, Microsoft)

```typescript
// Generar URL
export function getAuthUrl(empresaId, usuarioId) {
  const state = Buffer.from(JSON.stringify({ empresaId, usuarioId }))
    .toString('base64');
  return `${AUTH_URL}?client_id=${CLIENT_ID}&state=${state}`;
}

// Intercambiar código
export async function exchangeCode(code) {
  const response = await axios.post(TOKEN_URL, {
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code'
  });
  return response.data;
}

// Refresh
export async function refreshToken(refreshToken) {
  const response = await axios.post(TOKEN_URL, {
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token'
  });
  return response.data;
}
```

### API Key (WooCommerce, Stripe)

```typescript
// Almacenar
const credentials = encryptCredentials({
  access_token: consumerKey,
  refresh_token: consumerSecret,
  token_type: 'basic',
  expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  scope: 'read_write'
});

// Usar
await axios.get(API_URL, {
  auth: {
    username: consumerKey,
    password: consumerSecret
  }
});
```

### Bearer Token (Zapier, Slack)

```typescript
// Almacenar
const credentials = encryptCredentials({
  access_token: bearerToken,
  refresh_token: '',
  token_type: 'Bearer',
  expires_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
  scope: 'full_access'
});

// Usar
await axios.get(API_URL, {
  headers: {
    Authorization: `Bearer ${bearerToken}`
  }
});
```

---

## 📚 Ejemplos por Tipo

### E-commerce (WooCommerce, Shopify)

**Endpoints:**
- `GET /:empresaId/{provider}/products`
- `POST /:empresaId/{provider}/products`
- `GET /:empresaId/{provider}/orders`
- `PUT /:empresaId/{provider}/orders/:id`

**Sincronización:**
```typescript
export async function syncOrders() {
  const integrations = await MarketplaceIntegrationModel.find({
    provider: 'woocommerce',
    status: 'active'
  });

  for (const integration of integrations) {
    const orders = await getRecentOrders(integration);
    // Procesar...
  }
}
```

### Automatización (Zapier, Make)

**Endpoints:**
- `POST /:empresaId/{provider}/trigger`
- `POST /:empresaId/{provider}/webhook`

**Implementación:**
```typescript
export async function triggerWebhook(integration, event, data) {
  const webhookUrl = integration.config.zapier?.webhook_url;
  await axios.post(webhookUrl, { event, data });
}
```

### Comunicación (Slack, Teams)

**Endpoints:**
- `POST /:empresaId/{provider}/message`
- `GET /:empresaId/{provider}/channels`

**Implementación:**
```typescript
export async function sendMessage(integration, channel, text) {
  const credentials = decryptCredentials(integration.credentials);
  await axios.post('https://slack.com/api/chat.postMessage', {
    channel,
    text
  }, {
    headers: {
      Authorization: `Bearer ${credentials.access_token}`
    }
  });
}
```

---

## 🎯 Best Practices

### Seguridad

```typescript
// ✅ Encriptar credenciales
const encrypted = encryptCredentials({ ... });

// ✅ Validar webhooks
if (!verifySignature(payload, signature, secret)) {
  return res.status(401).json({ error: 'Invalid' });
}

// ✅ Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
```

### Manejo de Errores

```typescript
try {
  const result = await apiCall();
  return result;
} catch (error: any) {
  console.error('❌ Error:', error.response?.data || error.message);
  
  // Actualizar estado si es error crítico
  if (error.response?.status === 401) {
    integration.status = 'error';
    integration.error_message = 'Credenciales inválidas';
    await integration.save();
  }
  
  throw new Error('Error descriptivo para el usuario');
}
```

### Logging

```typescript
console.log(`🔄 Sincronizando ${provider} para ${empresaId}...`);
console.log(`✅ ${count} items sincronizados`);
console.error(`❌ Error en ${provider}: ${error.message}`);
```

### Retry Logic

```typescript
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## 🧪 Testing

### Test de Servicio

```typescript
describe('WooCommerceService', () => {
  it('debe listar productos', async () => {
    const integration = await createTestIntegration();
    const products = await listProducts(integration);
    expect(products).toBeInstanceOf(Array);
  });
});
```

### Test de Endpoint

```typescript
describe('POST /api/marketplace/:empresaId/woocommerce/connect', () => {
  it('debe conectar WooCommerce', async () => {
    const response = await request(app)
      .post('/api/marketplace/test/woocommerce/connect')
      .set('Authorization', `Bearer ${token}`)
      .send({
        storeUrl: 'https://test.com',
        consumerKey: 'ck_test',
        consumerSecret: 'cs_test'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

---

## 📊 Checklist Final

Antes de considerar completa una integración:

- [ ] Modelo actualizado con nuevo provider
- [ ] Servicio creado y testeado
- [ ] Controladores implementados
- [ ] Rutas agregadas y documentadas
- [ ] Variables de entorno configuradas
- [ ] Credenciales encriptadas correctamente
- [ ] Manejo de errores robusto
- [ ] Logs descriptivos
- [ ] Tests unitarios pasando
- [ ] Tests de integración pasando
- [ ] Documentación actualizada
- [ ] README con ejemplos de uso
- [ ] Sincronización automática (si aplica)
- [ ] Webhooks configurados (si aplica)

---

## 📞 Soporte

Para dudas sobre implementación:
1. Revisar implementación de Google Calendar como referencia
2. Consultar documentación del proveedor
3. Verificar logs del servidor
4. Revisar esta guía

---

**Versión**: 1.0.0
**Última actualización**: 11 de Noviembre de 2025
