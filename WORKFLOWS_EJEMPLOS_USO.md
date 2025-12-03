# 📚 Workflows Conversacionales - Ejemplos de Uso Completos

## 🎉 Nuevo Diseño Implementado

El formulario de workflows ahora sigue el **diseño por pasos** (como el de crear agente) e incluye el **template de respuesta** (como el de keywords del chatbot).

---

## 🎨 Características del Nuevo Formulario

### ✅ Diseño por Pasos (Wizard)
```
1. Información → 2. Activación → 3. Pasos → 4. Mensajes → 5. Revisión
```

### ✅ Template de Respuesta
- Usa `{{variable}}` para insertar datos
- Soporta arrays con `{{#array}} ... {{/array}}`
- Accede a propiedades con `{{objeto.propiedad}}`

### ✅ Ejemplos en Cada Campo
- Cada input tiene un ejemplo de uso
- Tooltips explicativos
- Casos de uso reales

---

## 📋 Ejemplo 1: Búsqueda de Productos (E-commerce)

### Paso 1: Información Básica

```
Nombre: Búsqueda de Productos
Descripción: Permite buscar productos filtrando por sucursal, categoría y nombre
Prioridad: 10
Timeout: 30 minutos
```

**Ejemplo mostrado en el formulario:**
> "Búsqueda de Productos", "Reserva de Turnos", "Cotización"

---

### Paso 2: Activación

**Tipo:** Por Palabras Clave

**Keywords:**
- buscar
- stock
- disponibilidad
- precio

**Ejemplo mostrado:**
> Ejemplo: "buscar", "stock", "disponibilidad"

---

### Paso 3: Pasos del Workflow

**Paso 1 - Recopilar Sucursal:**
```
Tipo: Recopilar Información
Pregunta: "¿En qué sucursal querés buscar?
          Centro, Norte o Sur"
Variable: sucursal
Validación: Lista de opciones
Opciones: ["Centro", "Norte", "Sur"]
Intentos Máximos: 3
```

**Paso 2 - Recopilar Categoría:**
```
Tipo: Recopilar Información
Pregunta: "¿Qué tipo de producto buscás?
          Teléfonos, Fundas, Accesorios o Auriculares"
Variable: categoria
Validación: Lista de opciones
Opciones: ["Teléfonos", "Fundas", "Accesorios", "Auriculares"]
```

**Paso 3 - Recopilar Producto:**
```
Tipo: Recopilar Información
Pregunta: "¿Qué modelo o marca estás buscando?"
Variable: query
Validación: Texto libre
```

**Paso 4 - Ejecutar Búsqueda:**
```
Tipo: Ejecutar Endpoint
Endpoint: GET /productos/buscar
Mapeo de Parámetros:
  sucursal → sucursal
  categoria → categoria
  query → q
```

**Ejemplo mostrado en el formulario:**
```
💡 Ejemplo de flujo:
1. Paso 1 (Recopilar): "¿En qué sucursal?" → Variable: sucursal
2. Paso 2 (Recopilar): "¿Qué categoría?" → Variable: categoria
3. Paso 3 (Recopilar): "¿Qué producto buscás?" → Variable: query
4. Paso 4 (Ejecutar): GET /productos/buscar con los datos recopilados
```

---

### Paso 4: Mensajes y Template

**Mensaje Inicial:**
```
🔍 Te ayudo a buscar productos en nuestro stock
```

**Template de Respuesta:**
```
✅ Encontré {{total}} productos:

{{#productos}}
📱 {{nombre}}
   💰 Precio: ${{precio}}
   📦 Stock: {{stock}} unidades
   🏢 Sucursal: {{sucursal}}
{{/productos}}
```

**Mensaje de Abandono:**
```
🚫 Búsqueda cancelada. Escribí 'buscar' cuando quieras empezar de nuevo.
```

**Ejemplo mostrado:**
```
💡 Variables disponibles:
• {{variable}} - Inserta el valor de una variable
• {{#array}} ... {{/array}} - Itera sobre un array
• {{objeto.propiedad}} - Accede a propiedades anidadas

Ejemplo completo:
✅ Encontré {{total}} productos:

{{#productos}}
📱 {{nombre}}
   💰 Precio: ${{precio}}
   📦 Stock: {{stock}} unidades
   🏢 Sucursal: {{sucursal}}
{{/productos}}
```

---

### Paso 5: Revisión

El sistema muestra un resumen completo:

```
📋 Información
  Nombre: Búsqueda de Productos
  Descripción: Permite buscar productos...
  Prioridad: 10
  Timeout: 30 minutos

🎯 Activación
  Tipo: Por Palabras Clave
  Keywords: buscar, stock, disponibilidad, precio

📝 Pasos (4)
  Paso 1: 📝 Recopilar: sucursal
  Paso 2: 📝 Recopilar: categoria
  Paso 3: 📝 Recopilar: query
  Paso 4: ⚡ Ejecutar: GET /productos/buscar

⚙️ Configuración
  Estado: ✅ Activo
  Permitir cancelar: Sí
```

---

## 📋 Ejemplo 2: Reserva de Turnos (Servicios)

### Paso 1: Información Básica

```
Nombre: Reserva de Turnos
Descripción: Sistema de reserva de turnos médicos con selección de especialidad, profesional y horario
Prioridad: 15
Timeout: 45 minutos
```

---

### Paso 2: Activación

**Tipo:** Por Palabras Clave

**Keywords:**
- turno
- reserva
- cita
- agendar

---

### Paso 3: Pasos del Workflow

**Paso 1 - Especialidad:**
```
Pregunta: "¿Qué especialidad necesitás?
          Clínica Médica, Pediatría, Traumatología"
Variable: especialidad
Validación: Opciones
Opciones: ["Clínica Médica", "Pediatría", "Traumatología"]
```

**Paso 2 - Profesional:**
```
Pregunta: "¿Con qué profesional querés el turno?"
Variable: profesional
Validación: Texto
```

**Paso 3 - Fecha:**
```
Pregunta: "¿Qué día preferís? (formato: DD/MM/AAAA)"
Variable: fecha
Validación: Regex
Regex: ^\d{2}/\d{2}/\d{4}$
Mensaje Error: "Por favor ingresá la fecha en formato DD/MM/AAAA"
```

**Paso 4 - Confirmar:**
```
Tipo: Ejecutar
Endpoint: POST /turnos/reservar
Mapeo:
  especialidad → especialidad
  profesional → profesional
  fecha → fecha
```

---

### Paso 4: Template de Respuesta

```
✅ Turno confirmado!

📅 Fecha: {{fecha}}
👨‍⚕️ Profesional: {{profesional}}
🏥 Especialidad: {{especialidad}}
🕐 Horario: {{horario}}

📍 Dirección: {{direccion}}

⚠️ Por favor llegá 10 minutos antes.
Para cancelar, escribí "cancelar turno"
```

---

## 📋 Ejemplo 3: Cotización de Servicios

### Paso 1: Información

```
Nombre: Cotización de Servicios
Descripción: Genera cotizaciones personalizadas según el servicio requerido
Prioridad: 8
Timeout: 20 minutos
```

---

### Paso 2: Activación

**Tipo:** Por Palabras Clave

**Keywords:**
- cotización
- presupuesto
- precio
- cuanto cuesta

---

### Paso 3: Pasos

**Paso 1 - Servicio:**
```
Pregunta: "¿Qué servicio te interesa?
          Desarrollo Web, App Móvil, Diseño, Consultoría"
Variable: servicio
Validación: Opciones
```

**Paso 2 - Alcance:**
```
Pregunta: "Describí brevemente el alcance del proyecto"
Variable: alcance
Validación: Texto
```

**Paso 3 - Presupuesto:**
```
Pregunta: "¿Cuál es tu presupuesto aproximado? (en USD)"
Variable: presupuesto
Validación: Número
```

**Paso 4 - Generar:**
```
Tipo: Ejecutar
Endpoint: POST /cotizaciones/generar
```

---

### Paso 4: Template

```
💼 Cotización Generada

Servicio: {{servicio}}
Alcance: {{alcance}}
Presupuesto: ${{presupuesto}} USD

📊 Propuesta:
{{#paquetes}}
  {{nombre}} - ${{precio}}
  {{descripcion}}
  
{{/paquetes}}

📞 Un asesor se contactará contigo en las próximas 24hs.
```

---

## 📋 Ejemplo 4: Workflow de Bienvenida

### Paso 1: Información

```
Nombre: Bienvenida Nuevos Usuarios
Descripción: Saluda y recopila información básica de nuevos contactos
Prioridad: 20
Timeout: 60 minutos
```

---

### Paso 2: Activación

**Tipo:** Primer Mensaje ⭐

**Ejemplo mostrado:**
> Ejemplo: Workflow de bienvenida para nuevos usuarios

---

### Paso 3: Pasos

**Paso 1 - Nombre:**
```
Pregunta: "¡Hola! 👋 Bienvenido a [Empresa]
          ¿Cómo te llamás?"
Variable: nombre
Validación: Texto
```

**Paso 2 - Email:**
```
Pregunta: "Perfecto {{nombre}}! ¿Cuál es tu email?"
Variable: email
Validación: Regex
Regex: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

**Paso 3 - Interés:**
```
Pregunta: "¿Qué te trae por aquí?
          Productos, Servicios, Soporte, Otro"
Variable: interes
Validación: Opciones
```

**Paso 4 - Guardar:**
```
Tipo: Ejecutar
Endpoint: POST /contactos/registrar
```

---

### Paso 4: Template

```
✅ Gracias {{nombre}}!

Ya estás registrado en nuestro sistema.

📧 Email: {{email}}
🎯 Interés: {{interes}}

{{#recomendaciones}}
Te recomendamos:
• {{titulo}}
  {{descripcion}}
{{/recomendaciones}}

¿En qué más puedo ayudarte?
```

---

## 🎯 Validaciones Disponibles con Ejemplos

### 1. Texto Libre
```
Validación: Texto
Ejemplo de uso: Nombre, descripción, comentarios
Usuario puede escribir: Cualquier texto
```

### 2. Número
```
Validación: Número
Ejemplo de uso: Cantidad, precio, edad
Usuario puede escribir: 25, 1500, 3.5
```

### 3. Lista de Opciones
```
Validación: Opciones
Opciones: ["Centro", "Norte", "Sur"]
Ejemplo de uso: Sucursales, categorías, servicios
Usuario puede escribir: "norte" (normaliza a "Norte") ✅
```

### 4. Expresión Regular
```
Validación: Regex
Regex: ^\d{2}/\d{2}/\d{4}$
Ejemplo de uso: Fechas, teléfonos, códigos
Usuario debe escribir: 25/12/2024
```

---

## 💡 Tips de Uso

### 1. Mensajes Claros
```
❌ Malo: "¿Qué querés?"
✅ Bueno: "¿Qué tipo de producto buscás?
          Teléfonos, Fundas, Accesorios o Auriculares"
```

### 2. Opciones Visibles
```
Siempre muestra las opciones en la pregunta:
"¿En qué sucursal?
Centro, Norte o Sur"
```

### 3. Variables Descriptivas
```
❌ Malo: var1, var2, dato
✅ Bueno: sucursal, categoria, nombreProducto
```

### 4. Templates Estructurados
```
Usa emojis y formato:
✅ Título
📱 Item 1
💰 Precio
📦 Stock
```

### 5. Mensajes de Error Útiles
```
❌ Malo: "Error"
✅ Bueno: "Por favor ingresá la fecha en formato DD/MM/AAAA"
```

---

## 🚀 Flujo Completo de Uso

### 1. Crear Workflow
```
Dashboard → APIs → [API] → Flujos → Nuevo Workflow
```

### 2. Completar Paso 1 (Información)
- Nombre descriptivo
- Descripción clara
- Prioridad según importancia
- Timeout adecuado

### 3. Completar Paso 2 (Activación)
- Elegir tipo de trigger
- Agregar keywords si aplica
- Ver ejemplo en pantalla

### 4. Completar Paso 3 (Pasos)
- Agregar pasos uno por uno
- Configurar validaciones
- Mapear parámetros para ejecución
- Ver ejemplo de flujo completo

### 5. Completar Paso 4 (Mensajes)
- Mensaje inicial atractivo
- Template con variables
- Mensaje de abandono claro
- Ver ejemplos de templates

### 6. Revisar Paso 5
- Verificar toda la configuración
- Activar inmediatamente o después
- Guardar

### 7. Probar en WhatsApp
```
Usuario: buscar iphone
Bot: [Inicia workflow]
```

---

## ✅ Checklist de Creación

- [ ] Nombre descriptivo y claro
- [ ] Descripción completa
- [ ] Trigger configurado correctamente
- [ ] Keywords relevantes (si aplica)
- [ ] Al menos 1 paso de recopilación
- [ ] Al menos 1 paso de ejecución
- [ ] Validaciones configuradas
- [ ] Template de respuesta con variables
- [ ] Mensajes personalizados
- [ ] Probado en WhatsApp

---

## 🎉 Resultado Final

Con este nuevo diseño tienes:

1. ✅ **Wizard por pasos** - Guía clara y ordenada
2. ✅ **Ejemplos en cada campo** - Aprende mientras creas
3. ✅ **Template de respuesta** - Formatea resultados profesionalmente
4. ✅ **Validaciones visuales** - Configura fácilmente
5. ✅ **Revisión final** - Verifica antes de guardar

**¡Todo listo para crear workflows conversacionales profesionales!** 🚀
