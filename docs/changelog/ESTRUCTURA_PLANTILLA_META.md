# 📋 Estructura de Plantilla de Meta en MongoDB

## 🎯 Qué se guarda en MongoDB

La configuración de la plantilla se guarda en `configuraciones_modulo` → `notificacionDiariaAgentes`:

```json
{
  "usarPlantillaMeta": true,
  "plantillaMeta": {
    "nombre": "chofer_sanjose",
    "idioma": "es",
    "activa": true,
    "componentes": {
      "header": null,
      "body": [
        { "type": "text", "text": "agente" },
        { "type": "text", "text": "lista_turnos" }
      ],
      "buttons": null
    }
  }
}
```

## 🔧 Componentes de la Plantilla

### 1. **Nombre de la plantilla** (`nombre`)
- **Valor:** `"chofer_sanjose"`
- **Uso:** Identifica la plantilla en Meta Business Manager
- **Debe coincidir EXACTAMENTE** con el nombre en Meta

### 2. **Idioma** (`idioma`)
- **Valor:** `"es"` (español)
- **Uso:** Código de idioma para Meta

### 3. **Componentes** (`componentes`)

#### Body (obligatorio):
```json
"body": [
  { "type": "text", "text": "agente" },
  { "type": "text", "text": "lista_turnos" }
]
```

**Explicación:**
- `"agente"`: Nombre de la variable en el código → `{{1}}` en Meta
- `"lista_turnos"`: Nombre de la variable en el código → `{{2}}` en Meta

## 📤 Cómo se envía a Meta

### 1. **Construcción de variables** (en el código):

```typescript
const variables = {
  agente: "Juan Pérez",
  lista_turnos: "1. 10:00 a. m. - Cliente A | Origen: X | Destino: Y || 2. 12:00 p. m. - Cliente B | Origen: Z | Destino: W"
};
```

### 2. **Generación de componentes** (automático):

La función `generarComponentesPlantilla()` convierte:

```typescript
// MongoDB config:
{ "type": "text", "text": "agente" }
{ "type": "text", "text": "lista_turnos" }

// + Variables:
{ agente: "Juan Pérez", lista_turnos: "..." }

// = Componentes para Meta:
[
  {
    "type": "body",
    "parameters": [
      { "type": "text", "text": "Juan Pérez" },
      { "type": "text", "text": "1. 10:00 a. m. - Cliente A..." }
    ]
  }
]
```

### 3. **Payload final a Meta API**:

```json
{
  "messaging_product": "whatsapp",
  "to": "5493794946066",
  "type": "template",
  "template": {
    "name": "chofer_sanjose",
    "language": {
      "code": "es"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Juan Pérez" },
          { "type": "text", "text": "1. 10:00 a. m. - Cliente A | Origen: X | Destino: Y || 2. 12:00 p. m. - Cliente B | Origen: Z | Destino: W" }
        ]
      }
    ]
  }
}
```

## 🔗 Flujo Completo

```
1. MongoDB guarda:
   └─ plantillaMeta.nombre = "chofer_sanjose"
   └─ plantillaMeta.componentes.body = [
        { "type": "text", "text": "agente" },
        { "type": "text", "text": "lista_turnos" }
      ]

2. Código construye variables:
   └─ variables = {
        agente: "Juan Pérez",
        lista_turnos: "1. 10:00 a. m. - ..."
      }

3. generarComponentesPlantilla() mapea:
   └─ "agente" → variables.agente → "Juan Pérez"
   └─ "lista_turnos" → variables.lista_turnos → "1. 10:00 a. m. - ..."

4. enviarMensajePlantillaMeta() envía a Meta:
   └─ POST https://graph.facebook.com/v22.0/{phoneNumberId}/messages
   └─ Body: { template: { name: "chofer_sanjose", components: [...] } }

5. Meta recibe y procesa:
   └─ Busca plantilla "chofer_sanjose" aprobada
   └─ Reemplaza {{1}} con "Juan Pérez"
   └─ Reemplaza {{2}} con "1. 10:00 a. m. - ..."
   └─ Envía mensaje al destinatario
```

## 📋 Plantilla en Meta Business Manager

La plantilla `chofer_sanjose` en Meta debe tener:

```
Hola {{1}}! 👋

Estos son tus viajes de hoy:

{{2}}

¡Que tengas un excelente día! 💪
```

**Donde:**
- `{{1}}` = Nombre del agente (variable "agente")
- `{{2}}` = Lista de turnos (variable "lista_turnos")

## ⚠️ IMPORTANTE

### Lo que se guarda en MongoDB:
- ✅ **Nombre de la plantilla:** `"chofer_sanjose"`
- ✅ **Nombres de variables:** `"agente"`, `"lista_turnos"`
- ✅ **Tipo de componente:** `"body"`

### Lo que NO se guarda en MongoDB:
- ❌ **Contenido del mensaje** ("Hola {{1}}! 👋...")
- ❌ **Texto de la plantilla**
- ❌ **Estructura del mensaje**

**El contenido del mensaje se configura SOLO en Meta Business Manager.**

## 🔍 Verificación

Para verificar que está bien configurado:

```bash
npx tsx src/scripts/verTodoNotifAgentes.ts
```

Debe mostrar:
```json
"plantillaMeta": {
  "nombre": "chofer_sanjose",
  "idioma": "es",
  "activa": true,
  "componentes": {
    "body": [
      { "type": "text", "text": "agente" },
      { "type": "text", "text": "lista_turnos" }
    ]
  }
}
```

## 🎯 Resumen

**MongoDB guarda:**
1. Nombre de la plantilla en Meta
2. Nombres de las variables que se reemplazarán
3. Tipo de componente (body, header, buttons)

**Meta Business Manager guarda:**
1. Contenido del mensaje
2. Texto de la plantilla
3. Posición de los parámetros {{1}}, {{2}}, etc.

**El código hace el mapeo:**
1. Lee la config de MongoDB
2. Construye las variables con valores reales
3. Genera los componentes para Meta
4. Envía a la API de Meta
