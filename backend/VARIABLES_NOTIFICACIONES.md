# 📋 Variables en Notificaciones Automáticas

## 🎯 Cómo Funcionan las Variables

Las notificaciones automáticas utilizan un sistema de **plantillas con variables** que se reemplazan con datos reales del turno al momento del envío.

---

## 📝 Variables Estándar Disponibles

### Variables Básicas
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{cliente}` | Nombre completo del cliente | "Juan Pérez" |
| `{telefono}` | Teléfono del cliente | "+5491144556677" |
| `{fecha}` | Fecha del turno | "15/11/2024" |
| `{hora}` | Hora del turno | "14:30" |
| `{duracion}` | Duración en minutos | "60 minutos" |
| `{agente}` | Nombre del agente asignado | "María González" |
| `{turno}` | Nomenclatura personalizada | "viaje", "turno", "reserva" |

---

## 🔧 Variables de Campos Personalizados

**Cualquier campo personalizado** que agregues en la configuración del módulo se convierte automáticamente en una variable.

### Ejemplo para Empresa de Transporte

Si configuras estos campos personalizados:
- **origen** (texto)
- **destino** (texto)
- **pasajeros** (número)
- **equipaje** (texto)

Automáticamente tendrás estas variables disponibles:
- `{origen}`
- `{destino}`
- `{pasajeros}`
- `{equipaje}`

### Ejemplo de Plantilla
```
🚗 *Recordatorio de viaje para mañana*

📍 *Origen:* {origen}
📍 *Destino:* {destino}
🕐 *Hora:* {hora}
👥 *Pasajeros:* {pasajeros}
🧳 *Equipaje:* {equipaje}

Conductor: {agente}
Teléfono: {telefono}

¿Confirmas tu viaje? Responde *SÍ* o *NO*
```

---

## 🔄 Flujo de Procesamiento

### 1. **Creación del Turno**
Cuando se crea un turno, todos los datos se guardan en `turno.datos`:
```javascript
{
  clienteId: "...",
  agenteId: "...",
  fechaInicio: "2024-11-15T14:30:00Z",
  duracion: 60,
  datos: {
    origen: "Av. Corrientes 1234",
    destino: "Aeropuerto Ezeiza",
    pasajeros: "3 personas",
    equipaje: "2 valijas"
  }
}
```

### 2. **Programación de Notificación**
El sistema calcula cuándo enviar según el `momento` configurado:
- **Inmediata**: Al crear el turno
- **Hora exacta**: A la hora especificada el día del turno
- **X horas antes**: 24h, 1h, etc. antes del turno
- **Noche anterior**: 22:00 del día anterior
- **Mismo día**: 09:00 del día del turno

### 3. **Envío de Notificación**
El servicio de notificaciones (`notificacionesService.ts`):

1. Obtiene el turno y sus datos
2. Busca al cliente y agente
3. Crea el objeto de variables:
```javascript
const variables = {
  // Variables estándar
  fecha: "15/11/2024",
  hora: "14:30",
  duracion: "60 minutos",
  turno: "viaje",
  cliente: "Juan Pérez",
  telefono: "+5491144556677",
  agente: "María González",
  
  // Campos personalizados (desde turno.datos)
  ...turno.datos  // origen, destino, pasajeros, equipaje, etc.
};
```

4. Procesa la plantilla reemplazando variables:
```javascript
function procesarPlantilla(plantilla: string, variables: Record<string, any>): string {
  let mensaje = plantilla;
  
  Object.entries(variables).forEach(([clave, valor]) => {
    const regex = new RegExp(`\\{${clave}\\}`, 'g');
    mensaje = mensaje.replace(regex, String(valor));
  });
  
  return mensaje;
}
```

5. Envía el mensaje vía WhatsApp API

---

## 🎨 Ejemplos de Uso por Industria

### 🚗 Empresa de Transporte
```
🚗 Hola {cliente}!

Tu viaje está confirmado para mañana {fecha} a las {hora}

📍 Salida: {origen}
📍 Llegada: {destino}
👥 Pasajeros: {pasajeros}
🧳 Equipaje: {equipaje}

Conductor: {agente}
📞 Contacto: {telefono}

¡Nos vemos mañana!
```

### 💇 Peluquería/Spa
```
✨ Hola {cliente}!

Te recordamos tu {turno} para {fecha} a las {hora}

💇 Servicio: {servicio}
⏱️ Duración: {duracion}
👤 Profesional: {agente}

¿Confirmas tu cita? Responde SÍ o NO
```

### 🏥 Consultorio Médico
```
🏥 Recordatorio de consulta

Paciente: {cliente}
📅 Fecha: {fecha}
🕐 Hora: {hora}
👨‍⚕️ Dr/a: {agente}
🏢 Consultorio: {consultorio}
📋 Especialidad: {especialidad}

Por favor llegar 10 minutos antes.
```

### 🍕 Delivery/Restaurante
```
🍕 ¡Tu pedido está en camino!

Cliente: {cliente}
📍 Dirección: {direccion}
🕐 Hora estimada: {hora}
🛵 Repartidor: {agente}
📦 Pedido: {items}
💰 Total: {total}

¡Buen provecho!
```

---

## ⚙️ Configuración en el CRM

### Paso 1: Definir Campos Personalizados
1. Ve a **Configuración → Campos Personalizados**
2. Agrega los campos que necesites:
   - **Clave**: `origen` (sin espacios, minúsculas)
   - **Etiqueta**: "Origen del viaje"
   - **Tipo**: texto/número/fecha/select

### Paso 2: Crear Notificación
1. Ve a **Configuración → Notificaciones**
2. Click en **+ Agregar Notificación**
3. Configura:
   - **Destinatario**: Cliente/Agente/Específicos
   - **Tipo**: Recordatorio/Confirmación
   - **Momento**: Cuándo enviar
   - **Mensaje**: Usa las variables con `{nombre}`

### Paso 3: Probar
1. Click en **🧪 Enviar Prueba**
2. El sistema enviará al primer destinatario seleccionado
3. Verifica que las variables se reemplacen correctamente

---

## 🔍 Debugging

### Ver Variables Disponibles
En el frontend, al editar una notificación, verás todas las variables disponibles:
- Variables estándar (siempre presentes)
- Variables de campos personalizados (dinámicas según tu configuración)

### Logs del Servidor
Al enviar una notificación, verás en los logs:
```
📤 Enviando notificación:
  Teléfono: +5493794946066
  Empresa: San Jose
  Mensaje: 🚗 Recordatorio de viaje para mañana...
```

### Variables No Reemplazadas
Si una variable aparece como `{variable}` en el mensaje enviado:
- ✅ Verifica que el campo exista en la configuración
- ✅ Verifica que el turno tenga ese dato
- ✅ Verifica la ortografía de la variable

---

## 🚀 Próximas Mejoras

- [ ] Variables calculadas (ej: `{dias_hasta_turno}`)
- [ ] Condicionales (ej: mostrar texto solo si hay equipaje)
- [ ] Formateo de fechas personalizado
- [ ] Variables de empresa (dirección, teléfono, etc.)
- [ ] Plantillas predefinidas por industria
