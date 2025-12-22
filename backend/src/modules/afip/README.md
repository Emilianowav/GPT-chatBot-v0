# 🧾 Módulo AFIP - Facturación Electrónica

Integración completa con los Web Services de AFIP (Argentina) para facturación electrónica en el marketplace.

## 📋 Características

- ✅ Autenticación WSAA (Web Service de Autenticación y Autorización)
- ✅ Facturación Electrónica WSFEv1
- ✅ Soporte para todos los tipos de comprobantes (Facturas A/B/C, NC, ND)
- ✅ Multi-empresa (cada empresa tiene su propia configuración)
- ✅ Renovación automática de tokens (12 horas)
- ✅ Gestión de certificados por empresa
- ✅ Frontend completo con dashboard
- ✅ API REST completa

## 🏗️ Arquitectura

```
backend/src/modules/afip/
├── config.ts                 # Configuración y constantes
├── models/
│   ├── AFIPSeller.ts        # Modelo de vendedor/empresa
│   └── AFIPInvoice.ts       # Modelo de comprobantes
├── services/
│   ├── afipAuthService.ts   # Autenticación WSAA
│   └── afipInvoicingService.ts # Facturación WSFEv1
└── routes/
    ├── sellerRoutes.ts      # Rutas de configuración
    ├── invoiceRoutes.ts     # Rutas de facturación
    └── index.ts             # Índice de rutas
```

## 🚀 Instalación

### 1. Instalar Dependencias

```bash
cd backend
npm install
```

Las dependencias necesarias ya están en `package.json`:
- `soap` - Cliente SOAP para Web Services
- `node-forge` - Firma PKCS#7 para autenticación
- `date-fns` - Manejo de fechas
- `xml2js` - Parseo de XML

### 2. Configurar Variables de Entorno

Editar `.env`:

```env
# AFIP - Facturación Electrónica
AFIP_ENVIRONMENT=testing
# testing: Homologación (pruebas)
# production: Producción (facturas reales)
```

### 3. Iniciar Backend

```bash
npm run dev
```

El módulo se montará automáticamente en `/api/modules/afip`

## 📖 Uso

### Configuración Inicial (Por Empresa)

Cada empresa debe configurar su integración con AFIP:

1. **Obtener Certificado de AFIP:**
   - Generar clave privada y CSR
   - Subir CSR a AFIP
   - Descargar certificado (.pem)
   - Autorizar servicios wsfe/wsfev1 en AFIP
   - Crear punto de venta para Web Services

2. **Configurar en el Sistema:**
   - Ir a Dashboard → Integraciones → AFIP
   - Completar formulario:
     - CUIT
     - Razón Social
     - Punto de Venta
     - Certificado (.pem)
     - Clave Privada (.key)
     - Ambiente (testing/production)
   - Guardar configuración
   - Probar autenticación

### Crear Factura

```typescript
// Desde el frontend o API
const response = await fetch('/api/modules/afip/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    empresaId: 'xxx',
    invoiceData: {
      tipoComprobante: 11,        // Factura C
      concepto: 1,                // Productos
      clienteTipoDoc: 99,         // Consumidor Final
      clienteNroDoc: 0,
      importeTotal: 1000.00,
      importeNeto: 1000.00,
      importeIVA: 0
    }
  })
});

const data = await response.json();
console.log('CAE:', data.cae);
console.log('Número:', data.numeroCompleto);
```

## 🔌 API Endpoints

### Sellers (Configuración)

**GET** `/api/modules/afip/sellers?empresaId=xxx`
- Obtiene la configuración AFIP de una empresa

**POST** `/api/modules/afip/sellers`
- Crea o actualiza la configuración AFIP
- Body: `{ empresaId, cuit, razonSocial, puntoVenta, certificado, clavePrivada, environment }`

**POST** `/api/modules/afip/sellers/:id/test-auth`
- Prueba la autenticación con AFIP

**DELETE** `/api/modules/afip/sellers/:id`
- Desactiva la configuración AFIP

### Invoices (Facturación)

**GET** `/api/modules/afip/invoices?empresaId=xxx&limit=50&offset=0`
- Lista los comprobantes de una empresa

**POST** `/api/modules/afip/invoices`
- Crea un nuevo comprobante
- Body: `{ empresaId, invoiceData }`

**GET** `/api/modules/afip/invoices/:id`
- Obtiene un comprobante por ID

**GET** `/api/modules/afip/invoices/ultimo/:tipoComprobante?empresaId=xxx`
- Obtiene el último número de comprobante

**POST** `/api/modules/afip/invoices/consultar`
- Consulta un comprobante en AFIP
- Body: `{ empresaId, tipoComprobante, puntoVenta, numero }`

**GET** `/api/modules/afip/invoices/stats/:empresaId`
- Estadísticas de facturación

## 📊 Tipos de Comprobante

| Código | Tipo |
|--------|------|
| 1 | Factura A |
| 6 | Factura B |
| 11 | Factura C |
| 3 | Nota de Crédito A |
| 8 | Nota de Crédito B |
| 13 | Nota de Crédito C |
| 2 | Nota de Débito A |
| 7 | Nota de Débito B |
| 12 | Nota de Débito C |

## 📊 Tipos de Documento

| Código | Tipo |
|--------|------|
| 80 | CUIT |
| 86 | CUIL |
| 96 | DNI |
| 99 | Consumidor Final |

## 🔐 Seguridad

- ✅ Certificados encriptados en base de datos
- ✅ Tokens renovados automáticamente cada 12 horas
- ✅ Validación de CAE en cada operación
- ✅ Logs de todas las operaciones
- ✅ Separación por empresa (multi-tenant)

## 🐛 Troubleshooting

### Error: "Token expirado"

Los tokens de AFIP tienen validez de 12 horas. El sistema los renueva automáticamente, pero si hay un error:

```bash
# Probar autenticación manualmente desde el frontend
# Dashboard → Integraciones → AFIP → Probar Autenticación
```

### Error: "Servicio no autorizado"

1. Ir a AFIP → Administrador de Relaciones
2. Verificar que wsfe/wsfev1 están autorizados
3. Esperar 5-10 minutos para propagación

### Error: "Certificado inválido"

Verificar que:
- El certificado es en formato PEM
- La clave privada corresponde al certificado
- El certificado no está vencido (válido 2 años)

## 📚 Documentación AFIP

- **Web Services:** https://www.arca.gob.ar/ws/
- **Manual WSFEv1:** https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp
- **Soporte AFIP:** 0810-999-2347

## 🎉 Estado del Módulo

✅ **Completamente funcional y listo para producción**

- Backend completo con autenticación y facturación
- Frontend con dashboard interactivo
- Multi-empresa con separación de datos
- Renovación automática de tokens
- Manejo de errores robusto
- Documentación completa

---

**Versión:** 1.0.0  
**Última actualización:** Diciembre 2025
