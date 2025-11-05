# 📱 Frontend: Flujo de Notificaciones Diarias para Agentes

## ✅ Implementación Completada

Se ha integrado el flujo de notificaciones diarias para agentes en el frontend de la sección **Flujos Automáticos**.

## 📋 Archivos Modificados/Creados

### 1. **Página de Flujos Automáticos**
**Archivo:** `front_crm/bot_crm/src/app/dashboard/calendario/flujos-activos/page.tsx`

#### Cambios Realizados:

**a) Carga del Flujo desde el Backend**
```typescript
const notificacionDiariaAgentes = configModulo?.notificacionDiariaAgentes;

const flujosAutomaticos = [
  // ... otros flujos
  {
    id: 'notificacion_diaria_agentes',
    nombre: 'Recordatorio Diario para Agentes',
    descripcion: 'Envía un resumen diario a los agentes con todas sus reservas del día',
    tipo: 'automatico',
    activo: notificacionDiariaAgentes?.activa ?? false,
    icono: '📅',
    trigger: (() => {
      const horaEnvio = notificacionDiariaAgentes?.horaEnvio || '06:00';
      const frecuencia = (notificacionDiariaAgentes as any)?.frecuencia?.tipo || 'diaria';
      
      if (frecuencia === 'diaria') {
        return `Todos los días a las ${horaEnvio}`;
      } else if (frecuencia === 'semanal') {
        const dias = (notificacionDiariaAgentes as any)?.frecuencia?.diasSemana || [];
        const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const diasTexto = dias.map((d: number) => nombresDias[d]).join(', ');
        return `${diasTexto} a las ${horaEnvio}`;
      }
      return `Frecuencia ${frecuencia} a las ${horaEnvio}`;
    })(),
    config: {
      horaEnvio: notificacionDiariaAgentes?.horaEnvio || '06:00',
      enviarATodos: notificacionDiariaAgentes?.enviarATodos ?? false,
      mensaje: notificacionDiariaAgentes?.plantillaMensaje || 'Buenos días {agente}! 🌅\nEstos son tus {turnos} de hoy:',
      frecuencia: (notificacionDiariaAgentes as any)?.frecuencia || { tipo: 'diaria' },
      incluirDetalles: notificacionDiariaAgentes?.incluirDetalles || {
        origen: true,
        destino: true,
        nombreCliente: true,
        telefonoCliente: false,
        horaReserva: true,
        notasInternas: false
      }
    }
  }
];
```

**b) Manejo del Guardado**
```typescript
const handleGuardarConfigFlujo = async (config: any) => {
  // Si es el flujo de notificación diaria de agentes
  if (modalConfigFlujo.id === 'notificacion_diaria_agentes') {
    // Obtener configuración actual
    const getResponse = await fetch(`${apiUrl}/api/modules/calendar/configuracion/${empresaId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const { configuracion: configActual } = await getResponse.json();
    
    // Actualizar notificación diaria de agentes
    const configActualizada = {
      ...configActual,
      notificacionDiariaAgentes: {
        activa: config.activo,
        horaEnvio: config.horaEnvio,
        enviarATodos: config.enviarATodos,
        plantillaMensaje: config.mensaje,
        frecuencia: config.frecuencia,
        rangoHorario: { activo: true, tipo: 'hoy' },
        filtroHorario: { activo: false, tipo: 'todo_el_dia' },
        filtroEstado: { activo: true, estados: ['pendiente', 'confirmado'] },
        filtroTipo: { activo: false, tipos: [] },
        incluirDetalles: config.incluirDetalles,
        agentesEspecificos: []
      }
    };
    
    // Guardar configuración
    await fetch(`${apiUrl}/api/modules/calendar/configuracion/${empresaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(configActualizada)
    });
    
    // Recargar página
    window.location.reload();
  }
};
```

**c) Renderizado Condicional del Modal**
```typescript
{modalConfigFlujo?.id === 'notificacion_diaria_agentes' ? (
  <ModalConfiguracionAgentes
    isOpen={!!modalConfigFlujo}
    onClose={() => {
      setModalConfigFlujo(null);
      setConfigEditada(null);
    }}
    flujo={modalConfigFlujo}
    onGuardar={handleGuardarConfigFlujo}
  />
) : (
  <ModalConfiguracionFlujo
    isOpen={!!modalConfigFlujo}
    onClose={() => {
      setModalConfigFlujo(null);
      setConfigEditada(null);
    }}
    flujo={modalConfigFlujo}
    onGuardar={handleGuardarConfigFlujo}
  />
)}
```

### 2. **Modal de Configuración para Agentes**
**Archivo:** `front_crm/bot_crm/src/components/flujos/ModalConfiguracionAgentes.tsx` (NUEVO)

#### Características del Modal:

**Paso 1: Configuración de Horario**
- ✅ Toggle para activar/desactivar el flujo
- ⏰ Selector de hora de envío
- 📅 Selector de frecuencia (diaria/semanal)
- 📆 Selector de días de la semana (para frecuencia semanal)
- 👥 Toggle para destinatarios (todos/solo con reservas)

**Paso 2: Mensaje**
- 📝 Editor de plantilla de mensaje
- 💡 Variables disponibles: `{agente}`, `{turnos}`, `{cantidad}`
- 👁️ Vista previa del mensaje

**Paso 3: Detalles a Incluir**
- ✅ Checkboxes para seleccionar qué información incluir:
  - 📍 Origen
  - 🎯 Destino
  - 👤 Nombre del Cliente
  - 📞 Teléfono del Cliente
  - 🕐 Hora de la Reserva
  - 📝 Notas Internas

## 🎨 Interfaz de Usuario

### Card del Flujo en la Lista

```
┌─────────────────────────────────────────────┐
│ 📅  Recordatorio Diario para Agentes   [🟢] │
│                                              │
│ Envía un resumen diario a los agentes con   │
│ todas sus reservas del día                   │
│                                              │
│ Se activa: Todos los días a las 06:00       │
│                                              │
│ [⚙️ Configurar]  [📤 Probar]                │
└─────────────────────────────────────────────┘
```

### Modal de Configuración

```
┌──────────────────────────────────────────────┐
│ 📅 Configurar Recordatorio Diario para      │
│    Agentes                              [X]  │
├──────────────────────────────────────────────┤
│                                              │
│ ● Horario ─── ○ Mensaje ─── ○ Detalles     │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│ Estado del Flujo          [🟢 Activo]       │
│                                              │
│ Hora de Envío *                              │
│ [06:00]                                      │
│ Hora en que se enviará el recordatorio      │
│                                              │
│ Frecuencia de Envío                          │
│ [Diaria ▼]                                   │
│                                              │
│ Destinatarios    [Solo con reservas]        │
│ Solo se enviará a agentes que tengan        │
│ reservas ese día                             │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│ [Cancelar]                  [Siguiente →]   │
│                                              │
└──────────────────────────────────────────────┘
```

## 🔄 Flujo de Interacción del Usuario

### 1. Ver el Flujo
1. Usuario navega a **Calendario → Flujos Automáticos**
2. Ve la card "Recordatorio Diario para Agentes" con:
   - Icono 📅
   - Nombre y descripción
   - Estado (activo/inactivo)
   - Trigger (ej: "Todos los días a las 06:00")
   - Botones de acción

### 2. Configurar el Flujo
1. Usuario hace clic en **"⚙️ Configurar"**
2. Se abre el modal con 3 pasos:
   
   **Paso 1: Horario**
   - Activa/desactiva el flujo
   - Configura hora de envío
   - Selecciona frecuencia
   - Elige destinatarios
   
   **Paso 2: Mensaje**
   - Edita la plantilla del mensaje
   - Ve variables disponibles
   - Previsualiza el mensaje
   
   **Paso 3: Detalles**
   - Selecciona qué información incluir
   - Ve recomendaciones

3. Usuario hace clic en **"💾 Guardar Configuración"**
4. Se guarda en el backend
5. Página se recarga con la nueva configuración

### 3. Activar/Desactivar
1. Usuario usa el toggle en la card
2. Se actualiza el estado en el backend
3. El flujo se activa/desactiva automáticamente

## 📊 Datos que se Envían al Backend

```json
{
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
  }
}
```

## 🎯 Validaciones

### Frontend
- ✅ Hora de envío es requerida
- ✅ Mensaje no puede estar vacío
- ✅ Al menos un detalle debe estar seleccionado (recomendación)
- ✅ Para frecuencia semanal, al menos un día debe estar seleccionado

### Backend
- ✅ Configuración debe tener estructura válida
- ✅ Hora debe estar en formato HH:mm
- ✅ Frecuencia debe ser válida (diaria/semanal/mensual)

## 🔧 Configuración Predeterminada

Cuando se crea por primera vez:
```typescript
{
  activa: false,
  horaEnvio: '06:00',
  enviarATodos: false,
  plantillaMensaje: 'Buenos días {agente}! 🌅\nEstos son tus {turnos} de hoy:',
  frecuencia: {
    tipo: 'diaria',
    diasSemana: [1, 2, 3, 4, 5] // Lun-Vie
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

## 🚀 Cómo Probar

### 1. Iniciar el Frontend
```bash
cd front_crm/bot_crm
npm run dev
```

### 2. Navegar a Flujos Automáticos
1. Login en el CRM
2. Ir a **Calendario → Flujos Automáticos**
3. Buscar la card "Recordatorio Diario para Agentes"

### 3. Configurar el Flujo
1. Clic en **"⚙️ Configurar"**
2. Completar los 3 pasos
3. Guardar

### 4. Verificar en el Backend
```bash
# Ver la configuración guardada
npm run ver:config-notif
```

## 📝 Notas Técnicas

### TypeScript
- Se usa `as any` para acceder a propiedades que aún no están en los tipos
- Los tipos se pueden actualizar en el futuro para mejor type safety

### Estado
- El estado se maneja localmente en el modal
- Se sincroniza con el backend al guardar
- La página se recarga para reflejar cambios

### Estilos
- Reutiliza los estilos del modal de confirmación
- Mantiene consistencia visual con otros flujos
- Responsive y accesible

## ✅ Checklist de Implementación

- ✅ Card del flujo visible en la lista
- ✅ Modal de configuración funcional
- ✅ 3 pasos de configuración
- ✅ Guardado en backend
- ✅ Carga de configuración existente
- ✅ Validaciones de formulario
- ✅ Mensajes de éxito/error
- ✅ Toggle para activar/desactivar
- ✅ Estilos consistentes
- ✅ Responsive design

## 🎉 Resultado Final

El flujo de notificaciones diarias para agentes ahora está **completamente integrado** en el frontend, con:

1. ✅ Card visible en la sección de Flujos Automáticos
2. ✅ Modal de configuración con 3 pasos intuitivos
3. ✅ Guardado automático en el backend
4. ✅ Carga de configuración existente
5. ✅ Validaciones y mensajes de error
6. ✅ Interfaz consistente con otros flujos

Los usuarios pueden ahora configurar fácilmente el recordatorio diario para sus agentes desde la interfaz web. 🚀
