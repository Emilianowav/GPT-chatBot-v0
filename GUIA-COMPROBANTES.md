# Guía de Gestión de Comprobantes - Módulo AFIP

## 📋 Funcionalidades Implementadas

El módulo AFIP ahora incluye gestión completa de comprobantes:

- ✅ Crear Facturas (A, B, C)
- ✅ Crear Notas de Crédito (A, B, C)
- ✅ Crear Notas de Débito (A, B, C)
- ✅ Consultar Comprobantes Existentes
- ✅ Obtener Último Número de Comprobante

---

## 🚀 Comandos Disponibles

### 1. Crear Factura

```bash
npm run test:factura
```

Crea una Factura B de prueba con:
- Importe: $121.00 (IVA incluido)
- Cliente: Consumidor Final
- Concepto: Productos

**Resultado:** Genera `ultima-factura.json` con los datos del comprobante.

---

### 2. Consultar Comprobante

```bash
# Consultar la última factura creada
npm run consultar:comprobante

# Consultar un comprobante específico
node consultar-comprobante.js [tipo] [puntoVenta] [numero]

# Ejemplo: Consultar Factura B, PV 1, Nro 2
node consultar-comprobante.js 6 1 2
```

**Tipos de Comprobante:**
- `1` = Factura A
- `6` = Factura B
- `11` = Factura C
- `3` = Nota de Crédito A
- `8` = Nota de Crédito B
- `13` = Nota de Crédito C
- `2` = Nota de Débito A
- `7` = Nota de Débito B
- `12` = Nota de Débito C

**Resultado:** Muestra todos los datos del comprobante y genera `comprobante-consultado.json`.

---

### 3. Obtener Último Número

```bash
# Consultar último número de Factura B en PV 1
npm run consultar:ultimo

# Consultar otro tipo de comprobante
node ultimo-comprobante.js [tipo] [puntoVenta]

# Ejemplo: Último número de NC B en PV 1
node ultimo-comprobante.js 8 1
```

**Resultado:** Muestra el último número autorizado y el próximo disponible.

---

### 4. Crear Nota de Crédito

```bash
# Crear NC para la última factura emitida
npm run crear:nc
```

**Requisitos:**
- Debe existir `ultima-factura.json`
- Token válido en `token.txt` y `sign.txt`

**Funcionamiento:**
- Crea una NC del mismo tipo que la factura (Factura B → NC B)
- Asocia automáticamente la NC a la factura original
- Usa el mismo importe que la factura

**Resultado:** Genera `ultima-nota-credito.json` con el CAE obtenido.

---

### 5. Crear Nota de Débito

```bash
# Crear ND con importe adicional de $50
npm run crear:nd

# Crear ND con importe personalizado
node crear-nota-debito.js [importe]

# Ejemplo: ND de $100
node crear-nota-debito.js 100
```

**Requisitos:**
- Debe existir `ultima-factura.json`
- Token válido

**Funcionamiento:**
- Crea una ND del mismo tipo que la factura
- Asocia automáticamente la ND a la factura original
- Calcula IVA 21% sobre el importe adicional

**Resultado:** Genera `ultima-nota-debito.json` con el CAE obtenido.

---

## 📊 Flujo de Trabajo Completo

### Ejemplo: Facturar y luego anular con NC

```bash
# 1. Autenticarse
npm run test:auth

# 2. Crear factura
npm run test:factura
# Resultado: Factura B #2 - CAE: 75519302051937

# 3. Consultar la factura creada
npm run consultar:comprobante
# Verifica que la factura existe en AFIP

# 4. Crear Nota de Crédito (anular)
npm run crear:nc
# Resultado: NC B #1 - CAE: 75519302052221
```

### Ejemplo: Facturar y agregar cargo con ND

```bash
# 1. Crear factura
npm run test:factura

# 2. Crear ND por $50 adicionales
npm run crear:nd
# Resultado: ND B #1 con importe adicional
```

---

## 🔍 Información Detallada de Consultas

### Consultar Comprobante

Muestra información completa:

- **Información General:** Tipo, número, fecha, estado
- **Importes:** Total, neto, IVA, tributos, exentos
- **Receptor:** Tipo y número de documento
- **Moneda:** Código y cotización
- **Autorización:** CAE, tipo de emisión, vencimiento
- **Detalle IVA:** Todas las alícuotas aplicadas
- **Tributos:** Detalle de tributos (IIBB, etc)
- **Comprobantes Asociados:** NC/ND vinculadas
- **Observaciones:** Mensajes de AFIP

### Obtener Último Número

Útil para:
- Verificar el próximo número disponible antes de facturar
- Validar secuencia de numeración
- Consultar estado de diferentes tipos de comprobantes

---

## 💡 Tips y Mejores Prácticas

### 1. Notas de Crédito

**Cuándo usar:**
- Anular una factura
- Corregir errores en importes
- Devoluciones de mercadería
- Descuentos posteriores a la facturación

**Importante:**
- La NC debe ser del mismo tipo que la factura (B → B, A → A)
- Siempre debe asociarse a un comprobante original
- El importe no puede superar el de la factura original

### 2. Notas de Débito

**Cuándo usar:**
- Agregar cargos adicionales
- Intereses por mora
- Gastos no incluidos en la factura original
- Ajustes de precio

**Importante:**
- La ND debe ser del mismo tipo que la factura
- Debe asociarse al comprobante original
- Genera un nuevo importe a cobrar

### 3. Consultas

**Recomendaciones:**
- Consultar comprobantes antes de crear NC/ND
- Verificar último número antes de facturar manualmente
- Guardar los JSON generados como respaldo

---

## 🔐 Seguridad

### Tokens de Acceso

Los tokens duran **12 horas**. Si obtienes error de autenticación:

```bash
npm run test:auth
```

### Certificados

Los certificados de testing son válidos por **2 años**. Verifica la fecha de vencimiento en WSASS.

---

## 📁 Archivos Generados

| Archivo | Descripción |
|---------|-------------|
| `ultima-factura.json` | Última factura creada |
| `ultima-nota-credito.json` | Última NC creada |
| `ultima-nota-debito.json` | Última ND creada |
| `comprobante-consultado.json` | Último comprobante consultado |
| `token.txt` | Token de acceso AFIP |
| `sign.txt` | Firma de acceso AFIP |

---

## 🐛 Solución de Problemas

### Error: "No se encontraron credenciales"

```bash
npm run test:auth
```

### Error: "Comprobante no encontrado"

Verifica que el tipo, punto de venta y número sean correctos.

### Error: "No se encontró ultima-factura.json"

Primero crea una factura:

```bash
npm run test:factura
```

### Error: "Comprobante asociado no válido"

Verifica que la factura original exista y esté aprobada.

---

## 📚 Documentación Adicional

- **Manual WSFEv1:** `manual.md`
- **Guía de Testing:** `GUIA-TESTING.md`
- **Instalación:** `INSTALACION.md`
- **Desarrollo:** `DESARROLLO.md`

---

## 🎯 Próximos Pasos

Una vez que domines estas funcionalidades, puedes:

1. **Integrar en Next.js** - Crear API Routes con esta lógica
2. **Crear UI** - Formularios React para cada operación
3. **Agregar validaciones** - Validar datos antes de enviar a AFIP
4. **Implementar CAEA** - Sistema de autorización anticipada
5. **Facturación avanzada** - Múltiples alícuotas, tributos, moneda extranjera

---

## ✅ Checklist de Funcionalidades

- [x] Autenticación WSAA
- [x] Crear Facturas B
- [x] Consultar Comprobantes
- [x] Obtener Último Número
- [x] Crear Notas de Crédito
- [x] Crear Notas de Débito
- [ ] Facturas A y C
- [ ] Múltiples alícuotas de IVA
- [ ] Tributos (IIBB)
- [ ] Moneda extranjera
- [ ] Facturas de Crédito Electrónica (FCE)
- [ ] CAEA

---

**¡El módulo está listo para gestión completa de comprobantes!** 🎉
