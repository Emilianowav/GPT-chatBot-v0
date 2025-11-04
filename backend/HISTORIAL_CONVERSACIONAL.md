# 📚 Sistema de Historial Conversacional

## Concepto

El sistema guarda **TODO el historial de conversación** sin límites, permitiendo que GPT tenga contexto completo de todas las interacciones previas con cada contacto.

## Almacenamiento

### Modelo: ContactoEmpresa

```typescript
export interface ConversacionesGPT {
  historial: string[];           // Array de mensajes (SIN LÍMITE)
  ultimaConversacion: Date;
  saludado: boolean;
  despedido: boolean;
  mensaje_ids: string[];
  ultimo_status: string;
  contactoInformado: boolean;
}
```

### Estructura del Historial

El array `historial` almacena mensajes alternados:
- **Índice par (0, 2, 4...)**: Mensaje del usuario
- **Índice impar (1, 3, 5...)**: Respuesta del asistente

**Ejemplo**:
```javascript
historial: [
  "Hola",                           // [0] Usuario
  "¡Hola! ¿Cómo estás?",           // [1] Asistente
  "Necesito información",           // [2] Usuario
  "Claro, ¿sobre qué tema?",       // [3] Asistente
  // ... continúa sin límite
]
```

## Guardado de Mensajes

### Función: actualizarHistorialConversacion

**Ubicación**: `src/services/contactoService.ts`

```typescript
export async function actualizarHistorialConversacion(
  contactoId: string,
  mensaje: string
): Promise<void> {
  await ContactoEmpresaModel.findByIdAndUpdate(
    contactoId,
    {
      $push: { 'conversaciones.historial': mensaje },  // Agrega al final
      $set: { 
        'conversaciones.ultimaConversacion': new Date(),
        'metricas.ultimaInteraccion': new Date()
      }
    }
  );
}
```

**Características**:
- ✅ Usa `$push` de MongoDB (agrega al final del array)
- ✅ NO tiene límite de mensajes
- ✅ Actualiza timestamp de última conversación
- ✅ Actualiza timestamp de última interacción

## Carga del Historial

### En whatsappController.ts

```typescript
// Construir historial para GPT
const historialGPT: any[] = [
  {
    role: 'system',
    content: empresa.prompt || 'Eres un asistente virtual amable y servicial.'
  }
];

// Agregar TODO el historial (sin límite)
console.log(`📚 [GPT] Cargando historial completo: ${contacto.conversaciones.historial.length} mensajes`);
const historialCompleto = contacto.conversaciones.historial;
for (let i = 0; i < historialCompleto.length; i++) {
  historialGPT.push({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: historialCompleto[i]
  });
}

// Agregar mensaje actual
historialGPT.push({
  role: 'user',
  content: mensaje
});
```

**Resultado**:
- GPT recibe TODO el contexto de la conversación
- Puede recordar interacciones de hace días, semanas o meses
- Mantiene coherencia en conversaciones largas

## Flujo Completo

```
1. Usuario envía mensaje
   ↓
2. whatsappController carga TODO el historial
   ↓
3. Construye array para OpenAI:
   - [0] System prompt
   - [1..N] Historial completo (user/assistant alternados)
   - [N+1] Mensaje actual
   ↓
4. OpenAI procesa con contexto completo
   ↓
5. Guarda mensaje del usuario en historial
   ↓
6. Guarda respuesta del asistente en historial
   ↓
7. Envía respuesta al usuario
```

## Comandos de Gestión

### Ver Historial Completo
```bash
npm run ver:historial
```

**Muestra**:
- Total de mensajes
- Cada mensaje numerado con su rol (Usuario/Asistente)
- Métricas del contacto

### Limpiar Historial
```bash
npm run limpiar:numero-parana
```

**Elimina**:
- Contacto completo (incluye historial)
- Estados de conversación
- Conserva turnos (si existen)

## Ventajas

1. **Contexto Completo**: GPT recuerda toda la conversación
2. **Coherencia**: Respuestas consistentes con interacciones previas
3. **Personalización**: Puede recordar preferencias mencionadas antes
4. **Sin Pérdida**: No se pierde información histórica

## Consideraciones

### Límites de OpenAI

Aunque nuestro sistema NO limita el historial, OpenAI tiene límites de tokens:

- **GPT-3.5-turbo**: ~4,096 tokens (~3,000 palabras)
- **GPT-4**: ~8,192 tokens (~6,000 palabras)
- **GPT-4-turbo**: ~128,000 tokens (~96,000 palabras)

**Recomendación**: 
- Para conversaciones muy largas (>100 mensajes), considerar usar GPT-4-turbo
- O implementar resumen automático de mensajes antiguos

### Costos

Cada mensaje enviado a OpenAI incluye TODO el historial:
- Más historial = más tokens = mayor costo
- Pero mejora significativamente la calidad de las respuestas

**Ejemplo**:
- Conversación de 50 mensajes ≈ 2,000 tokens
- Costo por mensaje ≈ $0.002 (GPT-3.5-turbo)

## Monitoreo

### Métricas Guardadas

```typescript
export interface MetricasContacto {
  interacciones: number;        // Total de interacciones
  mensajesEnviados: number;     // Mensajes del asistente
  mensajesRecibidos: number;    // Mensajes del usuario
  tokensConsumidos: number;     // Total de tokens usados
  ultimaInteraccion: Date;      // Última vez que interactuó
}
```

### Ver Métricas
```bash
npm run ver:historial
```

Muestra al final:
- Interacciones totales
- Mensajes enviados/recibidos
- Tokens consumidos
- Última interacción

## Ejemplos de Uso

### Conversación Continua

**Usuario**: "Hola, necesito información sobre hospedaje"
**Asistente**: "¡Hola! Claro, te cuento sobre nuestras cabañas..."

*(2 días después)*

**Usuario**: "Hola de nuevo"
**Asistente**: "¡Hola! ¿Seguís interesado en las cabañas que te comenté?"

✅ GPT recuerda la conversación anterior

### Preferencias Recordadas

**Usuario**: "Prefiero habitaciones con vista al río"
**Asistente**: "Perfecto, tenemos cabañas con vista al Paraná..."

*(1 semana después)*

**Usuario**: "¿Hay disponibilidad para el fin de semana?"
**Asistente**: "Sí, tengo disponible la cabaña con vista al río que te gusta..."

✅ GPT recuerda la preferencia mencionada

## Archivos Relacionados

- `src/controllers/whatsappController.ts` (línea 130-146): Carga historial completo
- `src/services/contactoService.ts` (línea 155-169): Guarda mensajes
- `src/models/ContactoEmpresa.ts` (línea 16-26): Define estructura
- `scripts/verHistorialCompleto.ts`: Script para ver historial
