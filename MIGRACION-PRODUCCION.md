# 🚀 Migración a Producción - Guía Rápida

## ✅ Cambios Realizados

El módulo ha sido configurado para **ambiente de producción**. Los cambios incluyen:

### 1. Configuración
- ✅ `config.js` → `environment: 'production'`
- ✅ URLs cambiadas a producción:
  - WSAA: `https://wsaa.afip.gov.ar/ws/services/LoginCms`
  - WSFEv1: `https://servicios1.afip.gov.ar/wsfev1/service.asmx`

### 2. Frontend
- ✅ Indicador visual de PRODUCCIÓN (rojo pulsante)
- ✅ Advertencias en formularios
- ✅ Mensajes de precaución

### 3. Scripts
- ✅ Nuevo script de verificación: `npm run verificar:produccion`

---

## ⚠️ ANTES DE CONTINUAR

**IMPORTANTE:** Los certificados de testing NO funcionan en producción.

Debes obtener certificados de producción de AFIP siguiendo la guía:
📚 **`CERTIFICADOS-PRODUCCION.md`**

---

## 🔧 Pasos para Usar en Producción

### Paso 1: Verificar Configuración

```bash
npm run verificar:produccion
```

Este script verifica:
- ✅ Ambiente configurado
- ✅ URLs correctas
- ✅ Certificados presentes
- ✅ CUIT configurado
- ✅ Credenciales válidas

### Paso 2: Obtener Certificados de Producción

**Si aún tienes certificados de testing:**

1. Lee la guía completa: `CERTIFICADOS-PRODUCCION.md`
2. Genera nuevo CSR: `npm run generar:certs`
3. Sube CSR a AFIP (producción)
4. Autoriza servicios: `wsfe` y `wsfev1`
5. Descarga certificado de producción
6. Guarda en `certs/certificado.pem`

### Paso 3: Actualizar CUIT

Edita `config.js`:

```javascript
cuit: process.env.AFIP_CUIT || 'TU_CUIT_REAL',
```

O usa variable de entorno:

```bash
set AFIP_CUIT=20398632959
```

### Paso 4: Autenticarse

```bash
npm run test:auth
```

**Resultado esperado:**
```
✅ Autenticación exitosa
Token guardado en: token.txt
```

**Si hay error:**
- Verifica que el certificado sea de producción
- Verifica que hayas autorizado los servicios en AFIP
- Verifica que el CUIT sea correcto

### Paso 5: Probar Facturación

⚠️ **ADVERTENCIA:** Esto creará una factura REAL

```bash
npm run test:factura
```

### Paso 6: Verificar en AFIP

1. Ingresa a https://www.afip.gob.ar
2. Comprobantes en línea → Consultar comprobantes
3. Busca la factura por CAE o número
4. Debe aparecer en el sistema

---

## 🖥️ Usar el Frontend

### Iniciar Frontend

```bash
cd frontend
npm run dev
```

Abre: http://localhost:3000

### Indicadores de Producción

- 🔴 **Indicador rojo pulsante** en sidebar
- ⚠️ **Advertencias** en formularios
- 📢 **Mensajes de precaución** antes de crear facturas

---

## 🔄 Volver a Testing

Si necesitas volver a testing:

### 1. Cambiar Configuración

Edita `config.js`:

```javascript
environment: process.env.AFIP_ENVIRONMENT || 'testing',
```

### 2. Usar Certificados de Testing

Asegúrate de tener los certificados de testing en `certs/`

### 3. Actualizar Frontend

Edita `frontend/components/Sidebar.tsx`:

```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-3">
  <div className="flex items-center gap-2 text-green-700">
    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
    <span className="text-sm font-medium">AFIP Conectado</span>
  </div>
  <p className="text-xs text-green-600 mt-1">Testing Environment</p>
</div>
```

### 4. Reiniciar

```bash
npm run test:auth
```

---

## 📊 Diferencias Clave

| Aspecto | Testing | Producción |
|---------|---------|------------|
| **Facturas** | Sin validez | ✅ **Validez fiscal real** |
| **CAE** | De prueba | ✅ **CAE legal** |
| **Datos** | Ficticios OK | ❌ **Deben ser reales** |
| **CUIT Cliente** | Puede ser 0 | ❌ **Debe ser válido** |
| **Consulta AFIP** | No aparecen | ✅ **Aparecen en sistema** |
| **Certificados** | Testing | ✅ **Producción** |
| **URLs** | *homo.afip.gov.ar | ✅ **afip.gov.ar** |

---

## ⚠️ Precauciones

### 1. Datos Reales
- ✅ Usa CUIT reales de clientes
- ✅ Usa importes correctos
- ✅ Verifica datos antes de enviar

### 2. Punto de Venta
- ✅ Debe estar habilitado en AFIP
- ✅ Usa el número correcto
- ✅ No uses puntos de venta de testing

### 3. Certificados
- ✅ Guarda backup de certificados
- ✅ Protege la clave privada
- ✅ Renueva antes de vencer (2 años)

### 4. Tokens
- ✅ Expiran cada 12 horas
- ✅ Re-autentícate cuando sea necesario
- ✅ No compartas tokens

---

## 🐛 Solución de Problemas

### "Certificado no autorizado"

```bash
# 1. Verificar servicios autorizados en AFIP
# 2. Autorizar: wsfe y wsfev1
# 3. Reintentar autenticación
npm run test:auth
```

### "CUIT no válido"

```bash
# 1. Verificar CUIT en config.js
# 2. Verificar que esté activo en AFIP
# 3. Verificar facturación electrónica habilitada
```

### "Punto de venta no habilitado"

```bash
# 1. AFIP → Comprobantes en línea
# 2. Administración → Puntos de Venta
# 3. Habilitar punto de venta
# 4. Actualizar config.js
```

### "Token expirado"

```bash
npm run test:auth
```

---

## 📞 Soporte

### AFIP
- Web: https://www.afip.gob.ar
- Tel: 0810-999-2347
- Chat: En sitio web

### Documentación
- `CERTIFICADOS-PRODUCCION.md` - Certificados
- `GUIA-COMPROBANTES.md` - Gestión de comprobantes
- `RESUMEN-FUNCIONALIDADES.md` - Todas las funcionalidades
- `manual.md` - Manual WSFEv1 v4.1

---

## ✅ Checklist Final

Antes de usar en producción:

- [ ] Certificados de producción obtenidos
- [ ] Servicios autorizados en AFIP (wsfe, wsfev1)
- [ ] CUIT actualizado en config.js
- [ ] Punto de venta habilitado
- [ ] Verificación ejecutada: `npm run verificar:produccion`
- [ ] Autenticación exitosa: `npm run test:auth`
- [ ] Factura de prueba creada y verificada en AFIP
- [ ] Frontend probado
- [ ] Backup de certificados realizado
- [ ] Equipo informado sobre ambiente de producción

---

## 🎯 Próximos Pasos

1. ✅ Ejecutar: `npm run verificar:produccion`
2. ✅ Obtener certificados de producción (si no los tienes)
3. ✅ Autenticarse: `npm run test:auth`
4. ✅ Crear factura de prueba
5. ✅ Verificar en AFIP
6. ✅ Usar frontend: `cd frontend && npm run dev`
7. ✅ Integrar en tu sistema

---

**¡El módulo está configurado para producción!** 🚀

**RECUERDA:** Las facturas en producción son reales y tienen validez fiscal.
