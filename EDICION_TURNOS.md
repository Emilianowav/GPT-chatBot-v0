# ✏️ Edición Completa de Turnos

## 🎯 Objetivo

Permitir la edición completa de todos los aspectos de un turno, especialmente el cambio de agente asignado.

---

## ✨ Funcionalidades

### Campos Editables:

1. **👤 Agente** - Cambiar el agente asignado al turno
2. **📅 Fecha y Hora de Inicio** - Modificar cuándo empieza el turno
3. **⏰ Fecha y Hora de Fin** - Modificar cuándo termina el turno
4. **📝 Notas** - Agregar o modificar notas del turno
5. **📍 Origen** - Dirección de origen (campo personalizado)
6. **🎯 Destino** - Dirección de destino (campo personalizado)
7. **👥 Pasajeros** - Número de pasajeros (campo personalizado)
8. **🧳 Equipaje** - Descripción del equipaje (campo personalizado)
9. **💬 Observaciones** - Observaciones adicionales (campo personalizado)

---

## 🖼️ Modal de Edición

### Vista del Modal:

```
┌────────────────────────────────────────────────────────┐
│ ✏️ Editar Turno                                   [×] │
├────────────────────────────────────────────────────────┤
│ Cliente: Juan Pérez                                    │
│ Teléfono: +54 9 11 1234-5678                          │
├────────────────────────────────────────────────────────┤
│ 👤 Agente *                  📅 Fecha y Hora Inicio * │
│ [María González ▼]           [01/11/2025 09:00]       │
│                                                        │
│ ⏰ Fecha y Hora Fin          📝 Notas                 │
│ [01/11/2025 10:00]           [Notas adicionales...]   │
├────────────────────────────────────────────────────────┤
│ 📋 Detalles del Turno                                 │
│                                                        │
│ 📍 Origen                    🎯 Destino               │
│ [Av. Corrientes 1234]        [Obelisco]               │
│                                                        │
│ 👥 Pasajeros                 🧳 Equipaje              │
│ [2]                          [Valija grande]           │
│                                                        │
│ 💬 Observaciones                                      │
│ [Cliente prefiere música clásica...]                  │
├────────────────────────────────────────────────────────┤
│                          [Cancelar] [💾 Guardar]      │
└────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementación

### 1. Botón de Editar en la Tabla

**Ubicación:** Columna "Acciones" de cada turno

```tsx
<button
  className={styles.btnEditar}
  onClick={() => abrirModalEdicion(turno)}
  title="Editar turno"
>
  ✏️
</button>
```

**Estilo:**
```css
.btnEditar {
  background: rgba(102, 126, 234, 0.1);
  border: 2px solid #667eea;
  color: #667eea;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
}

.btnEditar:hover {
  background: #667eea;
  color: white;
  transform: scale(1.1);
}
```

---

### 2. Estado del Formulario

```typescript
const [formEdicion, setFormEdicion] = useState({
  agenteId: '',
  fechaInicio: '',
  fechaFin: '',
  notas: '',
  datos: {} as any
});
```

---

### 3. Abrir Modal de Edición

```typescript
const abrirModalEdicion = (turno: Turno) => {
  setTurnoSeleccionado(turno);
  
  // Cargar datos del turno en el formulario
  setFormEdicion({
    agenteId: typeof turno.agenteId === 'string' 
      ? turno.agenteId 
      : (turno.agenteId as any)?._id || '',
    fechaInicio: new Date(turno.fechaInicio).toISOString().slice(0, 16),
    fechaFin: turno.fechaFin 
      ? new Date(turno.fechaFin).toISOString().slice(0, 16) 
      : '',
    notas: turno.notas || '',
    datos: turno.datos || {}
  });
  
  setModalEditar(true);
};
```

---

### 4. Guardar Cambios

```typescript
const handleGuardarEdicion = async () => {
  if (!turnoSeleccionado) return;
  
  try {
    const response = await fetch(
      `${API_URL}/api/calendar/turnos/${turnoSeleccionado._id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          agenteId: formEdicion.agenteId,
          fechaInicio: new Date(formEdicion.fechaInicio).toISOString(),
          fechaFin: formEdicion.fechaFin 
            ? new Date(formEdicion.fechaFin).toISOString() 
            : undefined,
          notas: formEdicion.notas,
          datos: formEdicion.datos
        })
      }
    );

    if (!response.ok) {
      throw new Error('Error al actualizar turno');
    }

    setModalEditar(false);
    setTurnoSeleccionado(null);
    cargarTurnosConFiltros();
  } catch (error) {
    console.error('Error al guardar edición:', error);
    alert('Error al guardar los cambios');
  }
};
```

---

### 5. Actualizar Campos Personalizados

```typescript
const actualizarDatosCampo = (campo: string, valor: any) => {
  setFormEdicion({
    ...formEdicion,
    datos: {
      ...formEdicion.datos,
      [campo]: valor
    }
  });
};
```

---

## 📋 Campos del Formulario

### Campos Principales:

#### 1. Agente (Obligatorio)
```tsx
<div className={styles.field}>
  <label>👤 Agente *</label>
  <select
    value={formEdicion.agenteId}
    onChange={(e) => setFormEdicion({ 
      ...formEdicion, 
      agenteId: e.target.value 
    })}
  >
    <option value="">Seleccionar agente...</option>
    {agentes.map(agente => (
      <option key={agente._id} value={agente._id}>
        {agente.nombre} {agente.apellido}
      </option>
    ))}
  </select>
</div>
```

#### 2. Fecha y Hora de Inicio (Obligatorio)
```tsx
<div className={styles.field}>
  <label>📅 Fecha y Hora de Inicio *</label>
  <input
    type="datetime-local"
    value={formEdicion.fechaInicio}
    onChange={(e) => setFormEdicion({ 
      ...formEdicion, 
      fechaInicio: e.target.value 
    })}
  />
</div>
```

#### 3. Fecha y Hora de Fin (Opcional)
```tsx
<div className={styles.field}>
  <label>⏰ Fecha y Hora de Fin</label>
  <input
    type="datetime-local"
    value={formEdicion.fechaFin}
    onChange={(e) => setFormEdicion({ 
      ...formEdicion, 
      fechaFin: e.target.value 
    })}
  />
</div>
```

#### 4. Notas (Opcional)
```tsx
<div className={styles.field} style={{ gridColumn: '1 / -1' }}>
  <label>📝 Notas</label>
  <textarea
    value={formEdicion.notas}
    onChange={(e) => setFormEdicion({ 
      ...formEdicion, 
      notas: e.target.value 
    })}
    placeholder="Notas adicionales..."
    rows={3}
  />
</div>
```

---

### Campos Personalizados:

#### 1. Origen
```tsx
<div className={styles.field}>
  <label>📍 Origen</label>
  <input
    type="text"
    value={formEdicion.datos?.origen || ''}
    onChange={(e) => actualizarDatosCampo('origen', e.target.value)}
    placeholder="Dirección de origen..."
  />
</div>
```

#### 2. Destino
```tsx
<div className={styles.field}>
  <label>🎯 Destino</label>
  <input
    type="text"
    value={formEdicion.datos?.destino || ''}
    onChange={(e) => actualizarDatosCampo('destino', e.target.value)}
    placeholder="Dirección de destino..."
  />
</div>
```

#### 3. Pasajeros
```tsx
<div className={styles.field}>
  <label>👥 Pasajeros</label>
  <input
    type="number"
    value={formEdicion.datos?.pasajeros || ''}
    onChange={(e) => actualizarDatosCampo('pasajeros', e.target.value)}
    placeholder="Número de pasajeros..."
    min="1"
  />
</div>
```

#### 4. Equipaje
```tsx
<div className={styles.field}>
  <label>🧳 Equipaje</label>
  <input
    type="text"
    value={formEdicion.datos?.equipaje || ''}
    onChange={(e) => actualizarDatosCampo('equipaje', e.target.value)}
    placeholder="Descripción del equipaje..."
  />
</div>
```

#### 5. Observaciones
```tsx
<div className={styles.field} style={{ gridColumn: '1 / -1' }}>
  <label>💬 Observaciones</label>
  <textarea
    value={formEdicion.datos?.observaciones || ''}
    onChange={(e) => actualizarDatosCampo('observaciones', e.target.value)}
    placeholder="Observaciones adicionales..."
    rows={2}
  />
</div>
```

---

## 🎯 Casos de Uso

### Caso 1: Cambiar Agente

**Escenario:** El agente original no puede atender el turno

```
1. Hacer clic en botón ✏️ del turno
2. Seleccionar nuevo agente del dropdown
3. Hacer clic en "💾 Guardar Cambios"
✅ Turno reasignado al nuevo agente
```

---

### Caso 2: Modificar Fecha y Hora

**Escenario:** El cliente solicita cambiar la hora del turno

```
1. Hacer clic en botón ✏️
2. Cambiar "Fecha y Hora de Inicio" a nueva hora
3. Ajustar "Fecha y Hora de Fin" si es necesario
4. Guardar cambios
✅ Turno reprogramado
```

---

### Caso 3: Actualizar Detalles del Viaje

**Escenario:** El cliente cambió la dirección de destino

```
1. Hacer clic en botón ✏️
2. Modificar campo "🎯 Destino"
3. Actualizar "👥 Pasajeros" si cambió
4. Agregar observaciones si es necesario
5. Guardar cambios
✅ Detalles actualizados
```

---

### Caso 4: Agregar Notas

**Escenario:** Necesitas agregar información importante

```
1. Hacer clic en botón ✏️
2. Escribir en campo "📝 Notas"
3. Agregar observaciones en "💬 Observaciones"
4. Guardar cambios
✅ Notas agregadas
```

---

## 🔒 Validaciones

### Campos Obligatorios:
- ✅ **Agente:** Debe seleccionar un agente
- ✅ **Fecha y Hora de Inicio:** Debe especificar cuándo empieza

### Botón Guardar:
```tsx
<button 
  className={styles.btnPrimary}
  onClick={handleGuardarEdicion}
  disabled={!formEdicion.agenteId || !formEdicion.fechaInicio}
>
  💾 Guardar Cambios
</button>
```

**El botón se deshabilita si:**
- No hay agente seleccionado
- No hay fecha de inicio

---

## 📊 Interfaz Turno Actualizada

```typescript
export interface Turno {
  _id: string;
  empresaId: string;
  agenteId: any;
  clienteId: string;
  fechaInicio: string;
  fechaFin: string;
  duracion: number;
  estado: 'pendiente' | 'confirmado' | 'en_curso' | 'completado' | 'cancelado' | 'no_asistio';
  servicio?: string;
  notas?: string;
  notasInternas?: string;
  precio?: number;
  confirmado: boolean;
  creadoEn: string;
  actualizadoEn: string;
  
  // ✅ NUEVOS CAMPOS
  clienteInfo?: {
    _id: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    email?: string;
  };
  
  datos?: {
    origen?: string;
    destino?: string;
    pasajeros?: number;
    equipaje?: string;
    observaciones?: string;
    [key: string]: any; // Permite campos adicionales
  };
}
```

---

## 🎨 Estilos

### Botón Editar:
```css
.btnEditar {
  background: rgba(102, 126, 234, 0.1);
  border: 2px solid #667eea;
  color: #667eea;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.btnEditar:hover {
  background: #667eea;
  color: white;
  transform: scale(1.1);
}
```

### Formulario:
```css
.formGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.camposPersonalizados {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e0e0e0;
}
```

---

## 🔄 Flujo Completo

```
1. Usuario hace clic en ✏️ en la tabla
   ↓
2. Se abre modal con datos del turno cargados
   ↓
3. Usuario modifica los campos necesarios
   ↓
4. Usuario hace clic en "💾 Guardar Cambios"
   ↓
5. Se envía PUT request a la API
   ↓
6. API actualiza el turno en la base de datos
   ↓
7. Modal se cierra
   ↓
8. Tabla se recarga con datos actualizados
   ↓
✅ Turno editado exitosamente
```

---

## 📁 Archivos Modificados

1. ✅ `src/app/dashboard/calendario/gestion-turnos/page.tsx`
   - Agregado estado `formEdicion`
   - Agregada función `abrirModalEdicion`
   - Agregada función `handleGuardarEdicion`
   - Agregada función `actualizarDatosCampo`
   - Agregado botón ✏️ en tabla
   - Agregado modal de edición completo

2. ✅ `src/app/dashboard/calendario/gestion-turnos/gestion.module.css`
   - Agregados estilos para `.btnEditar`
   - Agregados estilos para `.formGrid`
   - Agregados estilos para `.camposPersonalizados`

3. ✅ `src/lib/calendarApi.ts`
   - Agregado campo `clienteInfo` a interfaz `Turno`
   - Agregado campo `datos` a interfaz `Turno`

---

## ✅ Ventajas

1. **Edición Completa:** Todos los campos son editables
2. **Cambio de Agente:** Fácil reasignación de turnos
3. **Campos Personalizados:** Soporte para datos específicos del negocio
4. **Validación:** Campos obligatorios claramente marcados
5. **UX Intuitiva:** Modal claro y organizado
6. **Responsive:** Funciona en cualquier dispositivo

---

## 📝 Resumen

**Funcionalidad:** Edición completa de turnos

**Campos Editables:**
- ✅ Agente (obligatorio)
- ✅ Fecha y hora de inicio (obligatorio)
- ✅ Fecha y hora de fin
- ✅ Notas
- ✅ Origen, Destino, Pasajeros, Equipaje, Observaciones

**Acceso:** Botón ✏️ en cada fila de la tabla

**Validación:** Agente y fecha de inicio obligatorios

**API:** PUT `/api/calendar/turnos/:id`

¡Edición completa de turnos implementada! ✏️🎉
