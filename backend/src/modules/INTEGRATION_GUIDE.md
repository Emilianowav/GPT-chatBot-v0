# 🔗 Guía de Integración Completa: OCR + Mercado Pago + AFIP

Esta guía explica cómo usar los tres módulos juntos para automatizar procesos de facturación y cobro.

## 🎯 Casos de Uso

### 1. Flujo: Foto de Factura → Pago Automático

**Escenario:** Cliente envía foto de factura por WhatsApp → Bot procesa → Crea link de pago

```typescript
// En el chatbot (whatsappController.ts)
import { ocrToPaymentFlow } from './modules/ocr/services/ocrIntegrationService.js';

// Usuario envía imagen
if (message.type === 'image') {
  const imageBuffer = await downloadImage(message.imageUrl);
  
  // Procesar con OCR y crear pago
  const result = await ocrToPaymentFlow(
    imageBuffer,
    empresaId,
    'factura.jpg',
    'image/jpeg',
    imageBuffer.length,
    mpSellerId // ID del vendedor de MP
  );
  
  if (result.success) {
    await sendWhatsAppMessage(
      phoneNumber,
      `${result.message}\n\n💳 Paga aquí: ${result.paymentLink}`
    );
  }
}
```

### 2. Flujo: Foto de Factura → Validación AFIP

**Escenario:** Verificar autenticidad de una factura recibida

```typescript
import { processImageAndValidateAFIP } from './modules/ocr/services/ocrIntegrationService.js';

const result = await processImageAndValidateAFIP(
  imageBuffer,
  empresaId,
  'factura.jpg',
  'image/jpeg',
  imageBuffer.length
);

if (result.afipValidation?.valid) {
  console.log(`✅ Factura válida. CAE: ${result.afipValidation.cae}`);
} else {
  console.log('⚠️ No se pudo validar la factura');
}
```

### 3. Flujo: Crear Factura AFIP → Enviar por WhatsApp

**Escenario:** Emitir factura electrónica y enviarla al cliente

```typescript
import { crearComprobante } from './modules/afip/services/afipInvoicingService.js';

// 1. Crear factura en AFIP
const invoice = await crearComprobante(sellerId, {
  tipoComprobante: 11, // Factura C
  concepto: 1,
  clienteTipoDoc: 99,
  clienteNroDoc: 0,
  importeTotal: 1000,
  importeNeto: 1000,
  importeIVA: 0
});

// 2. Enviar por WhatsApp
await sendWhatsAppMessage(
  clientPhone,
  `✅ Factura emitida\n\n` +
  `Número: ${invoice.numeroCompleto}\n` +
  `CAE: ${invoice.cae}\n` +
  `Vencimiento: ${invoice.caeVencimiento}\n` +
  `Total: $${invoice.invoice.importeTotal}`
);
```

### 4. Flujo Completo: OCR → AFIP → MP

**Escenario:** Cliente envía foto → Sistema valida → Emite factura → Crea pago

```typescript
// 1. Procesar imagen con OCR
const ocrResult = await processImageAndCreatePayment(
  imageBuffer,
  empresaId,
  'factura.jpg',
  'image/jpeg',
  imageBuffer.length
);

// 2. Emitir factura en AFIP con los datos extraídos
const afipInvoice = await crearComprobante(sellerId, {
  tipoComprobante: 11,
  concepto: 1,
  clienteTipoDoc: 99,
  clienteNroDoc: 0,
  importeTotal: ocrResult.paymentData.amount,
  importeNeto: ocrResult.paymentData.amount,
  importeIVA: 0
});

// 3. Crear link de pago en MP
const mpPayment = await createPaymentLink({
  sellerId: mpSellerId,
  title: `Factura ${afipInvoice.numeroCompleto}`,
  unitPrice: ocrResult.paymentData.amount,
  description: `CAE: ${afipInvoice.cae}`
});

// 4. Enviar todo al cliente
await sendWhatsAppMessage(
  clientPhone,
  `✅ Factura procesada\n\n` +
  `📄 Número: ${afipInvoice.numeroCompleto}\n` +
  `🔐 CAE: ${afipInvoice.cae}\n` +
  `💰 Total: $${ocrResult.paymentData.amount}\n\n` +
  `💳 Paga aquí: ${mpPayment.init_point}`
);
```

## 🛠️ Configuración

### 1. Configurar Mercado Pago

```bash
# Frontend
1. Ir a /dashboard/integraciones
2. Click en "Conectar con Mercado Pago"
3. Autorizar la aplicación
4. Listo ✅
```

### 2. Configurar AFIP

```bash
# Frontend
1. Ir a /dashboard/integraciones/afip
2. Seguir la guía paso a paso (5 pasos)
3. Subir certificados
4. Probar autenticación
5. Listo ✅
```

### 3. Usar OCR

```bash
# Frontend
1. Ir a /dashboard/integraciones/ocr
2. Arrastrar imagen de factura
3. Procesar
4. Revisar datos extraídos
5. Listo ✅
```

## 📡 API Endpoints

### OCR

```bash
# Procesar imagen
POST /api/modules/ocr/process
Content-Type: multipart/form-data
Body: { file, empresaId }

# Listar documentos
GET /api/modules/ocr/documents?empresaId=xxx

# Obtener documento
GET /api/modules/ocr/documents/:id

# Estadísticas
GET /api/modules/ocr/stats/:empresaId
```

### AFIP

```bash
# Configurar seller
POST /api/modules/afip/sellers
Body: { empresaId, cuit, razonSocial, puntoVenta, certificado, clavePrivada }

# Crear factura
POST /api/modules/afip/invoices
Body: { empresaId, invoiceData }

# Listar facturas
GET /api/modules/afip/invoices?empresaId=xxx

# Estadísticas
GET /api/modules/afip/invoices/stats/:empresaId
```

### Mercado Pago

```bash
# Crear link de pago
POST /api/modules/mercadopago/payment-links
Body: { sellerId, title, unitPrice, description }

# Listar links
GET /api/modules/mercadopago/payment-links?sellerId=xxx

# Crear suscripción
POST /api/modules/mercadopago/subscriptions
Body: { sellerId, planData }
```

## 🤖 Integración con Chatbots

### Ejemplo: Bot de Facturación

```typescript
// whatsappController.ts
import { ocrToPaymentFlow, getOCRSummaryForChatbot } from './modules/ocr/services/ocrIntegrationService.js';

// Cuando el usuario envía una imagen
if (message.type === 'image') {
  // Mostrar mensaje de procesamiento
  await sendWhatsAppMessage(phoneNumber, '⏳ Procesando imagen...');
  
  // Procesar con OCR
  const imageBuffer = await downloadImage(message.imageUrl);
  const result = await ocrToPaymentFlow(
    imageBuffer,
    empresaId,
    'factura.jpg',
    'image/jpeg',
    imageBuffer.length,
    mpSellerId
  );
  
  if (result.success) {
    // Obtener resumen formateado
    const summary = await getOCRSummaryForChatbot(result.ocrDocument._id);
    
    // Enviar resumen + link de pago
    await sendWhatsAppMessage(
      phoneNumber,
      `${summary}\n\n💳 Paga aquí: ${result.paymentLink}`
    );
  } else {
    await sendWhatsAppMessage(phoneNumber, result.message);
  }
}
```

### Ejemplo: Bot de Validación AFIP

```typescript
// Validar factura recibida
if (message.text?.toLowerCase().includes('validar factura')) {
  await sendWhatsAppMessage(phoneNumber, '📸 Envía una foto de la factura');
  
  // Esperar imagen
  // ... (lógica de espera)
  
  // Cuando llega la imagen
  const result = await processImageAndValidateAFIP(
    imageBuffer,
    empresaId,
    'factura.jpg',
    'image/jpeg',
    imageBuffer.length
  );
  
  if (result.afipValidation?.valid) {
    await sendWhatsAppMessage(
      phoneNumber,
      `✅ Factura válida\n\nCAE: ${result.afipValidation.cae}`
    );
  } else {
    await sendWhatsAppMessage(
      phoneNumber,
      '⚠️ No se pudo validar la factura'
    );
  }
}
```

## 🔄 Flujos Automatizados

### Flujo 1: Cobro Automático

```
1. Cliente envía foto de factura
2. OCR extrae datos (total, número, etc.)
3. Sistema crea link de pago en MP
4. Bot envía link al cliente
5. Cliente paga
6. Webhook de MP notifica
7. Sistema actualiza estado
```

### Flujo 2: Facturación Automática

```
1. Cliente solicita factura
2. Bot pregunta datos (CUIT, monto, etc.)
3. Sistema emite factura en AFIP
4. Bot envía factura al cliente
5. Opcionalmente, crea link de pago
```

### Flujo 3: Validación y Pago

```
1. Cliente envía foto de factura
2. OCR extrae datos
3. Sistema valida con AFIP (si tiene CAE)
4. Si es válida, crea link de pago
5. Cliente paga
6. Sistema registra todo
```

## 📊 Monitoreo

### Dashboard de Integraciones

```
/dashboard/integraciones
├── Mercado Pago (conectado/desconectado)
├── AFIP (configurado/no configurado)
└── OCR (estadísticas de uso)
```

### Estadísticas Disponibles

**OCR:**
- Total de documentos procesados
- Confianza promedio
- Tiempo de procesamiento promedio

**AFIP:**
- Total de facturas emitidas
- Notas de crédito/débito
- Facturación del mes

**Mercado Pago:**
- Links de pago creados
- Pagos recibidos
- Suscripciones activas

## 🚀 Próximos Pasos

1. **Configurar los 3 módulos** en el marketplace
2. **Probar cada módulo** individualmente
3. **Integrar en chatbots** usando los helpers
4. **Automatizar flujos** según tus necesidades
5. **Monitorear resultados** en el dashboard

## 📞 Soporte

- **Documentación AFIP:** Ver `backend/src/modules/afip/README.md`
- **Documentación OCR:** Ver `backend/src/modules/ocr/README.md`
- **Documentación MP:** Ver `backend/src/modules/mercadopago/README.md`

---

**¡Todo listo para automatizar tu negocio!** 🎉
