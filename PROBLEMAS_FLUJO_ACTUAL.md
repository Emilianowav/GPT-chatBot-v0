# PROBLEMAS DEL FLUJO ACTUAL vs FLUJO DESEADO

## 🔴 PROBLEMA 1: FALTA MENÚ PRINCIPAL

### **Estado Actual:**
El bot inicia directamente con búsqueda de libros:
```
Bot: "¡Hola! ¿Cómo puedo ayudarte hoy en nuestra librería Veo Veo? ¿Estás buscando un libro en particular?"
```

### **Estado Deseado:**
Debe mostrar menú con 6 opciones:
```
Hola 👋
¡Bienvenido/a a Librería Veo Veo! 📚✏️

👉 Por favor, selecciona un ítem de consulta:

1️⃣ Libros escolares u otros títulos
2️⃣ Libros de Inglés
3️⃣ Soporte de ventas
4️⃣ Información del local
5️⃣ Promociones vigentes
6️⃣ Consultas personalizadas

Escribí el número
```

### **Solución:**
- Crear nodo GPT "Menú Principal" que muestre las 6 opciones
- Crear Router con 6 rutas (una por cada opción)
- Cada ruta lleva a su flujo específico

---

## 🔴 PROBLEMA 2: FORMATO DE BÚSQUEDA INCORRECTO

### **Estado Actual:**
El bot pregunta de forma conversacional:
```
Bot: "¿Podrías decirme si buscas algún libro de inglés en particular o si prefieres alguna editorial específica?"
```

### **Estado Deseado:**
Debe pedir formato específico:
```
Por favor, ingrese su búsqueda en el siguiente orden:

Título - Editorial - Edición

⚠️No enviar fotografía de libros, únicamente por escrito!
```

### **Solución:**
- Actualizar systemPrompt del GPT Búsqueda para pedir formato exacto
- No hacer preguntas conversacionales, solo pedir el formato

---

## 🔴 PROBLEMA 3: FALTA FLUJO DE LIBROS DE INGLÉS

### **Estado Actual:**
El bot intenta buscar libros de inglés como si fueran libros normales.

### **Estado Deseado:**
Debe redirigir a atención personalizada:
```
Los libros de ingles se realizan únicamente a pedido con seña. 

Para realizar su pedido, comunicarse con un asesor de venta directo:

👉 http://wa.me/5493794732177?text=Hola,%20estoy%20interesado%20en%20un%20libro%20de%20ingles%20a%20pedido

Escribí 1 para volver al menú principal
```

### **Solución:**
- Crear nodo GPT "Libros de Inglés" con mensaje fijo
- Agregar botón para volver al menú

---

## 🔴 PROBLEMA 4: FALTA MOSTRAR RESULTADOS DE WOOCOMMERCE

### **Estado Actual:**
Después de buscar, el bot solo confirma la búsqueda pero no muestra productos.

### **Estado Deseado:**
```
Perfecto😊, estos son los resultados que coinciden con tu busqueda: 
📚 Resultados encontrados:

1. HARRY POTTER VII Y LAS RELIQUIAS DE LA MUERTE
   💰Precio de lista $50000
   💰Efectivo o transferencia $50000
   📦 Stock: 1

2. HARRY POTTER Y LA ORDEN DEL FENIX
   💰Precio de lista $50000
   💰Efectivo o transferencia $50000
   📦 Stock: 2

💡 ¿Cuál libro querés agregar a tu compra?

-> Escribí el número del libro que buscas
-> Escribí 0 para volver al menú principal
```

### **Solución:**
- Agregar nodo WooCommerce API (buscar productos)
- Agregar nodo GPT "Formatear Resultados" con formato exacto
- Router: ¿Hay stock? → SÍ: Mostrar / NO: Mensaje sin stock

---

## 🔴 PROBLEMA 5: FALTA MENSAJE SIN STOCK

### **Estado Deseado:**
```
Lo sentimos, este libro parece no encontrarse en stock en este momento, de todas formas nos encontramos haciendo pedidos a las editoriales y puede que lo tengamos disponible en muy poco tiempo.

Podes consultar si tu producto estará en stock pronto, en ese caso podes reservarlo.

Para mas información comunicarse a nuestro número de atención personalizada
http://wa.me/5493794732177

👉 Elegí una opción:
Buscar otro título
Volver al menu principal
```

### **Solución:**
- Agregar Router después de WooCommerce API
- Si resultados.length === 0 → Mensaje sin stock
- Si resultados.length > 0 → Mostrar resultados

---

## 🔴 PROBLEMA 6: FALTA FLUJO DE CANTIDAD

### **Estado Deseado:**
```
📦 ¿Cuántos ejemplares de HARRY POTTER 01 LA PIEDRA FILOSOFAL querés?

Escribí la cantidad (1-10)
```

### **Solución:**
- Agregar nodo GPT "Pedir Cantidad" después de selección
- Validar que sea número entre 1 y stock disponible

---

## 🔴 PROBLEMA 7: FALTA RESUMEN DE COMPRA

### **Estado Deseado:**
```
✅ Libro agregado a tu compra:

📘 HARRY POTTER 01 LA PIEDRA FILOSOFAL
📦 Cantidad: 1
💰 Precio: $25000
💵 Subtotal: $25000

¿Qué querés hacer?

1️⃣ Agregar otro libro a mi compra
2️⃣ Finalizar y generar link de pago

Escribí el número
```

### **Solución:**
- Agregar nodo GPT "Resumen Compra"
- Router: 1 → Volver a búsqueda / 2 → Generar pago

---

## 🔴 PROBLEMA 8: FALTA LINK DE PAGO REAL

### **Estado Deseado:**
```
🔗 Link de pago: [LINK MERCADO PAGO]

👉 Una vez realizado el pago, por favor enviános:
•	📸 Comprobante de pago
•	✍️ al siguiente numero: http://wa.me/5493794732177

⏰ Retiro del pedido: Podés pasar a retirarlo a partir de las 24 hs de confirmado el pago.
```

### **Solución:**
- Agregar nodo Mercado Pago API
- Generar preference con productos del carrito
- Enviar link real de pago

---

## 🔴 PROBLEMA 9: FALTAN FLUJOS 3, 4, 5, 6

### **Flujos Faltantes:**
- **Flujo 3:** Soporte de ventas (4 sub-opciones)
- **Flujo 4:** Información del local
- **Flujo 5:** Promociones vigentes
- **Flujo 6:** Consultas personalizadas

### **Solución:**
- Crear nodos GPT con mensajes fijos para cada flujo
- Agregar routers donde sea necesario (Flujo 3 tiene sub-menú)

---

## 🔴 PROBLEMA 10: FALTA BOTÓN "VOLVER AL MENÚ"

### **Estado Actual:**
No hay forma de volver al menú principal.

### **Estado Deseado:**
Todos los flujos deben tener opción "Escribí 0 para volver al menú principal"

### **Solución:**
- Agregar detección de "0" en todos los nodos conversacionales
- Router global que detecte "0" y redirija al menú principal

---

## 📋 RESUMEN DE SOLUCIONES

### **ARQUITECTURA CORRECTA:**

```
[TRIGGER] WhatsApp Watch Events
    ↓
[GPT] Menú Principal (6 opciones)
    ↓
[ROUTER] Detectar opción (1-6)
    ↓
    ├─ [1] FLUJO LIBROS (11 nodos)
    │   ├─ GPT: Pedir búsqueda (formato específico)
    │   ├─ Router: ¿Info completa?
    │   ├─ GPT Transform: JSON para WooCommerce
    │   ├─ WooCommerce API: Buscar productos
    │   ├─ Router: ¿Hay stock?
    │   ├─ GPT: Formatear resultados
    │   ├─ GPT: Pedir selección
    │   ├─ GPT: Pedir cantidad
    │   ├─ GPT: Resumen compra
    │   ├─ Router: ¿Agregar más o pagar?
    │   └─ Mercado Pago API + Mensaje final
    │
    ├─ [2] FLUJO INGLÉS (2 nodos)
    │   ├─ GPT: Mensaje fijo + link atención
    │   └─ Router: Volver al menú
    │
    ├─ [3] FLUJO SOPORTE (6 nodos)
    │   ├─ GPT: Sub-menú (4 opciones)
    │   ├─ Router: Detectar sub-opción
    │   └─ GPT: Respuesta según opción
    │
    ├─ [4] FLUJO INFO LOCAL (1 nodo)
    │   └─ GPT: Mensaje fijo con dirección/horario
    │
    ├─ [5] FLUJO PROMOCIONES (1 nodo)
    │   └─ GPT: Mensaje fijo con promos bancarias
    │
    └─ [6] FLUJO CONSULTAS (1 nodo)
        └─ GPT: Mensaje fijo + link atención
```

---

## 🎯 ESTRATEGIA DE IMPLEMENTACIÓN

### **FASE 1: MENÚ PRINCIPAL (3 nodos)**
1. GPT Menú Principal
2. Router 6 rutas
3. Testear navegación

### **FASE 2: FLUJOS SIMPLES (4-6) (3 nodos)**
1. GPT Info Local
2. GPT Promociones
3. GPT Consultas Personalizadas
4. Testear mensajes fijos

### **FASE 3: FLUJO INGLÉS (2 nodos)**
1. GPT Libros Inglés
2. Router volver menú
3. Testear redirección

### **FASE 4: FLUJO SOPORTE (6 nodos)**
1. GPT Sub-menú soporte
2. Router 4 sub-opciones
3. 4 GPT con respuestas
4. Testear cada opción

### **FASE 5: FLUJO LIBROS COMPLETO (11 nodos)**
1. Implementar búsqueda con formato correcto
2. Agregar WooCommerce API
3. Formatear resultados
4. Selección y cantidad
5. Mercado Pago
6. Testear flujo completo end-to-end

---

## ⚠️ PRIORIDAD

**ORDEN DE IMPLEMENTACIÓN:**
1. ✅ Menú Principal (crítico)
2. ✅ Flujos simples 4, 5, 6 (fácil)
3. ✅ Flujo Inglés (fácil)
4. ✅ Flujo Soporte (medio)
5. ⏳ Flujo Libros completo (complejo)

**TOTAL ESTIMADO: ~25 nodos**
