# 🚀 SCRIPTS PARA EJECUTAR EN PRODUCCIÓN

## ⚠️ IMPORTANTE
Estos scripts deben ejecutarse EN EL SERVIDOR DE PRODUCCIÓN, no en local.

---

## 📋 Scripts a Ejecutar (en orden)

### 1. Crear API Config de WooCommerce
```bash
cd backend
node scripts/crear-api-config-woocommerce-veo-veo.js
```
**Qué hace:** Crea la configuración de WooCommerce con credenciales encriptadas y actualiza el nodo.

---

### 2. Mover Tópicos a Ubicación Correcta
```bash
node scripts/mover-topicos-a-config.js
```
**Qué hace:** Mueve tópicos de `flow.topicos` a `flow.config.topicos` (requerido por FlowExecutor).

---

### 3. Actualizar Tópicos con Información Correcta
```bash
node scripts/actualizar-topicos-veo-veo-correctos.js
```
**Qué hace:** Configura horarios, libros de inglés, promociones bancarias, políticas.

---

### 4. Agregar globalVariablesOutput al Clasificador
```bash
node scripts/fix-clasificador-global-variables.js
```
**Qué hace:** Agrega `globalVariablesOutput: ["tipo_accion"]` para que el router principal pueda evaluar la condición.

---

## ✅ Verificación

Después de ejecutar todos los scripts, verificar:

1. **API Config existe:**
   ```bash
   mongo
   use chatbot
   db.api_configs.find({ empresaId: "Veo Veo" })
   ```

2. **Tópicos en ubicación correcta:**
   ```bash
   db.flows.findOne({ empresaId: "Veo Veo" }, { "config.topicos": 1 })
   ```

3. **Clasificador tiene globalVariablesOutput:**
   ```bash
   db.flows.findOne(
     { empresaId: "Veo Veo" },
     { "nodes.$": 1 }
   ).nodes.find(n => n.id === "gpt-clasificador-inteligente")
   ```

---

## 🧪 Testing

Después de ejecutar todos los scripts:

```bash
node scripts/limpiar-mi-numero.js
```

Luego testear en WhatsApp:
- "Estoy buscando harry potter"
- "¿Tienen libros de inglés?"
- "¿Hay descuentos?"

---

## 📊 Commits

- **Commit 1:** `92d07ff` - API Config y tópicos
- **Commit 2:** `066a78e` - Fix clasificador globalVariablesOutput
