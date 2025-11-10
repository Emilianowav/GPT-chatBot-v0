# 📅 Sistema de Carga de Turnos por Mes

## 🎯 Objetivo

Implementar un sistema de carga dinámica de turnos donde:
- Al abrir el calendario, se cargan **TODOS los turnos del mes actual**
- Al cambiar de mes (← →), se cargan **TODOS los turnos del nuevo mes**
- No se cargan turnos innecesarios de otros meses

---

## 🏗️ Arquitectura del Sistema

### Flujo de Datos:

```
┌─────────────────────────────────────────────────────────┐
│                    CalendarioPage                        │
│  - Estado: mesActual                                     │
│  - Función: cargarTurnosMes(primerDia, ultimoDia)      │
│  - Función: handleCambiarMes(primerDia, ultimoDia)     │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Props: turnos, onCambiarMes, mesInicial
                     ↓
┌─────────────────────────────────────────────────────────┐
│                 CalendarioMensual                        │
│  - Estado: mesActual                                     │
│  - useEffect: Notifica cuando cambia el mes             │
│  - Botones: ← (mes anterior) | → (mes siguiente)        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo Completo

### 1. Carga Inicial

```
Usuario abre /dashboard/calendario
  ↓
CalendarioPage se monta
  ↓
useEffect detecta isAuthenticated = true
  ↓
Calcula rango del mes actual:
  - primerDia: 01/11/2025 00:00:00
  - ultimoDia: 30/11/2025 23:59:59
  ↓
Llama cargarTurnosMes(primerDia, ultimoDia)
  ↓
Hace fetch: GET /api/modules/calendar/turnos?fechaDesde=...&fechaHasta=...
  ↓
Backend devuelve TODOS los turnos de noviembre 2025
  ↓
CalendarioMensual recibe turnos y los muestra
```

### 2. Cambio de Mes

```
Usuario hace clic en → (mes siguiente)
  ↓
CalendarioMensual actualiza mesActual (diciembre 2025)
  ↓
useEffect detecta cambio en mesActual
  ↓
Calcula nuevo rango:
  - primerDia: 01/12/2025 00:00:00
  - ultimoDia: 31/12/2025 23:59:59
  ↓
Llama onCambiarMes(primerDia, ultimoDia)
  ↓
CalendarioPage recibe el callback
  ↓
Actualiza mesActual en el padre
  ↓
Llama cargarTurnosMes(primerDia, ultimoDia)
  ↓
Hace fetch: GET /api/modules/calendar/turnos?fechaDesde=...&fechaHasta=...
  ↓
Backend devuelve TODOS los turnos de diciembre 2025
  ↓
CalendarioMensual recibe nuevos turnos y los muestra
```

---

## 💻 Implementación

### 1. CalendarioMensual.tsx

```typescript
interface CalendarioMensualProps {
  turnos: Turno[];
  agentes: any[];
  onSeleccionarTurno?: (turno: Turno) => void;
  onCambiarMes?: (primerDia: Date, ultimoDia: Date) => void;  // ← NUEVO
  mesInicial?: Date;                                           // ← NUEVO
}

export default function CalendarioMensual({ 
  turnos, 
  agentes, 
  onSeleccionarTurno,
  onCambiarMes,      // ← NUEVO
  mesInicial         // ← NUEVO
}: CalendarioMensualProps) {
  const [mesActual, setMesActual] = useState(mesInicial || new Date());

  // Notificar cuando cambia el mes
  useEffect(() => {
    if (onCambiarMes) {
      const year = mesActual.getFullYear();
      const month = mesActual.getMonth();
      const primerDia = new Date(year, month, 1, 0, 0, 0, 0);
      const ultimoDia = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      onCambiarMes(primerDia, ultimoDia);
    }
  }, [mesActual, onCambiarMes]);

  // ... resto del código
}
```

### 2. CalendarioPage.tsx

```typescript
export default function CalendarioPage() {
  const { turnos, loading, cargarTurnos } = useTurnos();
  const [mesActual, setMesActual] = useState(new Date());

  // Función para cargar turnos de un mes específico
  const cargarTurnosMes = useCallback((primerDia: Date, ultimoDia: Date) => {
    console.log('📅 Cargando turnos del mes:', {
      desde: primerDia.toLocaleDateString('es-AR'),
      hasta: ultimoDia.toLocaleDateString('es-AR')
    });
    
    cargarTurnos({
      fechaDesde: primerDia.toISOString(),
      fechaHasta: ultimoDia.toISOString()
    });
  }, [cargarTurnos]);

  // Carga inicial del mes actual
  useEffect(() => {
    if (isAuthenticated) {
      const year = mesActual.getFullYear();
      const month = mesActual.getMonth();
      const primerDia = new Date(year, month, 1, 0, 0, 0, 0);
      const ultimoDia = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      cargarTurnosMes(primerDia, ultimoDia);
    }
  }, [isAuthenticated, mesActual, cargarTurnosMes]);

  // Handler para cuando el calendario cambia de mes
  const handleCambiarMes = useCallback((primerDia: Date, ultimoDia: Date) => {
    setMesActual(new Date(primerDia.getFullYear(), primerDia.getMonth(), 1));
    cargarTurnosMes(primerDia, ultimoDia);
  }, [cargarTurnosMes]);

  return (
    <CalendarioMensual
      turnos={turnos}
      agentes={agentes}
      mesInicial={mesActual}
      onCambiarMes={handleCambiarMes}
    />
  );
}
```

---

## 📊 Ejemplo de Uso

### Escenario: Usuario navega por los meses

```
Mes Actual: Noviembre 2025
  ↓
[Carga inicial]
GET /api/modules/calendar/turnos?fechaDesde=2025-11-01T00:00:00&fechaHasta=2025-11-30T23:59:59
Response: [turno1, turno2, turno3, ...] (todos de noviembre)
  ↓
Usuario hace clic en →
  ↓
[Cambio a Diciembre 2025]
GET /api/modules/calendar/turnos?fechaDesde=2025-12-01T00:00:00&fechaHasta=2025-12-31T23:59:59
Response: [turno10, turno11, turno12, ...] (todos de diciembre)
  ↓
Usuario hace clic en ←
  ↓
[Vuelve a Noviembre 2025]
GET /api/modules/calendar/turnos?fechaDesde=2025-11-01T00:00:00&fechaHasta=2025-11-30T23:59:59
Response: [turno1, turno2, turno3, ...] (todos de noviembre)
```

---

## 🎨 Logs en Consola

```javascript
// Al cargar la página
📅 Cargando turnos del mes: { desde: '1/11/2025', hasta: '30/11/2025' }

// Al cambiar a diciembre
📅 Cargando turnos del mes: { desde: '1/12/2025', hasta: '31/12/2025' }

// Al volver a noviembre
📅 Cargando turnos del mes: { desde: '1/11/2025', hasta: '30/11/2025' }
```

---

## ✅ Ventajas del Sistema

### 1. **Carga Eficiente**
- Solo carga los turnos del mes visible
- No carga turnos innecesarios de otros meses
- Reduce el tráfico de red

### 2. **Navegación Fluida**
- Carga automática al cambiar de mes
- No requiere botón de "Recargar"
- Experiencia de usuario mejorada

### 3. **Sincronización**
- El padre (CalendarioPage) siempre sabe qué mes se está viendo
- Fácil agregar funcionalidades adicionales (ej: estadísticas del mes)

### 4. **Escalabilidad**
- Funciona igual con 10 turnos o 1000 turnos
- El backend puede optimizar la consulta por rango de fechas
- Posibilidad de agregar paginación si es necesario

---

## 🔧 Mejoras Futuras

### 1. Cache de Meses

```typescript
const [turnosPorMes, setTurnosPorMes] = useState<Record<string, Turno[]>>({});

const cargarTurnosMes = useCallback((primerDia: Date, ultimoDia: Date) => {
  const key = `${primerDia.getFullYear()}-${primerDia.getMonth()}`;
  
  // Si ya tenemos los turnos de este mes, no hacer fetch
  if (turnosPorMes[key]) {
    console.log('📦 Usando turnos cacheados del mes:', key);
    return;
  }
  
  // Cargar del servidor
  cargarTurnos({ fechaDesde, fechaHasta }).then(turnos => {
    setTurnosPorMes(prev => ({ ...prev, [key]: turnos }));
  });
}, [turnosPorMes, cargarTurnos]);
```

### 2. Prefetch del Mes Siguiente

```typescript
useEffect(() => {
  // Precargar el mes siguiente en segundo plano
  const mesSiguiente = new Date(mesActual);
  mesSiguiente.setMonth(mesSiguiente.getMonth() + 1);
  
  const primerDia = new Date(mesSiguiente.getFullYear(), mesSiguiente.getMonth(), 1);
  const ultimoDia = new Date(mesSiguiente.getFullYear(), mesSiguiente.getMonth() + 1, 0);
  
  // Precargar en background
  setTimeout(() => {
    cargarTurnos({ fechaDesde: primerDia, fechaHasta: ultimoDia });
  }, 1000);
}, [mesActual]);
```

### 3. Indicador de Carga

```typescript
{loadingTurnos && (
  <div className={styles.loadingOverlay}>
    <Spinner />
    <p>Cargando turnos de {mesActual.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}...</p>
  </div>
)}
```

### 4. Estadísticas del Mes

```typescript
const estadisticasMes = useMemo(() => {
  return {
    total: turnos.length,
    confirmados: turnos.filter(t => t.estado === 'confirmado').length,
    pendientes: turnos.filter(t => t.estado === 'pendiente').length,
    cancelados: turnos.filter(t => t.estado === 'cancelado').length
  };
}, [turnos]);

// Mostrar en el header del calendario
<div className={styles.estadisticas}>
  <span>Total: {estadisticasMes.total}</span>
  <span>Confirmados: {estadisticasMes.confirmados}</span>
  <span>Pendientes: {estadisticasMes.pendientes}</span>
</div>
```

---

## 🧪 Testing

### Test 1: Carga Inicial

```typescript
test('Debe cargar turnos del mes actual al montar', async () => {
  render(<CalendarioPage />);
  
  await waitFor(() => {
    expect(cargarTurnos).toHaveBeenCalledWith({
      fechaDesde: expect.stringContaining('2025-11-01'),
      fechaHasta: expect.stringContaining('2025-11-30')
    });
  });
});
```

### Test 2: Cambio de Mes

```typescript
test('Debe cargar turnos del nuevo mes al navegar', async () => {
  const { getByLabelText } = render(<CalendarioPage />);
  
  // Hacer clic en mes siguiente
  fireEvent.click(getByLabelText('Mes siguiente'));
  
  await waitFor(() => {
    expect(cargarTurnos).toHaveBeenCalledWith({
      fechaDesde: expect.stringContaining('2025-12-01'),
      fechaHasta: expect.stringContaining('2025-12-31')
    });
  });
});
```

### Test 3: Múltiples Navegaciones

```typescript
test('Debe manejar múltiples cambios de mes', async () => {
  const { getByLabelText } = render(<CalendarioPage />);
  
  // Noviembre → Diciembre
  fireEvent.click(getByLabelText('Mes siguiente'));
  await waitFor(() => expect(cargarTurnos).toHaveBeenCalledTimes(2));
  
  // Diciembre → Enero
  fireEvent.click(getByLabelText('Mes siguiente'));
  await waitFor(() => expect(cargarTurnos).toHaveBeenCalledTimes(3));
  
  // Enero → Diciembre
  fireEvent.click(getByLabelText('Mes anterior'));
  await waitFor(() => expect(cargarTurnos).toHaveBeenCalledTimes(4));
});
```

---

## 📝 Resumen

**Problema:** El calendario no cargaba turnos al cambiar de mes

**Solución:** Sistema de carga dinámica por mes

**Componentes Modificados:**
1. ✅ `CalendarioMensual.tsx` - Notifica cambios de mes
2. ✅ `CalendarioPage.tsx` - Maneja la carga de turnos

**Resultado:**
- ✅ Carga todos los turnos del mes actual al abrir
- ✅ Carga todos los turnos del nuevo mes al navegar
- ✅ No carga turnos innecesarios
- ✅ Experiencia de usuario fluida

¡Sistema de carga por mes implementado correctamente! 🎉
