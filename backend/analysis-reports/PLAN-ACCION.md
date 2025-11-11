# 🎯 PLAN DE ACCIÓN INMEDIATO

**Objetivo:** Implementar sistema de mensajes de flujo 100% configurables desde la BD

**Tiempo estimado:** 9-10 horas (2-3 días de trabajo)

---

## 📚 DOCUMENTOS GENERADOS

1. **`2025-11-11_analisis-completo.json`** - Datos crudos (417 documentos, 18 colecciones)
2. **`2025-11-11_analisis-completo.md`** - Reporte detallado con esquemas
3. **`RESUMEN-EJECUTIVO.md`** - Hallazgos clave y recomendaciones
4. **`ESQUEMA-MIGRACION.md`** - Comparación antes/después + scripts
5. **`PLAN-ACCION.md`** - Este documento

---

## ✅ DECISIÓN REQUERIDA

**¿Proceder con la implementación del plan propuesto?**

### **Opción A: Proceder Ahora** ✅ RECOMENDADO
- Implementar sistema configurable de mensajes
- Separar claramente notificaciones vs flujos
- Mejorar escalabilidad y mantenibilidad

### **Opción B: Posponer**
- Continuar con mensajes hardcodeados
- Implementar solo cuando sea crítico
- Riesgo: Deuda técnica acumulada

---

## 🚀 SI PROCEDER → SIGUIENTE PASO

### **PASO 1: Crear Branch**
```bash
git checkout -b feature/configurable-flow-messages
```

### **PASO 2: Actualizar Modelo**

**Archivo:** `src/modules/calendar/models/ConfiguracionModulo.ts`

```typescript
// Agregar al final del archivo, antes de export

export interface IMensajeFlujo {
  mensaje: string;
  botones?: Array<{
    id: string;
    texto: string;
  }>;
}

export interface IMensajeFlujoConOpciones extends IMensajeFlujo {
  opciones?: Array<{
    id: string;
    texto: string;
    descripcion: string;
  }>;
}

export interface IFlujConfirmacion {
  esperando_confirmacion?: IMensajeFlujo;
  confirmado?: IMensajeFlujo;
  cancelado?: IMensajeFlujo;
  modificado?: IMensajeFlujo;
  error?: IMensajeFlujo;
}

export interface IFlujoMenu {
  bienvenida?: IMensajeFlujoConOpciones;
  opcion_invalida?: IMensajeFlujo;
}

export interface IFlujoNotificacion {
  esperando_opcion_inicial?: IMensajeFlujo;
  confirmado?: IMensajeFlujo;
  cancelado?: IMensajeFlujo;
}

// Actualizar IConfiguracionModulo
export interface IConfiguracionModulo extends Document {
  empresaId: string;
  
  plantillasMeta?: {
    notificacionDiariaAgentes?: any;
    confirmacionTurnos?: any;
  };
  
  // ✨ NUEVO
  mensajesFlujo?: {
    confirmacion_turnos?: IFlujConfirmacion;
    menu_principal?: IFlujoMenu;
    notificacion_viajes?: IFlujoNotificacion;
  };
  
  // ✨ NUEVO
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
  
  // ... resto de campos existentes
}
```

### **PASO 3: Crear Script de Migración**

**Archivo:** `scripts/migrar-mensajes-flujo.js`

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ConfiguracionModuloModel } from '../src/modules/calendar/models/ConfiguracionModulo.js';

dotenv.config();

async function migrar() {
  try {
    console.log('🚀 Iniciando migración de mensajes de flujo...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.useDb('neural_chatbot');
    console.log('✅ Conectado a MongoDB\n');
    
    const configs = await ConfiguracionModuloModel.find();
    console.log(`📋 Configuraciones encontradas: ${configs.length}\n`);
    
    for (const config of configs) {
      console.log(`🔄 Procesando: ${config.empresaId}`);
      
      // Inicializar mensajesFlujo
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
            mensaje: "Tu {turno} del {fecha} a las {hora} ha sido cancelado. Si necesitas reprogramar, escríbenos."
          },
          modificado: {
            mensaje: "Para modificar tu {turno}, por favor indícame:\n1. Nueva fecha\n2. Nueva hora\n3. Otro detalle a cambiar"
          },
          error: {
            mensaje: "Hubo un problema procesando tu solicitud. Por favor, intenta nuevamente o contacta con nosotros."
          }
        },
        menu_principal: {
          bienvenida: {
            mensaje: "¡Hola! Soy el asistente de {nombre_empresa}. ¿En qué puedo ayudarte?",
            opciones: [
              {
                id: "reservar",
                texto: "Reservar {turno}",
                descripcion: "Agenda un nuevo {turno}"
              },
              {
                id: "consultar",
                texto: "Consultar {turno}",
                descripcion: "Ver tus {turnos} programados"
              },
              {
                id: "cancelar",
                texto: "Cancelar {turno}",
                descripcion: "Cancelar un {turno} existente"
              },
              {
                id: "otro",
                texto: "Otra consulta",
                descripcion: "Hablar con un asesor"
              }
            ]
          },
          opcion_invalida: {
            mensaje: "No entendí tu opción. Por favor, selecciona una de las opciones del menú."
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
          },
          confirmado: {
            mensaje: "✅ {turnos} confirmado(s). ¡Gracias!"
          },
          cancelado: {
            mensaje: "Tu {turno} ha sido cancelado."
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
      console.log(`   ✅ Migrado exitosamente\n`);
    }
    
    console.log(`\n✅ Migración completada: ${configs.length} configuraciones actualizadas`);
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

migrar();
```

### **PASO 4: Agregar Script a package.json**

```json
{
  "scripts": {
    "analyze-db": "node scripts/analizar-base-datos.js",
    "migrate:flow-messages": "node scripts/migrar-mensajes-flujo.js"
  }
}
```

### **PASO 5: Ejecutar Migración**

```bash
npm run migrate:flow-messages
```

**Salida esperada:**
```
🚀 Iniciando migración de mensajes de flujo...

✅ Conectado a MongoDB

📋 Configuraciones encontradas: 3

🔄 Procesando: San Jose
   ✅ Migrado exitosamente

🔄 Procesando: Paraná Lodge
   ✅ Migrado exitosamente

🔄 Procesando: Otra Empresa
   ✅ Migrado exitosamente

✅ Migración completada: 3 configuraciones actualizadas
👋 Desconectado de MongoDB
```

### **PASO 6: Verificar en MongoDB**

```javascript
// En MongoDB Compass o mongo shell
use neural_chatbot

db.configuraciones_modulo.findOne(
  { empresaId: "San Jose" },
  { mensajesFlujo: 1, variablesDinamicas: 1 }
)
```

**Resultado esperado:**
```javascript
{
  "_id": ObjectId("..."),
  "mensajesFlujo": {
    "confirmacion_turnos": {
      "esperando_confirmacion": {
        "mensaje": "¿Qué deseas hacer con tu {turno}?",
        "botones": [...]
      },
      ...
    },
    ...
  },
  "variablesDinamicas": {
    "nombre_empresa": "San Jose",
    "nomenclatura_turno": "viaje",
    ...
  }
}
```

---

## 📋 CHECKLIST INICIAL

- [ ] Leer `RESUMEN-EJECUTIVO.md`
- [ ] Leer `ESQUEMA-MIGRACION.md`
- [ ] Decidir si proceder
- [ ] Crear backup de BD
- [ ] Crear branch `feature/configurable-flow-messages`
- [ ] Actualizar `ConfiguracionModulo.ts`
- [ ] Crear `scripts/migrar-mensajes-flujo.js`
- [ ] Agregar script a `package.json`
- [ ] Ejecutar migración
- [ ] Verificar datos en MongoDB
- [ ] Commit: "feat: add mensajesFlujo and variablesDinamicas schema"

---

## 🎯 DESPUÉS DE LA MIGRACIÓN

### **Siguiente Fase: FlowMessageService**

1. Crear `src/services/flowMessageService.ts`
2. Implementar lógica de reemplazo de variables
3. Integrar con flujos existentes
4. Crear tests

**Ver:** `ESQUEMA-MIGRACION.md` para detalles completos

---

## 📞 SOPORTE

Si encuentras problemas durante la migración:

1. **Revisar logs** del script de migración
2. **Verificar conexión** a MongoDB
3. **Comprobar permisos** de escritura en la BD
4. **Rollback** si es necesario:
   ```bash
   mongorestore --uri="..." --db=neural_chatbot ./backup-2025-11-11/neural_chatbot
   ```

---

## ✅ CRITERIOS DE ÉXITO

La migración es exitosa si:

1. ✅ Todas las configuraciones tienen `mensajesFlujo`
2. ✅ Todas las configuraciones tienen `variablesDinamicas`
3. ✅ No hay errores en los logs
4. ✅ Los datos son válidos según el esquema
5. ✅ El sistema sigue funcionando normalmente

---

**¿Listo para empezar?** 🚀

Ejecuta:
```bash
npm run migrate:flow-messages
```

Y comparte el resultado para continuar con la siguiente fase.
