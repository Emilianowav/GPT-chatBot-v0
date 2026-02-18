# 💾 SOLUCIÓN: SISTEMA DE CACHÉ DE COTIZACIONES - INTERCAPITAL

## 🎯 PROBLEMA IDENTIFICADO

### Situación Actual:
- **API de cotización fuera de servicio:** `http://app1.intercapital.ar/api/market/cotizacion/{symbol}` devuelve error 502
- **Flujo bloqueado:** Sin cotización, no se pueden crear órdenes de compra/venta
- **Variables globales se pierden:** El sistema NO está persistiendo `precio_actual` entre sesiones

### Análisis del Flujo Actual:
```
Usuario: "Quiero comprar 2 de YPFD"
   ↓
GPT Procesador → extrae: topico=COMPRA, symbol=YPFD, cantidad=2
   ↓
Router → detecta: NO existe precio_actual
   ↓
HTTP Cotización → ❌ ERROR 502
   ↓
GPT Venta (incorrecto) → intenta leer HTTP Venta que no existe
```

---

## 💡 SOLUCIÓN PROPUESTA

### Opción 1: Usar Variables Globales Persistentes (RECOMENDADO)

El modelo `ContactoEmpresa` tiene soporte para `globalVariables` en `workflowState`:

```typescript
export interface WorkflowState {
  workflowId: string;
  apiId: string;
  pasoActual: number;
  datosRecopilados: Record<string, any>;
  globalVariables?: Record<string, any>;  // ← AQUÍ SE GUARDAN
  ultimaActualizacion?: Date;
}
```

**Implementación:**

1. **Modificar el nodo de cotización** para que:
   - Primero intente obtener precio de la API
   - Si falla (502), busque en `globalVariables` del contacto
   - Si encuentra precio cacheado (< 24 horas), lo use
   - Si no hay caché o está muy viejo, informe al usuario

2. **Guardar precios en globalVariables** cada vez que se obtenga exitosamente:
```javascript
{
  "precio_actual_YPFD": 57900,
  "precio_fecha_YPFD": "2026-02-17T18:00:00Z",
  "nombre_activo_YPFD": "YPF Sociedad Anónima",
  "variacion_YPFD": 2.5
}
```

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Paso 1: Crear Nodo HTTP Mejorado con Fallback

**Configuración del nodo de cotización:**

```json
{
  "id": "node-1768851290437",
  "type": "http",
  "data": {
    "label": "Obtener Cotización (con caché)",
    "config": {
      "url": "http://app1.intercapital.ar/api/market/cotizacion/{{symbol}}",
      "method": "GET",
      "headers": {
        "x-api-key": "2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a"
      },
      "timeout": 10000,
      "fallbackEnabled": true,
      "fallbackConfig": {
        "useCachedData": true,
        "cacheKey": "precio_actual_{{symbol}}",
        "cacheMaxAge": 86400000,
        "fallbackMessage": "⚠️ No pudimos obtener la cotización actual. Usando último precio conocido."
      },
      "variableMappings": [
        {
          "variableName": "precio_actual",
          "responsePath": "ultimo",
          "variableType": "global",
          "cacheEnabled": true
        },
        {
          "variableName": "nombre_activo",
          "responsePath": "nombre",
          "variableType": "global",
          "cacheEnabled": true
        },
        {
          "variableName": "variacion",
          "responsePath": "variacion_porcentaje",
          "variableType": "global",
          "cacheEnabled": true
        },
        {
          "variableName": "precio_fecha",
          "responsePath": "fecha",
          "variableType": "global",
          "cacheEnabled": true
        }
      ]
    }
  }
}
```

### Paso 2: Modificar FlowExecutor para Soportar Caché

**Ubicación:** `backend/src/services/FlowExecutor.ts`

**Agregar método para buscar en caché:**

```typescript
private async getCachedPrice(symbol: string): Promise<any | null> {
  try {
    const contacto = await ContactoEmpresaModel.findById(this.contactoId);
    if (!contacto?.workflowState?.globalVariables) {
      return null;
    }

    const cacheKey = `precio_actual_${symbol}`;
    const fechaKey = `precio_fecha_${symbol}`;
    
    const precioCache = contacto.workflowState.globalVariables[cacheKey];
    const fechaCache = contacto.workflowState.globalVariables[fechaKey];

    if (!precioCache || !fechaCache) {
      return null;
    }

    // Verificar que el caché no sea muy viejo (24 horas)
    const fechaCacheDate = new Date(fechaCache);
    const ahora = new Date();
    const diffHoras = (ahora.getTime() - fechaCacheDate.getTime()) / (1000 * 60 * 60);

    if (diffHoras > 24) {
      console.log(`⚠️ Caché de ${symbol} muy viejo (${diffHoras.toFixed(1)} horas)`);
      return null;
    }

    console.log(`✅ Usando precio cacheado de ${symbol}: $${precioCache} (${diffHoras.toFixed(1)} horas)`);
    
    return {
      ultimo: precioCache,
      nombre: contacto.workflowState.globalVariables[`nombre_activo_${symbol}`],
      variacion_porcentaje: contacto.workflowState.globalVariables[`variacion_${symbol}`],
      fecha: fechaCache,
      _cached: true
    };
  } catch (error) {
    console.error('❌ Error al buscar precio en caché:', error);
    return null;
  }
}
```

**Modificar executeHttpNode para usar caché:**

```typescript
async executeHttpNode(node: any, input: any): Promise<any> {
  const config = node.data.config;
  
  try {
    // Intentar request normal
    const response = await axios({
      method: config.method,
      url: resolvedUrl,
      headers: config.headers,
      data: config.body,
      timeout: config.timeout || 30000
    });

    // Guardar en caché si es cotización
    if (config.variableMappings && config.variableMappings.some(v => v.cacheEnabled)) {
      await this.savePriceToCache(config, response.data);
    }

    return response.data;

  } catch (error) {
    console.error(`❌ Error en HTTP request: ${error.message}`);

    // Si falla y tiene fallback habilitado, buscar en caché
    if (config.fallbackEnabled && config.fallbackConfig?.useCachedData) {
      const symbol = this.globalVariables['symbol'];
      const cachedData = await this.getCachedPrice(symbol);

      if (cachedData) {
        console.log(`✅ Usando datos cacheados para ${symbol}`);
        return cachedData;
      }
    }

    throw error;
  }
}
```

**Agregar método para guardar en caché:**

```typescript
private async savePriceToCache(config: any, responseData: any): Promise<void> {
  try {
    const symbol = this.globalVariables['symbol'];
    if (!symbol) return;

    const updates: Record<string, any> = {};
    
    config.variableMappings.forEach((mapping: any) => {
      if (mapping.cacheEnabled) {
        const cacheKey = `${mapping.variableName}_${symbol}`;
        const value = this.extractValueFromPath(responseData, mapping.responsePath);
        updates[cacheKey] = value;
      }
    });

    // Agregar timestamp
    updates[`precio_fecha_${symbol}`] = new Date().toISOString();

    // Guardar en BD
    await ContactoEmpresaModel.findByIdAndUpdate(
      this.contactoId,
      {
        $set: {
          'workflowState.globalVariables': {
            ...this.globalVariables,
            ...updates
          },
          'workflowState.ultimaActualizacion': new Date()
        }
      }
    );

    console.log(`💾 Precio de ${symbol} guardado en caché`);
  } catch (error) {
    console.error('❌ Error al guardar precio en caché:', error);
  }
}
```

---

## 📋 ALTERNATIVA SIMPLE (Sin modificar código)

### Solución Manual: Hardcodear Precios Temporales

Mientras la API está caída, puedes crear un nodo GPT que use precios hardcodeados:

**Nodo GPT "Cotización Fallback":**

```json
{
  "id": "node-cotizacion-fallback",
  "type": "gpt",
  "data": {
    "label": "Cotización Fallback",
    "config": {
      "tipo": "formateador",
      "modelo": "gpt-3.5-turbo",
      "systemPrompt": "Extrae el símbolo del activo y asigna un precio de referencia.\n\nPRECIOS DE REFERENCIA (última actualización: 17/02/2026):\n- YPFD: $57,900\n- GGAL: $3,450\n- AL30: $850\n- PAMP: $2,100\n- BMA: $4,200\n\nSi el símbolo no está en la lista, usa precio: 0 y marca como 'sin_precio'.\n\nDevuelve JSON:\n{\n  \"precio_actual\": <precio>,\n  \"nombre_activo\": \"<nombre completo>\",\n  \"variacion\": 0,\n  \"precio_disponible\": true/false\n}",
      "extractionConfig": {
        "enabled": true,
        "variables": [
          {
            "nombre": "precio_actual",
            "tipo": "number"
          },
          {
            "nombre": "nombre_activo",
            "tipo": "string"
          },
          {
            "nombre": "precio_disponible",
            "tipo": "boolean"
          }
        ]
      }
    }
  }
}
```

**Flujo modificado:**

```
Router → Cotización HTTP (intenta)
   ↓ (si falla)
   → GPT Cotización Fallback (usa precios hardcodeados)
   → Router Tipo Operación
   → HTTP Compra/Venta
```

---

## 🎯 PLAN DE ACCIÓN INMEDIATO

### Opción A: Implementación Completa (2-3 horas)
1. Modificar `FlowExecutor.ts` con métodos de caché
2. Actualizar nodo de cotización con `fallbackEnabled`
3. Testear con diferentes símbolos
4. Documentar sistema de caché

### Opción B: Solución Rápida (15 minutos)
1. Crear nodo GPT "Cotización Fallback" con precios hardcodeados
2. Agregar edge desde Router: si falla cotización → GPT Fallback
3. Actualizar precios manualmente cada día
4. Testear flujo completo

---

## 📊 COMPARACIÓN DE SOLUCIONES

| Característica | Caché en BD | Precios Hardcodeados |
|----------------|-------------|----------------------|
| Tiempo de implementación | 2-3 horas | 15 minutos |
| Mantenimiento | Automático | Manual diario |
| Precisión | Alta (último precio real) | Media (actualización manual) |
| Escalabilidad | Alta | Baja |
| Complejidad | Media | Baja |

---

## ✅ RECOMENDACIÓN FINAL

**Para resolver AHORA:**
→ Usar **Opción B** (Precios Hardcodeados) para desbloquear el flujo inmediatamente

**Para implementar DESPUÉS:**
→ Implementar **Opción A** (Caché en BD) cuando haya tiempo para desarrollo

---

## 📝 PRÓXIMOS PASOS

1. ¿Querés que implemente la solución rápida (GPT Fallback)?
2. ¿O preferís que modifique el código para implementar el sistema de caché completo?
3. ¿Qué precios necesitás hardcodear para los activos más comunes?

