# 💬 FlowMessageService - Guía de Uso

## 📖 Descripción

`FlowMessageService` es el servicio encargado de gestionar mensajes configurables para flujos conversacionales. Permite enviar mensajes personalizados desde la base de datos con reemplazo automático de variables.

## ⚠️ IMPORTANTE

**Este servicio es para mensajes DENTRO de conversaciones activas.**

- ✅ **Usar FlowMessageService**: Respuestas dentro de un flujo conversacional
- ❌ **NO usar FlowMessageService**: Para iniciar conversaciones (usar NotificationService con plantillas de Meta)

---

## 🚀 Uso Básico

### 1. Importar el Servicio

```typescript
import { flowMessageService } from '../services/flowMessageService.js';
```

### 2. Enviar Mensaje Simple

```typescript
// Ejemplo: Confirmar un turno
await flowMessageService.enviarMensajeFlujo(
  '+5491112345678',           // Teléfono del usuario
  'San Jose',                  // ID de la empresa
  'confirmacion_turnos',       // Nombre del flujo
  'confirmado',                // Estado del flujo
  {                            // Variables a reemplazar
    turno: 'viaje',
    fecha: '15/11/2025',
    hora: '14:30'
  }
);
```

**Mensaje enviado:**
```
✅ Perfecto! Tu viaje ha sido confirmado para el 15/11/2025 a las 14:30. Te esperamos!
```

### 3. Enviar Mensaje con Botones

```typescript
// Ejemplo: Preguntar qué hacer con un turno
await flowMessageService.enviarMensajeFlujo(
  '+5491112345678',
  'San Jose',
  'confirmacion_turnos',
  'esperando_confirmacion',
  {
    turno: 'viaje'
  }
);
```

**Mensaje enviado con botones:**
```
¿Qué deseas hacer con tu viaje?

[Confirmar] [Modificar] [Cancelar]
```

### 4. Enviar Mensaje con Opciones de Menú

```typescript
// Ejemplo: Mostrar menú principal
await flowMessageService.enviarMensajeConOpciones(
  '+5491112345678',
  'San Jose',
  'menu_principal',
  'bienvenida',
  {}
);
```

**Mensaje enviado:**
```
¡Hola! Soy el asistente de San Jose. ¿En qué puedo ayudarte?

1. Reservar viaje - Agenda un nuevo viaje
2. Consultar viaje - Ver tus viajes programados
3. Cancelar viaje - Cancelar un viaje existente
4. Otra consulta - Hablar con un asesor
```

---

## 🔧 Métodos Disponibles

### `getMensaje(empresaId, flujo, estado)`

Obtiene un mensaje configurado desde la BD.

```typescript
const mensaje = await flowMessageService.getMensaje(
  'San Jose',
  'confirmacion_turnos',
  'confirmado'
);

console.log(mensaje);
// {
//   mensaje: "✅ Perfecto! Tu {turno} ha sido confirmado...",
//   botones: undefined
// }
```

### `getVariablesDinamicas(empresaId)`

Obtiene las variables dinámicas de una empresa.

```typescript
const variables = await flowMessageService.getVariablesDinamicas('San Jose');

console.log(variables);
// {
//   nombre_empresa: 'San Jose',
//   nomenclatura_turno: 'viaje',
//   nomenclatura_turnos: 'viajes',
//   nomenclatura_agente: 'chofer',
//   nomenclatura_agentes: 'choferes',
//   zona_horaria: 'America/Argentina/Buenos_Aires',
//   moneda: 'ARS',
//   idioma: 'es'
// }
```

### `reemplazarVariables(texto, variables, variablesDinamicas)`

Reemplaza variables en un texto.

```typescript
const texto = "Tu {turno} del {fecha} a las {hora}";
const resultado = flowMessageService.reemplazarVariables(
  texto,
  { fecha: '15/11', hora: '14:30' },
  { turno: 'viaje' }
);

console.log(resultado);
// "Tu viaje del 15/11 a las 14:30"
```

### `enviarMensajeFlujo(telefono, empresaId, flujo, estado, variables)`

Envía un mensaje de flujo (con o sin botones).

```typescript
const enviado = await flowMessageService.enviarMensajeFlujo(
  '+5491112345678',
  'San Jose',
  'confirmacion_turnos',
  'confirmado',
  { turno: 'viaje', fecha: '15/11', hora: '14:30' }
);

console.log(enviado); // true si se envió correctamente
```

### `enviarMensajeConOpciones(telefono, empresaId, flujo, estado, variables)`

Envía un mensaje con opciones de menú.

```typescript
const enviado = await flowMessageService.enviarMensajeConOpciones(
  '+5491112345678',
  'San Jose',
  'menu_principal',
  'bienvenida',
  {}
);
```

---

## 📝 Variables Disponibles

### Variables de Contexto (específicas de cada mensaje)

Estas variables se pasan en el objeto `variables`:

```typescript
{
  turno: string,        // ID o descripción del turno
  turnos: string,       // Lista de turnos
  fecha: string,        // Fecha del turno
  hora: string,         // Hora del turno
  nombre: string,       // Nombre del cliente
  origen: string,       // Origen del viaje
  destino: string,      // Destino del viaje
  pasajeros: number,    // Cantidad de pasajeros
  // ... cualquier otra variable personalizada
}
```

### Variables Dinámicas (de la empresa)

Estas se obtienen automáticamente de la BD:

```typescript
{
  nombre_empresa: string,       // "San Jose"
  nomenclatura_turno: string,   // "viaje", "turno", "cita"
  nomenclatura_turnos: string,  // "viajes", "turnos", "citas"
  nomenclatura_agente: string,  // "chofer", "médico", "profesional"
  nomenclatura_agentes: string, // "choferes", "médicos", "profesionales"
  zona_horaria: string,         // "America/Argentina/Buenos_Aires"
  moneda: string,               // "ARS", "USD"
  idioma: string                // "es", "en"
}
```

---

## 🔄 Integración con Flujos

### Ejemplo: Flujo de Confirmación de Turnos

```typescript
// flows/confirmacionTurnosFlow.ts

import { flowMessageService } from '../services/flowMessageService.js';
import { Flow, FlowContext, FlowResult } from './types.js';

export const confirmacionTurnosFlow: Flow = {
  name: 'confirmacion_turnos',
  priority: 'urgente',
  version: '1.0.0',

  shouldActivate: (context: FlowContext) => {
    // Este flujo se activa programáticamente
    return false;
  },

  start: async (context: FlowContext): Promise<FlowResult> => {
    // Enviar mensaje con botones usando el servicio
    await flowMessageService.enviarMensajeFlujo(
      context.telefono,
      context.empresaId,
      'confirmacion_turnos',
      'esperando_confirmacion',
      {
        turno: context.flowData?.turno || 'turno'
      }
    );

    return {
      nextState: 'esperando_confirmacion',
      data: context.flowData
    };
  },

  onInput: async (context: FlowContext): Promise<FlowResult> => {
    const { message, flowState, flowData } = context;
    
    if (flowState === 'esperando_confirmacion') {
      const respuesta = message.text?.toLowerCase();
      
      if (respuesta === 'confirmar' || message.interactive?.button_reply?.id === 'confirmar') {
        // Enviar mensaje de confirmación
        await flowMessageService.enviarMensajeFlujo(
          context.telefono,
          context.empresaId,
          'confirmacion_turnos',
          'confirmado',
          {
            turno: flowData.turno,
            fecha: flowData.fecha,
            hora: flowData.hora
          }
        );

        return {
          nextState: null,
          data: null,
          completed: true
        };
      }
      
      if (respuesta === 'cancelar' || message.interactive?.button_reply?.id === 'cancelar') {
        // Enviar mensaje de cancelación
        await flowMessageService.enviarMensajeFlujo(
          context.telefono,
          context.empresaId,
          'confirmacion_turnos',
          'cancelado',
          {
            turno: flowData.turno,
            fecha: flowData.fecha,
            hora: flowData.hora
          }
        );

        return {
          nextState: null,
          data: null,
          completed: true
        };
      }
      
      if (respuesta === 'modificar' || message.interactive?.button_reply?.id === 'modificar') {
        // Enviar mensaje de modificación
        await flowMessageService.enviarMensajeFlujo(
          context.telefono,
          context.empresaId,
          'confirmacion_turnos',
          'modificado',
          {
            turno: flowData.turno
          }
        );

        return {
          nextState: 'esperando_modificacion',
          data: flowData
        };
      }
    }

    // Si no se reconoce la respuesta, enviar mensaje de error
    await flowMessageService.enviarMensajeFlujo(
      context.telefono,
      context.empresaId,
      'confirmacion_turnos',
      'error',
      {}
    );

    return {
      nextState: flowState,
      data: flowData
    };
  }
};
```

---

## ✅ Ventajas del Sistema

1. **100% Configurable**: Todos los mensajes se editan desde la BD
2. **Multiempresa**: Cada empresa tiene sus propios mensajes
3. **Variables Dinámicas**: Nomenclaturas personalizadas por empresa
4. **Mantenible**: Cambios de texto sin tocar código
5. **Escalable**: Fácil agregar nuevos flujos y estados
6. **Type-Safe**: TypeScript garantiza tipos correctos

---

## 🎯 Próximos Pasos

1. Refactorizar flujos existentes para usar `FlowMessageService`
2. Crear panel de administración para editar mensajes
3. Agregar soporte para más tipos de mensajes (listas, imágenes, etc.)
4. Implementar sistema de plantillas con Handlebars para lógica compleja

---

## 📞 Soporte

Para dudas o problemas, revisar:
- `analysis-reports/RESUMEN-EJECUTIVO.md`
- `analysis-reports/ESQUEMA-MIGRACION.md`
- `analysis-reports/PLAN-ACCION.md`
