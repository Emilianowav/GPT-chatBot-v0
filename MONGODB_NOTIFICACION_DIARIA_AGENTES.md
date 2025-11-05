# 📦 MongoDB: Notificación Diaria para Agentes

## 🗄️ Ubicación en MongoDB

### Colección
```
configuracion_modulos
```

### Campo
```
notificacionDiariaAgentes
```

### Estructura Completa
```javascript
{
  _id: ObjectId("..."),
  empresaId: "673a1b2c3d4e5f6g7h8i9j0k",
  tipoNegocio: "viajes",
  nomenclatura: { ... },
  camposPersonalizados: [ ... ],
  notificaciones: [ ... ],
  
  // ⭐ CAMPO DE NOTIFICACIÓN DIARIA PARA AGENTES
  notificacionDiariaAgentes: {
    activa: true,                    // 🔴 Si está en false, aparece apagado en el frontend
    horaEnvio: "06:00",
    enviarATodos: false,
    plantillaMensaje: "Buenos días {agente}! 🌅\nEstos son tus {turnos} de hoy:",
    
    frecuencia: {
      tipo: "diaria",
      diasSemana: [1, 2, 3, 4, 5]   // Lun-Vie
    },
    
    rangoHorario: {
      activo: true,
      tipo: "hoy"
    },
    
    filtroHorario: {
      activo: false,
      tipo: "todo_el_dia"
    },
    
    filtroEstado: {
      activo: true,
      estados: ["pendiente", "confirmado"]
    },
    
    filtroTipo: {
      activo: false,
      tipos: []
    },
    
    incluirDetalles: {
      origen: true,
      destino: true,
      nombreCliente: true,
      telefonoCliente: false,
      horaReserva: true,
      notasInternas: false
    },
    
    agentesEspecificos: []
  },
  
  activo: true,
  creadoEn: ISODate("..."),
  actualizadoEn: ISODate("...")
}
```

## 🔍 Cómo Verificar en MongoDB

### Opción 1: Script de Verificación (Recomendado)

```bash
cd backend
npm run ver:notif-diaria-agentes
```

Este script te mostrará:
- ✅ Si existe la configuración
- 🔔 Estado (activa/inactiva)
- ⏰ Hora de envío
- 📅 Frecuencia
- 📋 Detalles incluidos

### Opción 2: MongoDB Compass

1. Abrir MongoDB Compass
2. Conectar a tu base de datos
3. Ir a la colección `configuracion_modulos`
4. Buscar el documento de tu empresa
5. Expandir el campo `notificacionDiariaAgentes`

### Opción 3: MongoDB CLI

```javascript
// Ver todas las empresas con notificación activa
db.configuracion_modulos.find(
  { "notificacionDiariaAgentes.activa": true },
  { empresaId: 1, "notificacionDiariaAgentes": 1 }
).pretty()

// Ver configuración completa de una empresa específica
db.configuracion_modulos.findOne(
  { empresaId: "TU_EMPRESA_ID" },
  { notificacionDiariaAgentes: 1 }
).pretty()

// Ver solo el estado de todas las empresas
db.configuracion_modulos.find(
  {},
  { 
    empresaId: 1, 
    "notificacionDiariaAgentes.activa": 1,
    "notificacionDiariaAgentes.horaEnvio": 1
  }
).pretty()
```

## 🔧 Cómo Activar/Desactivar

### Desde el Frontend
1. Ir a **Calendario → Flujos Automáticos**
2. Buscar la card "📅 Recordatorio Diario para Agentes"
3. Usar el **toggle** para activar/desactivar

### Desde MongoDB CLI
```javascript
// Activar
db.configuracion_modulos.updateOne(
  { empresaId: "TU_EMPRESA_ID" },
  { $set: { "notificacionDiariaAgentes.activa": true } }
)

// Desactivar
db.configuracion_modulos.updateOne(
  { empresaId: "TU_EMPRESA_ID" },
  { $set: { "notificacionDiariaAgentes.activa": false } }
)
```

### Desde Script de Configuración
```bash
cd backend
npm run config:notif-diaria-agentes
```

Editar el script y cambiar:
```typescript
const ACTIVAR = true;  // o false para desactivar
```

## ❓ Por Qué Aparece Apagado en el Frontend

Si el flujo aparece apagado (🔴 inactivo) en el frontend, puede ser por:

### 1. **Campo `activa` está en `false`**
```javascript
notificacionDiariaAgentes: {
  activa: false,  // ❌ Esto hace que aparezca apagado
  // ...
}
```

**Solución:**
```bash
npm run ver:notif-diaria-agentes  # Verificar estado
npm run config:notif-diaria-agentes  # Configurar y activar
```

### 2. **El campo no existe en MongoDB**
```javascript
{
  empresaId: "...",
  notificaciones: [ ... ],
  // ❌ No existe notificacionDiariaAgentes
}
```

**Solución:**
```bash
npm run config:notif-diaria-agentes  # Crear configuración
```

### 3. **Error en la carga del frontend**
El frontend carga el valor desde:
```typescript
const notificacionDiariaAgentes = configModulo?.notificacionDiariaAgentes;
activo: notificacionDiariaAgentes?.activa ?? false
```

**Solución:**
- Verificar que el API endpoint devuelve la configuración
- Revisar la consola del navegador (F12) para errores
- Verificar que `useConfiguracion` hook funciona correctamente

## 🔄 Flujo de Datos

```
MongoDB
  ↓
Backend API: GET /api/modules/calendar/configuracion/:empresaId
  ↓
Frontend Hook: useConfiguracion(empresaId)
  ↓
configModulo.notificacionDiariaAgentes
  ↓
Card en Flujos Automáticos
  ↓
Toggle: activa = true/false
```

## 🛠️ Comandos Útiles

```bash
# Ver configuración actual
npm run ver:notif-diaria-agentes

# Configurar/activar notificación
npm run config:notif-diaria-agentes

# Probar envío
npm run test:notif-diaria-agentes

# Ver logs del servidor
npm run dev
# Buscar líneas con: "📅 Verificando"
```

## 📊 Valores Predeterminados

Si el campo no existe, estos son los valores que se usan:

```typescript
{
  activa: false,                    // ⚠️ Por defecto está INACTIVA
  horaEnvio: "06:00",
  enviarATodos: false,
  plantillaMensaje: "Buenos días! Estos son tus {turnos} de hoy:",
  frecuencia: {
    tipo: "diaria",
    diasSemana: [1, 2, 3, 4, 5]
  },
  rangoHorario: {
    activo: false,
    tipo: "hoy"
  },
  filtroEstado: {
    activo: false,
    estados: ["pendiente", "confirmado"]
  },
  incluirDetalles: {
    origen: true,
    destino: true,
    nombreCliente: true,
    telefonoCliente: false,
    horaReserva: true,
    notasInternas: false
  }
}
```

## ✅ Checklist de Verificación

- [ ] El campo `notificacionDiariaAgentes` existe en MongoDB
- [ ] El campo `activa` está en `true`
- [ ] La hora de envío está configurada
- [ ] El frontend carga correctamente la configuración
- [ ] El API endpoint devuelve los datos
- [ ] No hay errores en la consola del navegador
- [ ] El toggle funciona correctamente

## 🚨 Solución Rápida

Si el flujo aparece apagado:

```bash
# 1. Verificar estado actual
cd backend
npm run ver:notif-diaria-agentes

# 2. Si no existe o está inactiva, configurar
npm run config:notif-diaria-agentes

# 3. Verificar que se guardó correctamente
npm run ver:notif-diaria-agentes

# 4. Refrescar el frontend (F5)
```

## 📝 Ejemplo de Documento Completo

```javascript
{
  "_id": ObjectId("673a1b2c3d4e5f6g7h8i9j0k"),
  "empresaId": "empresa123",
  "tipoNegocio": "viajes",
  "nomenclatura": {
    "turno": "Viaje",
    "turnos": "Viajes",
    "agente": "Chofer",
    "agentes": "Choferes",
    "cliente": "Pasajero",
    "clientes": "Pasajeros"
  },
  "notificaciones": [
    {
      "tipo": "confirmacion",
      "activa": true,
      // ...
    }
  ],
  "notificacionDiariaAgentes": {
    "activa": true,
    "horaEnvio": "06:00",
    "enviarATodos": false,
    "plantillaMensaje": "Buenos días {agente}! 🌅\nEstos son tus {turnos} de hoy:",
    "frecuencia": {
      "tipo": "diaria",
      "diasSemana": [1, 2, 3, 4, 5]
    },
    "rangoHorario": {
      "activo": true,
      "tipo": "hoy"
    },
    "filtroHorario": {
      "activo": false,
      "tipo": "todo_el_dia"
    },
    "filtroEstado": {
      "activo": true,
      "estados": ["pendiente", "confirmado"]
    },
    "filtroTipo": {
      "activo": false,
      "tipos": []
    },
    "incluirDetalles": {
      "origen": true,
      "destino": true,
      "nombreCliente": true,
      "telefonoCliente": false,
      "horaReserva": true,
      "notasInternas": false
    },
    "agentesEspecificos": []
  },
  "activo": true,
  "creadoEn": ISODate("2024-11-05T10:00:00Z"),
  "actualizadoEn": ISODate("2024-11-05T15:00:00Z")
}
```

---

**Resumen:**
- 📦 **Colección**: `configuracion_modulos`
- 🔑 **Campo**: `notificacionDiariaAgentes`
- 🔴 **Estado**: `notificacionDiariaAgentes.activa` (true/false)
- 🛠️ **Verificar**: `npm run ver:notif-diaria-agentes`
- ⚙️ **Configurar**: `npm run config:notif-diaria-agentes`
