# DOCUMENTACIÓN COMPLETA DEL SISTEMA DE FLUJOS

## 📚 Índice de Documentación

Esta documentación cubre **TODOS** los aspectos del sistema de flow builder, desde la arquitectura hasta la implementación práctica.

### Documentos Disponibles

1. **[01-ARQUITECTURA-SISTEMA-FLUJOS.md](./01-ARQUITECTURA-SISTEMA-FLUJOS.md)**
   - Visión general del sistema
   - Modelo de datos completo
   - Tipos de nodos y categorías
   - Sistema de conexiones (edges)
   - Proceso de ejecución de flujos
   - Ejemplos de flujos completos

2. **[02-CONFIGURACION-NODOS.md](./02-CONFIGURACION-NODOS.md)**
   - Configuración detallada de cada tipo de nodo:
     - Nodo GPT (conversacional, formateador, transform)
     - Nodo Router (handles, condiciones, validaciones)
     - Nodo WhatsApp (mensajes, variables)
     - Nodo WooCommerce (búsqueda, field mappings)
     - Nodo MercadoPago (preferencias de pago)
     - Nodo Webhook (triggers, notificaciones)
   - Ejemplos completos de configuración
   - Inyección automática de tópicos en GPT

3. **[03-SISTEMA-VARIABLES-TOPICOS.md](./03-SISTEMA-VARIABLES-TOPICOS.md)**
   - Variables globales automáticas
   - Variables de nodos (contexto)
   - Tópicos globales (knowledge base)
   - Resolución de variables paso a paso
   - Expresiones avanzadas (fallbacks, arrays, anidados)
   - Operadores en condiciones
   - Ejemplos prácticos completos

4. **[04-GUIA-CREAR-BOT-DESDE-CERO.md](./04-GUIA-CREAR-BOT-DESDE-CERO.md)**
   - Preparación inicial (definir propósito, mapear flujo)
   - Crear flujo base desde el frontend
   - Configurar tópicos globales
   - Diseñar el flujo completo paso a paso:
     - Webhook (trigger)
     - GPT Clasificador
     - Router Principal
     - Ramas: Saludo, Búsqueda, Carrito, Consulta
   - Checklist de configuración
   - Probar el flujo
   - Activar en producción

5. **[05-TROUBLESHOOTING-FAQ.md](./05-TROUBLESHOOTING-FAQ.md)**
   - Problemas comunes y soluciones:
     - GPT genera variables literales
     - Router no dirige correctamente
     - Variables no se resuelven
     - Error 500 al guardar flujo
     - Toggle retorna 404
     - Tópicos no se inyectan
   - Errores de configuración
   - Debugging (logs, BD, contexto)
   - Scripts de debugging
   - FAQ (agregar nodos, validaciones, errores, idiomas)
   - Mejores prácticas

6. **[06-SCHEMA-BASE-DE-DATOS.md](./06-SCHEMA-BASE-DE-DATOS.md)**
   - Schema completo de todas las colecciones:
     - `flows` (configuración de flujos)
     - `conversation_states` (estado de conversaciones)
     - `historial_conversaciones` (historial de mensajes)
     - `contactos` (información de usuarios)
     - `api_configs` (configuración de APIs)
   - Interfaces TypeScript completas
   - Ejemplos de documentos reales
   - Índices de MongoDB
   - Queries útiles

---

## 🚀 Inicio Rápido

### Para Crear un Nuevo Bot

1. Lee `04-GUIA-CREAR-BOT-DESDE-CERO.md` completo
2. Prepara la información de tu empresa (tópicos)
3. Mapea el flujo en papel
4. Crea el flujo desde el frontend
5. Configura los nodos paso a paso
6. Prueba exhaustivamente
7. Activa en producción

### Para Entender el Sistema

1. Comienza con `01-ARQUITECTURA-SISTEMA-FLUJOS.md`
2. Luego lee `02-CONFIGURACION-NODOS.md`
3. Profundiza en `03-SISTEMA-VARIABLES-TOPICOS.md`
4. Consulta `06-SCHEMA-BASE-DE-DATOS.md` para entender la BD

### Para Resolver Problemas

1. Busca tu problema en `05-TROUBLESHOOTING-FAQ.md`
2. Revisa los logs del backend
3. Verifica la configuración en MongoDB
4. Usa los scripts de debugging

---

## 📖 Conceptos Clave

### Nodos
Bloques de construcción del flujo. Tipos:
- **Trigger**: Webhook (punto de entrada)
- **Processor**: GPT, Router (procesamiento)
- **Action**: WhatsApp, WooCommerce, MercadoPago (acciones)

### Conexiones (Edges)
Líneas que conectan nodos. Pueden tener:
- Source y target (nodos origen y destino)
- SourceHandle (para routers con múltiples salidas)
- Condiciones (para filtrar ejecución)

### Router
Nodo especial que permite múltiples salidas basadas en condiciones:
```typescript
{
  handles: [
    { id: "route-1", label: "Ruta 1", condition: "{{variable}} == 'valor'" },
    { id: "route-2", label: "Ruta 2", condition: "true" }  // Default
  ]
}
```

### Variables
Datos que fluyen entre nodos:
- **Globales**: `{{telefono}}`, `{{mensaje_usuario}}`
- **De nodos**: `{{nodo-id.propiedad}}`
- **De tópicos**: `{{topicos.empresa.nombre}}`

### Tópicos
Knowledge base de la empresa que se inyecta automáticamente en todos los nodos GPT cuando `topicos_habilitados = true`.

---

## 🔧 Herramientas de Desarrollo

### Scripts Útiles

```bash
# Limpiar estado de usuario antes de probar
cd backend
node scripts/limpiar-mi-numero.js

# Ver flujo completo
node scripts/ver-flujo-completo.mjs

# Listar todos los flujos
node scripts/listar-todos-flujos.mjs

# Activar/desactivar flujo
node scripts/toggle-flujo.mjs
```

### Endpoints API

```bash
# Obtener todos los flujos
GET http://localhost:3000/api/flows

# Obtener flujo por ID
GET http://localhost:3000/api/flows/by-id/:flowId

# Obtener flujos por empresa
GET http://localhost:3000/api/flows/:empresaId

# Crear flujo
POST http://localhost:3000/api/flows

# Actualizar flujo
PUT http://localhost:3000/api/flows/:flowId

# Toggle activo/inactivo
PATCH http://localhost:3000/api/flows/:flowId/toggle

# Eliminar flujo
DELETE http://localhost:3000/api/flows/:flowId
```

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Bot de Ventas Simple

```
Usuario → Webhook → GPT Clasificador → Router
                                         ├─→ Búsqueda → WooCommerce → GPT → WhatsApp
                                         └─→ Consulta → GPT → WhatsApp
```

### Ejemplo 2: Bot con Carrito y Pago

```
Usuario → Webhook → GPT → Router
                           ├─→ Buscar → WooCommerce → GPT → WhatsApp
                           └─→ Carrito → GPT → Router
                                                ├─→ Pagar → MercadoPago → WhatsApp
                                                └─→ Modificar → WooCommerce
```

### Ejemplo 3: Bot con Notificaciones

```
Webhook Pago → Router
                ├─→ Aprobado → WhatsApp Confirmación
                └─→ Rechazado → WhatsApp Error
```

---

## 🎯 Mejores Prácticas

### ✅ Hacer

- Limpiar estado del usuario antes de cada prueba
- Usar nombres descriptivos para nodos y variables
- Configurar tópicos globales para información de la empresa
- Siempre tener una ruta por defecto en routers (`condition: "true"`)
- Verificar logs del backend durante desarrollo
- Probar todos los caminos del flujo

### ❌ Evitar

- Prompts de GPT que generan variables literales `{{variable}}`
- Routers sin ruta por defecto
- Más de 50 nodos en un solo flujo
- Nombres genéricos: "nodo1", "gpt2"
- Asumir que variables siempre existen (usar fallbacks)
- Probar sin limpiar estado previo

---

## 🆘 Soporte

### Problemas Comunes

1. **GPT genera `{{variable}}`** → Ver sección en `05-TROUBLESHOOTING-FAQ.md`
2. **Router no funciona** → Verificar handles y sourceHandle en edges
3. **Variables no se resuelven** → Verificar que el nodo anterior se ejecutó
4. **Error 500 al guardar** → Incluir campo `config: {}` en el flujo
5. **Toggle 404** → Verificar orden de rutas en `flowRoutes.ts`

### Debugging

```bash
# Ver logs en tiempo real
cd backend
npm run dev

# Buscar errores
npm run dev | Select-String "ERROR"
npm run dev | Select-String "❌"
```

### MongoDB

```javascript
// Ver flujo
db.flows.findOne({ nombre: "Mi Bot" })

// Ver estado de conversación
db.conversation_states.findOne({ telefono: "549..." })

// Ver historial
db.historial_conversaciones.findOne({ telefono: "549..." })
```

---

## 📚 Recursos Adicionales

### Archivos Importantes

- **Backend**: `backend/src/services/FlowExecutor.ts` (ejecución de flujos)
- **Frontend**: `front_crm/bot_crm/src/app/dashboard/flow-builder/page.tsx` (editor visual)
- **Modelo**: `backend/src/models/Flow.ts` (schema de MongoDB)
- **Rutas**: `backend/src/routes/flowRoutes.ts` (API endpoints)

### Tecnologías Utilizadas

- **Frontend**: React, React Flow, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Base de Datos**: MongoDB, Mongoose
- **APIs**: OpenAI (GPT), WhatsApp Business Cloud API, WooCommerce, MercadoPago

---

## 🔄 Actualizaciones

**Última actualización**: 2026-01-17

Esta documentación está completa y actualizada con todas las funcionalidades del sistema de flujos.

---

**¡Listo para crear tu primer bot!** 🚀

Comienza con `04-GUIA-CREAR-BOT-DESDE-CERO.md` y sigue los pasos detallados.
