# ESPECIFICACIÓN: Configuración GPT desde Frontend

## 🎯 OBJETIVO
**TODO lo que el usuario ve en WhatsApp debe ser configurable desde el frontend, SIN tocar código.**

## 📋 SISTEMA ACTUAL (Backend)

### Estructura de Nodo GPT en MongoDB:
```javascript
{
  type: 'gpt',
  data: {
    label: 'OpenAI (ChatGPT, Sera...',
    config: {
      tipo: 'conversacional',
      modelo: 'gpt-3.5-turbo',
      temperatura: 0.7,
      maxTokens: 500,
      
      // NUEVO SISTEMA (3 bloques)
      personalidad: "Eres amigable, profesional...",
      topicos: [
        {
          titulo: "Especialidad en Libros",
          contenido: "Veo Veo Libros es una librería..."
        },
        {
          titulo: "Formas de Pago",
          contenido: "Aceptamos efectivo, transferencia..."
        }
      ],
      variablesRecopilar: [
        {
          nombre: "titulo",
          descripcion: "Título del libro",
          obligatoria: true
        }
      ],
      
      // LEGACY (solo para compatibilidad)
      systemPrompt: "Eres un asistente..."
    }
  }
}
```

### Cómo se construye el prompt:
```typescript
// GPTPromptBuilder.buildSystemPrompt()
const prompt = `
# PERSONALIDAD
${config.personalidad}

# INFORMACIÓN DISPONIBLE
${config.topicos.map(t => `## ${t.titulo}\n${t.contenido}`).join('\n\n')}

# VARIABLES A RECOPILAR
${config.variablesRecopilar.map(v => `- ${v.nombre}: ${v.descripcion}`).join('\n')}
`;
```

## 🎨 FRONTEND REQUERIDO

### Modal de Configuración GPT (GPTConfigModal.tsx)

#### Tabs/Secciones:
1. **General** (ya existe)
   - Modelo (GPT-4, GPT-3.5, etc.)
   - Temperatura
   - Max Tokens

2. **Personalidad** (NUEVO)
   ```tsx
   <textarea
     rows={4}
     placeholder="Ej: Eres amigable, profesional y persistente..."
     value={config.personalidad}
     onChange={(e) => setConfig({...config, personalidad: e.target.value})}
   />
   ```

3. **Tópicos** (NUEVO)
   ```tsx
   {config.topicos?.map((topico, i) => (
     <div key={i}>
       <input 
         placeholder="Título del tópico"
         value={topico.titulo}
         onChange={(e) => updateTopico(i, 'titulo', e.target.value)}
       />
       <textarea
         placeholder="Contenido del tópico"
         value={topico.contenido}
         onChange={(e) => updateTopico(i, 'contenido', e.target.value)}
       />
       <button onClick={() => removeTopico(i)}>Eliminar</button>
     </div>
   ))}
   <button onClick={addTopico}>+ Agregar Tópico</button>
   ```

4. **Variables a Recopilar** (NUEVO - solo para tipo 'conversacional')
   ```tsx
   {config.variablesRecopilar?.map((variable, i) => (
     <div key={i}>
       <input 
         placeholder="Nombre (ej: titulo)"
         value={variable.nombre}
       />
       <input 
         placeholder="Descripción"
         value={variable.descripcion}
       />
       <checkbox 
         checked={variable.obligatoria}
         label="Obligatoria"
       />
       <button onClick={() => removeVariable(i)}>Eliminar</button>
     </div>
   ))}
   <button onClick={addVariable}>+ Agregar Variable</button>
   ```

5. **System Prompt (Legacy)** (opcional, solo mostrar si existe)
   - Textarea con el systemPrompt legacy
   - Mostrar warning: "⚠️ Este es el sistema legacy. Usa Personalidad + Tópicos para mejor control."

## 📝 EJEMPLO DE USO

### Usuario configura desde Frontend:

**Personalidad:**
```
Eres amigable, profesional y persistente. Ayudas a los clientes de Librería XYZ.
```

**Tópicos:**
1. **Especialidad**
   ```
   Librería XYZ se especializa en libros técnicos y académicos.
   ```

2. **Horarios**
   ```
   Abierto de lunes a viernes de 9am a 6pm.
   ```

**Variables a Recopilar:**
- `titulo` - Título del libro - Obligatoria: ✅
- `autor` - Autor del libro - Obligatoria: ❌

### Resultado en WhatsApp:
```
Usuario: Hola
Bot: ¡Hola! Bienvenido a Librería XYZ. ¿En qué puedo ayudarte?
     Nos especializamos en libros técnicos y académicos.
```

## ✅ CRITERIOS DE ÉXITO

1. ✅ Usuario puede cambiar la personalidad del bot desde el frontend
2. ✅ Usuario puede agregar/editar/eliminar tópicos
3. ✅ Usuario puede configurar qué variables recopilar
4. ✅ Cambios se guardan en MongoDB
5. ✅ Cambios se reflejan inmediatamente en WhatsApp
6. ✅ NO se requiere tocar código para cambiar mensajes

## 🚫 NO HACER

- ❌ NO hardcodear mensajes en el código
- ❌ NO usar systemPrompt legacy para nuevos nodos
- ❌ NO requerir conocimientos técnicos para editar
- ❌ NO mezclar configuración con código

## 📦 ARCHIVOS A MODIFICAR

1. `front_crm/bot_crm/src/components/flow-builder/modals/GPTConfigModal.tsx`
   - Agregar tabs para Personalidad, Tópicos, Variables
   - Agregar funciones para agregar/editar/eliminar items

2. `front_crm/bot_crm/src/components/flow-builder/modals/GPTConfigModal.module.css`
   - Estilos para los nuevos componentes

3. Backend ya está listo:
   - `GPTPromptBuilder.ts` construye el prompt desde estos 3 bloques
   - FlowExecutor usa GPTPromptBuilder automáticamente

## 🎯 PRIORIDAD

**CRÍTICA** - El usuario NO debe ver mensajes genéricos que no puede cambiar.
