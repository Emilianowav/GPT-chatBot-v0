# SISTEMA DE VARIABLES Y TÓPICOS

## Índice
1. [Variables Globales](#variables-globales)
2. [Variables de Nodos](#variables-de-nodos)
3. [Tópicos Globales](#tópicos-globales)
4. [Resolución de Variables](#resolución-de-variables)
5. [Expresiones Avanzadas](#expresiones-avanzadas)

---

## Variables Globales

### Definición
Variables disponibles en todo el flujo, inicializadas al inicio de la ejecución.

### Variables Automáticas

Estas variables se crean automáticamente cuando llega un mensaje de WhatsApp:

```typescript
{
  telefono: "5493794946066",           // Número del usuario
  mensaje_usuario: "Hola",             // Mensaje recibido
  nombre_contacto: "Emiliano",         // Nombre del contacto
  telefono_empresa: "5493794057297",   // Número de la empresa
  timestamp: "2026-01-17T02:00:00Z"    // Timestamp del mensaje
}
```

### Agregar Variables Globales

Desde cualquier nodo, puedes agregar variables globales usando `setGlobalVariable`:

```typescript
// En FlowExecutor
this.setGlobalVariable('nombre_producto', 'Harry Potter');
this.setGlobalVariable('precio_total', 4000);
```

### Acceder a Variables Globales

```typescript
// Formato 1: Sin prefijo
"{{telefono}}" → "5493794946066"
"{{mensaje_usuario}}" → "Hola"

// Formato 2: Con prefijo global.
"{{global.telefono}}" → "5493794946066"
"{{global.nombre_contacto}}" → "Emiliano"
```

---

## Variables de Nodos

### Definición
Cada nodo ejecutado guarda su output en el contexto, accesible por otros nodos.

### Estructura del Contexto

```typescript
context = {
  "webhook-whatsapp": {
    output: {
      telefono: "5493794946066",
      mensaje_usuario: "Hola"
    }
  },
  "gpt-clasificador": {
    output: {
      respuesta_gpt: "busqueda",
      intencion: "busqueda"
    }
  },
  "woocommerce-search": {
    output: {
      productos: [
        { id: 123, name: "Harry Potter", price: "2000" }
      ]
    }
  }
}
```

### Acceder a Variables de Nodos

```typescript
// Formato: {{nodeId.propiedad}}
"{{gpt-clasificador.intencion}}" → "busqueda"
"{{woocommerce-search.productos}}" → [...]

// Acceso anidado
"{{woocommerce-search.productos.0.name}}" → "Harry Potter"
"{{woocommerce-search.productos.0.price}}" → "2000"

// Propiedades de arrays
"{{woocommerce-search.productos.length}}" → 5
```

### Ejemplo Completo

```typescript
// Nodo 1: GPT Clasificador
{
  id: "gpt-clasificador",
  output: {
    respuesta_gpt: "El usuario quiere buscar libros",
    intencion: "busqueda",
    categoria: "libros"
  }
}

// Nodo 2: WooCommerce (usa output del nodo 1)
{
  id: "woocommerce-search",
  config: {
    searchTerm: "{{gpt-clasificador.categoria}}"  // → "libros"
  },
  output: {
    productos: [...]
  }
}

// Nodo 3: WhatsApp (usa output del nodo 2)
{
  id: "whatsapp-respuesta",
  config: {
    mensaje: "Encontré {{woocommerce-search.productos.length}} productos"
  }
}
```

---

## Tópicos Globales

### Definición
Información de conocimiento de la empresa que se inyecta automáticamente en todos los nodos GPT.

### Configuración en el Flujo

```json
{
  "config": {
    "topicos_habilitados": true,
    "topicos": {
      "empresa": {
        "nombre": "Librería Veo Veo",
        "ubicacion": "San Juan 1037, Corrientes Capital",
        "whatsapp": "5493794732177",
        "email": "info@veoveo.com"
      },
      "horarios": {
        "lunes_viernes": "8:30-12:00 y 17:00-21:00",
        "sabados": "9:00-13:00 y 17:00-21:00",
        "domingos": "Cerrado"
      },
      "politica_envios": {
        "descripcion": "Envíos a todo el país. Costo según destino.",
        "tiempo_entrega": "3-5 días hábiles",
        "envio_gratis_desde": 50000
      },
      "medios_pago": {
        "efectivo": true,
        "transferencia": true,
        "mercadopago": true,
        "descuento_efectivo": 10
      },
      "productos": {
        "libros_ingles": {
          "disponible": true,
          "descripcion": "Amplia variedad de libros en inglés para todos los niveles"
        }
      }
    }
  }
}
```

### Inyección Automática en GPT

Cuando `topicos_habilitados = true`, el FlowExecutor inyecta automáticamente los tópicos en el systemPrompt de TODOS los nodos GPT:

```
SYSTEM PROMPT ORIGINAL DEL NODO
+
═══ INFORMACIÓN DE LA EMPRESA ═══

**EMPRESA:**
  • nombre: Librería Veo Veo
  • ubicacion: San Juan 1037, Corrientes Capital
  • whatsapp: 5493794732177
  • email: info@veoveo.com

**HORARIOS:**
  • lunes_viernes: 8:30-12:00 y 17:00-21:00
  • sabados: 9:00-13:00 y 17:00-21:00
  • domingos: Cerrado

**POLITICA ENVIOS:**
  • descripcion: Envíos a todo el país. Costo según destino.
  • tiempo_entrega: 3-5 días hábiles
  • envio_gratis_desde: 50000

**MEDIOS PAGO:**
  • efectivo: true
  • transferencia: true
  • mercadopago: true
  • descuento_efectivo: 10

**PRODUCTOS:**
  • libros_ingles:
    - disponible: true
    - descripcion: Amplia variedad de libros en inglés para todos los niveles
```

### Acceder a Tópicos como Variables

También puedes acceder a tópicos como variables en configuraciones de nodos:

```typescript
// En config de WhatsApp
{
  mensaje: "Nuestra ubicación es: {{topicos.empresa.ubicacion}}"
}
// → "Nuestra ubicación es: San Juan 1037, Corrientes Capital"

// En condiciones de Router
{
  condition: "{{topicos.medios_pago.mercadopago}} == true"
}
// → true

// Acceso anidado
{
  mensaje: "{{topicos.productos.libros_ingles.descripcion}}"
}
// → "Amplia variedad de libros en inglés para todos los niveles"
```

### Código de Inyección en FlowExecutor

```typescript
// FlowExecutor.ts - executeGPTNode()
if (this.flow?.config?.topicos_habilitados && this.topicos && Object.keys(this.topicos).length > 0) {
  console.log(`\n📚 [TÓPICOS GLOBALES] Inyectando automáticamente ${Object.keys(this.topicos).length} tópico(s)`);
  
  let topicosSection = '\n\n═══ INFORMACIÓN DE LA EMPRESA ═══\n';
  
  Object.entries(this.topicos).forEach(([key, value]: [string, any]) => {
    console.log(`   - ${key}`);
    
    if (typeof value === 'object' && value !== null) {
      topicosSection += `\n**${key.toUpperCase().replace(/-/g, ' ')}:**\n`;
      Object.entries(value).forEach(([subKey, subValue]) => {
        topicosSection += `  • ${subKey}: ${subValue}\n`;
      });
    } else {
      topicosSection += `\n**${key.toUpperCase().replace(/-/g, ' ')}:** ${value}\n`;
    }
  });
  
  systemPrompt += topicosSection;
}
```

---

## Resolución de Variables

### Proceso de Resolución

```
1. Detectar patrón {{...}}
   ↓
2. Extraer expresión dentro de {{}}
   ↓
3. Verificar si tiene prefijo:
   - topicos. → Buscar en this.topicos
   - global. → Buscar en this.globalVariables
   - Sin prefijo → Buscar primero en globalVariables, luego en context
   ↓
4. Evaluar expresión:
   - Variable simple: {{telefono}}
   - Propiedad anidada: {{productos.0.name}}
   - Propiedad especial: {{productos.length}}
   - Fallback: {{variable || 'default'}}
   ↓
5. Reemplazar {{...}} con valor resuelto
```

### Método resolveVariableInString

```typescript
private resolveVariableInString(str: string): string {
  if (!str) return '';

  // Buscar todas las variables en formato {{...}}
  const regex = /\{\{([^}]+)\}\}/g;
  
  return str.replace(regex, (match, expression) => {
    console.log(`      🔍 Resolviendo: ${expression}`);
    
    const value = this.evaluateExpression(expression.trim());
    
    if (value === undefined || value === null) {
      console.log(`      ⚠️  Variable no encontrada: ${expression}`);
      return match; // Mantener {{variable}} si no se encuentra
    }
    
    // Si es objeto/array, convertir a JSON
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  });
}
```

### Método evaluateExpression

```typescript
private evaluateExpression(expression: string): any {
  console.log(`      → Evaluando expresión: "${expression}"`);
  
  // Caso 1: Fallback con ||
  if (expression.includes('||')) {
    const parts = expression.split('||').map(p => p.trim());
    const leftValue = this.evaluateExpression(parts[0]);
    
    if (leftValue !== undefined && leftValue !== null && leftValue !== '') {
      return leftValue;
    }
    
    // Evaluar fallback
    const fallback = parts[1];
    if (/^\d+$/.test(fallback)) {
      return parseInt(fallback, 10);
    }
    if ((fallback.startsWith('"') && fallback.endsWith('"')) ||
        (fallback.startsWith("'") && fallback.endsWith("'"))) {
      return fallback.slice(1, -1);
    }
    return fallback;
  }
  
  // Caso 2: Propiedad .length
  if (expression.endsWith('.length')) {
    const varPath = expression.slice(0, -7);
    const value = this.getVariableValue(varPath);
    
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'string') return value.length;
    return 0;
  }
  
  // Caso 3: Variable simple o anidada
  return this.getVariableValue(expression);
}
```

### Método getVariableValue

```typescript
private getVariableValue(varPath: string): any {
  console.log(`         🔎 [getVariableValue] Buscando: "${varPath}"`);
  
  // 1. Tópicos con prefijo 'topicos.'
  if (varPath.startsWith('topicos.')) {
    const topicoPath = varPath.substring(8).split('.');
    let value: any = this.topicos;
    
    for (const part of topicoPath) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  // 2. Variables globales con prefijo 'global.'
  if (varPath.startsWith('global.')) {
    const globalKey = varPath.substring(7);
    return this.getGlobalVariable(globalKey);
  }

  // 3. Buscar en globalVariables (sin prefijo)
  const globalValue = this.getGlobalVariable(varPath);
  if (globalValue !== undefined && globalValue !== null) {
    return globalValue;
  }

  // 4. Buscar en contexto de nodos
  const parts = varPath.split('.');
  const nodeId = parts[0];
  const path = parts.slice(1);

  let value = this.context[nodeId]?.output;
  
  if (!value) {
    return undefined;
  }

  for (const part of path) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value;
}
```

---

## Expresiones Avanzadas

### 1. Fallbacks (Valores por Defecto)

```typescript
// Si variable no existe, usar valor por defecto
"{{nombre_usuario || 'Cliente'}}"
// → "Cliente" si nombre_usuario no existe

"{{productos.length || 0}}"
// → 0 si productos no existe o está vacío

"{{descuento || 10}}"
// → 10 si descuento no existe
```

### 2. Acceso a Arrays

```typescript
// Primer elemento
"{{productos.0.name}}"
// → "Harry Potter"

// Último elemento (si conoces el índice)
"{{productos.4.name}}"

// Longitud del array
"{{productos.length}}"
// → 5
```

### 3. Acceso Anidado

```typescript
// Objeto dentro de objeto
"{{topicos.empresa.ubicacion}}"
// → "San Juan 1037, Corrientes Capital"

// Array dentro de objeto
"{{woocommerce-search.productos.0.categories.0.name}}"
// → "Libros"
```

### 4. Operadores en Condiciones

```typescript
// Igualdad
"{{intencion}} == 'busqueda'"

// Desigualdad
"{{intencion}} != 'busqueda'"

// Mayor que
"{{productos.length}} > 0"

// Menor que
"{{stock}} < 5"

// Mayor o igual
"{{precio}} >= 1000"

// Menor o igual
"{{descuento}} <= 20"
```

### 5. Verificación de Existencia

```typescript
// Existe y no está vacío
"{{productos}}"
// → true si productos existe y tiene elementos

// No existe o está vacío
"!{{productos}}"
// → true si productos no existe o está vacío
```

### Ejemplos Completos

#### Ejemplo 1: Mensaje Dinámico con Fallbacks
```typescript
{
  config: {
    mensaje: "Hola {{nombre_contacto || 'Cliente'}}, encontré {{productos.length || 0}} resultados."
  }
}
// Si nombre_contacto = "Juan" y productos.length = 5:
// → "Hola Juan, encontré 5 resultados."

// Si nombre_contacto no existe y productos no existe:
// → "Hola Cliente, encontré 0 resultados."
```

#### Ejemplo 2: Router con Múltiples Condiciones
```typescript
{
  handles: [
    {
      id: "route-muchos",
      label: "Muchos resultados",
      condition: "{{productos.length}} > 5"
    },
    {
      id: "route-pocos",
      label: "Pocos resultados",
      condition: "{{productos.length}} > 0"
    },
    {
      id: "route-ninguno",
      label: "Sin resultados",
      condition: "{{productos.length}} == 0"
    }
  ]
}
```

#### Ejemplo 3: Acceso a Tópicos en Mensaje
```typescript
{
  config: {
    mensaje: `📍 Ubicación: {{topicos.empresa.ubicacion}}
🕐 Horarios: {{topicos.horarios.lunes_viernes}}
📞 WhatsApp: {{topicos.empresa.whatsapp}}

¿En qué puedo ayudarte?`
  }
}
// →
// 📍 Ubicación: San Juan 1037, Corrientes Capital
// 🕐 Horarios: 8:30-12:00 y 17:00-21:00
// 📞 WhatsApp: 5493794732177
//
// ¿En qué puedo ayudarte?
```

---

Continúa en: `04-GUIA-CREAR-BOT-DESDE-CERO.md`
