# Ejemplo de Configuración: GPT Formateador para WooCommerce

## Caso de Uso
El usuario habla con un GPT conversacional que recopila información sobre un libro.
Luego, un **GPT Formateador** analiza el historial y extrae los datos en formato JSON para buscar en WooCommerce.

---

## Configuración del Nodo GPT Formateador

```json
{
  "tipo": "formateador",
  "module": "gpt-formateador",
  "modelo": "gpt-3.5-turbo",
  "temperatura": 0.1,
  "maxTokens": 500,
  
  "configuracionExtraccion": {
    "instruccionesExtraccion": "Analiza la conversación y extrae la información sobre el libro que el usuario está buscando. Identifica el título del libro, la editorial (si la mencionó), y la edición (si la mencionó). Si el usuario dijo 'cualquiera' o 'cualquier edición', deja ese campo vacío o null.",
    
    "fuenteDatos": "historial_completo",
    
    "formatoSalida": {
      "tipo": "json",
      "estructura": "{ \"titulo_libro\": string, \"editorial\": string | null, \"edicion\": string | null }",
      "ejemplo": "{ \"titulo_libro\": \"Harry Potter 3\", \"editorial\": null, \"edicion\": null }"
    },
    
    "camposEsperados": [
      {
        "nombre": "titulo_libro",
        "descripcion": "Título del libro que el usuario mencionó",
        "tipoDato": "string",
        "requerido": true,
        "valorPorDefecto": null
      },
      {
        "nombre": "editorial",
        "descripcion": "Editorial del libro (si la mencionó)",
        "tipoDato": "string",
        "requerido": false,
        "valorPorDefecto": null
      },
      {
        "nombre": "edicion",
        "descripcion": "Edición del libro (si la mencionó)",
        "tipoDato": "string",
        "requerido": false,
        "valorPorDefecto": null
      }
    ]
  },
  
  "outputFormat": "json",
  "globalVariablesOutput": ["titulo_libro", "editorial", "edicion"]
}
```

---

## Flujo de Ejecución

### 1. Usuario habla con GPT Conversacional
```
Usuario: "Quiero Harry Potter 3"
Bot: "¿Buscas alguna editorial en particular?"
Usuario: "Cualquiera está bien"
```

**Historial guardado:**
```
[
  "Quiero Harry Potter 3",
  "¿Buscas alguna editorial en particular?",
  "Cualquiera está bien",
  "Dale, te busco opciones"
]
```

### 2. GPT Formateador analiza el historial

**Input al GPT Formateador:**
```
INSTRUCCIONES:
Analiza la conversación y extrae la información sobre el libro que el usuario está buscando. 
Identifica el título del libro, la editorial (si la mencionó), y la edición (si la mencionó). 
Si el usuario dijo 'cualquiera' o 'cualquier edición', deja ese campo vacío o null.

CONVERSACIÓN:
Quiero Harry Potter 3
¿Buscas alguna editorial en particular?
Cualquiera está bien
Dale, te busco opciones

FORMATO DE SALIDA ESPERADO:
{ "titulo_libro": string, "editorial": string | null, "edicion": string | null }

EJEMPLO:
{ "titulo_libro": "Harry Potter 3", "editorial": null, "edicion": null }

Responde ÚNICAMENTE con el JSON, sin texto adicional.
```

**Output del GPT Formateador:**
```json
{
  "titulo_libro": "Harry Potter 3",
  "editorial": null,
  "edicion": null
}
```

### 3. Backend guarda variables globales
```javascript
globalVariables = {
  titulo_libro: "Harry Potter 3",
  editorial: null,
  edicion: null
}
```

### 4. Nodo WooCommerce usa las variables
```javascript
// En el nodo WooCommerce
params = {
  search: "{{titulo_libro}}", // "Harry Potter 3"
  limit: 10
}
```

---

## Ventajas de este Enfoque

1. **Separación de responsabilidades**
   - GPT Conversacional: Habla con el usuario
   - GPT Formateador: Extrae y estructura datos

2. **Configuración flexible**
   - Instrucciones personalizadas por caso de uso
   - Formato de salida específico para cada API

3. **Reutilizable**
   - Mismo patrón para WooCommerce, Stripe, Google Calendar, etc.
   - Solo cambian las instrucciones y campos esperados

4. **Debuggeable**
   - Logs claros de qué se envió al formateador
   - Fácil ver si el JSON de salida es correcto

---

## Comparación: Conversacional vs Formateador

| Aspecto | GPT Conversacional | GPT Formateador |
|---------|-------------------|-----------------|
| **Propósito** | Hablar con el usuario | Transformar datos |
| **Input** | Mensaje del usuario | Historial completo |
| **Output** | Texto natural | JSON estructurado |
| **Temperatura** | 0.7-1.0 (creativo) | 0.0-0.3 (preciso) |
| **Configuración** | Personalidad, tópicos, variables | Instrucciones de extracción, formato |
| **Guarda en historial** | Sí | No |
| **Interactúa con usuario** | Sí | No |
