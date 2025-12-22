# 📋 Cómo Ver Facturas de Web Services en el Portal AFIP

## 🎯 IMPORTANTE
Las facturas creadas por **Web Services (API)** NO aparecen en "Comprobantes en Línea (RCEL)".
Se consultan en una sección diferente del portal AFIP.

---

## 🌐 MÉTODO 1: Consulta de Comprobantes Electrónicos (Recomendado)

### Paso 1: Ingresar a AFIP
1. Ir a: **https://www.afip.gob.ar**
2. Click en **"Acceso con Clave Fiscal"**
3. Ingresar CUIT: **20398632959**
4. Ingresar Clave Fiscal

### Paso 2: Buscar "Mis Comprobantes"
En el buscador del portal o en el menú principal:
- Buscar: **"Mis Comprobantes"**
- O: **"Comprobantes Electrónicos"**
- O: **"Consulta de Comprobantes Electrónicos Originales"**

### Paso 3: Seleccionar la Opción Correcta
Buscar alguna de estas opciones:
- **"Consulta de Comprobantes Electrónicos Originales"**
- **"Mis Comprobantes Electrónicos"**
- **"Régimen de Emisión de Comprobantes Electrónicos"**

### Paso 4: Filtrar por Fecha y Tipo
Una vez dentro:
- **Fecha Desde:** 20/12/2025
- **Fecha Hasta:** 20/12/2025
- **Tipo de Comprobante:** Factura C (código 11)
- Click en **"Buscar"** o **"Consultar"**

### Paso 5: Verificar Resultados
Deberías ver:
- **Factura C 0004-00000001** - CAE: 75519589963192 - $12.10
- **NC C 0004-00000001** - CAE: 75519590054017 - $12.10

---

## 🌐 MÉTODO 2: Búsqueda Directa por CAE

### Opción A: Desde el Menú Principal
1. Buscar: **"Consulta por CAE"** o **"Verificar CAE"**
2. Ingresar CAE: **75519589963192**
3. Debería mostrar todos los datos de la factura

### Opción B: Verificador Público de CAE
1. Ir a: **https://www.afip.gob.ar/sitio/externos/default.asp**
2. Buscar: **"Consulta de Comprobantes"** o **"Verificar Comprobante"**
3. Ingresar:
   - **CUIT Emisor:** 20398632959
   - **Tipo Comprobante:** Factura C (11)
   - **Punto de Venta:** 4
   - **Número:** 1
   - **CAE:** 75519589963192

---

## 🌐 MÉTODO 3: Desde Administrador de Relaciones

### Paso 1: Ir a Administrador de Relaciones
1. En AFIP, buscar: **"Administrador de Relaciones"**
2. O: **"Mis Servicios"**

### Paso 2: Buscar Facturación Electrónica
- Buscar: **"Comprobantes en línea"**
- O: **"Facturación Electrónica"**
- Seleccionar el servicio

### Paso 3: Consultar Comprobantes
- Dentro del servicio, buscar **"Consulta"** o **"Mis Comprobantes"**
- Filtrar por fecha: 20/12/2025

---

## 💻 MÉTODO 4: Desde el Módulo (Siempre Funciona)

Este es el método más confiable y rápido:

### Consultar Factura Específica
```bash
npm run consultar:comprobante 11 4 1
```

### Consultar Nota de Crédito
```bash
npm run consultar:comprobante 13 4 1
```

### Ver Todas las Facturas de Diciembre
```bash
npm run consultar:rango 20251201 20251231
```

### Ver Archivos JSON
```bash
# Ver última factura
type ultima-factura.json

# Ver última NC
type ultima-nota-credito.json

# Ver comprobante consultado
type comprobante-consultado.json
```

---

## 🖥️ MÉTODO 5: Desde el Frontend del Módulo

1. Abrir navegador en: **http://localhost:3000**
2. Ver **Dashboard** con estadísticas
3. Ver **Historial** con todas las facturas

---

## 🔍 RUTAS COMUNES EN AFIP

Dependiendo de la versión del portal, buscar:

### En el Menú Principal:
- **"Comprobantes"** → **"Consulta de Comprobantes Electrónicos"**
- **"Facturación Electrónica"** → **"Consultar Comprobantes"**
- **"Mis Comprobantes"** → **"Comprobantes Electrónicos"**
- **"Servicios"** → **"Comprobantes en línea"** → **"Consulta"**

### En el Buscador:
- "Consulta de comprobantes electrónicos"
- "Mis comprobantes electrónicos"
- "Verificar CAE"
- "Comprobantes emitidos"

---

## ⚠️ IMPORTANTE: Diferencias entre Sistemas

### RCEL (Comprobantes en Línea)
- ❌ **NO muestra** facturas de Web Services
- ✅ Solo muestra facturas del portal web
- Sistema: "Factura en Línea - Monotributo"

### Comprobantes Electrónicos Originales
- ✅ **SÍ muestra** facturas de Web Services
- ✅ Muestra facturas con CAE
- Sistema: "CAE - Monotributo" (el que usamos)

---

## 📊 Datos de tus Comprobantes

Para buscar en AFIP:

### Factura C
- **Tipo:** 11 (Factura C)
- **Punto de Venta:** 4
- **Número:** 1
- **CAE:** 75519589963192
- **Fecha:** 20/12/2025
- **Importe:** $12.10

### Nota de Crédito C
- **Tipo:** 13 (NC C)
- **Punto de Venta:** 4
- **Número:** 1
- **CAE:** 75519590054017
- **Fecha:** 20/12/2025
- **Importe:** $12.10

---

## 🎯 Si Aún No Aparecen

### Verificación desde el Módulo
```bash
# Esto SIEMPRE funciona y consulta directamente a AFIP
npm run consultar:comprobante 11 4 1
```

Si este comando muestra la factura, entonces **la factura EXISTE en AFIP**.

El problema es solo encontrar la sección correcta del portal web.

### Contactar a AFIP
Si no puedes encontrar la sección:
1. Llamar a AFIP: **0810-999-2347**
2. Preguntar: **"¿Dónde consulto comprobantes emitidos por Web Services con CAE?"**
3. Mencionar que tienes el CAE: **75519589963192**

---

## 📱 Resumen Rápido

**Para ver facturas de Web Services en AFIP:**

1. **NO buscar en:** "Comprobantes en Línea (RCEL)"
2. **SÍ buscar en:** "Consulta de Comprobantes Electrónicos Originales"
3. **O consultar desde el módulo:** `npm run consultar:comprobante 11 4 1`

**Tus facturas EXISTEN y son VÁLIDAS:**
- ✅ Tienen CAE válido
- ✅ Consultables por Web Service
- ✅ Validez fiscal completa

---

## 🔗 Links Útiles

- **Portal AFIP:** https://www.afip.gob.ar
- **Ayuda AFIP:** https://www.afip.gob.ar/ayuda/
- **Teléfono AFIP:** 0810-999-2347
- **Manual Web Services:** https://www.arca.gob.ar/ws/documentacion/ws-factura-electronica.asp

---

## 💡 Consejo Final

**El método más confiable es consultar desde el módulo:**

```bash
npm run consultar:comprobante 11 4 1
```

Esto consulta directamente a AFIP por Web Service y te muestra todos los datos del comprobante, incluyendo:
- CAE
- Fecha
- Importe
- Estado
- Todos los detalles fiscales

**Si este comando funciona, tu factura es 100% válida y existe en AFIP.**
