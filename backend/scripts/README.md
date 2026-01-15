# 📋 Scripts de Utilidad - Neural Chatbot

Scripts útiles para gestión y mantenimiento del sistema.

---

## 🔍 Búsqueda y Consulta

### `buscar-contacto.js`
Busca un contacto por teléfono en la base de datos.

```bash
node scripts/buscar-contacto.js
```

**Uso:** Modificar el teléfono en el script antes de ejecutar.

---

### `listar-empresas.ts`
Lista todas las empresas registradas en el sistema.

```bash
node scripts/listar-empresas.ts
```

**Muestra:** ID, nombre, teléfono, módulos activos.

---

### `listar-chatbots.js`
Lista todos los chatbots configurados.

```bash
node scripts/listar-chatbots.js
```

**Muestra:** Empresa, nombre del bot, estado (activo/inactivo).

---

### `ver-workflow-completo.js`
Muestra la estructura completa de un workflow específico.

```bash
node scripts/ver-workflow-completo.js
```

**Uso:** Modificar el nombre de la empresa en el script.
**Muestra:** Pasos, tipos, validaciones, endpoints.

---

## 🧹 Limpieza y Mantenimiento

### `limpiar-mi-numero.js`
Limpia el estado de un contacto específico (útil para testing).

```bash
node scripts/limpiar-mi-numero.js
```

**Limpia:**
- workflowState del contacto
- conversation_states
- historial_conversaciones
- workflow_states

**Teléfono configurado:** `5493794946066`

---

### `limpiar-produccion.js`
Limpia datos de prueba en producción (usar con precaución).

```bash
node scripts/limpiar-produccion.js
```

⚠️ **PRECAUCIÓN:** Solo usar en ambiente de desarrollo o con supervisión.

---

## 👥 Gestión de Usuarios

### `crear-admin-juventus.ts`
Crea un usuario administrador para Club Juventus.

```bash
node scripts/crear-admin-juventus.ts
```

**Credenciales por defecto:**
- Email: `admin@juventus.com`
- Password: `admin123`

---

### `crear-admin-veoveo.ts`
Crea un usuario administrador para Veo Veo.

```bash
node scripts/crear-admin-veoveo.ts
```

**Credenciales por defecto:**
- Email: `admin@veoveo.com`
- Password: `admin123`

---

## 🧪 Testing y Verificación

### `test-woocommerce-veo-veo.js`
Prueba la conexión con la API de WooCommerce de Veo Veo.

```bash
node scripts/test-woocommerce-veo-veo.js
```

**Verifica:**
- Autenticación
- Listado de productos
- Categorías

---

### `test-miscanchas-api.js`
Prueba la conexión con la API de Mis Canchas (Juventus).

```bash
node scripts/test-miscanchas-api.js
```

**Verifica:**
- Autenticación
- Listado de deportes
- Disponibilidad de canchas

---

### `verificar-workflow-juventus.js`
Verifica la configuración del workflow de Juventus.

```bash
node scripts/verificar-workflow-juventus.js
```

**Muestra:** Pasos, endpoints, validaciones.

---

## 🔧 Configuración

### `analizar-base-datos.js`
Analiza el estado completo de la base de datos.

```bash
node scripts/analizar-base-datos.js
```

**Muestra:**
- Colecciones existentes
- Conteo de documentos
- Estructura de datos

---

### `check-db.js`
Verifica la conexión a la base de datos.

```bash
node scripts/check-db.js
```

**Uso:** Diagnóstico rápido de conectividad.

---

## 📝 Notas Importantes

### Variables de Entorno
Todos los scripts requieren las siguientes variables en `.env`:

```env
MONGODB_URI=mongodb://...
ENCRYPTION_KEY=your-32-character-key
META_ACCESS_TOKEN=your-meta-token
```

### Conexión a Producción
Para ejecutar scripts en producción, asegurate de que el `.env` tenga el `MONGODB_URI` de producción.

### Seguridad
- **Nunca** commitear credenciales en los scripts
- Usar variables de entorno para datos sensibles
- Los scripts de limpieza deben usarse con precaución

---

## 🗑️ Scripts Eliminados

Se eliminaron ~150 scripts obsoletos o específicos de debugging temporal. Los scripts mantenidos son:
- ✅ Útiles para múltiples empresas
- ✅ Documentados y mantenibles
- ✅ Reutilizables
- ✅ Sin hardcoded de datos específicos

---

## 💡 Crear Nuevos Scripts

Al crear nuevos scripts:

1. **Usar plantilla base:**
```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // Tu código aquí
    
    await mongoose.disconnect();
    console.log('\n✅ Completado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
```

2. **Nombrar descriptivamente:** `verbo-sustantivo-contexto.js`
3. **Documentar en este README**
4. **Evitar hardcodear datos específicos**

---

## 📞 Soporte

Para dudas sobre scripts específicos, revisar el código fuente. Cada script tiene comentarios explicativos.
