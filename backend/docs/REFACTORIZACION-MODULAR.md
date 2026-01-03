# 🔧 Refactorización Modular - Eliminación de Código Hardcodeado

## 📋 Resumen de Cambios

Se refactorizó el código para eliminar dependencias hardcodeadas de empresas específicas (Veo Veo, JFC Techno, Juventus) y hacerlo completamente modular y escalable usando configuración en base de datos.

---

## ✅ Problemas Resueltos

### 1. **"Sin respuesta del modelo"** ❌ → ✅
**Archivo:** `src/services/openaiService.ts`

**Antes:**
```typescript
return {
  texto: textoRespuesta || "Sin respuesta del modelo.",
  // ...
}
```

**Después:**
```typescript
return {
  texto: textoRespuesta || (functionCall ? "" : "Sin respuesta del modelo."),
  // ...
}
```

**Explicación:** Cuando GPT usa function calling, `message.content` es `null`. Ahora solo muestra error si NO hay function call.

---

### 2. **Bucle infinito de saludos** ❌ → ✅
**Archivos:** `src/flows/gptFlow.ts`, `src/controllers/whatsappController.ts`

**Solución:** Se agregaron reglas anti-loop automáticas al prompt base:

```typescript
promptBase += obtenerReglasAntiLoop(empresa);
```

Las reglas incluyen:
- No repetir saludos si ya se saludó
- Mantener contexto de conversación
- No repetir información ya dada

---

### 3. **Lista hardcodeada de empresas con pagos** ❌ → ✅
**Archivos:** `src/flows/gptFlow.ts`, `src/controllers/whatsappController.ts`

**Antes:**
```typescript
const EMPRESAS_CON_PAGOS = ['6940a9a181b92bfce970fdb5', 'Veo Veo'];

const tienePageosHabilitados = EMPRESAS_CON_PAGOS.includes(empresaIdStr) || 
                                EMPRESAS_CON_PAGOS.includes(empresa.nombre);
```

**Después:**
```typescript
const tienePageosHabilitados = tieneMercadoPagoActivo(empresa);
```

**Explicación:** Ahora verifica si la empresa tiene el módulo `mercadopago` activo en `empresa.modulos`.

---

### 4. **Prefijos de slug hardcodeados** ❌ → ✅
**Archivos:** `src/flows/gptFlow.ts`, `src/controllers/whatsappController.ts`

**Antes:**
```typescript
let slugPrefix = '';
if (empresa.nombre === 'JFC Techno') {
  slugPrefix = 'jfc-';
} else if (empresa.nombre === 'Veo Veo') {
  slugPrefix = 'veo-';
}
```

**Después:**
```typescript
const slugPrefix = obtenerSlugPrefix(empresa);
```

**Explicación:** El helper genera el prefijo dinámicamente desde el nombre de la empresa o usa `empresa.modulos[mercadopago].configuracion.slugPrefix` si está configurado.

---

### 5. **Detección de tipo de negocio hardcodeada** ❌ → ✅
**Archivo:** `src/services/workflowConversationalHandler.ts`

**Antes:**
```typescript
// Detectar si es Veo Veo (librería) o Juventus (cancha)
const esVeoVeo = datosRecopilados.producto_nombre !== undefined || 
                 datosRecopilados.subtotal !== undefined;

if (esVeoVeo) {
  // VEO VEO: Venta de libros - cobrar precio total
  // ...
} else {
  // JUVENTUS: Reserva de cancha - cobrar seña
  // ...
}
```

**Después:**
```typescript
// Determinar tipo de pago usando workflow.configPago (MODULAR)
const porcentajeSeña = workflow.configPago?.porcentajeSeña || 0.5;
const esVentaCompleta = porcentajeSeña >= 1.0;

if (esVentaCompleta || tieneProducto) {
  // VENTA COMPLETA: Cobrar precio total
  // ...
} else if (!esVentaCompleta || tieneCancha) {
  // SEÑA/RESERVA: Cobrar porcentaje
  // ...
}
```

**Explicación:** Usa `workflow.configPago.porcentajeSeña` para determinar si es venta completa (1.0 = 100%) o seña (0.5 = 50%).

---

### 6. **Prompts genéricos no personalizables** ❌ → ✅
**Archivos:** `src/flows/gptFlow.ts`, `src/controllers/whatsappController.ts`

**Antes:**
```typescript
promptBase += `\n\n--- INSTRUCCIONES DE PAGO ---
IMPORTANTE: Cuando el cliente mencione un producto específico (mouse, teclado, etc.)...
```

**Después:**
```typescript
promptBase += '\n\n' + obtenerInstruccionesBusqueda(empresa);
promptBase += '\n\n' + obtenerInstruccionesPago(empresa, productosInfo);
```

**Explicación:** Las instrucciones ahora son dinámicas y personalizables por empresa.

---

## 🆕 Nuevo Archivo: `src/utils/empresaHelpers.ts`

Este archivo centraliza toda la lógica de configuración de empresas:

### Funciones principales:

1. **`tieneModuloActivo(empresa, moduloId)`**
   - Verifica si una empresa tiene un módulo específico activo
   - Ejemplo: `tieneModuloActivo(empresa, 'mercadopago')`

2. **`tieneMercadoPagoActivo(empresa)`**
   - Atajo para verificar módulo de Mercado Pago
   - Reemplaza la lista hardcodeada `EMPRESAS_CON_PAGOS`

3. **`obtenerSlugPrefix(empresa)`**
   - Obtiene el prefijo de slug para payment links
   - Primero busca en `empresa.modulos[mercadopago].configuracion.slugPrefix`
   - Fallback: genera desde nombre de empresa ("Veo Veo" → "veo-")

4. **`obtenerInstruccionesBusqueda(empresa)`**
   - Retorna instrucciones de búsqueda personalizadas
   - Usa `empresa.gptConfig.searchInstructions` si existe
   - Fallback: instrucciones genéricas

5. **`obtenerInstruccionesPago(empresa, productosInfo)`**
   - Retorna instrucciones de pago personalizadas
   - Usa `empresa.gptConfig.paymentInstructions` si existe
   - Fallback: instrucciones genéricas con catálogo

6. **`obtenerReglasAntiLoop(empresa)`**
   - Retorna reglas para evitar bucles de conversación
   - Usa `empresa.gptConfig.contextRules` si existe
   - Fallback: reglas anti-loop por defecto

---

## 🗄️ Configuración en Base de Datos

### Estructura de Empresa (existente):

```javascript
{
  nombre: "Veo Veo",
  modulos: [
    {
      id: "mercadopago",
      activo: true,
      configuracion: {
        slugPrefix: "veo-",  // NUEVO (opcional)
        sellerId: "USER_ID_MP",
        catalogSource: "woocommerce"
      }
    }
  ]
}
```

### Estructura de Workflow (existente):

```javascript
{
  nombre: "Veo Veo - Consultar Libros",
  configPago: {
    seña: 1,              // Monto fijo o calculado
    porcentajeSeña: 1.0,  // 1.0 = 100% (venta completa)
                          // 0.5 = 50% (seña)
    tiempoExpiracion: 15,
    moneda: "ARS"
  }
}
```

### Extensión Opcional (futuro):

```javascript
{
  nombre: "Veo Veo",
  gptConfig: {  // NUEVO (opcional)
    antiLoopRules: true,
    searchInstructions: "Instrucciones personalizadas de búsqueda...",
    paymentInstructions: "Instrucciones personalizadas de pago...",
    contextRules: [
      "Regla personalizada 1",
      "Regla personalizada 2"
    ],
    productExamples: ["libro", "manual", "cuaderno"]
  }
}
```

---

## 📊 Comparación Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Empresas con pagos** | Lista hardcodeada | `empresa.modulos` |
| **Prefijo de slug** | `if (empresa === 'Veo Veo')` | `obtenerSlugPrefix(empresa)` |
| **Tipo de pago** | Detectar por variables | `workflow.configPago.porcentajeSeña` |
| **Prompts GPT** | Genéricos con ejemplos hardcodeados | Dinámicos y personalizables |
| **Reglas anti-loop** | No existían | Automáticas y configurables |
| **Escalabilidad** | Requiere cambios de código | Solo configuración en BD |

---

## 🚀 Beneficios

1. **✅ Modular:** Agregar nueva empresa no requiere tocar código
2. **✅ Escalable:** Configuración 100% en base de datos
3. **✅ Mantenible:** Cambios centralizados en helpers
4. **✅ Testeable:** Funciones puras fáciles de testear
5. **✅ Documentado:** Código autodocumentado con nombres claros
6. **✅ Compatible:** Mantiene compatibilidad con configuración existente

---

## 🔍 Validación

### Checklist de pruebas:

- [ ] **Veo Veo:** Flujo de compra de libros funciona correctamente
- [ ] **Juventus:** Flujo de reserva de canchas funciona correctamente
- [ ] **JFC Techno:** Flujo de venta de productos funciona correctamente
- [ ] **Nueva empresa:** Se puede configurar sin tocar código
- [ ] **GPT:** No muestra "Sin respuesta del modelo" con function calling
- [ ] **GPT:** No entra en bucle de saludos
- [ ] **Mercado Pago:** Detecta correctamente empresas con MP activo
- [ ] **Payment Links:** Filtra correctamente por slug prefix

---

## 📝 Notas de Migración

### Para agregar una nueva empresa:

1. Crear empresa en BD con `modulos: [{ id: 'mercadopago', activo: true }]`
2. Crear seller en Mercado Pago con `internalId: "Nombre Empresa"`
3. Configurar workflows con `configPago.porcentajeSeña` apropiado
4. (Opcional) Agregar `gptConfig` para personalizar prompts

### No es necesario:

- ❌ Modificar código fuente
- ❌ Agregar empresa a listas hardcodeadas
- ❌ Crear lógica específica por empresa
- ❌ Reiniciar servidor (solo recargar configuración)

---

## 🐛 Debugging

Si una empresa no detecta pagos correctamente:

```javascript
// En consola de Node.js o script de debug:
const { tieneMercadoPagoActivo } = require('./src/utils/empresaHelpers.js');
const { EmpresaModel } = require('./src/models/Empresa.js');

const empresa = await EmpresaModel.findOne({ nombre: 'Nombre Empresa' });
console.log('Tiene MP activo:', tieneMercadoPagoActivo(empresa));
console.log('Módulos:', empresa.modulos);
```

---

## 📚 Referencias

- **Modelo Empresa:** `src/models/Empresa.ts`
- **Helpers:** `src/utils/empresaHelpers.ts`
- **GPT Flow:** `src/flows/gptFlow.ts`
- **WhatsApp Controller:** `src/controllers/whatsappController.ts`
- **Workflow Handler:** `src/services/workflowConversationalHandler.ts`
- **OpenAI Service:** `src/services/openaiService.ts`

---

## ✨ Próximos Pasos (Opcional)

1. Extender modelo `Empresa` con campo `gptConfig` en schema
2. Crear interfaz en CRM para configurar `gptConfig` por empresa
3. Agregar más helpers para otras configuraciones modulares
4. Crear tests unitarios para `empresaHelpers.ts`
5. Documentar API de configuración para nuevas empresas
