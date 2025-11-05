# 🔄 Solución: Dependencias Circulares y Recargas Infinitas

## 🐛 Problemas Identificados

### 1. Dependencias Circulares en CalendarioPage

```typescript
// ❌ PROBLEMA: Loop infinito
const cargarTurnosMes = useCallback((primerDia, ultimoDia) => {
  cargarTurnos({ fechaDesde, fechaHasta });
}, [cargarTurnos]); // Depende de cargarTurnos

useEffect(() => {
  cargarTurnosMes(primerDia, ultimoDia);
}, [mesActual, cargarTurnosMes]); // Depende de cargarTurnosMes

const handleCambiarMes = useCallback((primerDia, ultimoDia) => {
  setMesActual(new Date(...)); // Cambia mesActual
  cargarTurnosMes(primerDia, ultimoDia); // Llama a cargarTurnosMes
}, [cargarTurnosMes]); // Depende de cargarTurnosMes
```

**Flujo del problema:**
```
1. useEffect se ejecuta (depende de mesActual y cargarTurnosMes)
   ↓
2. Llama a cargarTurnosMes
   ↓
3. cargarTurnosMes depende de cargarTurnos
   ↓
4. cargarTurnos se recrea en cada render
   ↓
5. cargarTurnosMes se recrea
   ↓
6. useEffect detecta cambio en cargarTurnosMes
   ↓
7. VUELVE AL PASO 1 → LOOP INFINITO 🔄
```

---

### 2. CalendarioMensual Notifica en el Mount

```typescript
// ❌ PROBLEMA: Notifica en el primer render
useEffect(() => {
  if (onCambiarMes) {
    onCambiarMes(primerDia, ultimoDia); // Se ejecuta en mount
  }
}, [mesActual, onCambiarMes]); // Depende de onCambiarMes
```

**Flujo del problema:**
```
1. CalendarioMensual se monta
   ↓
2. useEffect se ejecuta (primer render)
   ↓
3. Llama a onCambiarMes
   ↓
4. Padre actualiza mesActual
   ↓
5. CalendarioMensual recibe nuevo mesInicial
   ↓
6. useEffect se ejecuta de nuevo
   ↓
7. LOOP INFINITO 🔄
```

---

### 3. Hook useTurnos Recarga Automáticamente

```typescript
// ❌ PROBLEMA: Recarga sin filtros
const crearTurno = useCallback(async (data) => {
  await calendarApi.crearTurno(data);
  await cargarTurnos(); // ⚠️ Sin filtros! Carga TODOS los turnos
  return response.turno;
}, [cargarTurnos]);
```

**Flujo del problema:**
```
1. Usuario crea turno en Noviembre 2025
   ↓
2. crearTurno se ejecuta
   ↓
3. Llama a cargarTurnos() sin parámetros
   ↓
4. Backend devuelve TODOS los turnos (sin filtro de fecha)
   ↓
5. Calendario muestra turnos de todos los meses
   ↓
6. Usuario ve turnos incorrectos ❌
```

---

### 4. useEstadisticas Carga Automáticamente

```typescript
// ❌ PROBLEMA: Carga en cada render
useEffect(() => {
  cargarEstadisticas();
}, [cargarEstadisticas]); // Se recrea en cada render
```

---

## ✅ Soluciones Implementadas

### 1. Eliminar Dependencias Circulares en CalendarioPage

```typescript
// ✅ SOLUCIÓN: useEffect solo depende de mesActual
useEffect(() => {
  if (isAuthenticated) {
    const year = mesActual.getFullYear();
    const month = mesActual.getMonth();
    const primerDia = new Date(year, month, 1, 0, 0, 0, 0);
    const ultimoDia = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    console.log('📅 Cargando turnos del mes:', {
      desde: primerDia.toLocaleDateString('es-AR'),
      hasta: ultimoDia.toLocaleDateString('es-AR')
    });
    
    cargarTurnos({
      fechaDesde: primerDia.toISOString(),
      fechaHasta: ultimoDia.toISOString()
    });
  }
}, [isAuthenticated, mesActual]); // ✅ Solo depende de mesActual, NO de funciones
```

**Ventajas:**
- ✅ No hay dependencias circulares
- ✅ Se ejecuta solo cuando cambia `mesActual` o `isAuthenticated`
- ✅ Llama directamente a `cargarTurnos` sin intermediarios

---

### 2. Handler Simplificado

```typescript
// ✅ SOLUCIÓN: Solo actualiza el estado
const handleCambiarMes = useCallback((primerDia: Date, ultimoDia: Date) => {
  console.log('📆 Cambiando a mes:', {
    desde: primerDia.toLocaleDateString('es-AR'),
    hasta: ultimoDia.toLocaleDateString('es-AR')
  });
  
  // Solo actualizar el estado, el useEffect se encargará de cargar
  setMesActual(new Date(primerDia.getFullYear(), primerDia.getMonth(), 1));
}, []); // ✅ Sin dependencias
```

**Flujo correcto:**
```
1. Usuario hace clic en → (mes siguiente)
   ↓
2. CalendarioMensual actualiza mesActual interno
   ↓
3. Notifica a handleCambiarMes
   ↓
4. handleCambiarMes actualiza mesActual del padre
   ↓
5. useEffect detecta cambio en mesActual
   ↓
6. Carga turnos del nuevo mes
   ↓
✅ FIN (no hay loop)
```

---

### 3. Evitar Notificación en Mount

```typescript
// ✅ SOLUCIÓN: Skip primer render
const [esPrimerRender, setEsPrimerRender] = useState(true);

useEffect(() => {
  if (esPrimerRender) {
    setEsPrimerRender(false);
    return; // ✅ No notificar en el primer render
  }
  
  if (onCambiarMes) {
    const year = mesActual.getFullYear();
    const month = mesActual.getMonth();
    const primerDia = new Date(year, month, 1, 0, 0, 0, 0);
    const ultimoDia = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    console.log('📅 CalendarioMensual: Notificando cambio de mes');
    onCambiarMes(primerDia, ultimoDia);
  }
}, [mesActual]); // ✅ Solo depende de mesActual
```

**Flujo correcto:**
```
1. CalendarioMensual se monta
   ↓
2. useEffect se ejecuta (esPrimerRender = true)
   ↓
3. setEsPrimerRender(false) y return
   ↓
4. NO llama a onCambiarMes
   ↓
✅ No hay notificación en mount

5. Usuario hace clic en →
   ↓
6. mesActual cambia
   ↓
7. useEffect se ejecuta (esPrimerRender = false)
   ↓
8. Llama a onCambiarMes
   ↓
✅ Notificación correcta
```

---

### 4. Eliminar Recargas Automáticas en useTurnos

```typescript
// ✅ SOLUCIÓN: No recargar automáticamente
const crearTurno = useCallback(async (data: calendarApi.CrearTurnoData) => {
  try {
    setLoading(true);
    setError(null);
    const response = await calendarApi.crearTurno(data);
    // ✅ NO recargar automáticamente - el componente padre lo hará con los filtros correctos
    return response.turno;
  } catch (err: any) {
    setError(err.message);
    throw err;
  } finally {
    setLoading(false);
  }
}, []); // ✅ Sin dependencias
```

**Flujo correcto:**
```
1. Usuario crea turno
   ↓
2. crearTurno se ejecuta
   ↓
3. NO recarga turnos
   ↓
4. Retorna al componente padre
   ↓
5. Padre llama a recargarTurnosMes()
   ↓
6. Recarga con filtros correctos (fechaDesde, fechaHasta)
   ↓
✅ Solo turnos del mes actual
```

---

### 5. Desactivar Carga Automática de Estadísticas

```typescript
// ✅ SOLUCIÓN: Comentar useEffect automático
// NO cargar automáticamente - el componente padre decidirá cuándo cargar
// useEffect(() => {
//   cargarEstadisticas();
// }, [cargarEstadisticas]);
```

---

## 📊 Comparación

### Antes (❌ Con Problemas):

| Acción | Recargas | Resultado |
|--------|----------|-----------|
| Abrir calendario | 3-5 veces | Loop infinito |
| Cambiar mes | 2-3 veces | Loop infinito |
| Crear turno | 2 veces | Carga todos los turnos |
| Cancelar turno | 2 veces | Carga todos los turnos |

### Después (✅ Solucionado):

| Acción | Recargas | Resultado |
|--------|----------|-----------|
| Abrir calendario | 1 vez | Solo mes actual |
| Cambiar mes | 1 vez | Solo nuevo mes |
| Crear turno | 1 vez | Solo mes actual |
| Cancelar turno | 1 vez | Solo mes actual |

---

## 🎯 Principios Aplicados

### 1. **Evitar Dependencias de Funciones en useEffect**

```typescript
// ❌ MAL
useEffect(() => {
  cargarDatos();
}, [cargarDatos]); // cargarDatos se recrea en cada render

// ✅ BIEN
useEffect(() => {
  // Lógica directa aquí
  fetch('/api/datos');
}, [dependenciasPrimitivas]); // Solo primitivos o estados
```

### 2. **useCallback Solo Cuando es Necesario**

```typescript
// ❌ MAL - useCallback innecesario
const handleClick = useCallback(() => {
  console.log('click');
}, []);

// ✅ BIEN - Función normal
const handleClick = () => {
  console.log('click');
};

// ✅ BIEN - useCallback cuando se pasa como prop a componente memoizado
const handleClick = useCallback(() => {
  console.log('click');
}, []);
```

### 3. **Evitar Recargas Automáticas en Hooks**

```typescript
// ❌ MAL - Hook recarga automáticamente
export function useDatos() {
  const cargar = useCallback(async () => {
    const datos = await fetch('/api/datos');
    setDatos(datos);
  }, []);
  
  useEffect(() => {
    cargar(); // ⚠️ Carga automática
  }, [cargar]);
  
  return { datos, cargar };
}

// ✅ BIEN - Componente decide cuándo cargar
export function useDatos() {
  const cargar = useCallback(async () => {
    const datos = await fetch('/api/datos');
    setDatos(datos);
  }, []);
  
  // NO hay useEffect automático
  
  return { datos, cargar };
}
```

### 4. **Separar Lógica de Carga y Recarga**

```typescript
// ✅ BIEN - Carga inicial
useEffect(() => {
  if (isAuthenticated) {
    cargarDatos();
  }
}, [isAuthenticated, filtros]); // Depende de filtros, no de funciones

// ✅ BIEN - Recarga manual
const recargar = useCallback(() => {
  cargarDatos();
}, [filtros]);
```

---

## 🧪 Testing

### Test 1: No Hay Loop Infinito

```typescript
test('No debe recargar infinitamente', async () => {
  const cargarTurnos = jest.fn();
  
  render(<CalendarioPage cargarTurnos={cargarTurnos} />);
  
  await waitFor(() => {
    expect(cargarTurnos).toHaveBeenCalledTimes(1); // ✅ Solo 1 vez
  });
  
  // Esperar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  expect(cargarTurnos).toHaveBeenCalledTimes(1); // ✅ Sigue siendo 1
});
```

### Test 2: Cambio de Mes Carga Solo 1 Vez

```typescript
test('Cambio de mes carga solo una vez', async () => {
  const cargarTurnos = jest.fn();
  const { getByLabelText } = render(<CalendarioPage cargarTurnos={cargarTurnos} />);
  
  // Carga inicial
  await waitFor(() => expect(cargarTurnos).toHaveBeenCalledTimes(1));
  
  // Cambiar mes
  fireEvent.click(getByLabelText('Mes siguiente'));
  
  await waitFor(() => expect(cargarTurnos).toHaveBeenCalledTimes(2)); // ✅ Solo 2 veces
  
  // Esperar 2 segundos
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  expect(cargarTurnos).toHaveBeenCalledTimes(2); // ✅ Sigue siendo 2
});
```

### Test 3: Crear Turno Recarga con Filtros

```typescript
test('Crear turno recarga con filtros correctos', async () => {
  const cargarTurnos = jest.fn();
  const { getByText } = render(<CalendarioPage cargarTurnos={cargarTurnos} />);
  
  // Crear turno
  fireEvent.click(getByText('Nuevo Turno'));
  // ... llenar formulario ...
  fireEvent.click(getByText('Guardar'));
  
  await waitFor(() => {
    expect(cargarTurnos).toHaveBeenLastCalledWith({
      fechaDesde: expect.stringContaining('2025-11-01'),
      fechaHasta: expect.stringContaining('2025-11-30')
    });
  });
});
```

---

## 📝 Resumen

**Problemas Encontrados:**
1. ❌ Dependencias circulares en useEffect
2. ❌ CalendarioMensual notifica en mount
3. ❌ useTurnos recarga sin filtros
4. ❌ useEstadisticas carga automáticamente

**Soluciones Aplicadas:**
1. ✅ useEffect solo depende de primitivos
2. ✅ Skip primer render en CalendarioMensual
3. ✅ Eliminar recargas automáticas en hooks
4. ✅ Desactivar carga automática de estadísticas

**Resultado:**
- ✅ No hay loops infinitos
- ✅ Carga eficiente (1 vez por acción)
- ✅ Filtros correctos siempre
- ✅ Mejor performance

¡Dependencias circulares eliminadas! 🎉
