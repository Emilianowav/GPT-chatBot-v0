# 🔄 Nuevo Flujo de Creación de Agentes

## 📋 Resumen de Cambios

Se ha rehecho completamente el flujo de creación y edición de agentes con las siguientes mejoras:

### ✨ Nuevo Modal Moderno (`ModalAgente.tsx`)

**Características principales:**
- **Flujo paso a paso (3 pasos):**
  1. **Datos Básicos**: Información personal y profesional del agente
  2. **Horarios y Disponibilidad**: Configuración semanal con horarios predefinidos
  3. **Configuración de Atención**: Modo de atención y parámetros específicos

- **UX Mejorada:**
  - Indicador de progreso visual
  - Validación en cada paso
  - Mensajes de error claros
  - Animaciones suaves
  - Diseño responsive
  - Horarios predefinidos para aplicar rápidamente

### 🔧 Relaciones y Campos Manejados

#### Campos Básicos
- `nombre` (requerido)
- `apellido` (requerido)
- `email` (requerido, único por empresa)
- `telefono`
- `titulo` (Dr., Lic., Ing., etc.)
- `especialidad`
- `sector` (departamento/área)
- `descripcion`
- `activo` (boolean)

#### Modo de Atención
- **`turnos_programados`**: Turnos con horarios específicos
  - `duracionTurnoPorDefecto` (minutos)
  - `bufferEntreturnos` (minutos de descanso)
  
- **`turnos_libres`**: Sin horarios, por orden de llegada
  - `capacidadSimultanea` (cuántos clientes al mismo tiempo)
  - `maximoTurnosPorDia` (límite diario, 0 = sin límite)
  
- **`mixto`**: Permite ambos modos

#### Disponibilidad Semanal
Array de objetos con:
- `diaSemana` (0-6, donde 0=Domingo)
- `horaInicio` (formato HH:mm)
- `horaFin` (formato HH:mm)
- `activo` (boolean)

### 🔄 Relaciones con Turnos

El modelo `Turno` se relaciona con `Agente` mediante:
- `agenteId` (ObjectId, requerido)
- Los turnos respetan la disponibilidad configurada
- Los turnos programados usan `duracionTurnoPorDefecto` y `bufferEntreturnos`
- Los turnos libres respetan `capacidadSimultanea` y `maximoTurnosPorDia`

### 📁 Archivos Modificados

#### Frontend
1. **`ModalAgente.tsx`** (NUEVO)
   - Componente modal con flujo paso a paso
   - Validaciones en cada paso
   - Horarios predefinidos para facilitar configuración

2. **`ModalAgente.module.css`** (NUEVO)
   - Estilos modernos con animaciones
   - Diseño responsive
   - Estados visuales claros

3. **`agentes/page.tsx`** (MODIFICADO)
   - Reemplazado `FormularioAgente` por `ModalAgente`
   - Simplificado el código

4. **`calendarApi.ts`** (MODIFICADO)
   - Actualizada interfaz `CrearAgenteData` con todos los campos

#### Backend
1. **`agenteController.ts`** (MODIFICADO)
   - Acepta todos los campos nuevos en creación
   - Maneja `disponibilidad`, `modoAtencion`, `sector`, `activo`

2. **`agenteService.ts`** (MODIFICADO)
   - Interfaz `CrearAgenteData` actualizada
   - Valores por defecto apropiados
   - Validación de email único por empresa

3. **`Agente.ts`** (modelo existente)
   - Ya tenía todos los campos necesarios
   - No requirió cambios

### 🎯 Flujo de Uso

#### Crear Agente
1. Click en "Nuevo Agente"
2. **Paso 1**: Completar datos básicos (nombre, email, etc.)
3. **Paso 2**: Configurar disponibilidad semanal
   - Seleccionar días activos
   - Configurar horarios (o usar predefinidos)
4. **Paso 3**: Configurar modo de atención
   - Elegir entre turnos programados, libres o mixto
   - Configurar parámetros específicos
5. Click en "Crear Agente"

#### Editar Agente
1. Click en "Editar" en la tarjeta del agente
2. El modal se abre con los datos actuales
3. Navegar por los pasos y modificar lo necesario
4. Click en "Actualizar Agente"

### ✅ Validaciones Implementadas

#### Paso 1 (Datos Básicos)
- Nombre requerido
- Apellido requerido
- Email requerido y formato válido
- Email único por empresa (backend)

#### Paso 2 (Disponibilidad)
- Al menos un día debe estar activo
- Hora de fin debe ser posterior a hora de inicio
- Formato de hora válido (HH:mm)

#### Paso 3 (Atención)
- Valores numéricos dentro de rangos válidos
- Configuración coherente según modo de atención

### 🎨 Mejoras de UX

1. **Indicador de Progreso**: Muestra visualmente en qué paso está el usuario
2. **Validación en Tiempo Real**: Errores claros antes de avanzar
3. **Horarios Predefinidos**: Botones rápidos para configurar horarios comunes
4. **Diseño Limpio**: Interfaz moderna y fácil de usar
5. **Responsive**: Funciona bien en móviles y tablets
6. **Animaciones**: Transiciones suaves entre pasos

### 🔗 Integración con Sistema de Turnos

El agente creado/editado se integra automáticamente con:
- **Sistema de disponibilidad**: Valida horarios al crear turnos
- **Notificaciones**: Usa la información del agente en mensajes
- **Calendario**: Muestra disponibilidad en vistas de calendario
- **Reportes**: Incluye datos del agente en estadísticas

### 📊 Próximos Pasos Sugeridos

1. **Testing**: Probar creación y edición de agentes
2. **Validar Turnos**: Verificar que los turnos respeten la disponibilidad
3. **Notificaciones**: Confirmar que usan correctamente los datos del agente
4. **Documentación**: Actualizar manual de usuario

### 🐛 Notas Técnicas

- El campo `disponibilidad` se envía completo en cada actualización
- El backend valida que no haya conflictos de email
- Los valores por defecto se aplican en el backend si no se envían
- El modal se resetea correctamente al cerrar/abrir
- La validación de horarios previene configuraciones inválidas

---

## 🚀 Cómo Probar

1. Iniciar el backend: `cd backend && npm run dev`
2. Iniciar el frontend: `cd front_crm/bot_crm && npm run dev`
3. Ir a `/dashboard/calendario/agentes`
4. Crear un nuevo agente siguiendo los 3 pasos
5. Verificar que se guarda correctamente
6. Editar el agente y verificar que carga los datos
7. Probar diferentes modos de atención

## ✨ Resultado Final

Un flujo de creación de agentes mucho más intuitivo, completo y profesional que:
- Guía al usuario paso a paso
- Valida datos en tiempo real
- Maneja todas las relaciones correctamente
- Ofrece una experiencia de usuario moderna
- Es fácil de mantener y extender
