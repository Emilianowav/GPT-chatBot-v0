# 🚀 Guía de Configuración AFIP

Guía paso a paso para configurar la integración con AFIP en el marketplace.

## 📋 Requisitos Previos

1. **Clave Fiscal AFIP** nivel 3 o superior
2. **CUIT** del contribuyente
3. **OpenSSL** instalado (para generar certificados)
4. Acceso al **Administrador de Relaciones** de AFIP

## 🔧 Paso 1: Generar Certificados

### En Windows

```powershell
# Instalar OpenSSL desde: https://slproweb.com/products/Win32OpenSSL.html

# Generar clave privada
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" genrsa -out privada.key 2048

# Generar CSR (Certificate Signing Request)
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" req -new -key privada.key -out certificado.csr -subj "/C=AR/O=TU_EMPRESA/CN=TU_CUIT/serialNumber=CUIT TU_CUIT"
```

### En Linux/Mac

```bash
# Generar clave privada
openssl genrsa -out privada.key 2048

# Generar CSR
openssl req -new -key privada.key -out certificado.csr -subj "/C=AR/O=TU_EMPRESA/CN=TU_CUIT/serialNumber=CUIT TU_CUIT"
```

**Importante:** Reemplaza `TU_EMPRESA` y `TU_CUIT` con tus datos reales.

## 🌐 Paso 2: Subir CSR a AFIP

1. Ingresar a AFIP con Clave Fiscal
2. Ir a **Administrador de Relaciones de Clave Fiscal**
3. Seleccionar **Nueva Relación**
4. Buscar **Certificados Digitales**
5. Hacer clic en **Generar Nuevo Certificado**
6. Copiar el contenido de `certificado.csr` y pegarlo
7. Hacer clic en **Generar**
8. Descargar el certificado generado (archivo `.crt`)

## 🔐 Paso 3: Convertir Certificado a PEM

```bash
# Si el certificado descargado es .crt, convertirlo a .pem
openssl x509 -in certificado.crt -out certificado.pem -outform PEM
```

## ✅ Paso 4: Autorizar Servicios en AFIP

1. En AFIP, ir a **Administrador de Relaciones**
2. Buscar tu empresa
3. Hacer clic en **Administrar Relaciones**
4. Buscar y autorizar:
   - **wsfe** (Web Service Facturación Electrónica)
   - **wsfev1** (Web Service Facturación Electrónica v1)
5. Guardar cambios
6. **Esperar 5-10 minutos** para que se propaguen los cambios

## 📊 Paso 5: Crear Punto de Venta

1. En AFIP, ir a **Comprobantes en línea**
2. Seleccionar **Administración de Puntos de Venta**
3. Hacer clic en **Nuevo Punto de Venta**
4. Seleccionar **Web Services**
5. Anotar el número de punto de venta asignado (ej: 4)

## 💻 Paso 6: Configurar en el Sistema

### Backend

1. Verificar que las dependencias estén instaladas:
```bash
cd backend
npm install
```

2. Configurar `.env`:
```env
AFIP_ENVIRONMENT=testing
```

3. Iniciar backend:
```bash
npm run dev
```

### Frontend

1. Acceder al dashboard: `http://localhost:3001/dashboard/integraciones/afip`

2. Completar el formulario:
   - **CUIT:** Tu CUIT (ej: 20398632959)
   - **Razón Social:** Nombre de tu empresa
   - **Punto de Venta:** El número asignado por AFIP (ej: 4)
   - **Ambiente:** Testing (para pruebas) o Production (para facturas reales)
   - **Certificado:** Subir el archivo `certificado.pem`
   - **Clave Privada:** Subir el archivo `privada.key`

3. Hacer clic en **Guardar Configuración**

4. Hacer clic en **🔐 Probar Autenticación**

Si todo está correcto, verás: ✅ Autenticación exitosa con AFIP

## 🧾 Paso 7: Crear Primera Factura de Prueba

1. Ir a la pestaña **Nueva Factura**

2. Completar:
   - **Tipo de Comprobante:** Factura C
   - **Concepto:** Productos
   - **Tipo de Documento Cliente:** Consumidor Final
   - **Número de Documento:** 0
   - **Importe Total:** 100.00

3. Hacer clic en **📄 Crear Comprobante**

Si todo está correcto, verás el CAE (Código de Autorización Electrónico) generado.

## 🔄 Paso 8: Migrar a Producción

Cuando estés listo para emitir facturas reales:

1. **Generar nuevos certificados** (los de testing no sirven para producción)
2. **Autorizar servicios** en producción
3. **Crear punto de venta** en producción
4. **Actualizar configuración:**
   - Cambiar ambiente a **Production**
   - Subir certificados de producción
   - Actualizar punto de venta

5. **Cambiar variable de entorno:**
```env
AFIP_ENVIRONMENT=production
```

6. **Reiniciar backend**

## ⚠️ Consideraciones Importantes

### Testing vs Production

- **Testing (Homologación):**
  - Para pruebas
  - No genera facturas reales
  - Certificados diferentes
  - URLs diferentes

- **Production:**
  - Facturas reales válidas
  - Certificados de producción
  - Impacto fiscal real

### Certificados

- **Validez:** 2 años
- **Renovación:** Generar nuevos certificados antes del vencimiento
- **Seguridad:** Nunca compartir la clave privada

### Tokens

- **Validez:** 12 horas
- **Renovación:** Automática por el sistema
- **Error común:** Si el token expira, el sistema lo renueva automáticamente

### Puntos de Venta

- **Web Services:** Usar puntos de venta específicos para Web Services
- **No aparecen en portal:** Los comprobantes de Web Services no aparecen en "Comprobantes en Línea"
- **Consulta:** Usar la API del sistema o Web Services de AFIP para consultar

## 🐛 Solución de Problemas

### "Error al autenticar con WSAA"

**Causas posibles:**
- Certificado o clave privada incorrectos
- Certificado vencido
- Formato de archivo incorrecto (debe ser PEM)

**Solución:**
1. Verificar que el certificado sea válido
2. Verificar que la clave privada corresponda al certificado
3. Regenerar certificados si es necesario

### "Servicio no autorizado"

**Causas posibles:**
- Servicios wsfe/wsfev1 no autorizados en AFIP
- Cambios recientes no propagados

**Solución:**
1. Verificar autorización en Administrador de Relaciones
2. Esperar 5-10 minutos
3. Reintentar

### "Punto de venta inválido"

**Causas posibles:**
- Punto de venta no creado
- Punto de venta no es de Web Services

**Solución:**
1. Crear punto de venta para Web Services en AFIP
2. Usar el número correcto en la configuración

### "CAE no generado"

**Causas posibles:**
- Datos del comprobante incorrectos
- Importes inválidos
- Cliente sin CUIT cuando es obligatorio

**Solución:**
1. Revisar observaciones de AFIP en la respuesta
2. Corregir datos según indicaciones
3. Reintentar

## 📞 Soporte

### AFIP
- **Teléfono:** 0810-999-2347
- **Web:** https://www.afip.gob.ar
- **Documentación:** https://www.arca.gob.ar/ws/

### Sistema
- Revisar logs del backend
- Verificar configuración en base de datos
- Consultar documentación del módulo

## ✅ Checklist de Configuración

- [ ] OpenSSL instalado
- [ ] Clave privada generada
- [ ] CSR generado
- [ ] Certificado descargado de AFIP
- [ ] Certificado convertido a PEM
- [ ] Servicios wsfe/wsfev1 autorizados
- [ ] Punto de venta creado
- [ ] Configuración guardada en el sistema
- [ ] Autenticación probada exitosamente
- [ ] Primera factura de prueba creada
- [ ] CAE obtenido correctamente

---

**¡Listo!** Tu integración con AFIP está configurada y funcionando.
