# ARQUITECTURA GPT CONVERSACIONAL - 3 BLOQUES DINÁMICOS

## 🎯 OBJETIVO
Sistema 100% configurable desde frontend para crear GPT conversacionales que:
1. Tienen personalidad definida
2. Acceden a información estática (tópicos) de forma "innata"
3. Recopilan variables dinámicas para APIs
4. Ejecutan acciones post-recopilación

---

## 📦 ESTRUCTURA DE CONFIGURACIÓN

### **BLOQUE 1: PERSONALIDAD**
```typescript
{
  personalidad: string; // Textarea libre
}
```

**Ejemplo:**
```
Eres el asistente virtual de Librería Veo Veo 📚
Tono amigable, profesional, usa emojis
Siempre saluda con entusiasmo
```

---

### **BLOQUE 2: INFORMACIÓN ESTÁTICA (TÓPICOS)**
```typescript
{
  topicos: [
    {
      id: string;
      titulo: string;
      contenido: string;
      keywords?: string[]; // Opcional: ayuda al GPT
    }
  ]
}
```

**Ejemplo:**
```json
{
  "topicos": [
    {
      "id": "horarios",
      "titulo": "Horarios del Local",
      "contenido": "Lunes a Viernes 8:30-12 y 17-21. Sábados 9-13 y 17-21",
      "keywords": ["horario", "abierto", "cerrado", "cuando"]
    },
    {
      "id": "libros-ingles",
      "titulo": "Libros de Inglés",
      "contenido": "Los libros de inglés se realizan únicamente a pedido con seña. Contactar: wa.me/5493794732177",
      "keywords": ["ingles", "english", "idioma"]
    },
    {
      "id": "promociones",
      "titulo": "Promociones Bancarias",
      "contenido": "Banco de Corrientes: Lunes y Miércoles 3 cuotas sin interés...",
      "keywords": ["promo", "descuento", "cuotas", "banco"]
    }
  ]
}
```

**Comportamiento:**
- El GPT accede a los tópicos de forma "innata" cuando el usuario pregunta
- No necesita keywords exactas, usa comprensión del lenguaje
- Tolera errores de ortografía
- Responde naturalmente con la información del tópico

---

### **BLOQUE 3: RECOPILACIÓN DE DATOS**
```typescript
{
  variablesRecopilar: [
    {
      nombre: string;
      descripcion: string;
      obligatorio: boolean;
      tipo: 'texto' | 'numero' | 'fecha' | 'email' | 'telefono';
      validacion?: {
        min?: number;
        max?: number;
        regex?: string;
        opciones?: string[];
      };
      ejemplos?: string[];
    }
  ]
}
```

**Ejemplo:**
```json
{
  "variablesRecopilar": [
    {
      "nombre": "titulo",
      "descripcion": "Título del libro",
      "obligatorio": true,
      "tipo": "texto",
      "ejemplos": ["Harry Potter", "Matemática 3"]
    },
    {
      "nombre": "editorial",
      "descripcion": "Editorial del libro",
      "obligatorio": false,
      "tipo": "texto",
      "ejemplos": ["Santillana", "Salamandra"]
    },
    {
      "nombre": "cantidad",
      "descripcion": "Cantidad de ejemplares",
      "obligatorio": true,
      "tipo": "numero",
      "validacion": {
        "min": 1,
        "max": 10
      }
    }
  ]
}
```

**Comportamiento:**
- El GPT pregunta de forma conversacional
- Valida según las reglas especificadas
- Guarda automáticamente en variables globales
- Marca cuando todas las obligatorias están completas

---

### **BLOQUE 4: ACCIONES POST-RECOPILACIÓN**
```typescript
{
  accionesCompletado: [
    {
      tipo: 'mensaje' | 'guardar_variables_globales' | 'marcar_completado' | 'ejecutar_api';
      contenido?: string;
      variables?: string[];
      token?: string;
      apiEndpoint?: string;
    }
  ]
}
```

**Ejemplo:**
```json
{
  "accionesCompletado": [
    {
      "tipo": "mensaje",
      "contenido": "Perfecto, voy a buscar: {{titulo}} - {{editorial}}"
    },
    {
      "tipo": "guardar_variables_globales",
      "variables": ["titulo", "editorial", "edicion"]
    },
    {
      "tipo": "marcar_completado",
      "token": "[INFO_COMPLETA]"
    }
  ]
}
```

**Comportamiento:**
- Se ejecutan cuando todas las variables obligatorias están completas
- `mensaje`: Envía un mensaje de confirmación
- `guardar_variables_globales`: Guarda en globalVariables (automático)
- `marcar_completado`: Agrega token para que Router detecte

---

## 🔧 GENERACIÓN AUTOMÁTICA DE SYSTEMPROMPT

El `GPTPromptBuilder` construye el systemPrompt automáticamente:

```
# PERSONALIDAD
Eres el asistente virtual de Librería Veo Veo 📚
Tono amigable, profesional, usa emojis

# INFORMACIÓN DISPONIBLE
Tienes acceso a la siguiente información para responder consultas:

## 1. Horarios del Local
Lunes a Viernes 8:30-12 y 17-21. Sábados 9-13 y 17-21
📌 Palabras clave: horario, abierto, cerrado, cuando

## 2. Libros de Inglés
Los libros de inglés se realizan únicamente a pedido con seña...
📌 Palabras clave: ingles, english, idioma

⚠️ IMPORTANTE: Accede a estos tópicos de forma natural.
No es necesario que el usuario mencione exactamente las palabras clave.

# RECOPILACIÓN DE DATOS
Tu tarea principal es recopilar los siguientes datos:

## DATOS OBLIGATORIOS:
1. **titulo** - Título del libro
   Tipo: texto
   Ejemplos: Harry Potter, Matemática 3

2. **cantidad** - Cantidad de ejemplares
   Tipo: numero
   Validación: mínimo 1, máximo 10

## DATOS OPCIONALES:
1. **editorial** - Editorial del libro
   Tipo: texto

## INSTRUCCIONES DE RECOPILACIÓN:
1. Pregunta de forma natural y conversacional
2. Si el usuario da información incompleta, pide lo que falta
3. Valida los datos según las reglas especificadas
4. Si el usuario comete errores de ortografía, interpreta su intención

# CUANDO COMPLETES LA RECOPILACIÓN:
- Envía este mensaje: "Perfecto, voy a buscar: {{titulo}} - {{editorial}}"
- Marca el final con el token: [INFO_COMPLETA]
```

---

## 🌐 VARIABLES GLOBALES AUTOMÁTICAS

Cuando el GPT recopila variables, se guardan automáticamente:

```typescript
// Usuario: "Busco Harry Potter de Salamandra"
// GPT extrae y guarda:
globalVariables = {
  titulo: "Harry Potter",
  editorial: "Salamandra"
}

// Siguiente nodo puede acceder con:
{{global.titulo}}
{{global.editorial}}
```

---

## ✅ VALIDACIONES (OPCIÓN C)

### **Validación Conversacional (GPT):**
- El GPT valida durante la conversación
- Pide correcciones si hay errores
- Tolera errores de ortografía

### **Validación Técnica (Backend):**
```typescript
// FlowExecutor valida después del GPT
const validacion = GPTPromptBuilder.validateVariables(
  globalVariables,
  config.variablesRecopilar
);

output.variables_completas = validacion.valido;
output.variables_faltantes = validacion.faltantes;
```

### **Nodo Validador Separado (Opcional):**
- Puede agregarse un nodo "Validador" después del GPT
- Valida tipos, rangos, formatos
- Redirige al GPT si falta algo

---

## 🎨 FRONTEND - PANEL DE CONFIGURACIÓN

```tsx
<GPTConfigPanel>
  {/* BLOQUE 1: PERSONALIDAD */}
  <section>
    <h3>Personalidad del Bot</h3>
    <textarea 
      placeholder="Eres el asistente virtual de..."
      value={config.personalidad}
      onChange={(e) => setConfig({...config, personalidad: e.target.value})}
    />
  </section>

  {/* BLOQUE 2: TÓPICOS */}
  <section>
    <h3>Información Estática (Tópicos)</h3>
    <p>Agrega información que el bot usará para responder preguntas</p>
    
    {config.topicos.map((topico, index) => (
      <div key={index} className="topico-item">
        <input 
          placeholder="Título (ej: Horarios del Local)"
          value={topico.titulo}
          onChange={(e) => updateTopico(index, 'titulo', e.target.value)}
        />
        <textarea 
          placeholder="Contenido (ej: Lunes a Viernes 8:30-12...)"
          value={topico.contenido}
          onChange={(e) => updateTopico(index, 'contenido', e.target.value)}
        />
        <input 
          placeholder="Palabras clave (opcional): horario, abierto, cerrado"
          value={topico.keywords?.join(', ')}
          onChange={(e) => updateTopico(index, 'keywords', e.target.value.split(','))}
        />
        <button onClick={() => eliminarTopico(index)}>🗑️ Eliminar</button>
      </div>
    ))}
    
    <button onClick={agregarTopico}>➕ Agregar Tópico</button>
  </section>

  {/* BLOQUE 3: VARIABLES */}
  <section>
    <h3>Variables a Recopilar</h3>
    <p>Define qué datos debe recopilar el bot</p>
    
    {config.variablesRecopilar.map((variable, index) => (
      <div key={index} className="variable-item">
        <input 
          placeholder="Nombre (ej: titulo)"
          value={variable.nombre}
          onChange={(e) => updateVariable(index, 'nombre', e.target.value)}
        />
        <input 
          placeholder="Descripción (ej: Título del libro)"
          value={variable.descripcion}
          onChange={(e) => updateVariable(index, 'descripcion', e.target.value)}
        />
        <select 
          value={variable.tipo}
          onChange={(e) => updateVariable(index, 'tipo', e.target.value)}
        >
          <option value="texto">Texto</option>
          <option value="numero">Número</option>
          <option value="fecha">Fecha</option>
          <option value="email">Email</option>
          <option value="telefono">Teléfono</option>
        </select>
        <label>
          <input 
            type="checkbox"
            checked={variable.obligatorio}
            onChange={(e) => updateVariable(index, 'obligatorio', e.target.checked)}
          />
          Obligatorio
        </label>
        
        {/* Validaciones */}
        {variable.tipo === 'numero' && (
          <div className="validaciones">
            <input 
              type="number"
              placeholder="Mínimo"
              value={variable.validacion?.min}
              onChange={(e) => updateValidacion(index, 'min', e.target.value)}
            />
            <input 
              type="number"
              placeholder="Máximo"
              value={variable.validacion?.max}
              onChange={(e) => updateValidacion(index, 'max', e.target.value)}
            />
          </div>
        )}
        
        <button onClick={() => eliminarVariable(index)}>🗑️ Eliminar</button>
      </div>
    ))}
    
    <button onClick={agregarVariable}>➕ Agregar Variable</button>
  </section>

  {/* BLOQUE 4: ACCIONES */}
  <section>
    <h3>Acciones al Completar</h3>
    <p>Qué hacer cuando se recopilen todos los datos</p>
    
    {config.accionesCompletado.map((accion, index) => (
      <div key={index} className="accion-item">
        <select 
          value={accion.tipo}
          onChange={(e) => updateAccion(index, 'tipo', e.target.value)}
        >
          <option value="mensaje">Enviar Mensaje</option>
          <option value="marcar_completado">Marcar Completado</option>
          <option value="guardar_variables_globales">Guardar Variables</option>
        </select>
        
        {accion.tipo === 'mensaje' && (
          <textarea 
            placeholder="Mensaje (usa {{variable}} para interpolar)"
            value={accion.contenido}
            onChange={(e) => updateAccion(index, 'contenido', e.target.value)}
          />
        )}
        
        {accion.tipo === 'marcar_completado' && (
          <input 
            placeholder="Token (ej: [INFO_COMPLETA])"
            value={accion.token}
            onChange={(e) => updateAccion(index, 'token', e.target.value)}
          />
        )}
        
        <button onClick={() => eliminarAccion(index)}>🗑️ Eliminar</button>
      </div>
    ))}
    
    <button onClick={agregarAccion}>➕ Agregar Acción</button>
  </section>
</GPTConfigPanel>
```

---

## 🚀 FLUJO DE EJECUCIÓN

```
1. Usuario envía mensaje
   ↓
2. FlowExecutor ejecuta nodo GPT
   ↓
3. GPTPromptBuilder construye systemPrompt desde 3 bloques
   ↓
4. Se envía a OpenAI con historial
   ↓
5. GPT responde (usando tópicos si es necesario)
   ↓
6. GPTPromptBuilder extrae variables de la respuesta
   ↓
7. Variables se guardan en globalVariables automáticamente
   ↓
8. Se valida si todas las obligatorias están completas
   ↓
9. Si completo: ejecutar acciones (mensaje, marcar token)
   ↓
10. Router detecta token y redirige al siguiente nodo
```

---

## 📊 EJEMPLO COMPLETO: VEO VEO

### **Configuración:**
```json
{
  "personalidad": "Eres el asistente virtual de Librería Veo Veo 📚\nTono amigable, profesional, usa emojis",
  
  "topicos": [
    {
      "id": "horarios",
      "titulo": "Horarios del Local",
      "contenido": "📍 San Juan 1037 - Corrientes Capital\n🕗 Lunes a Viernes 8:30-12 y 17-21\n🕗 Sábados 9-13 y 17-21",
      "keywords": ["horario", "abierto", "cerrado", "cuando", "donde"]
    },
    {
      "id": "libros-ingles",
      "titulo": "Libros de Inglés",
      "contenido": "Los libros de inglés se realizan únicamente a pedido con seña.\nPara realizar su pedido: wa.me/5493794732177",
      "keywords": ["ingles", "english", "idioma", "pedido"]
    }
  ],
  
  "variablesRecopilar": [
    {
      "nombre": "titulo",
      "descripcion": "Título del libro",
      "obligatorio": true,
      "tipo": "texto",
      "ejemplos": ["Harry Potter", "Matemática 3"]
    },
    {
      "nombre": "editorial",
      "descripcion": "Editorial del libro",
      "obligatorio": false,
      "tipo": "texto"
    }
  ],
  
  "accionesCompletado": [
    {
      "tipo": "mensaje",
      "contenido": "Perfecto, voy a buscar: {{titulo}} - {{editorial || 'cualquier editorial'}}"
    },
    {
      "tipo": "marcar_completado",
      "token": "[INFO_COMPLETA]"
    }
  ]
}
```

### **Conversación:**
```
Usuario: "Hola"
Bot: "¡Hola! 👋 Bienvenido a Librería Veo Veo 📚 ¿En qué puedo ayudarte?"

Usuario: "Que horario tienen?"
Bot: "📍 Estamos en San Juan 1037 - Corrientes Capital
🕗 Lunes a Viernes 8:30-12 y 17-21
🕗 Sábados 9-13 y 17-21
¿Te gustaría buscar algún libro?"

Usuario: "Si, busco ari poter"
Bot: "¿Te refieres a Harry Potter? 😊 ¿De qué editorial lo necesitas? Si no sabés, puedo buscar en todas."

Usuario: "Si, cualquiera"
Bot: "Perfecto, voy a buscar: Harry Potter - cualquier editorial [INFO_COMPLETA]"

→ Router detecta [INFO_COMPLETA]
→ Siguiente nodo: WooCommerce API con {{global.titulo}}
```

---

## ✅ VENTAJAS DEL SISTEMA

1. **100% Configurable:** Todo desde el frontend, sin tocar código
2. **Dinámico:** Agregar/eliminar tópicos y variables en tiempo real
3. **Inteligente:** GPT accede a tópicos de forma "innata"
4. **Robusto:** Validaciones en GPT + backend
5. **Escalable:** Funciona para cualquier caso de uso (ventas, soporte, reservas)
6. **Variables Globales:** Automáticas, disponibles en todo el flujo
7. **Modular:** Cada bloque es independiente

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Backend implementado (FlowExecutor + GPTPromptBuilder)
2. ⏳ Frontend: Crear panel de configuración con 3 bloques
3. ⏳ Testear con flujo Veo Veo
4. ⏳ Agregar extracción inteligente de variables (usar GPT para extraer)
5. ⏳ Implementar nodo Validador separado (opcional)
