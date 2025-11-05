# 🔄 Nuevo Flujo de Creación de Turnos

## 📋 Resumen de Cambios

Se ha rehecho completamente el flujo de creación de turnos con manejo diferenciado para **turnos programados** y **turnos libres**.

### ✨ Nuevo Modal Moderno (`ModalTurno.tsx`)

**Características principales:**
- **Flujo paso a paso (3 pasos):**
  1. **Cliente y Agente**: Selección de cliente y agente (si aplica)
  2. **Fecha y Horario**: Configuración diferenciada según tipo de turno
  3. **Detalles**: Campos personalizados y notas

- **Manejo Diferenciado por Tipo de Turno:**

#### 🗓️ Turnos Programados
- **Selección de horario específico** de slots disponibles
- **Duración fija** según configuración del agente
- **Validación de disponibilidad** en tiempo real
- **Buffer entre turnos** respetado automáticamente

#### 📋 Turnos Libres
- **Selección libre de horario minuto a minuto** (ej: 09:02, 14:37, etc.)
- **Duración calculada automáticamente** basada en:
  - Jornada de trabajo del agente
  - Duración base de turnos
  - Buffer entre turnos
  - Fórmula: `duracionTurno = jornadaTotal / cantidadTurnosPosibles`
- **Validación de capacidad** simultánea y máximo por día
- **Cualquier horario** dentro de la jornada de trabajo
- **Validación de rango**: El horario debe estar entre horaInicio y horaFin del agente

#### 🔄 Modo Mixto
- Permite ambos tipos de turnos
- El usuario puede elegir el comportamiento

## 🧮 Cálculo Automático de Duración (Turnos Libres)

### Fórmula
```javascript
// 1. Calcular minutos de la jornada
minutosJornada = horaFin - horaInicio

// 2. Calcular minutos por turno (incluyendo buffer)
minutosporTurno = duracionBase + buffer

// 3. Calcular cuántos turnos caben
cantidadTurnos = floor(minutosJornada / minutosporTurno)

// 4. Calcular duración real del turno
duracionTurno = floor(minutosJornada / cantidadTurnos)
```

### Ejemplo
```
Jornada: 09:00 - 18:00 (540 minutos)
Duración base: 30 minutos
Buffer: 5 minutos

minutosporTurno = 30 + 5 = 35 minutos
cantidadTurnos = floor(540 / 35) = 15 turnos
duracionTurno = floor(540 / 15) = 36 minutos por turno
```

## 🔧 Relaciones y Validaciones

### Turnos Programados
- ✅ Valida disponibilidad de slots
- ✅ Respeta horarios configurados
- ✅ Aplica buffer entre turnos
- ✅ Usa duración por defecto del agente
- ✅ Muestra solo horarios disponibles

### Turnos Libres
- ✅ Valida capacidad simultánea
- ✅ Valida máximo de turnos por día
- ✅ Calcula duración automáticamente
- ✅ Asigna al inicio de la jornada
- ✅ No requiere selección de horario específico

### Modo Mixto
- ✅ Combina ambas validaciones
- ✅ Permite flexibilidad máxima
- ✅ Advertencias en lugar de errores

## 📁 Archivos Modificados/Creados

### Frontend
1. **`ModalTurno.tsx`** (NUEVO - 600+ líneas)
   - Modal con flujo de 3 pasos
   - Lógica diferenciada por tipo de turno
   - Cálculo automático de duración para turnos libres
   - Validaciones específicas por modo

2. **`ModalTurno.module.css`** (NUEVO - 350+ líneas)
   - Estilos modernos
   - Info boxes para turnos libres
   - Diseño responsive

3. **`calendario/page.tsx`** (MODIFICADO)
   - Reemplazado `FormularioTurno` por `ModalTurno`
   - Código simplificado

### Backend
4. **`turnoService.ts`** (YA EXISTÍA - Sin cambios)
   - Ya manejaba correctamente turnos libres
   - Validaciones por modo de atención
   - Capacidad simultánea y máximo por día

## 🎯 Flujo de Uso

### Crear Turno Programado
1. Click en "Nuevo Turno"
2. **Paso 1**: Seleccionar cliente y agente (con turnos programados)
3. **Paso 2**: Seleccionar fecha
   - Sistema carga slots disponibles
   - Usuario elige horario específico
4. **Paso 3**: Completar campos personalizados
5. Click en "Crear Turno"

### Crear Turno Libre
1. Click en "Nuevo Turno"
2. **Paso 1**: Seleccionar cliente y agente (con turnos libres)
   - Se muestra indicador "📋 Turnos libres (sin horario fijo)"
3. **Paso 2**: Seleccionar fecha y horario
   - **Se muestra selector de hora tipo time** (minuto a minuto)
   - Usuario puede elegir cualquier horario: 09:02, 14:37, etc.
   - Se valida que esté dentro de la jornada del agente
   - Se muestra info box con duración calculada automáticamente
   - Ejemplo: "Duración calculada automáticamente: 36 minutos"
4. **Paso 3**: Completar campos personalizados
5. Click en "Crear Turno"
   - Se asigna al horario exacto seleccionado
   - Duración calculada según fórmula

## ✅ Validaciones Implementadas

### Paso 1 (Cliente y Agente)
- Cliente requerido
- Agente requerido (si está configurado como obligatorio)
- Validación de modo de atención del agente

### Paso 2 (Fecha y Horario)
- Fecha requerida
- Horario requerido (para ambos tipos)
- **Para turnos programados:**
  - Selección de slots disponibles
  - Validación de disponibilidad en tiempo real
- **Para turnos libres:**
  - Selección libre minuto a minuto (input type="time")
  - Validación de día disponible
  - Validación de rango horario (debe estar entre horaInicio y horaFin)
  - Cálculo automático de duración

### Paso 3 (Detalles)
- Campos personalizados requeridos validados
- Formato de datos correcto

## 🎨 Mejoras de UX

### Indicadores Visuales
- **⏰** Turnos programados: Muestra selector de slots disponibles (select)
- **📋** Turnos libres: Muestra selector de hora libre (input time) + info box con duración
- **🔄** Modo mixto: Indica flexibilidad

### Info Box para Turnos Libres
```
┌─────────────────────────────────────┐
│ 🕐 Turno Libre                      │
│                                     │
│ Duración calculada automáticamente: │
│ 36 minutos                          │
│                                     │
│ Basado en la jornada de trabajo    │
│ y capacidad del agente              │
└─────────────────────────────────────┘
```

### Hints Contextuales
- Días disponibles del agente
- Tipo de turno seleccionado
- Información de capacidad

## 🔗 Integración con Backend

### Request para Turno Programado
```json
{
  "agenteId": "abc123",
  "clienteId": "xyz789",
  "fechaInicio": "2024-11-15T14:30:00.000Z",
  "duracion": 30,
  "datos": { "origen": "...", "destino": "..." },
  "notas": "..."
}
```

### Request para Turno Libre
```json
{
  "agenteId": "abc123",
  "clienteId": "xyz789",
  "fechaInicio": "2024-11-15T09:02:00.000Z",  // Horario exacto elegido por usuario
  "duracion": 36,  // Calculado automáticamente
  "datos": { "origen": "...", "destino": "..." },
  "notas": "..."
}
```

## 📊 Comparación Antes/Después

### Antes (FormularioTurno)
- ❌ Todo en una pantalla
- ❌ Mismo flujo para todos los tipos
- ❌ Duración manual para turnos libres
- ❌ Sin cálculo automático
- ❌ Confuso para el usuario

### Después (ModalTurno)
- ✅ 3 pasos claros
- ✅ Flujo diferenciado por tipo
- ✅ Duración automática para turnos libres
- ✅ Cálculo inteligente basado en jornada
- ✅ UX clara y guiada

## 🧪 Casos de Prueba

### Turno Programado
1. [ ] Crear turno con horario específico
2. [ ] Validar que respeta buffer entre turnos
3. [ ] Verificar que usa duración por defecto
4. [ ] Confirmar que valida disponibilidad

### Turno Libre
1. [ ] Crear turno con horario libre (ej: 09:02)
2. [ ] Verificar cálculo automático de duración
3. [ ] Validar que acepta cualquier minuto
4. [ ] Validar que rechaza horarios fuera de jornada
5. [ ] Validar capacidad simultánea
6. [ ] Confirmar máximo de turnos por día

### Modo Mixto
1. [ ] Crear ambos tipos de turnos
2. [ ] Validar flexibilidad del sistema
3. [ ] Confirmar advertencias apropiadas

## 🚀 Beneficios

### Para Turnos Programados
- Horarios precisos
- Control total de agenda
- Optimización de tiempo
- Sin superposiciones

### Para Turnos Libres
- **Flexibilidad total** - cualquier horario minuto a minuto (09:02, 14:37, etc.)
- **Cálculo automático** - duración optimizada según jornada
- **Optimización de capacidad** - aprovecha toda la jornada
- **Control preciso** - usuario elige el horario exacto

### Para el Usuario
- Flujo claro y guiado
- Validaciones en tiempo real
- Información contextual
- Menos errores

## 📝 Notas Técnicas

### Cálculo de Duración
- Se ejecuta en el frontend cuando se selecciona la fecha
- Se basa en la disponibilidad del agente para ese día
- Considera duración base y buffer del agente
- Redondea hacia abajo para ser conservador

### Asignación de Horario
- **Turnos programados**: Usuario elige de slots disponibles (validación estricta)
- **Turnos libres**: Usuario elige cualquier horario minuto a minuto
  - Validación: Debe estar entre horaInicio y horaFin del agente
  - Backend valida capacidad simultánea y máximo por día
  - Múltiples turnos libres pueden tener horarios diferentes o iguales

### Validaciones Backend
- Turnos programados: valida slots disponibles
- Turnos libres: valida capacidad y máximo diario
- Modo mixto: combina ambas con advertencias

---

## ✨ Resultado Final

Un sistema de turnos que:
- **Diferencia claramente** entre turnos programados y libres
- **Calcula automáticamente** la duración para turnos libres
- **Optimiza la capacidad** del agente
- **Simplifica el proceso** para el usuario
- **Mantiene flexibilidad** con modo mixto

**Estado**: ✅ Completado y listo para testing
