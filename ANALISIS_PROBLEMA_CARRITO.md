# ANÁLISIS DEL PROBLEMA DEL CARRITO

## 🔴 PROBLEMA IDENTIFICADO

### Lo que pasó:
1. Usuario dice: "Binaria 1 y lecturas a la carta 1+"
2. Clasificador lo marca como "comprar" ❌
3. GPT-armar-carrito inventa productos similares:
   - ¡CONTá CONMIGO! MATEMATICA 6 ❌
   - ¡CONTá CONMIGO! LENGUA 6 ❌
4. Usuario recibe carrito con productos INCORRECTOS

### Lo que DEBERÍA pasar:
1. Usuario dice: "Binaria 1 y lecturas a la carta 1+"
2. Clasificador lo marca como "buscar_producto" ✅
3. WooCommerce busca esos productos
4. Bot muestra los productos encontrados
5. Usuario dice "quiero el 1 y el 2"
6. AHORA sí, GPT-armar-carrito extrae productos del historial ✅

---

## 🔍 CAUSA RAÍZ

### Problema 1: Clasificador incorrecto
El clasificador marca como "comprar" cuando el usuario menciona nombres de libros.

**Debería ser:**
- "Binaria 1 y lecturas a la carta 1+" → **buscar_producto**
- "quiero el 1 y el 2" (después de ver productos) → **comprar**

### Problema 2: GPT-armar-carrito inventa productos
El prompt del GPT dice "NUNCA inventes productos" pero lo hace igual.

**Por qué:**
- El usuario dice nombres de libros que NO están en la lista
- El GPT intenta "ayudar" y busca productos similares
- Devuelve productos incorrectos

---

## ✅ SOLUCIÓN

### 1. Arreglar el Clasificador
```
Si el usuario menciona NOMBRES de libros → buscar_producto
Si el usuario menciona NÚMEROS de productos ya mostrados → comprar
```

### 2. Arreglar GPT-armar-carrito
```
Si los productos mencionados NO están en el historial → carrito vacío
NO inventar productos similares
```

### 3. Flujo correcto
```
Usuario: "Binaria 1 y lecturas a la carta 1+"
  ↓
Clasificador: buscar_producto
  ↓
WooCommerce: Buscar productos
  ↓
Bot: "Encontré estos productos: 1. Binaria 1 - $X, 2. Lecturas a la carta 1+ - $Y"
  ↓
Usuario: "quiero el 1 y el 2"
  ↓
Clasificador: comprar
  ↓
GPT-armar-carrito: Extrae productos del historial
  ↓
Bot: "Tu carrito: Binaria 1 + Lecturas a la carta 1+ = $TOTAL"
```

---

## 🎯 ACCIÓN INMEDIATA

1. Revisar prompt del clasificador
2. Revisar prompt del gpt-armar-carrito
3. Asegurar que NO invente productos
4. Testear flujo completo
