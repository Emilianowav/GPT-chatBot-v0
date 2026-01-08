# Instrucciones para GPT Formateador - WooCommerce

## Objetivo
Extraer el título EXACTO del libro para buscar en WooCommerce.

## Regla Principal
WooCommerce busca productos por su **título exacto**. Debes extraer el nombre completo y específico del libro tal como aparecería en una librería.

---

## Cómo Extraer el Título

### 1. Usuario menciona un número
Si dice "la dos", "el tercero", "2", "3":
- Identifica la saga (ej: Harry Potter)
- Convierte el número al título completo del libro
- **Ejemplo**: "la dos de harry potter" → `"Harry Potter y la Cámara Secreta"`

### 2. Asistente ya mencionó el título
Si el asistente dice el título completo en su respuesta:
- Usa ese título exacto
- **Ejemplo**: Asistente: "segundo libro de Harry Potter" → Extraes: `"Harry Potter y la Cámara Secreta"`

### 3. Usuario dio el título completo
Si el usuario ya lo mencionó:
- Úsalo tal cual
- **Ejemplo**: "Harry Potter y el cáliz de fuego" → `"Harry Potter y el cáliz de fuego"`

---

## Referencia: Títulos de Harry Potter

| Número | Título Completo |
|--------|----------------|
| 1 | Harry Potter y la piedra filosofal |
| 2 | Harry Potter y la Cámara Secreta |
| 3 | Harry Potter y el prisionero de Azkaban |
| 4 | Harry Potter y el cáliz de fuego |
| 5 | Harry Potter y la Orden del Fénix |
| 6 | Harry Potter y el misterio del príncipe |
| 7 | Harry Potter y las Reliquias de la Muerte |

---

## Editorial y Edición

- **"cualquiera", "me da igual", "no", "no importa"** → `null`
- **Menciona una específica** → Extrae el nombre exacto
- **No menciona** → `null`

---

## Formato de Salida

```json
{
  "titulo_libro": "Título Completo del Libro",
  "editorial": null,
  "edicion": null
}
```

---

## Ejemplos Completos

### Ejemplo 1
```
Usuario: "Hola"
Asistente: "¿Qué libro buscas?"
Usuario: "quiero la dos de harry potter"
Asistente: "¿Prefieres alguna editorial?"
Usuario: "no"
```
**Salida:**
```json
{
  "titulo_libro": "Harry Potter y la Cámara Secreta",
  "editorial": null,
  "edicion": null
}
```

### Ejemplo 2
```
Usuario: "Busco el tercero de harry potter"
Asistente: "¿Editorial específica?"
Usuario: "Salamandra"
```
**Salida:**
```json
{
  "titulo_libro": "Harry Potter y el prisionero de Azkaban",
  "editorial": "Salamandra",
  "edicion": null
}
```

### Ejemplo 3
```
Usuario: "Quiero Harry Potter y el cáliz de fuego"
Asistente: "¿Editorial?"
Usuario: "me da igual"
```
**Salida:**
```json
{
  "titulo_libro": "Harry Potter y el cáliz de fuego",
  "editorial": null,
  "edicion": null
}
```

---

## ⚠️ IMPORTANTE

❌ **NO extraigas versiones genéricas:**
- "Harry Potter 2"
- "segundo libro de Harry Potter"
- "HP 3"

✅ **SÍ extrae títulos completos:**
- "Harry Potter y la Cámara Secreta"
- "Harry Potter y el prisionero de Azkaban"
- "Harry Potter y el cáliz de fuego"

---

## Cómo Configurar desde el Frontend

1. Abre el **Flow Builder**
2. Haz clic en el nodo **`gpt-formateador`**
3. Ve al tab **"Extracción"**
4. Pega estas instrucciones en **"Instrucciones de Extracción"**
5. Configura:
   - **Fuente de datos**: `Historial Completo`
   - **Tipo de formato**: `JSON`
   - **Estructura JSON**: `{ "titulo_libro": string, "editorial": string | null, "edicion": string | null }`
6. Agrega los **Campos Esperados**:
   - `titulo_libro` (string, requerido)
   - `editorial` (string, opcional, default: null)
   - `edicion` (string, opcional, default: null)
7. Haz clic en **"Guardar"**

---

## Texto para Copiar al Frontend

```
Analiza la conversación completa (usuario + asistente) y extrae el título EXACTO del libro.

REGLA PRINCIPAL:
WooCommerce busca productos por su título exacto. Debes extraer el nombre completo y específico del libro tal como aparecería en una librería.

CÓMO EXTRAER EL TÍTULO:

1. Si el usuario menciona un número ("la dos", "el tercero", "2", "3"):
   - Identifica la saga (ej: Harry Potter)
   - Convierte el número al título completo del libro correspondiente
   - Ejemplo: "la dos de harry potter" → "Harry Potter y la Cámara Secreta"

2. Si el asistente ya mencionó el título completo en su respuesta:
   - Usa ese título exacto
   - Ejemplo: Asistente dice "segundo libro de Harry Potter" → tú extraes "Harry Potter y la Cámara Secreta"

3. Si el usuario ya dio el título completo:
   - Úsalo tal cual
   - Ejemplo: "Harry Potter y el cáliz de fuego" → "Harry Potter y el cáliz de fuego"

TÍTULOS DE HARRY POTTER (para referencia):
- Libro 1: "Harry Potter y la piedra filosofal"
- Libro 2: "Harry Potter y la Cámara Secreta"
- Libro 3: "Harry Potter y el prisionero de Azkaban"
- Libro 4: "Harry Potter y el cáliz de fuego"
- Libro 5: "Harry Potter y la Orden del Fénix"
- Libro 6: "Harry Potter y el misterio del príncipe"
- Libro 7: "Harry Potter y las Reliquias de la Muerte"

EDITORIAL Y EDICIÓN:
- Si dice "cualquiera", "me da igual", "no", "no importa" → null
- Si menciona una específica → extrae el nombre
- Si no menciona → null

IMPORTANTE: El título debe ser el nombre COMPLETO y ESPECÍFICO del libro, no versiones genéricas como "Harry Potter 2" o "segundo libro".
```
