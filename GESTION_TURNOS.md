# 🔧 Gestión de Turnos

## 🎯 Objetivo

Crear una sección dedicada dentro del módulo de calendario para administrar y reconfigurar todos los turnos guardados de forma centralizada.

---

## ✨ Funcionalidades

### 1. **Filtros Avanzados**
- 🔍 **Por Estado:** Pendiente, Confirmado, En Curso, Completado, Cancelado
- 👤 **Por Agente:** Filtrar turnos de un agente específico
- 📅 **Por Rango de Fechas:** Desde - Hasta
- 🔎 **Búsqueda:** Por nombre de cliente o agente

### 2. **Vista de Tabla Completa**
- 📋 Lista todos los turnos con información detallada
- 🎨 Códigos de color por estado
- 📱 Información de contacto del cliente
- 📍 Detalles del turno (origen, destino, pasajeros, etc.)

### 3. **Acciones Rápidas**
- ✏️ **Cambiar Estado:** Dropdown para cambiar el estado del turno
- ❌ **Cancelar Turno:** Con motivo de cancelación
- 🔄 **Actualización en Tiempo Real:** Los cambios se reflejan inmediatamente

---

## 🏗️ Estructura de la Página

### Ubicación:
```
/dashboard/calendario/gestion-turnos
```

### Componentes:

```
┌─────────────────────────────────────────────────────────┐
│ 🔧 Gestión de Turnos                                    │
│ Administra y reconfigura los turnos guardados           │
│                                          [Volver] [+]    │
├─────────────────────────────────────────────────────────┤
│ 🔍 Filtros                                              │
│ ┌─────────┬─────────┬─────────┬─────────┬─────────┐   │
│ │ Estado  │ Agente  │ Desde   │ Hasta   │ Buscar  │   │
│ └─────────┴─────────┴─────────┴─────────┴─────────┘   │
│                                    [Aplicar Filtros]    │
├─────────────────────────────────────────────────────────┤
│ 📋 Turnos (15)                                          │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Fecha/Hora │ Cliente │ Agente │ Estado │ Acciones│  │
│ ├───────────────────────────────────────────────────┤  │
│ │ 01/11/2025 │ Juan P. │ María  │ [✓]    │ [▼] [×]│  │
│ │ 09:00      │ 📱 +54  │        │        │         │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Tabla de Turnos

### Columnas:

1. **Fecha y Hora**
   - Fecha en formato DD/MM/YYYY
   - Hora en formato HH:mm

2. **Cliente**
   - Nombre completo
   - Teléfono (si está disponible)

3. **Agente**
   - Nombre del agente asignado

4. **Estado**
   - Badge con color según estado:
     - 🟡 Pendiente (Amarillo)
     - 🔵 Confirmado (Azul)
     - 🟣 En Curso (Morado)
     - 🟢 Completado (Verde)
     - 🔴 Cancelado (Rojo)

5. **Detalles**
   - 📍 Origen
   - 🎯 Destino
   - 👥 Pasajeros
   - Otros campos personalizados

6. **Acciones**
   - Dropdown para cambiar estado
   - Botón para cancelar turno

---

## 🎨 Estados de Turno

### Estados Disponibles:

```typescript
enum EstadoTurno {
  PENDIENTE = 'pendiente',      // 🟡 Recién creado
  CONFIRMADO = 'confirmado',    // 🔵 Cliente confirmó
  EN_CURSO = 'en_curso',        // 🟣 Turno en progreso
  COMPLETADO = 'completado',    // 🟢 Turno finalizado
  CANCELADO = 'cancelado'       // 🔴 Turno cancelado
}
```

### Flujo de Estados:

```
Pendiente → Confirmado → En Curso → Completado
    ↓
Cancelado (desde cualquier estado excepto Completado)
```

---

## 🔄 Acciones Disponibles

### 1. Cambiar Estado

**Cómo funciona:**
```
1. Usuario selecciona nuevo estado del dropdown
   ↓
2. Se actualiza automáticamente en la base de datos
   ↓
3. La tabla se actualiza en tiempo real
   ↓
✅ Estado cambiado
```

**Código:**
```typescript
const handleCambiarEstado = async (turnoId: string, nuevoEstado: string) => {
  try {
    await actualizarEstado(turnoId, nuevoEstado);
    cargarTurnosConFiltros();
  } catch (error) {
    console.error('Error al cambiar estado:', error);
  }
};
```

---

### 2. Cancelar Turno

**Cómo funciona:**
```
1. Usuario hace clic en botón ❌
   ↓
2. Se abre modal de confirmación
   ↓
3. Usuario escribe motivo de cancelación
   ↓
4. Confirma cancelación
   ↓
5. Turno se marca como cancelado
   ↓
✅ Turno cancelado
```

**Modal de Cancelación:**
```
┌─────────────────────────────────────┐
│ ❌ Cancelar Turno              [×] │
├─────────────────────────────────────┤
│ ¿Estás seguro de cancelar?          │
│                                     │
│ Cliente: Juan Pérez                 │
│ Fecha: 01/11/2025                   │
│ Hora: 09:00                         │
│                                     │
│ Motivo de cancelación:              │
│ ┌─────────────────────────────────┐ │
│ │ Cliente canceló por...          │ │
│ └─────────────────────────────────┘ │
│                                     │
│        [Cancelar] [Confirmar]       │
└─────────────────────────────────────┘
```

---

## 🔍 Sistema de Filtros

### Filtros Disponibles:

#### 1. Por Estado
```typescript
<select value={filtros.estado}>
  <option value="todos">Todos los estados</option>
  <option value="pendiente">Pendiente</option>
  <option value="confirmado">Confirmado</option>
  <option value="en_curso">En Curso</option>
  <option value="completado">Completado</option>
  <option value="cancelado">Cancelado</option>
</select>
```

#### 2. Por Agente
```typescript
<select value={filtros.agenteId}>
  <option value="">Todos los agentes</option>
  {agentes.map(agente => (
    <option value={agente._id}>
      {agente.nombre} {agente.apellido}
    </option>
  ))}
</select>
```

#### 3. Por Rango de Fechas
```typescript
<input 
  type="date" 
  value={filtros.fechaDesde}
  onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
/>

<input 
  type="date" 
  value={filtros.fechaHasta}
  onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
/>
```

#### 4. Búsqueda por Texto
```typescript
<input 
  type="text"
  placeholder="Cliente o agente..."
  value={filtros.busqueda}
  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
/>
```

### Aplicar Filtros:

```typescript
const cargarTurnosConFiltros = () => {
  const filtrosApi: any = {};
  
  if (filtros.estado !== 'todos') {
    filtrosApi.estado = filtros.estado;
  }
  
  if (filtros.agenteId) {
    filtrosApi.agenteId = filtros.agenteId;
  }
  
  if (filtros.fechaDesde) {
    filtrosApi.fechaDesde = new Date(filtros.fechaDesde).toISOString();
  }
  
  if (filtros.fechaHasta) {
    const fecha = new Date(filtros.fechaHasta);
    fecha.setHours(23, 59, 59, 999);
    filtrosApi.fechaHasta = fecha.toISOString();
  }
  
  cargarTurnos(filtrosApi);
};
```

---

## 📱 Responsive Design

### Desktop (> 768px):
```
- Tabla completa visible
- Filtros en grid de 3 columnas
- Todas las acciones visibles
```

### Mobile (< 768px):
```
- Tabla con scroll horizontal
- Filtros en columna única
- Botones adaptados al ancho
```

---

## 🎯 Casos de Uso

### Caso 1: Ver Todos los Turnos Pendientes

```
1. Seleccionar "Pendiente" en filtro de estado
2. Hacer clic en "Aplicar Filtros"
3. Ver lista de turnos pendientes
```

### Caso 2: Confirmar Turnos del Día

```
1. Seleccionar fecha de hoy en "Desde" y "Hasta"
2. Seleccionar "Pendiente" en estado
3. Aplicar filtros
4. Para cada turno:
   - Cambiar estado a "Confirmado" en el dropdown
```

### Caso 3: Cancelar Turno con Motivo

```
1. Buscar turno en la tabla
2. Hacer clic en botón ❌
3. Escribir motivo: "Cliente canceló por enfermedad"
4. Confirmar cancelación
```

### Caso 4: Ver Turnos de un Agente Específico

```
1. Seleccionar agente en filtro
2. Aplicar filtros
3. Ver todos los turnos del agente
```

### Caso 5: Buscar Turno de un Cliente

```
1. Escribir nombre del cliente en búsqueda
2. Ver turnos filtrados en tiempo real
```

---

## 🔧 Archivos Creados

### 1. Página Principal
**Archivo:** `src/app/dashboard/calendario/gestion-turnos/page.tsx`

**Características:**
- ✅ Componente funcional con hooks
- ✅ Gestión de estado con useState
- ✅ Filtros avanzados
- ✅ Tabla responsive
- ✅ Modal de cancelación
- ✅ Integración con API

### 2. Estilos
**Archivo:** `src/app/dashboard/calendario/gestion-turnos/gestion.module.css`

**Características:**
- ✅ Diseño moderno con gradientes
- ✅ Tabla estilizada
- ✅ Modal con backdrop
- ✅ Responsive design
- ✅ Animaciones suaves

### 3. Integración
**Archivo:** `src/app/dashboard/calendario/page.tsx`

**Cambio:**
- ✅ Botón "Gestión de Turnos" agregado al header

---

## 🚀 Cómo Usar

### Acceso:

1. Ir a `/dashboard/calendario`
2. Hacer clic en botón "Gestión de Turnos"
3. Se abre la página de gestión

### Filtrar Turnos:

1. Seleccionar filtros deseados
2. Hacer clic en "Aplicar Filtros"
3. Ver resultados filtrados

### Cambiar Estado:

1. Localizar turno en la tabla
2. Seleccionar nuevo estado del dropdown
3. Estado se actualiza automáticamente

### Cancelar Turno:

1. Hacer clic en botón ❌
2. Escribir motivo de cancelación
3. Confirmar cancelación

---

## 📊 Ejemplo de Datos

### Turno en la Tabla:

```
┌─────────────────────────────────────────────────────────────────┐
│ 01/11/2025 │ Juan Pérez      │ María González │ Confirmado │   │
│ 09:00      │ 📱 +54911234567 │                │            │   │
│            │                 │                │            │   │
│ 📍 Av. Corrientes 1234                                         │
│ 🎯 Obelisco                                                    │
│ 👥 2 pasajeros                                                 │
│                                                                 │
│ [Estado: Confirmado ▼] [❌]                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Ventajas

1. **Centralizado:** Todos los turnos en un solo lugar
2. **Filtros Potentes:** Encuentra turnos rápidamente
3. **Acciones Rápidas:** Cambia estados con un clic
4. **Historial Completo:** Ve turnos pasados y futuros
5. **Responsive:** Funciona en cualquier dispositivo
6. **Intuitivo:** Interfaz clara y fácil de usar

---

## 🎨 Paleta de Colores

### Estados:
```css
Pendiente:   #f39c12 (Amarillo)
Confirmado:  #3498db (Azul)
En Curso:    #9b59b6 (Morado)
Completado:  #27ae60 (Verde)
Cancelado:   #e74c3c (Rojo)
```

### Botones:
```css
Primario:    linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Secundario:  #667eea (borde)
Peligro:     linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)
```

---

## 📝 Resumen

**Funcionalidad:** Gestión completa de turnos

**Características:**
- ✅ Filtros avanzados (estado, agente, fechas, búsqueda)
- ✅ Tabla con información completa
- ✅ Cambio rápido de estados
- ✅ Cancelación con motivo
- ✅ Diseño responsive
- ✅ Actualización en tiempo real

**Acceso:** `/dashboard/calendario/gestion-turnos`

**Archivos:**
- ✅ `page.tsx` - Componente principal
- ✅ `gestion.module.css` - Estilos
- ✅ Botón agregado en calendario principal

¡Gestión de turnos completa y funcional! 🎉
