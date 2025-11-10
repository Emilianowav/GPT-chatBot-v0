# 🤖 Creación Automática de Clientes desde WhatsApp

## 🎯 Objetivo

Crear automáticamente un registro de cliente en la base de datos cuando un número nuevo escribe por WhatsApp, capturando todos los datos disponibles que proporciona la plataforma.

---

## ✨ Funcionalidades Implementadas

### 1. **Creación Automática de Clientes**
- ✅ Detecta números nuevos que escriben por WhatsApp
- ✅ Crea automáticamente un registro de cliente
- ✅ Captura todos los datos disponibles de WhatsApp
- ✅ Evita duplicados (busca por teléfono primero)

### 2. **Campo Sector**
- ✅ Clientes pueden tener un sector asignado
- ✅ Agentes pueden tener un sector asignado (opcional)
- ✅ Permite organizar clientes por áreas/departamentos

### 3. **Datos Capturados de WhatsApp**
- ✅ **Teléfono:** Número del cliente
- ✅ **ProfileName:** Nombre del perfil de WhatsApp
- ✅ **EmpresaId:** Empresa a la que pertenece
- ✅ **ChatbotUserId:** ID del usuario en el chatbot

---

## 📊 Datos que Proporciona WhatsApp

### Payload de WhatsApp:

```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "5491112345678",  // ✅ Teléfono del cliente
          "text": {
            "body": "Hola, quiero información"
          }
        }],
        "contacts": [{
          "profile": {
            "name": "Juan Pérez"  // ✅ Nombre del perfil
          },
          "wa_id": "5491112345678"
        }],
        "metadata": {
          "display_phone_number": "5491187654321",  // Teléfono de la empresa
          "phone_number_id": "123456789"
        }
      }
    }]
  }]
}
```

### Datos Extraídos:

1. **`from`** → `telefono` (Número del cliente)
2. **`profile.name`** → `profileName` (Nombre del perfil)
3. **`display_phone_number`** → `telefonoEmpresa`
4. **`phone_number_id`** → `phoneNumberId`

---

## 🗂️ Modelo de Cliente Actualizado

### Interfaz ICliente:

```typescript
export interface ICliente extends Document {
  empresaId: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  fechaNacimiento?: Date;
  dni?: string;
  notas?: string;
  
  // ✅ NUEVOS CAMPOS
  sector?: string;           // Sector asignado
  profileName?: string;      // Nombre del perfil de WhatsApp
  
  origen: 'chatbot' | 'manual';
  chatbotUserId?: string;
  preferencias: PreferenciasComunicacion;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}
```

---

## 🗂️ Modelo de Agente Actualizado

### Interfaz IAgente:

```typescript
export interface IAgente extends Document {
  empresaId: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  avatar?: string;
  especialidad?: string;
  descripcion?: string;
  titulo?: string;
  
  // ✅ NUEVO CAMPO
  sector?: string;  // Sector al que pertenece (opcional)
  
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

---

## 🔄 Flujo de Creación Automática

```
1. Mensaje llega por WhatsApp
   ↓
2. Extraer datos del payload
   - Teléfono: 5491112345678
   - ProfileName: "Juan Pérez"
   - EmpresaId: "San Jose"
   ↓
3. Buscar cliente existente por teléfono
   ↓
4a. Cliente existe?
    ✅ SÍ → Actualizar profileName si cambió
    ❌ NO → Crear nuevo cliente
   ↓
5. Procesar nombre y apellido
   - "Juan Pérez" → nombre: "Juan", apellido: "Pérez"
   - "María" → nombre: "María", apellido: ""
   ↓
6. Crear cliente con datos
   - Origen: 'chatbot'
   - Activo: true
   - Preferencias: Por defecto
   - Notas: "Cliente creado automáticamente..."
   ↓
7. Guardar en base de datos
   ↓
✅ Cliente disponible para el agente
```

---

## 📝 Servicio de Creación Automática

### Archivo: `clienteAutoService.ts`

#### 1. Buscar o Crear Cliente

```typescript
export async function buscarOCrearClienteDesdeWhatsApp(
  datos: DatosWhatsApp
): Promise<ICliente> {
  const { telefono, profileName, empresaId, chatbotUserId } = datos;

  // 1. Buscar cliente existente
  let cliente = await ClienteModel.findOne({
    empresaId,
    telefono
  });

  if (cliente) {
    // Cliente existe, actualizar profileName si cambió
    if (profileName && cliente.profileName !== profileName) {
      cliente.profileName = profileName;
      await cliente.save();
    }
    return cliente;
  }

  // 2. Cliente no existe, crear uno nuevo
  // Extraer nombre y apellido del profileName
  let nombre = 'Cliente';
  let apellido = 'WhatsApp';

  if (profileName) {
    const partes = profileName.trim().split(' ');
    if (partes.length === 1) {
      nombre = partes[0];
      apellido = '';
    } else if (partes.length >= 2) {
      nombre = partes[0];
      apellido = partes.slice(1).join(' ');
    }
  }

  // Crear cliente
  cliente = new ClienteModel({
    empresaId,
    nombre,
    apellido: apellido || 'Sin Apellido',
    telefono,
    profileName,
    origen: 'chatbot',
    chatbotUserId,
    activo: true,
    notas: `Cliente creado automáticamente desde WhatsApp`,
    preferencias: {
      aceptaWhatsApp: true,
      aceptaSMS: false,
      aceptaEmail: true,
      recordatorioTurnos: true,
      diasAnticipacionRecordatorio: 1,
      horaRecordatorio: '10:00',
      notificacionesPromocion: false,
      notificacionesDisponibilidad: false
    }
  });

  await cliente.save();
  return cliente;
}
```

#### 2. Actualizar Sector

```typescript
export async function actualizarSectorCliente(
  clienteId: string,
  sector: string
): Promise<ICliente | null> {
  return await ClienteModel.findByIdAndUpdate(
    clienteId,
    { sector },
    { new: true }
  );
}
```

#### 3. Obtener Clientes por Sector

```typescript
export async function obtenerClientesPorSector(
  empresaId: string,
  sector: string
): Promise<ICliente[]> {
  return await ClienteModel.find({
    empresaId,
    sector,
    activo: true
  }).sort({ nombre: 1, apellido: 1 });
}
```

---

## 🔌 Integración en WhatsApp Controller

### Ubicación: `whatsappController.ts`

```typescript
// Después de obtener el usuario del chatbot
const usuario = await obtenerUsuario(...);

// 🆕 Crear o actualizar cliente en la base de datos
try {
  await buscarOCrearClienteDesdeWhatsApp({
    telefono: telefonoCliente,
    profileName: profileName ?? undefined,
    empresaId: empresa._id.toString(),
    chatbotUserId: usuario.id
  });
} catch (errorCliente) {
  console.error('⚠️ Error al crear/actualizar cliente:', errorCliente);
  // No interrumpir el flujo si falla
}
```

---

## 🎯 Casos de Uso

### Caso 1: Número Nuevo Escribe

**Escenario:** Cliente nuevo escribe por primera vez

```
1. Cliente: "Hola, quiero información"
   ↓
2. WhatsApp envía:
   - Teléfono: 5491112345678
   - ProfileName: "Juan Pérez"
   ↓
3. Sistema busca cliente por teléfono
   → No existe
   ↓
4. Sistema crea cliente:
   - Nombre: "Juan"
   - Apellido: "Pérez"
   - Teléfono: 5491112345678
   - Origen: 'chatbot'
   - ProfileName: "Juan Pérez"
   ↓
✅ Cliente creado y disponible para el agente
```

---

### Caso 2: Cliente Existente Escribe

**Escenario:** Cliente que ya existe vuelve a escribir

```
1. Cliente: "Hola de nuevo"
   ↓
2. WhatsApp envía:
   - Teléfono: 5491112345678
   - ProfileName: "Juan Pérez García" (cambió)
   ↓
3. Sistema busca cliente por teléfono
   → Existe
   ↓
4. Sistema actualiza profileName:
   - ProfileName: "Juan Pérez García"
   ↓
✅ Cliente actualizado
```

---

### Caso 3: Asignar Sector al Cliente

**Escenario:** Agente asigna sector al cliente

```
1. Agente abre perfil del cliente
   ↓
2. Agente selecciona sector: "Ventas"
   ↓
3. Sistema actualiza:
   - Cliente.sector = "Ventas"
   ↓
✅ Cliente asignado al sector "Ventas"
```

---

### Caso 4: Filtrar Clientes por Sector

**Escenario:** Ver todos los clientes de un sector

```
1. Agente selecciona filtro: "Sector: Ventas"
   ↓
2. Sistema consulta:
   - ClienteModel.find({ sector: "Ventas" })
   ↓
3. Muestra lista de clientes del sector
   ↓
✅ Clientes filtrados por sector
```

---

## 📊 Ejemplo de Cliente Creado

```json
{
  "_id": "67890abcdef12345",
  "empresaId": "San Jose",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "5491112345678",
  "profileName": "Juan Pérez",
  "sector": null,
  "origen": "chatbot",
  "chatbotUserId": "5491112345678_San Jose",
  "activo": true,
  "notas": "Cliente creado automáticamente desde WhatsApp el 01/11/2025 06:30:00",
  "preferencias": {
    "aceptaWhatsApp": true,
    "aceptaSMS": false,
    "aceptaEmail": true,
    "recordatorioTurnos": true,
    "diasAnticipacionRecordatorio": 1,
    "horaRecordatorio": "10:00",
    "notificacionesPromocion": false,
    "notificacionesDisponibilidad": false
  },
  "creadoEn": "2025-11-01T09:30:00.000Z",
  "actualizadoEn": "2025-11-01T09:30:00.000Z"
}
```

---

## 🔧 Archivos Modificados

### 1. Modelos

**`backend/src/models/Cliente.ts`**
- ✅ Agregado campo `sector?: string`
- ✅ Agregado campo `profileName?: string`

**`backend/src/modules/calendar/models/Agente.ts`**
- ✅ Agregado campo `sector?: string`

### 2. Servicios

**`backend/src/services/clienteAutoService.ts`** (NUEVO)
- ✅ `buscarOCrearClienteDesdeWhatsApp()`
- ✅ `actualizarSectorCliente()`
- ✅ `obtenerClientesPorSector()`

### 3. Controladores

**`backend/src/controllers/whatsappController.ts`**
- ✅ Integración de creación automática de clientes
- ✅ Llamada a `buscarOCrearClienteDesdeWhatsApp()`

---

## ✅ Ventajas

1. **Automático:** No requiere intervención manual
2. **Completo:** Captura todos los datos disponibles
3. **Sin Duplicados:** Busca por teléfono antes de crear
4. **Actualizable:** Actualiza profileName si cambia
5. **Organizado:** Sistema de sectores para clasificar
6. **Trazable:** Registra origen y fecha de creación
7. **Flexible:** Agentes pueden modificar datos después

---

## 📝 Resumen

**Funcionalidad:** Creación automática de clientes desde WhatsApp

**Datos Capturados:**
- ✅ Teléfono
- ✅ Nombre del perfil (profileName)
- ✅ EmpresaId
- ✅ ChatbotUserId

**Nuevos Campos:**
- ✅ `Cliente.sector` - Sector asignado
- ✅ `Cliente.profileName` - Nombre de WhatsApp
- ✅ `Agente.sector` - Sector del agente (opcional)

**Flujo:**
```
Mensaje WhatsApp → Extraer datos → Buscar cliente → 
Si no existe: Crear → Guardar → ✅ Disponible para agente
Si existe: Actualizar profileName → ✅ Actualizado
```

**Archivos:**
- ✅ `Cliente.ts` - Modelo actualizado
- ✅ `Agente.ts` - Modelo actualizado
- ✅ `clienteAutoService.ts` - Servicio nuevo
- ✅ `whatsappController.ts` - Integración

¡Clientes automáticos desde WhatsApp implementados! 🤖✨
