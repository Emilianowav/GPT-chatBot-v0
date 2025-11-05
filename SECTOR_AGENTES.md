# 🏢 Campo Sector para Agentes

## 🎯 Objetivo

Permitir asignar un sector o departamento a los agentes al momento de crearlos y editarlos, facilitando la organización y clasificación del equipo.

---

## ✨ Funcionalidades Implementadas

### 1. **Campo Sector en Agentes**
- ✅ Campo opcional `sector` en el modelo de Agente
- ✅ Visible en formulario de creación
- ✅ Visible en formulario de edición
- ✅ Mostrado en la tarjeta del agente

### 2. **Integración Frontend**
- ✅ Campo en `FormularioAgente.tsx`
- ✅ Badge visual en `ListaAgentes.tsx`
- ✅ Interfaz TypeScript actualizada

### 3. **Integración Backend**
- ✅ Campo en modelo `Agente.ts`
- ✅ Guardado en base de datos MongoDB

---

## 📋 Formulario de Agente

### Vista del Formulario:

```
┌────────────────────────────────────────────────┐
│ Nuevo Agente / Editar Agente                   │
├────────────────────────────────────────────────┤
│ Nombre *              Apellido *               │
│ [Juan            ]    [Pérez              ]    │
│                                                │
│ Email *               Teléfono                 │
│ [juan@ejemplo.com]    [+54 11 1234-5678  ]    │
│                                                │
│ Título/Profesión      Especialidad             │
│ [Dr.             ]    [Cardiología        ]    │
│                                                │
│ 🏢 Sector                                      │
│ [Ventas                                    ]    │
│ Sector o departamento al que pertenece         │
│ el agente (opcional)                           │
│                                                │
│ Descripción                                    │
│ [Breve descripción del agente...          ]    │
│                                                │
│ Modo de Atención *                             │
│ [Turnos Programados ▼]                         │
│                                                │
│ ... (resto del formulario)                     │
│                                                │
│              [Cancelar] [Crear Agente]         │
└────────────────────────────────────────────────┘
```

---

## 🎨 Visualización en Lista

### Tarjeta de Agente:

```
┌──────────────────────────────────────────────┐
│  [JP]  Juan Pérez                    [Activo]│
│        Dr. | Cardiología | 🏢 Ventas         │
├──────────────────────────────────────────────┤
│  📞 +54 11 1234-5678                         │
│  📧 juan.perez@ejemplo.com                   │
│                                              │
│  📅 Turnos Programados                       │
│  ⏱️ 30 min por turno                         │
│  🕐 Lun-Vie: 09:00 - 18:00                   │
│                                              │
│  [Editar] [Disponibilidad] [Desactivar]      │
└──────────────────────────────────────────────┘
```

**Badge de Sector:**
- 🏢 Icono de edificio
- Fondo semi-transparente blanco
- Borde sutil
- Aparece después de la especialidad

---

## 💾 Modelo de Datos

### Backend (MongoDB):

```typescript
export interface IAgente extends Document {
  empresaId: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  especialidad?: string;
  descripcion?: string;
  titulo?: string;
  sector?: string;  // ✅ NUEVO CAMPO
  
  modoAtencion: ModoAtencion;
  disponibilidad: Disponibilidad[];
  duracionTurnoPorDefecto: number;
  bufferEntreturnos: number;
  capacidadSimultanea?: number;
  maximoTurnosPorDia?: number;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}
```

### Frontend (TypeScript):

```typescript
export interface Agente {
  _id: string;
  empresaId: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  especialidad?: string;
  descripcion?: string;
  titulo?: string;
  sector?: string;  // ✅ NUEVO CAMPO
  
  modoAtencion: 'turnos_programados' | 'turnos_libres' | 'mixto';
  disponibilidad: Disponibilidad[];
  duracionTurnoPorDefecto: number;
  bufferEntreturnos: number;
  capacidadSimultanea?: number;
  maximoTurnosPorDia?: number;
  activo: boolean;
}
```

---

## 🔧 Implementación

### 1. FormularioAgente.tsx

#### Estado del Formulario:

```typescript
const [formData, setFormData] = useState({
  nombre: agenteInicial?.nombre || '',
  apellido: agenteInicial?.apellido || '',
  email: agenteInicial?.email || '',
  telefono: agenteInicial?.telefono || '',
  especialidad: agenteInicial?.especialidad || '',
  titulo: agenteInicial?.titulo || '',
  descripcion: agenteInicial?.descripcion || '',
  sector: agenteInicial?.sector || '',  // ✅ NUEVO
  modoAtencion: agenteInicial?.modoAtencion || 'turnos_programados',
  // ... resto de campos
});
```

#### Campo en el Formulario:

```tsx
<div className={styles.field}>
  <label>🏢 Sector</label>
  <input
    type="text"
    name="sector"
    value={formData.sector}
    onChange={handleChange}
    placeholder="Ventas, Soporte, Administración, etc."
  />
  <small style={{ color: '#666', fontSize: '0.85rem' }}>
    Sector o departamento al que pertenece el agente (opcional)
  </small>
</div>
```

---

### 2. ListaAgentes.tsx

#### Visualización del Sector:

```tsx
<div className={styles.agenteInfo}>
  <h3>{agente.nombre} {agente.apellido}</h3>
  {agente.titulo && <span className={styles.titulo}>{agente.titulo}</span>}
  {agente.especialidad && (
    <span className={styles.especialidad}>{agente.especialidad}</span>
  )}
  {agente.sector && (
    <span className={styles.sector}>🏢 {agente.sector}</span>
  )}
</div>
```

#### Estilos CSS:

```css
.sector {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

---

## 🎯 Casos de Uso

### Caso 1: Crear Agente con Sector

**Escenario:** Crear un nuevo agente del sector Ventas

```
1. Clic en "Nuevo Agente"
   ↓
2. Completar datos:
   - Nombre: Juan
   - Apellido: Pérez
   - Email: juan@ejemplo.com
   - Sector: Ventas
   ↓
3. Clic en "Crear Agente"
   ↓
✅ Agente creado con sector "Ventas"
```

---

### Caso 2: Editar Sector de Agente

**Escenario:** Cambiar agente de Soporte a Ventas

```
1. Clic en "Editar" en tarjeta del agente
   ↓
2. Cambiar campo Sector:
   - De: "Soporte"
   - A: "Ventas"
   ↓
3. Clic en "Actualizar"
   ↓
✅ Sector actualizado
```

---

### Caso 3: Agente sin Sector

**Escenario:** Crear agente sin asignar sector

```
1. Clic en "Nuevo Agente"
   ↓
2. Completar datos obligatorios
   - Nombre, Apellido, Email
   - Dejar campo Sector vacío
   ↓
3. Clic en "Crear Agente"
   ↓
✅ Agente creado sin sector (campo opcional)
```

---

### Caso 4: Filtrar por Sector (Futuro)

**Escenario:** Ver solo agentes del sector Ventas

```
1. Seleccionar filtro: "Sector: Ventas"
   ↓
2. Sistema filtra agentes
   ↓
✅ Muestra solo agentes con sector "Ventas"
```

---

## 📊 Ejemplos de Sectores

### Sectores Comunes:

- 🏢 **Ventas** - Equipo comercial
- 🛠️ **Soporte** - Atención al cliente
- 📊 **Administración** - Gestión administrativa
- 💼 **Gerencia** - Nivel directivo
- 🎨 **Marketing** - Equipo de marketing
- 💻 **IT** - Tecnología e informática
- 📦 **Logística** - Distribución y envíos
- 👥 **RRHH** - Recursos humanos
- 🏥 **Clínica** - Área médica
- 🔧 **Técnico** - Servicio técnico

---

## 🎨 Diseño Visual

### Badge de Sector:

**Características:**
- Fondo: `rgba(255, 255, 255, 0.25)`
- Borde: `1px solid rgba(255, 255, 255, 0.3)`
- Padding: `0.2rem 0.6rem`
- Border-radius: `12px`
- Font-size: `0.75rem`
- Margin-left: `0.5rem`

**Ubicación:**
- Después de la especialidad
- En el header de la tarjeta del agente
- Sobre fondo con gradiente morado

---

## 📁 Archivos Modificados

### Backend:

**`backend/src/modules/calendar/models/Agente.ts`**
```typescript
// Agregado campo sector
sector?: string;

// En el schema
sector: String,
```

### Frontend:

**`front_crm/bot_crm/src/lib/calendarApi.ts`**
```typescript
export interface Agente {
  // ... otros campos
  sector?: string;  // ✅ NUEVO
}
```

**`front_crm/bot_crm/src/components/calendar/FormularioAgente.tsx`**
```typescript
// Estado inicial
sector: agenteInicial?.sector || '',

// Campo en formulario
<input name="sector" value={formData.sector} ... />
```

**`front_crm/bot_crm/src/components/calendar/ListaAgentes.tsx`**
```tsx
{agente.sector && (
  <span className={styles.sector}>🏢 {agente.sector}</span>
)}
```

**`front_crm/bot_crm/src/components/calendar/ListaAgentes.module.css`**
```css
.sector {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

---

## ✅ Ventajas

1. **Organización:** Clasifica agentes por departamento
2. **Opcional:** No es obligatorio, flexible
3. **Visual:** Badge claro y distintivo
4. **Editable:** Se puede cambiar en cualquier momento
5. **Escalable:** Preparado para filtros futuros
6. **Consistente:** Mismo patrón que especialidad y título

---

## 🔮 Mejoras Futuras

### 1. Lista Predefinida de Sectores
```tsx
<select name="sector">
  <option value="">Sin sector</option>
  <option value="Ventas">Ventas</option>
  <option value="Soporte">Soporte</option>
  <option value="Administración">Administración</option>
  // ...
</select>
```

### 2. Filtro por Sector
```tsx
<select onChange={filtrarPorSector}>
  <option value="">Todos los sectores</option>
  <option value="Ventas">Ventas</option>
  <option value="Soporte">Soporte</option>
</select>
```

### 3. Estadísticas por Sector
```
Ventas: 5 agentes
Soporte: 3 agentes
Administración: 2 agentes
```

### 4. Colores por Sector
```css
.sector[data-sector="Ventas"] {
  background: rgba(52, 152, 219, 0.2);
}
.sector[data-sector="Soporte"] {
  background: rgba(46, 204, 113, 0.2);
}
```

---

## 📝 Resumen

**Funcionalidad:** Campo sector para agentes

**Características:**
- ✅ Campo opcional en modelo
- ✅ Visible en creación
- ✅ Visible en edición
- ✅ Badge visual en lista
- ✅ Guardado en base de datos

**Ubicación:**
- Formulario: Después de especialidad
- Lista: En header de tarjeta

**Archivos:**
- ✅ Backend: `Agente.ts` (modelo)
- ✅ Frontend: `calendarApi.ts` (interfaz)
- ✅ Frontend: `FormularioAgente.tsx` (formulario)
- ✅ Frontend: `ListaAgentes.tsx` (visualización)
- ✅ Frontend: `ListaAgentes.module.css` (estilos)

¡Campo sector implementado para agentes! 🏢✨
