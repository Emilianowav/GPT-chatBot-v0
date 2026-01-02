# 📊 FLUJOS INTERCAPITAL - CHATBOT WHATSAPP

## 🎯 MENÚ PRINCIPAL

**Trigger:** Keywords `hola`, `menu`, `inicio`, `intercapital`, `ayuda`

```
👋 ¡Bienvenido a Intercapital!
Soy tu asistente virtual para operaciones bursátiles.

👉 ¿Qué operación deseas realizar?

1️⃣ Comprar activos
2️⃣ Vender activos
3️⃣ Solicitar retiro
4️⃣ Consultar mis órdenes
5️⃣ Ayuda

Escribí el número
```

---

## 📈 FLUJO 1: COMPRAR ACTIVOS

### Pasos:

1. **Solicitar Comitente**
   - Pregunta: "🔢 Por favor, ingresa tu número de comitente:"
   - Validación: Número mayor a 0

2. **Validar Comitente** (API)
   - Endpoint: `GET /usuarios/validate?comitente={comitente}`
   - Si no existe: Mensaje de error + volver al menú
   - Si existe: "✅ Hola {nombre}! Tu cuenta está activa"

3. **Solicitar Símbolo**
   - Pregunta: "📊 ¿Qué activo deseas comprar? (ej: AL30, GGAL)"
   - Validación: Texto 2-10 caracteres

4. **Solicitar Cantidad**
   - Pregunta: "📦 ¿Cuántas unidades deseas comprar?"
   - Validación: Número mayor a 0

5. **Solicitar Precio**
   - Pregunta: "💰 ¿A qué precio deseas comprar? (precio por unidad)"
   - Validación: Número mayor a 0.01

6. **Confirmación**
   - Muestra resumen completo
   - Opciones: 1 (Confirmar) / 2 (Cancelar)

7. **Crear Orden** (API)
   - Endpoint: `POST /ordenes`
   - Body: comitente, operacion=COMPRA, symbol, cantidad, precio
   - Respuesta: Orden creada con número y estado

---

## 📉 FLUJO 2: VENDER ACTIVOS

### Pasos:

Idéntico al flujo de compra, pero con `operacion: VENTA`

1. Solicitar Comitente
2. Validar Comitente (API)
3. Solicitar Símbolo
4. Solicitar Cantidad
5. Solicitar Precio
6. Confirmación
7. Crear Orden (API) con operacion=VENTA

---

## 💵 FLUJO 3: SOLICITAR RETIRO

### Pasos:

1. **Solicitar Comitente**
   - Pregunta: "🔢 Por favor, ingresa tu número de comitente:"
   - Validación: Número mayor a 0

2. **Validar Comitente** (API)
   - Endpoint: `GET /usuarios/validate?comitente={comitente}`
   - Si no existe: Mensaje de error + volver al menú
   - Si existe: "✅ Hola {nombre}! Procedamos con tu retiro"

3. **Solicitar Monto**
   - Pregunta: "💵 ¿Qué monto deseas retirar? (en pesos)"
   - Validación: Número mayor a 0

4. **Solicitar CBU**
   - Pregunta: "🏦 Ingresa el CBU de destino (22 dígitos)"
   - Validación: Texto exactamente 22 caracteres
   - Advertencia: Verificar que el CBU sea correcto

5. **Confirmación**
   - Muestra: Comitente, Nombre, Monto, CBU
   - Opciones: 1 (Confirmar) / 2 (Cancelar)

6. **Crear Solicitud** (API)
   - Endpoint: `POST /ordenes`
   - Body: comitente, operacion=RETIRO, symbol=PESOS, cantidad=monto, precio=1, cbu_destino
   - Respuesta: Solicitud creada con número y estado
   - Nota: Procesamiento en 24-48hs hábiles

---

## 📋 FLUJO 4: CONSULTAR ÓRDENES

### Pasos:

1. **Solicitar Comitente**
   - Pregunta: "🔢 Por favor, ingresa tu número de comitente:"
   - Validación: Número mayor a 0

2. **Validar Comitente** (API)
   - Endpoint: `GET /usuarios/validate?comitente={comitente}`
   - Si no existe: Mensaje de error + volver al menú
   - Si existe: "✅ Hola {nombre}! Consultando tus órdenes..."

3. **Listar Órdenes** (API)
   - Endpoint: `GET /ordenes?comitente={comitente}&limit=10`
   - Si no hay órdenes: "📋 No tienes órdenes registradas"
   - Si hay órdenes: Lista numerada con formato:
     ```
     1. Orden #1234 - COMPRA 100 AL30 - Estado: PENDIENTE
     2. Orden #1235 - VENTA 50 GGAL - Estado: APROBADA
     ```
   - Opción: Seleccionar orden para ver detalles o 0 para volver

---

## ℹ️ FLUJO 5: AYUDA

### Contenido:

```
ℹ️ AYUDA - Intercapital Bot

¿Qué puedes hacer?

1️⃣ Comprar activos
   Crea órdenes de compra de acciones, bonos, cedears, etc.

2️⃣ Vender activos
   Crea órdenes de venta de tus activos.

3️⃣ Solicitar retiros
   Solicita transferencias a tu cuenta bancaria.

4️⃣ Consultar órdenes
   Revisa el estado de tus operaciones.

Información importante:
• Todas las órdenes quedan PENDIENTES de aprobación
• Nuestro equipo las procesará en horario de mercado
• Recibirás notificaciones de cambios de estado

¿Necesitas ayuda personalizada?
📞 Teléfono: 0800-XXX-XXXX
📧 Email: soporte@intercapital.com.ar

Escribí 1 para volver al menú principal
```

---

## 🔄 COMPORTAMIENTO GENERAL

### Auto-reinicio al Menú
- Al completar cualquier flujo, el bot automáticamente vuelve al menú principal
- El usuario no necesita escribir "hola" nuevamente

### Validación de Comitente
- Todos los flujos validan el comitente antes de continuar
- Si el comitente no existe o no puede operar, se muestra error y vuelve al menú

### Estados de Órdenes
- **PENDIENTE**: Orden creada, esperando aprobación
- **APROBADA**: Orden aprobada por el equipo
- **RECHAZADA**: Orden rechazada
- **EJECUTADA**: Orden ejecutada exitosamente

### Cancelación
- En cualquier paso de confirmación, el usuario puede cancelar con opción "2"
- Al cancelar, vuelve automáticamente al menú principal

---

## 🔧 CONFIGURACIÓN TÉCNICA

### Endpoints Utilizados

1. **Validar Usuario**
   - `GET /usuarios/validate?comitente={comitente}`
   - Headers: `x-api-key`

2. **Crear Orden**
   - `POST /ordenes`
   - Headers: `x-api-key`, `Content-Type: application/json`
   - Body: comitente, operacion, symbol, cantidad, precio, cbu_destino (opcional)

3. **Consultar Orden**
   - `GET /ordenes/{ordenId}`
   - Headers: `x-api-key`

4. **Listar Órdenes**
   - `GET /ordenes?comitente={comitente}&limit=10`
   - Headers: `x-api-key`

### Variables de Entorno Requeridas

```bash
INTERCAPITAL_API_URL=https://app1.intercapital.ar/api/chatbot
INTERCAPITAL_API_KEY=2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a
```

---

## 🧪 TESTING

### Script de Setup
```bash
node scripts/setup-intercapital.js
```

### Script de Testing
```bash
node scripts/test-intercapital.js
```

### Limpiar Estado
```bash
node scripts/limpiar-estado-intercapital.js
```

### Flujo de Testing Manual

1. Escribir "hola" o "intercapital" en WhatsApp
2. Seleccionar opción del menú
3. Seguir el flujo paso a paso
4. Verificar que la orden se cree correctamente
5. Verificar que vuelva al menú automáticamente

---

## ⚠️ NOTAS IMPORTANTES

1. **Todas las órdenes quedan PENDIENTES** - Requieren aprobación manual del equipo
2. **Validación de comitente es obligatoria** - No se pueden crear órdenes sin validar
3. **CBU debe tener 22 dígitos** - Validación estricta para retiros
4. **Precios en pesos** - Todos los montos son en pesos argentinos
5. **Horario de mercado** - Las órdenes se procesan en horario de mercado
6. **Retiros en 24-48hs** - Los retiros se procesan en días hábiles

---

## 📞 SOPORTE

Para problemas técnicos o consultas:
- **Email:** soporte@intercapital.com.ar
- **Teléfono:** 0800-XXX-XXXX
- **Horario:** Lunes a Viernes 9:00 - 18:00hs
