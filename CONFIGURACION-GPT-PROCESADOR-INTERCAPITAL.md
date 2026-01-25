# 🤖 CONFIGURACIÓN GPT PROCESADOR - INTERCAPITAL

## 📍 Ubicación en el Flujo
**Nodo 4** - Después de los nodos HTTP de validación y antes del Router

---

## ⚙️ Configuración del Nodo GPT

### Información Básica
- **Label:** `GPT Procesador`
- **Tipo:** OpenAI (ChatGPT)
- **Modelo:** `gpt-4o-mini` (más rápido y económico para clasificación)
- **Temperature:** `0.1` (respuestas consistentes y predecibles)
- **Max Tokens:** `10` (solo necesita responder con una palabra)

---

## 📝 System Prompt

```
Eres un procesador de intenciones para Intercapital. Tu ÚNICA función es analizar el mensaje del usuario y el historial de conversación para identificar la intención y responder con UNA SOLA PALABRA que represente el tópico.

TÓPICOS VÁLIDOS:
- COMPRA: El usuario quiere comprar activos (acciones, bonos, CEDEARs, fondos)
- VENTA: El usuario quiere vender activos que posee
- PORTFOLIO: El usuario consulta su cartera, saldos, tenencias, posiciones
- CONSULTA: El usuario hace preguntas generales sobre el mercado, precios, cotizaciones
- AYUDA: El usuario necesita ayuda, no entiende algo, o saluda

REGLAS ESTRICTAS:
1. Responde SOLO con una palabra en MAYÚSCULAS: COMPRA, VENTA, PORTFOLIO, CONSULTA o AYUDA
2. NO agregues explicaciones, puntos, comas ni nada más
3. Analiza el contexto completo del historial de conversación
4. Si hay duda entre dos categorías, prioriza la más específica
5. Si el usuario saluda o dice hola, usa AYUDA

EJEMPLOS DE CLASIFICACIÓN:

Usuario: "Quiero comprar acciones de YPF"
Respuesta: COMPRA

Usuario: "¿Cuánto tengo en mi cuenta?"
Respuesta: PORTFOLIO

Usuario: "Vender mis bonos AL30"
Respuesta: VENTA

Usuario: "¿Cómo está el dólar hoy?"
Respuesta: CONSULTA

Usuario: "Hola, necesito ayuda"
Respuesta: AYUDA

Usuario: "Quiero invertir en CEDEARs"
Respuesta: COMPRA

Usuario: "¿Cuántas acciones de GGAL tengo?"
Respuesta: PORTFOLIO

Usuario: "¿A cuánto está YPF?"
Respuesta: CONSULTA

Usuario: "Liquidar mi posición en bonos"
Respuesta: VENTA
```

---

## 🔗 Variables de Entrada

Configura estas variables en el campo de mensaje del usuario:

```
Mensaje del usuario: {{mensaje_usuario}}

Historial de conversación:
{{historial_conversacion}}

Información del cliente:
- Comitente: {{comitente}}
- Teléfono: {{telefono_usuario}}
```

**Nota:** El historial es crucial para entender el contexto de la conversación.

---

## 📤 Variable de Salida

### Configuración de Output Variable:
- **Nombre de la variable:** `topico_identificado`
- **Tipo:** `global`
- **Descripción:** Tópico identificado por el procesador (COMPRA, VENTA, PORTFOLIO, CONSULTA, AYUDA)

**Uso:** Esta variable será usada por el Router para dirigir el flujo a la rama correcta.

---

## 🔀 Conexión con el Router

El GPT Procesador debe conectarse directamente al Router (nodo naranja).

El Router tendrá 5 conexiones de salida, cada una con un filtro:

1. **Rama COMPRA:** `{{topico_identificado}} Equal to "COMPRA"`
2. **Rama VENTA:** `{{topico_identificado}} Equal to "VENTA"`
3. **Rama PORTFOLIO:** `{{topico_identificado}} Equal to "PORTFOLIO"`
4. **Rama CONSULTA:** `{{topico_identificado}} Equal to "CONSULTA"`
5. **Rama AYUDA:** `{{topico_identificado}} Equal to "AYUDA"`

---

## ✅ Checklist de Configuración

Antes de guardar el nodo, verifica:

- [ ] System Prompt copiado completo (sin modificaciones)
- [ ] Temperature en 0.1
- [ ] Max Tokens en 10
- [ ] Modelo: gpt-4o-mini
- [ ] Variables de entrada configuradas (mensaje_usuario, historial_conversacion, comitente, telefono_usuario)
- [ ] Variable de salida: `topico_identificado` (tipo global)
- [ ] Conexión al Router configurada

---

## 🧪 Pruebas Recomendadas

Después de configurar, prueba con estos mensajes:

1. **"Quiero comprar YPF"** → Debe responder: `COMPRA`
2. **"¿Cuánto dinero tengo?"** → Debe responder: `PORTFOLIO`
3. **"Vender mis bonos"** → Debe responder: `VENTA`
4. **"¿A cuánto está el dólar?"** → Debe responder: `CONSULTA`
5. **"Hola, buenos días"** → Debe responder: `AYUDA`

---

## 📊 Métricas de Éxito

El nodo está funcionando correctamente si:
- ✅ Responde siempre con UNA sola palabra en MAYÚSCULAS
- ✅ La clasificación es coherente con la intención del usuario
- ✅ El Router puede leer la variable `topico_identificado`
- ✅ El flujo se dirige a la rama correcta

---

## 🚨 Troubleshooting

### Problema: El GPT responde con texto adicional
**Solución:** Reducir Max Tokens a 5 y verificar que el System Prompt esté completo.

### Problema: La variable no se guarda
**Solución:** Verificar que el nombre sea exactamente `topico_identificado` (sin espacios ni mayúsculas) y tipo `global`.

### Problema: El Router no funciona
**Solución:** Verificar que los filtros usen comillas dobles: `"COMPRA"` no `'COMPRA'`.

---

## 📝 Notas Importantes

1. **No es conversacional:** Este GPT NO debe conversar con el usuario, solo clasificar.
2. **Respuesta rápida:** Con 10 tokens máximo, la respuesta es casi instantánea.
3. **Bajo costo:** gpt-4o-mini es muy económico para esta tarea.
4. **Determinístico:** Temperature 0.1 asegura respuestas consistentes.

---

**Fecha de creación:** 2026-01-24  
**Versión:** 1.0  
**Autor:** Sistema de configuración Intercapital
