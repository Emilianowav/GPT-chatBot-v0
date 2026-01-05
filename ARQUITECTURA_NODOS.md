# ARQUITECTURA DE NODOS - FLOW BUILDER

## 🎯 FILOSOFÍA
Cada nodo representa un **bloque de código ejecutable** que:
1. Recibe datos de entrada (input)
2. Ejecuta una acción específica
3. Genera datos de salida (output)
4. Pasa los datos al siguiente nodo

---

## 📦 CATEGORÍAS DE NODOS

### 1️⃣ **TRIGGERS** (Inicio del flujo)
**Función:** Escuchan eventos externos y disparan el flujo

#### WhatsApp - Watch Events
```javascript
{
  type: 'trigger',
  app: 'whatsapp',
  module: 'watch-events',
  
  // NO recibe input (es el inicio)
  input: null,
  
  // Output: datos del mensaje recibido
  output: {
    from: '5493794946066',
    message: 'Hola, quiero consultar libros',
    timestamp: '2026-01-05T18:11:00Z',
    messageId: 'wamid.xxx',
    // ... otros datos de WhatsApp
  },
  
  // Código que ejecuta:
  // - Escucha webhook de WhatsApp
  // - Valida mensaje entrante
  // - Extrae datos del mensaje
  // - Pasa al siguiente nodo
}
```

**Otros triggers posibles:**
- Webhook Listener (HTTP POST)
- Scheduler (cron job)
- Email Received
- Form Submitted

---

### 2️⃣ **PROCESSORS** (Procesan/transforman datos)
**Función:** Reciben datos, los procesan y generan nuevos datos

#### GPT - Recopilación de Datos
```javascript
{
  type: 'processor',
  app: 'openai',
  module: 'create-completion',
  
  // Input: recibe output del nodo anterior (WhatsApp Watch Events)
  input: {
    message: '{{1.message}}',  // Variable del nodo 1 (WhatsApp)
    from: '{{1.from}}',
  },
  
  // Configuración del procesador
  config: {
    tipo: 'conversacional',
    modelo: 'gpt-4',
    temperatura: 0.7,
    prompt_sistema: `Eres un asistente de librería. 
                     Extrae del mensaje del usuario:
                     - Título del libro
                     - Autor (si lo menciona)
                     - Género (si lo menciona)`,
    variables_entrada: ['message'],
    variables_salida: ['titulo', 'autor', 'genero'],
  },
  
  // Output: datos procesados por GPT
  output: {
    titulo: 'Cien años de soledad',
    autor: 'Gabriel García Márquez',
    genero: 'Realismo mágico',
    raw_response: '...',
  },
  
  // Código que ejecuta:
  // - Recibe mensaje del usuario
  // - Construye prompt con sistema + mensaje
  // - Llama a OpenAI API
  // - Parsea respuesta JSON
  // - Extrae variables configuradas
  // - Pasa al siguiente nodo
}
```

#### GPT - Formatear Búsqueda
```javascript
{
  type: 'processor',
  app: 'openai',
  module: 'create-completion',
  
  input: {
    titulo: '{{2.titulo}}',      // Del nodo GPT anterior
    autor: '{{2.autor}}',
    genero: '{{2.genero}}',
  },
  
  config: {
    tipo: 'formateador',
    modelo: 'gpt-4',
    temperatura: 0.3,
    prompt_sistema: `Convierte los datos en query de búsqueda para WooCommerce.
                     Formato: { "search": "...", "category": "..." }`,
  },
  
  output: {
    search_query: 'Cien años de soledad García Márquez',
    category: 'literatura-latinoamericana',
  },
}
```

---

### 3️⃣ **ACTIONS** (Ejecutan acciones externas)
**Función:** Interactúan con APIs/servicios externos

#### WooCommerce - Buscar Productos
```javascript
{
  type: 'action',
  app: 'woocommerce',
  module: 'search-products',
  
  input: {
    search: '{{3.search_query}}',     // Del GPT Formatear
    category: '{{3.category}}',
  },
  
  config: {
    apiConfigId: 'woo-veo-veo',
    endpoint: '/wp-json/wc/v3/products',
    method: 'GET',
    params: {
      search: '{{input.search}}',
      category: '{{input.category}}',
      per_page: 10,
    },
  },
  
  output: {
    products: [
      {
        id: 123,
        name: 'Cien años de soledad',
        price: 15000,
        stock: 5,
        image: 'https://...',
      },
      // ... más productos
    ],
    total_found: 3,
  },
  
  // Código que ejecuta:
  // - Construye URL con parámetros
  // - Hace GET request a WooCommerce
  // - Parsea respuesta
  // - Extrae array de productos
  // - Pasa al siguiente nodo
}
```

#### MercadoPago - Generar Link de Pago
```javascript
{
  type: 'action',
  app: 'mercadopago',
  module: 'create-payment-link',
  
  input: {
    items: '{{10.cart_items}}',      // Del nodo anterior
    total: '{{10.total_amount}}',
    customer_phone: '{{1.from}}',    // Del trigger WhatsApp
  },
  
  config: {
    credentials: {
      access_token: process.env.MP_ACCESS_TOKEN,
    },
    preference: {
      back_urls: {
        success: 'https://veoveo.com/success',
        failure: 'https://veoveo.com/failure',
      },
      auto_return: 'approved',
    },
  },
  
  output: {
    payment_link: 'https://mpago.la/xxx',
    preference_id: 'xxx-xxx-xxx',
    qr_code: 'data:image/png;base64,...',
  },
}
```

#### WhatsApp - Send Message
```javascript
{
  type: 'action',
  app: 'whatsapp',
  module: 'send-message',
  
  input: {
    to: '{{1.from}}',                    // Del trigger
    message: '{{11.formatted_message}}', // Del GPT anterior
    payment_link: '{{12.payment_link}}', // Del MercadoPago
  },
  
  config: {
    template: `Encontramos estos libros:
{{products_list}}

Total: ${{total}}
Link de pago: {{payment_link}}`,
  },
  
  output: {
    message_id: 'wamid.yyy',
    status: 'sent',
  },
}
```

---

### 4️⃣ **ROUTERS** (Bifurcan el flujo)
**Función:** Evalúan condiciones y dirigen el flujo por diferentes caminos

#### Router - ¿Productos encontrados?
```javascript
{
  type: 'router',
  app: 'flow-control',
  module: 'router',
  
  input: {
    products: '{{4.products}}',      // Del WooCommerce
    total_found: '{{4.total_found}}',
  },
  
  config: {
    conditions: [
      {
        label: 'Con productos',
        condition: '{{input.total_found}} > 0',
        output_handle: 'source-0',
      },
      {
        label: 'Sin productos',
        condition: '{{input.total_found}} === 0',
        output_handle: 'source-1',
      },
    ],
  },
  
  // Output: mismo que input, pero redirige según condición
  output: {
    products: '{{input.products}}',
    total_found: '{{input.total_found}}',
    route_taken: 'source-0', // o 'source-1'
  },
  
  // Código que ejecuta:
  // - Evalúa cada condición en orden
  // - Primera condición TRUE → toma esa ruta
  // - Pasa datos al nodo conectado a ese handle
}
```

---

## 🔄 FLUJO DE DATOS COMPLETO

```
1. WhatsApp Watch Events (TRIGGER)
   ↓ output: { from, message, timestamp }
   
2. GPT - Recopilación (PROCESSOR)
   ↓ input: { message: {{1.message}} }
   ↓ output: { titulo, autor, genero }
   
3. GPT - Formatear Búsqueda (PROCESSOR)
   ↓ input: { titulo: {{2.titulo}}, autor: {{2.autor}} }
   ↓ output: { search_query, category }
   
4. WooCommerce - Buscar (ACTION)
   ↓ input: { search: {{3.search_query}} }
   ↓ output: { products[], total_found }
   
5. Router - ¿Encontrados? (ROUTER)
   ↓ input: { products: {{4.products}}, total_found: {{4.total_found}} }
   ├─ source-0 (SI) → Nodo 6
   └─ source-1 (NO) → Nodo 7
   
6. GPT - Procesar Resultados (PROCESSOR)
   ↓ input: { products: {{4.products}} }
   ↓ output: { formatted_list, summary }
   
7. WhatsApp - Sin Resultados (ACTION)
   ↓ input: { to: {{1.from}} }
   ↓ output: { message_id }
```

---

## 🎨 VARIABLES Y REFERENCIAS

### Sintaxis de variables:
```
{{nodo_id.variable}}
{{1.message}}           // Mensaje del nodo 1
{{2.titulo}}            // Título extraído por GPT en nodo 2
{{4.products[0].name}}  // Primer producto del array
```

### Variables especiales:
```
{{input.*}}             // Datos de entrada del nodo actual
{{output.*}}            // Datos de salida del nodo actual
{{trigger.*}}           // Datos del trigger inicial (siempre disponibles)
{{previous.*}}          // Datos del nodo inmediatamente anterior
```

---

## 💾 ESTRUCTURA EN BASE DE DATOS

```javascript
{
  _id: '695b5802cf46dd410a91f37c',
  nombre: 'Veo Veo - Consultar Libros',
  empresaId: '6940a9a181b92bfce970fdb5',
  activo: true,
  
  nodes: [
    {
      id: 'trigger-inicio',
      type: 'whatsapp',
      category: 'trigger',
      position: { x: 100, y: 300 },
      data: {
        label: 'WhatsApp Business Cloud',
        subtitle: 'Watch Events',
        executionCount: 1,
        config: {
          module: 'watch-events',
          webhook_url: 'https://api.momentoia.co/webhook/whatsapp',
        },
      },
    },
    {
      id: 'gpt-recopilacion',
      type: 'gpt',
      category: 'processor',
      position: { x: 400, y: 300 },
      data: {
        label: 'OpenAI (ChatGPT, Sora, DALL-E, Whisper)',
        subtitle: 'Recopilación de datos',
        executionCount: 2,
        config: {
          tipo: 'conversacional',
          modelo: 'gpt-4',
          temperatura: 0.7,
          prompt_sistema: '...',
          variables_entrada: ['message'],
          variables_salida: ['titulo', 'autor', 'genero'],
        },
      },
    },
    // ... más nodos
  ],
  
  edges: [
    {
      id: 'trigger-inicio-gpt-recopilacion',
      source: 'trigger-inicio',
      target: 'gpt-recopilacion',
      type: 'simple',
      data: {
        // Mapeo de variables (opcional)
        mapping: {
          'gpt-recopilacion.input.message': 'trigger-inicio.output.message',
        },
      },
    },
    // ... más edges
  ],
}
```

---

## 🚀 EJECUCIÓN EN BACKEND

```javascript
// backend/src/flows/FlowExecutor.ts

class FlowExecutor {
  async execute(flowId, triggerData) {
    const flow = await FlowModel.findById(flowId);
    const context = { trigger: triggerData };
    
    // 1. Encontrar nodo trigger
    const triggerNode = flow.nodes.find(n => n.category === 'trigger');
    
    // 2. Ejecutar nodo trigger
    context[triggerNode.id] = {
      output: triggerData,
    };
    
    // 3. Seguir edges desde trigger
    let currentNodeId = triggerNode.id;
    
    while (currentNodeId) {
      const nextEdge = flow.edges.find(e => e.source === currentNodeId);
      if (!nextEdge) break;
      
      const nextNode = flow.nodes.find(n => n.id === nextEdge.target);
      
      // 4. Ejecutar siguiente nodo
      const nodeResult = await this.executeNode(nextNode, context);
      context[nextNode.id] = nodeResult;
      
      // 5. Si es router, evaluar condiciones
      if (nextNode.type === 'router') {
        currentNodeId = this.evaluateRouter(nextNode, context);
      } else {
        currentNodeId = nextNode.id;
      }
    }
    
    return context;
  }
  
  async executeNode(node, context) {
    // Resolver variables en input
    const input = this.resolveVariables(node.data.config, context);
    
    switch (node.type) {
      case 'gpt':
        return await this.executeGPT(node, input);
      case 'woocommerce':
        return await this.executeWooCommerce(node, input);
      case 'whatsapp':
        return await this.executeWhatsApp(node, input);
      // ... otros tipos
    }
  }
  
  resolveVariables(config, context) {
    // Reemplaza {{1.message}} con context['1'].output.message
    // ...
  }
}
```

---

## 📝 RESUMEN

**TIPOS DE NODOS:**
1. **TRIGGERS:** Inician el flujo (WhatsApp Watch Events, Webhooks)
2. **PROCESSORS:** Transforman datos (GPT, Formatters)
3. **ACTIONS:** Ejecutan acciones (API calls, Send messages)
4. **ROUTERS:** Bifurcan el flujo (Condiciones IF/ELSE)

**FLUJO DE DATOS:**
- Cada nodo recibe `input` del nodo anterior
- Ejecuta su lógica específica
- Genera `output` para el siguiente nodo
- Variables accesibles con `{{nodo_id.variable}}`

**EJECUCIÓN:**
- Backend sigue los edges en orden
- Resuelve variables dinámicamente
- Ejecuta código específico por tipo de nodo
- Mantiene contexto global del flujo
