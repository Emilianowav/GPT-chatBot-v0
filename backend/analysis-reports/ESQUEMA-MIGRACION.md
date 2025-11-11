# 🔄 Esquema de Migración: Actual vs Propuesto

## 📊 Estado Actual de la BD

### Colecciones Principales (18 total, 417 documentos)

```
neural_chatbot/
├── admin_users (9)              ✅ En uso
├── flujos (15)                  ✅ En uso - Flujos configurables
├── configuracion_modulos (0)    ❌ VACÍA - Eliminar
├── super_admins (1)             ✅ En uso
├── usuarios_empresa (7)         ✅ En uso
├── turnos (2)                   ✅ En uso
├── conversation_states (1)      ✅ En uso - Estados de flujo
├── agentes (2)                  ✅ En uso
├── configuracionbots (4)        ✅ En uso
├── configuracion_calendario (1) ✅ En uso
├── conversacionbots (13)        ✅ En uso
├── clientes (5)                 ✅ En uso
├── configuraciones_modulo (3)   ✅ EN USO - PRINCIPAL
├── usuarios (29)                ✅ En uso
├── bloqueos_horario (1)         ✅ En uso
├── empresas (7)                 ✅ En uso
├── contactos_empresa (39)       ✅ En uso
└── flow_logs (100)              ✅ En uso - Logs de flujos
```

---

## 🎯 Colección Objetivo: `configuraciones_modulo`

### **Estado Actual** (3 documentos)

```javascript
{
  "_id": ObjectId,
  "empresaId": "San Jose",  // ⚠️ String, debería ser ObjectId
  
  // ✅ YA EXISTE - Plantillas de Meta
  "plantillasMeta": {
    "notificacionDiariaAgentes": {
      "activa": true,
      "nombre": "chofer_sanjose",
      "tipo": "plantilla_meta",
      "idioma": "es",
      "parametros": [
        {
          "orden": 1,
          "nombre": "nombre",
          "valor": "{{nombre}}"
        },
        {
          "orden": 2,
          "nombre": "lista_turnos",
          "valor": "{{lista_turnos}}"
        }
      ],
      "programacion": {
        "hora": "06:00",
        "diasSemana": [1,2,3,4,5,6,7],
        "filtroEstado": ["pendiente", "confirmado"]
      }
    },
    "confirmacionTurnos": {
      "activa": true,
      "nombre": "clientes_sanjose",
      "tipo": "plantilla_meta",
      "idioma": "es",
      "parametros": [
        {
          "orden": 1,
          "nombre": "nombre",
          "valor": "{{nombre}}"
        },
        {
          "orden": 2,
          "nombre": "turnos",
          "valor": "{{turnos}}"
        }
      ],
      "programacion": {
        "hora": "22:00",
        "diasAntes": 1
      }
    }
  },
  
  // ❌ NO EXISTE - Necesario agregar
  "mensajesFlujo": undefined,
  "variablesDinamicas": undefined,
  
  "createdAt": Date,
  "updatedAt": Date,
  "__v": Number
}
```

---

### **Estado Propuesto** (Después de migración)

```javascript
{
  "_id": ObjectId,
  "empresaId": "San Jose",
  
  // ✅ MANTENER - Plantillas de Meta (para INICIAR conversaciones)
  "plantillasMeta": {
    "notificacionDiariaAgentes": { /* ... igual que antes ... */ },
    "confirmacionTurnos": { /* ... igual que antes ... */ }
  },
  
  // ✨ NUEVO - Mensajes de flujos (para DENTRO de conversaciones)
  "mensajesFlujo": {
    
    // Flujo: Confirmación de Turnos
    "confirmacion_turnos": {
      "esperando_confirmacion": {
        "mensaje": "¿Qué deseas hacer con tu {turno}?",
        "botones": [
          { "id": "confirmar", "texto": "Confirmar" },
          { "id": "modificar", "texto": "Modificar" },
          { "id": "cancelar", "texto": "Cancelar" }
        ]
      },
      "confirmado": {
        "mensaje": "✅ Perfecto! Tu {turno} ha sido confirmado para el {fecha} a las {hora}. Te esperamos!"
      },
      "cancelado": {
        "mensaje": "Tu {turno} del {fecha} a las {hora} ha sido cancelado. Si necesitas reprogramar, escríbenos."
      },
      "modificado": {
        "mensaje": "Para modificar tu {turno}, por favor indícame:\n1. Nueva fecha\n2. Nueva hora\n3. Otro detalle a cambiar"
      },
      "error": {
        "mensaje": "Hubo un problema procesando tu solicitud. Por favor, intenta nuevamente o contacta con nosotros."
      }
    },
    
    // Flujo: Menú Principal
    "menu_principal": {
      "bienvenida": {
        "mensaje": "¡Hola! Soy el asistente de {nombre_empresa}. ¿En qué puedo ayudarte?",
        "opciones": [
          {
            "id": "reservar",
            "texto": "Reservar {turno}",
            "descripcion": "Agenda un nuevo {turno}"
          },
          {
            "id": "consultar",
            "texto": "Consultar {turno}",
            "descripcion": "Ver tus {turnos} programados"
          },
          {
            "id": "cancelar",
            "texto": "Cancelar {turno}",
            "descripcion": "Cancelar un {turno} existente"
          },
          {
            "id": "otro",
            "texto": "Otra consulta",
            "descripcion": "Hablar con un asesor"
          }
        ]
      },
      "opcion_invalida": {
        "mensaje": "No entendí tu opción. Por favor, selecciona una de las opciones del menú."
      }
    },
    
    // Flujo: Notificación de Viajes
    "notificacion_viajes": {
      "esperando_opcion_inicial": {
        "mensaje": "Recibimos tu mensaje. ¿Qué deseas hacer?",
        "botones": [
          { "id": "confirmar", "texto": "Confirmar" },
          { "id": "modificar", "texto": "Modificar" },
          { "id": "cancelar", "texto": "Cancelar" }
        ]
      },
      "confirmado": {
        "mensaje": "✅ {turnos} confirmado(s). ¡Gracias!"
      },
      "cancelado": {
        "mensaje": "Tu {turno} ha sido cancelado."
      }
    }
  },
  
  // ✨ NUEVO - Variables dinámicas por empresa
  "variablesDinamicas": {
    "nombre_empresa": "San Jose",
    "nomenclatura_turno": "viaje",        // "viaje", "turno", "cita", "reserva"
    "nomenclatura_turnos": "viajes",      // plural
    "nomenclatura_agente": "chofer",      // "chofer", "médico", "profesional"
    "nomenclatura_agentes": "choferes",   // plural
    "zona_horaria": "America/Argentina/Buenos_Aires",
    "moneda": "ARS",
    "idioma": "es"
  },
  
  // ✅ MANTENER - Otros campos existentes
  "createdAt": Date,
  "updatedAt": Date,
  "__v": Number
}
```

---

## 🔄 Script de Migración

### **Paso 1: Backup**
```bash
mongodump --uri="mongodb+srv://..." --db=neural_chatbot --out=./backup-2025-11-11
```

### **Paso 2: Migración**
```javascript
// scripts/migrar-mensajes-flujo.js

import mongoose from 'mongoose';
import { ConfiguracionModuloModel } from '../src/modules/calendar/models/ConfiguracionModulo.js';

async function migrar() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const configs = await ConfiguracionModuloModel.find();
  
  for (const config of configs) {
    // Inicializar mensajesFlujo con valores por defecto
    config.mensajesFlujo = {
      confirmacion_turnos: {
        esperando_confirmacion: {
          mensaje: "¿Qué deseas hacer con tu {turno}?",
          botones: [
            { id: "confirmar", texto: "Confirmar" },
            { id: "modificar", texto: "Modificar" },
            { id: "cancelar", texto: "Cancelar" }
          ]
        },
        confirmado: {
          mensaje: "✅ Perfecto! Tu {turno} ha sido confirmado para el {fecha} a las {hora}. Te esperamos!"
        },
        cancelado: {
          mensaje: "Tu {turno} del {fecha} a las {hora} ha sido cancelado."
        },
        modificado: {
          mensaje: "Para modificar tu {turno}, indícame los cambios."
        }
      },
      menu_principal: {
        bienvenida: {
          mensaje: "¡Hola! Soy el asistente de {nombre_empresa}. ¿En qué puedo ayudarte?",
          opciones: [
            { id: "reservar", texto: "Reservar {turno}", descripcion: "Agenda un nuevo {turno}" },
            { id: "consultar", texto: "Consultar {turno}", descripcion: "Ver tus {turnos} programados" },
            { id: "cancelar", texto: "Cancelar {turno}", descripcion: "Cancelar un {turno} existente" }
          ]
        }
      },
      notificacion_viajes: {
        esperando_opcion_inicial: {
          mensaje: "Recibimos tu mensaje. ¿Qué deseas hacer?",
          botones: [
            { id: "confirmar", texto: "Confirmar" },
            { id: "modificar", texto: "Modificar" },
            { id: "cancelar", texto: "Cancelar" }
          ]
        }
      }
    };
    
    // Inicializar variablesDinamicas
    config.variablesDinamicas = {
      nombre_empresa: config.empresaId,
      nomenclatura_turno: "turno",
      nomenclatura_turnos: "turnos",
      nomenclatura_agente: "profesional",
      nomenclatura_agentes: "profesionales",
      zona_horaria: "America/Argentina/Buenos_Aires",
      moneda: "ARS",
      idioma: "es"
    };
    
    await config.save();
    console.log(`✅ Migrado: ${config.empresaId}`);
  }
  
  console.log(`\n✅ Migración completada: ${configs.length} configuraciones actualizadas`);
  await mongoose.disconnect();
}

migrar().catch(console.error);
```

### **Paso 3: Verificación**
```javascript
// scripts/verificar-migracion.js

async function verificar() {
  const configs = await ConfiguracionModuloModel.find();
  
  for (const config of configs) {
    console.log(`\n📋 ${config.empresaId}:`);
    console.log(`   ✅ plantillasMeta: ${!!config.plantillasMeta}`);
    console.log(`   ✅ mensajesFlujo: ${!!config.mensajesFlujo}`);
    console.log(`   ✅ variablesDinamicas: ${!!config.variablesDinamicas}`);
    
    if (config.mensajesFlujo) {
      console.log(`   📝 Flujos configurados: ${Object.keys(config.mensajesFlujo).length}`);
    }
  }
}
```

---

## 📝 Actualización del Modelo Mongoose

### **Antes:**
```typescript
// models/ConfiguracionModulo.ts

export interface IConfiguracionModulo extends Document {
  empresaId: string;
  plantillasMeta?: {
    notificacionDiariaAgentes?: any;
    confirmacionTurnos?: any;
  };
  // ... otros campos
}
```

### **Después:**
```typescript
// models/ConfiguracionModulo.ts

export interface IConfiguracionModulo extends Document {
  empresaId: string;
  
  // Plantillas de Meta (para INICIAR conversaciones)
  plantillasMeta?: {
    notificacionDiariaAgentes?: IPlantillaMeta;
    confirmacionTurnos?: IPlantillaMeta;
  };
  
  // ✨ NUEVO - Mensajes de flujos (para DENTRO de conversaciones)
  mensajesFlujo?: {
    confirmacion_turnos?: IFlujoCon firmacion;
    menu_principal?: IFlujoMenu;
    notificacion_viajes?: IFlujoNotificacion;
  };
  
  // ✨ NUEVO - Variables dinámicas por empresa
  variablesDinamicas?: {
    nombre_empresa: string;
    nomenclatura_turno: string;
    nomenclatura_turnos: string;
    nomenclatura_agente: string;
    nomenclatura_agentes: string;
    zona_horaria: string;
    moneda: string;
    idioma: string;
  };
}

// Interfaces auxiliares
interface IPlantillaMeta {
  activa: boolean;
  nombre: string;
  tipo: 'plantilla_meta' | 'texto_directo';
  idioma: string;
  parametros: Array<{
    orden: number;
    nombre: string;
    valor: string;
  }>;
  programacion?: any;
}

interface IFlujConfirmacion {
  esperando_confirmacion?: IMensajeFlujo;
  confirmado?: IMensajeFlujo;
  cancelado?: IMensajeFlujo;
  modificado?: IMensajeFlujo;
  error?: IMensajeFlujo;
}

interface IFlujoMenu {
  bienvenida?: IMensajeFlujoConOpciones;
  opcion_invalida?: IMensajeFlujo;
}

interface IMensajeFlujo {
  mensaje: string;
  botones?: Array<{
    id: string;
    texto: string;
  }>;
}

interface IMensajeFlujoConOpciones extends IMensajeFlujo {
  opciones?: Array<{
    id: string;
    texto: string;
    descripcion: string;
  }>;
}
```

---

## 🚀 Orden de Implementación

### **Día 1: Preparación**
1. ✅ Ejecutar script de análisis
2. ✅ Revisar RESUMEN-EJECUTIVO.md
3. ✅ Revisar ESQUEMA-MIGRACION.md
4. Aprobar plan de migración
5. Crear backup de BD

### **Día 2: Modelo y Migración**
1. Actualizar `ConfiguracionModulo.ts` con nuevas interfaces
2. Crear script `migrar-mensajes-flujo.js`
3. Ejecutar migración en desarrollo
4. Verificar datos migrados
5. Commit: "feat: add mensajesFlujo and variablesDinamicas to ConfiguracionModulo"

### **Día 3: FlowMessageService**
1. Crear `services/flowMessageService.ts`
2. Implementar `getMensaje()` y `enviarMensajeFlujo()`
3. Agregar tests unitarios
4. Commit: "feat: create FlowMessageService for configurable flow messages"

### **Día 4: Refactorizar Flujos**
1. Actualizar `confirmacionTurnosFlow.ts`
2. Actualizar `menuPrincipalFlow.ts`
3. Actualizar `notificacionViajesFlow.ts`
4. Probar cada flujo
5. Commit: "refactor: use FlowMessageService in all flows"

### **Día 5: Frontend**
1. Crear componente `ConfiguracionMensajesFlujo.tsx`
2. Crear endpoints de API
3. Integrar en panel de configuración
4. Probar end-to-end
5. Commit: "feat: add frontend panel for flow messages configuration"

---

## ✅ Checklist de Migración

- [ ] Backup de BD creado
- [ ] Modelo actualizado con nuevas interfaces
- [ ] Script de migración creado
- [ ] Migración ejecutada en desarrollo
- [ ] Datos verificados
- [ ] FlowMessageService implementado
- [ ] Tests unitarios pasando
- [ ] Flujos refactorizados
- [ ] Frontend implementado
- [ ] Testing end-to-end completado
- [ ] Documentación actualizada
- [ ] Migración ejecutada en producción
- [ ] Rollback plan documentado

---

**Próximo paso:** Ejecutar migración en desarrollo y verificar resultados.
