# Tópicos: Frontend vs Backend - Integración

## 🔍 Situación Actual

### Frontend (GPTConfigPanel)
```typescript
// Tópicos a nivel de NODO
config.topicos: [{
  id: "topico-1",
  titulo: "Horarios",
  contenido: "Lun-Vie 9-18hs",
  keywords: ["horario", "hora"]
}]
```

**Características:**
- ✅ Editable desde UI
- ✅ Específico por nodo GPT
- ❌ NO persiste en contexto del flujo
- ❌ NO disponible para otros nodos

### Backend (FlowExecutor)
```javascript
// Tópicos a nivel de FLUJO
flow.config.topicos: {
  horarios: {
    lunes_viernes: "8:30-12:00",
    descripcion: "Atendemos de Lunes a Viernes..."
  }
}
```

**Características:**
- ✅ Disponible para TODOS los nodos
- ✅ Persiste en contexto del flujo
- ❌ NO editable desde UI (solo MongoDB)
- ✅ Accesible mediante `{{topicos.horarios.descripcion}}`

---

## 🎯 Solución Propuesta: Sistema Híbrido

### 1. Tópicos Globales (Nivel Flujo)
**Uso:** Información compartida por TODOS los nodos
**Ejemplos:** Horarios, medios de pago, políticas de la empresa
**Ubicación:** `flow.config.topicos`
**Acceso:** `{{topicos.horarios.descripcion}}`

### 2. Tópicos Locales (Nivel Nodo)
**Uso:** Información específica de un nodo GPT
**Ejemplos:** Instrucciones específicas, contexto particular
**Ubicación:** `node.data.config.topicos`
**Acceso:** `{{topicos_locales.titulo}}`

---

## 🔧 Implementación

### Backend: Merge de Tópicos

```typescript
// FlowExecutor.ts
private buildGPTPrompt(node: any, config: any): string {
  // 1. Cargar tópicos globales del flujo
  const topicosGlobales = this.topicos;
  
  // 2. Cargar tópicos locales del nodo
  const topicosLocales = config.topicos || [];
  
  // 3. Construir sección de tópicos para el prompt
  let topicosSection = '';
  
  // Tópicos globales (estructurados)
  if (Object.keys(topicosGlobales).length > 0) {
    topicosSection += '\n\nINFORMACIÓN DISPONIBLE (NO INVENTES):\n';
    topicosSection += `{{topicos.horarios.descripcion}}\n`;
    topicosSection += `{{topicos.medios_pago.descripcion}}\n`;
    // etc.
  }
  
  // Tópicos locales (del nodo)
  if (topicosLocales.length > 0) {
    topicosSection += '\n\nINFORMACIÓN ADICIONAL:\n';
    topicosLocales.forEach(topico => {
      topicosSection += `\n**${topico.titulo}:**\n${topico.contenido}\n`;
    });
  }
  
  return systemPrompt + topicosSection;
}
```

### Frontend: Indicar Tipo de Tópico

```typescript
// GPTConfigPanel.tsx
<div className={styles.section}>
  <h3>Tópicos</h3>
  
  <div className={styles.infoBox}>
    <Info size={16} />
    <span>
      <strong>Tópicos Globales:</strong> Disponibles para todos los nodos (configurados a nivel flujo)
      <br />
      <strong>Tópicos Locales:</strong> Específicos de este nodo
    </span>
  </div>
  
  {/* Mostrar tópicos globales (read-only) */}
  <div className={styles.topicosGlobales}>
    <h4>Tópicos Globales (Compartidos)</h4>
    {Object.keys(topicosGlobales).map(key => (
      <div key={key} className={styles.topicoGlobal}>
        <strong>{key}:</strong> Disponible
      </div>
    ))}
  </div>
  
  {/* Editar tópicos locales */}
  <div className={styles.topicosLocales}>
    <h4>Tópicos Locales (Solo este nodo)</h4>
    <button onClick={agregarTopico}>+ Agregar Tópico Local</button>
    {/* ... */}
  </div>
</div>
```

---

## 📋 Plan de Implementación

### Fase 1: Backend (Inmediato)
- [x] Sistema de tópicos globales implementado
- [ ] Merge de tópicos globales + locales en prompts
- [ ] Logs para debug de tópicos

### Fase 2: Frontend (Corto plazo)
- [ ] Mostrar tópicos globales (read-only)
- [ ] Mantener tópicos locales editables
- [ ] Indicar diferencia visual entre ambos

### Fase 3: Editor de Tópicos Globales (Mediano plazo)
- [ ] Panel de configuración de flujo
- [ ] Editor de tópicos globales
- [ ] Validación de estructura
- [ ] Preview de cómo se ven en prompts

---

## 🎯 Casos de Uso

### Caso 1: Información Compartida (Tópicos Globales)
```
Horarios de atención → Todos los GPT deben saber
Medios de pago → Todos los GPT deben saber
Políticas de envío → Todos los GPT deben saber
```

**Solución:** Configurar en `flow.config.topicos`

### Caso 2: Información Específica (Tópicos Locales)
```
GPT Formateador → "Extrae solo título, editorial, edición"
GPT Asistente → "Presenta productos de forma atractiva"
GPT Pedir Datos → "Pregunta de forma relajada"
```

**Solución:** Configurar en `node.data.config.topicos`

---

## ✅ Beneficios del Sistema Híbrido

1. **Flexibilidad:** Tópicos globales + locales
2. **Reutilización:** Información compartida en un solo lugar
3. **Especificidad:** Cada nodo puede tener su contexto
4. **Mantenibilidad:** Cambiar horarios una vez, afecta a todos
5. **Escalabilidad:** Agregar nuevos tópicos sin duplicar

---

## 🚀 Próximos Pasos

1. **Implementar merge de tópicos** en backend
2. **Actualizar frontend** para mostrar ambos tipos
3. **Documentar** diferencia para usuarios
4. **Crear editor visual** de tópicos globales

---

**Creado:** 2026-01-15  
**Estado:** En progreso  
**Prioridad:** Alta
