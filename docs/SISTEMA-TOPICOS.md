# Sistema de Tópicos de Conocimiento

## 📚 Concepto

Los **tópicos** son información de conocimiento base que está disponible en todo momento para que los GPT puedan responder preguntas generales **sin inventar información**.

## 🎯 Problema Resuelto

**Antes:**
```
Usuario: "¿Qué horarios tienen?"
GPT: "Tenemos varios horarios..." [INVENTA INFORMACIÓN ❌]
```

**Ahora:**
```
Usuario: "¿Qué horarios tienen?"
GPT: "{{topicos.horarios.descripcion}}" [USA INFORMACIÓN REAL ✅]
→ "Atendemos de Lunes a Viernes de 8:30 a 12:00 y de 17:00 a 21:00..."
```

---

## 🔧 Configuración

### 1. Estructura de Tópicos

Los tópicos se configuran en el flujo mediante el script:

```bash
node scripts/configurar-topicos-veo-veo.cjs
```

**Estructura en MongoDB:**
```javascript
{
  _id: ObjectId("..."),
  config: {
    topicos_habilitados: true,
    topicos: {
      empresa: {
        nombre: "Librería Veo Veo",
        ubicacion: "San Juan 1037, Corrientes Capital",
        whatsapp: "5493794732177",
        whatsapp_link: "https://wa.me/5493794732177"
      },
      horarios: {
        lunes_viernes: "8:30-12:00 y 17:00-21:00",
        sabados: "9:00-13:00 y 17:00-21:00",
        domingos: "Cerrado",
        descripcion: "Atendemos de Lunes a Viernes de 8:30 a 12:00 y de 17:00 a 21:00. Sábados de 9:00 a 13:00 y de 17:00 a 21:00. Domingos cerrado."
      },
      productos: {
        categorias: ["Libros escolares", "Libros de inglés (solo a pedido)", ...],
        libros_ingles: {
          disponibilidad: "Solo a pedido con seña del 50%",
          tiempo_entrega: "7-15 días hábiles",
          descripcion: "Los libros de inglés se traen a pedido. Necesitamos una seña del 50% y el tiempo de entrega es de 7 a 15 días hábiles."
        }
      },
      medios_pago: {
        efectivo: "Aceptamos efectivo en el local",
        transferencia: "Transferencia bancaria",
        mercadopago: "Pago online con Mercado Pago",
        promociones: {
          banco_corrientes: "Lunes y Miércoles: 3 cuotas sin interés + 20% bonificación",
          banco_nacion: "Sábados: 10% reintegro + 3 cuotas sin interés"
        },
        descripcion: "Aceptamos efectivo, transferencia bancaria y Mercado Pago. Tenemos promociones con Banco Corrientes (Lunes y Miércoles: 3 cuotas sin interés + 20% bonificación) y Banco Nación (Sábados: 10% reintegro + 3 cuotas sin interés)."
      },
      politicas: {
        retiro: "24 horas después de confirmado el pago",
        envios: "A cargo del cliente, cotización con asesor",
        devoluciones: "Cambio por otro libro o nota de crédito",
        descripcion: "El retiro es 24 horas después de confirmado el pago. Los envíos son a cargo del cliente (cotización con asesor). Las devoluciones se hacen por cambio de libro o nota de crédito."
      }
    }
  }
}
```

---

## 💻 Uso en Prompts de GPT

### Sintaxis

```
{{topicos.categoria.subcategoria.campo}}
```

### Ejemplos

```javascript
// Horarios
{{topicos.horarios.descripcion}}
→ "Atendemos de Lunes a Viernes de 8:30 a 12:00..."

// Medios de pago
{{topicos.medios_pago.descripcion}}
→ "Aceptamos efectivo, transferencia bancaria y Mercado Pago..."

// Libros de inglés
{{topicos.productos.libros_ingles.descripcion}}
→ "Los libros de inglés se traen a pedido. Necesitamos una seña del 50%..."

// Ubicación
{{topicos.empresa.ubicacion}}
→ "San Juan 1037, Corrientes Capital"

// WhatsApp
{{topicos.empresa.whatsapp_link}}
→ "https://wa.me/5493794732177"
```

---

## 📝 Ejemplo de Prompt con Tópicos

```javascript
const systemPrompt = `Eres un asistente de Librería Veo Veo.

INFORMACIÓN DISPONIBLE (NO INVENTES, USA ESTO):
{{topicos.horarios.descripcion}}
{{topicos.medios_pago.descripcion}}
{{topicos.productos.libros_ingles.descripcion}}
{{topicos.politicas.descripcion}}

UBICACIÓN: {{topicos.empresa.ubicacion}}
WHATSAPP: {{topicos.empresa.whatsapp_link}}

TU TRABAJO:
1. Si el usuario pregunta sobre horarios, medios de pago, etc. → USA LA INFORMACIÓN DISPONIBLE ARRIBA
2. Si el usuario busca un libro → Ayúdalo a completar los datos
3. Si no sabes algo → Deriva a WhatsApp

REGLAS CRÍTICAS:
- ❌ NO inventes información
- ✅ USA SOLO la información disponible arriba
- ✅ Si no sabes algo, deriva a: {{topicos.empresa.whatsapp_link}}`;
```

---

## 🔄 Flujo de Resolución

### 1. Carga de Tópicos

```typescript
// FlowExecutor.ts
private loadTopicos(flow: any): void {
  if (flow.config?.topicos && flow.config?.topicos_habilitados) {
    this.topicos = flow.config.topicos;
    console.log('📚 [TÓPICOS] Cargados:', Object.keys(this.topicos).join(', '));
  }
}
```

### 2. Resolución en Variables

```typescript
// FlowExecutor.ts - getVariableValue()
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
```

### 3. Uso en Prompts

```
Prompt original:
"HORARIOS: {{topicos.horarios.descripcion}}"

Prompt resuelto:
"HORARIOS: Atendemos de Lunes a Viernes de 8:30 a 12:00 y de 17:00 a 21:00. Sábados de 9:00 a 13:00 y de 17:00 a 21:00. Domingos cerrado."
```

---

## ✅ Ventajas

### 1. No Inventa Información
- GPT solo puede usar información real configurada
- Si no está en tópicos, no puede inventar

### 2. Fácil de Actualizar
- Cambiar horarios, medios de pago, etc. sin tocar código
- Solo actualizar tópicos en MongoDB

### 3. Consistencia
- Todos los GPT usan la misma información
- No hay contradicciones entre respuestas

### 4. Escalable
- Agregar nuevos tópicos sin modificar código
- Configurar desde frontend (futuro)

---

## 🎯 Casos de Uso

### Caso 1: Horarios
```
Usuario: "¿Qué horarios tienen?"
GPT: "{{topicos.horarios.descripcion}}"
→ Respuesta real y actualizada
```

### Caso 2: Medios de Pago
```
Usuario: "¿Aceptan tarjeta?"
GPT: "{{topicos.medios_pago.descripcion}}"
→ Información completa de medios de pago y promociones
```

### Caso 3: Libros de Inglés
```
Usuario: "¿Tienen libros de inglés?"
GPT: "{{topicos.productos.libros_ingles.descripcion}}"
→ Explica que son a pedido con seña del 50%
```

### Caso 4: Información No Disponible
```
Usuario: "¿Hacen envíos internacionales?"
GPT: "No tengo esa información. Contactá directamente: {{topicos.empresa.whatsapp_link}}"
→ Deriva a atención humana
```

---

## 🔧 Scripts Disponibles

### Configurar Tópicos
```bash
node scripts/configurar-topicos-veo-veo.cjs
```

### Actualizar Prompts con Tópicos
```bash
node scripts/fix-gpt-con-topicos.cjs
```

### Verificar Tópicos Cargados
Los logs mostrarán:
```
📚 [TÓPICOS] Cargados: empresa, horarios, productos, medios_pago, politicas
```

---

## 📊 Comparación Antes/Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Horarios** | GPT inventa | Usa tópicos reales |
| **Medios de pago** | GPT inventa | Usa tópicos reales |
| **Libros de inglés** | GPT inventa | Usa tópicos reales |
| **Actualización** | Modificar código | Actualizar MongoDB |
| **Consistencia** | Variable | 100% consistente |
| **Inventar info** | ❌ Sí | ✅ No |

---

## 🚀 Futuro: Configuración desde Frontend

### Objetivo
Permitir editar tópicos desde el editor visual del flujo.

### Diseño Propuesto
```javascript
// Panel de configuración del flujo
{
  "topicos": {
    "horarios": {
      "lunes_viernes": "8:30-12:00 y 17:00-21:00",
      "sabados": "9:00-13:00 y 17:00-21:00",
      // ...
    }
  }
}
```

### UI Sugerida
- Tab "Tópicos" en configuración del flujo
- Editor JSON o formulario estructurado
- Preview de cómo se verán en prompts
- Validación de estructura

---

## 📖 Documentación Relacionada

- `VEO-VEO-GPT-CONFIGURACION.md` - Configuración completa de Veo Veo
- `GUIA-DEBUG-FLUJO.md` - Debug del flujo con tópicos
- `FIXES-FLUJO-WOOCOMMERCE.md` - Fixes aplicados al flujo

---

**Creado:** 2026-01-15  
**Última actualización:** 2026-01-15  
**Versión:** 1.0
