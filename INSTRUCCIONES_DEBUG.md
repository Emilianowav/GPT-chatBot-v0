# 🔍 INSTRUCCIONES PARA DEBUG

## Problema actual:
Bot dice "Voy a buscar..." pero NO muestra productos después.

## Necesito que me compartas:

### 1. Logs de Render del último intento (12:00 PM)

Busca en los logs de Render las líneas que contienen:

```
📱 Mensaje recibido de: 5493794946066
```

Y copia TODO el log desde ese punto hasta el final del flujo.

**Específicamente necesito ver:**

- ✅ Si ejecutó el nodo `woocommerce`
- ✅ Si WooCommerce devolvió productos
- ✅ Si ejecutó el nodo `gpt-asistente-ventas`
- ✅ Qué mensaje envió al final
- ✅ Por qué se detuvo el flujo

### 2. Formato esperado:

```
📱 Mensaje recibido de: 5493794946066
Mensaje: "Una novela porfa"
...
🔄 3. OpenAI (ChatGPT, Sera...
...
🔄 4. Router
...
🔄 5. WooCommerce
...
✅ Productos encontrados: X
...
🔄 6. OpenAI (ChatGPT, Sera...
...
✅ Mensaje enviado
```

### 3. Qué buscar en los logs:

- ¿Llegó a ejecutar WooCommerce? (busca "WooCommerce")
- ¿Cuántos productos encontró? (busca "Productos encontrados")
- ¿Ejecutó gpt-asistente-ventas después? (busca el nodo 6 o 7)
- ¿Qué mensaje final envió? (busca "Mensaje enviado")

---

## Hipótesis del problema:

1. **Hipótesis A:** El flujo se detiene después del nodo que dice "Voy a buscar..." y no continúa a WooCommerce
   - Causa: Falta un edge o el edge está mal configurado

2. **Hipótesis B:** WooCommerce se ejecuta pero no devuelve productos
   - Causa: Error en la búsqueda o categoría no encontrada

3. **Hipótesis C:** WooCommerce devuelve productos pero gpt-asistente-ventas no los muestra
   - Causa: Problema con el prompt o con la variable productos_formateados

---

## Una vez que tengas los logs:

Cópialos aquí y los analizaremos juntos para identificar exactamente dónde se rompe el flujo.
