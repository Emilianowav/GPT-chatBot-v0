# 🔌 GUÍA DE INTEGRACIÓN CON OTROS SISTEMAS

## 📋 Índice

1. [Arquitecturas de Integración](#arquitecturas-de-integración)
2. [Integración con ERP](#integración-con-erp)
3. [Integración con CRM](#integración-con-crm)
4. [Integración con E-commerce](#integración-con-e-commerce)
5. [Ejemplos de Código](#ejemplos-de-código)
6. [Base de Datos](#base-de-datos)
7. [Sincronización](#sincronización)

---

## 1. ARQUITECTURAS DE INTEGRACIÓN

### 1.1 Arquitectura REST API (Recomendada)

```
┌─────────────────────────────────────────────────────────┐
│                    TU SISTEMA                           │
│  (ERP / CRM / E-commerce / Sistema Personalizado)      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ HTTP REST API
                       │ (JSON)
                       │
┌──────────────────────▼──────────────────────────────────┐
│              MÓDULO AFIP - API SERVER                   │
│                  (Express.js)                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  POST /api/facturas                              │  │
│  │  POST /api/notas-credito                         │  │
│  │  GET  /api/comprobantes/:tipo/:pv/:numero        │  │
│  │  GET  /api/comprobantes/ultimo                   │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ SOAP Web Services
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   AFIP PRODUCCIÓN                       │
│              (Web Services WSAA/WSFEv1)                 │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Arquitectura Microservicios

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │    │   Backend    │    │   Módulo     │
│   (React/    │───▶│   (API)      │───▶│   AFIP       │
│    Vue/etc)  │    │              │    │   (Docker)   │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                                │
                                                │
                                        ┌───────▼───────┐
                                        │     AFIP      │
                                        └───────────────┘
```

### 1.3 Arquitectura Event-Driven

```
┌──────────────┐         ┌──────────────┐
│  Tu Sistema  │────────▶│  Message     │
│              │  Event  │  Queue       │
└──────────────┘         │  (RabbitMQ/  │
                         │   Kafka)     │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │  Módulo AFIP │
                         │  (Consumer)  │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │     AFIP     │
                         └──────────────┘
```

---

## 2. INTEGRACIÓN CON ERP

### 2.1 Flujo de Integración

```
ERP: Crear Venta
    │
    ├─▶ Validar datos
    │
    ├─▶ Llamar API Módulo AFIP
    │   POST /api/facturas
    │
    ├─▶ Recibir CAE
    │
    ├─▶ Guardar CAE en ERP
    │
    └─▶ Imprimir/Enviar Factura
```

### 2.2 Ejemplo: Integración con Sistema ERP

**Archivo: `erp-integration.js`**

```javascript
const axios = require('axios');

class ERPAFIPIntegration {
  constructor(afipApiUrl) {
    this.afipApiUrl = afipApiUrl;
  }

  /**
   * Crear factura desde el ERP
   */
  async crearFacturaDesdeVenta(venta) {
    try {
      // 1. Preparar datos para AFIP
      const facturaData = {
        tipoComprobante: this.determinarTipoComprobante(venta.cliente),
        puntoVenta: 4,
        cliente: {
          tipoDoc: venta.cliente.tipoDocumento,
          nroDoc: venta.cliente.numeroDocumento,
          nombre: venta.cliente.razonSocial
        },
        items: venta.items.map(item => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          subtotal: item.cantidad * item.precio
        })),
        importeTotal: venta.total,
        observaciones: venta.observaciones
      };

      // 2. Llamar a API del módulo AFIP
      const response = await axios.post(
        `${this.afipApiUrl}/api/facturas`,
        facturaData
      );

      // 3. Actualizar venta en ERP con datos de AFIP
      await this.actualizarVentaConCAE(venta.id, {
        cae: response.data.cae,
        vencimientoCae: response.data.vencimiento,
        numeroComprobante: response.data.numero,
        puntoVenta: response.data.puntoVenta,
        fechaEmision: response.data.fecha
      });

      // 4. Generar PDF de la factura
      await this.generarPDFFactura(venta.id);

      // 5. Enviar por email al cliente
      await this.enviarFacturaPorEmail(venta.id);

      return {
        success: true,
        cae: response.data.cae,
        mensaje: 'Factura creada exitosamente'
      };

    } catch (error) {
      console.error('Error al crear factura:', error);
      
      // Registrar error en ERP
      await this.registrarErrorFacturacion(venta.id, error.message);
      
      throw error;
    }
  }

  /**
   * Crear nota de crédito desde el ERP
   */
  async crearNotaCreditoDesdeDevolucion(devolucion) {
    try {
      // 1. Obtener factura original
      const facturaOriginal = await this.obtenerFactura(devolucion.facturaId);

      // 2. Preparar datos para AFIP
      const ncData = {
        facturaAsociada: {
          tipo: facturaOriginal.tipoComprobante,
          puntoVenta: facturaOriginal.puntoVenta,
          numero: facturaOriginal.numero,
          cae: facturaOriginal.cae
        },
        motivo: devolucion.motivo,
        importeTotal: devolucion.importeDevolucion
      };

      // 3. Llamar a API del módulo AFIP
      const response = await axios.post(
        `${this.afipApiUrl}/api/notas-credito`,
        ncData
      );

      // 4. Actualizar devolución en ERP
      await this.actualizarDevolucionConCAE(devolucion.id, {
        cae: response.data.cae,
        vencimientoCae: response.data.vencimiento,
        numeroComprobante: response.data.numero
      });

      return {
        success: true,
        cae: response.data.cae,
        mensaje: 'Nota de crédito creada exitosamente'
      };

    } catch (error) {
      console.error('Error al crear NC:', error);
      throw error;
    }
  }

  /**
   * Consultar comprobante en AFIP
   */
  async consultarComprobante(tipo, puntoVenta, numero) {
    try {
      const response = await axios.get(
        `${this.afipApiUrl}/api/comprobantes/${tipo}/${puntoVenta}/${numero}`
      );

      return response.data;
    } catch (error) {
      console.error('Error al consultar comprobante:', error);
      throw error;
    }
  }

  /**
   * Determinar tipo de comprobante según cliente
   */
  determinarTipoComprobante(cliente) {
    // Responsable Inscripto → Factura A (1)
    if (cliente.condicionIVA === 'RESPONSABLE_INSCRIPTO') {
      return 1;
    }
    // Monotributista → Factura C (11)
    if (cliente.condicionIVA === 'MONOTRIBUTO') {
      return 11;
    }
    // Consumidor Final → Factura B (6)
    return 6;
  }

  /**
   * Métodos auxiliares (implementar según tu ERP)
   */
  async actualizarVentaConCAE(ventaId, datosCAE) {
    // Implementar según tu base de datos
    // Ejemplo:
    // await db.ventas.update(ventaId, datosCAE);
  }

  async registrarErrorFacturacion(ventaId, error) {
    // Implementar según tu sistema de logs
    // Ejemplo:
    // await db.logs.insert({ ventaId, error, timestamp: new Date() });
  }

  async generarPDFFactura(ventaId) {
    // Implementar generación de PDF
  }

  async enviarFacturaPorEmail(ventaId) {
    // Implementar envío de email
  }
}

// Uso
const integration = new ERPAFIPIntegration('http://localhost:3001');

// Ejemplo: Crear factura desde venta
const venta = {
  id: 123,
  cliente: {
    tipoDocumento: 80,
    numeroDocumento: '30123456789',
    razonSocial: 'Cliente SA',
    condicionIVA: 'MONOTRIBUTO'
  },
  items: [
    { descripcion: 'Producto 1', cantidad: 2, precio: 100 },
    { descripcion: 'Producto 2', cantidad: 1, precio: 50 }
  ],
  total: 250,
  observaciones: 'Venta de productos'
};

integration.crearFacturaDesdeVenta(venta)
  .then(resultado => console.log('Factura creada:', resultado))
  .catch(error => console.error('Error:', error));
```

### 2.3 Webhook para Notificaciones

**Archivo: `webhook-handler.js`**

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Endpoint para recibir notificaciones del módulo AFIP
app.post('/webhooks/afip', async (req, res) => {
  const { evento, datos, timestamp } = req.body;

  try {
    switch (evento) {
      case 'factura.creada':
        await procesarFacturaCreada(datos);
        break;
      
      case 'nota_credito.creada':
        await procesarNotaCreditoCreada(datos);
        break;
      
      case 'error.facturacion':
        await procesarErrorFacturacion(datos);
        break;
    }

    res.json({ success: true, mensaje: 'Webhook procesado' });
  } catch (error) {
    console.error('Error al procesar webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

async function procesarFacturaCreada(datos) {
  console.log('Factura creada:', datos.cae);
  // Actualizar estado en ERP
  // Enviar notificación
  // etc.
}

async function procesarNotaCreditoCreada(datos) {
  console.log('NC creada:', datos.cae);
  // Procesar devolución
  // Actualizar inventario
  // etc.
}

async function procesarErrorFacturacion(datos) {
  console.error('Error en facturación:', datos.error);
  // Notificar al administrador
  // Registrar en logs
  // etc.
}

app.listen(3002, () => {
  console.log('Webhook handler corriendo en puerto 3002');
});
```

---

## 3. INTEGRACIÓN CON CRM

### 3.1 Flujo de Integración

```javascript
// crm-integration.js
class CRMAFIPIntegration {
  /**
   * Facturar oportunidad cerrada
   */
  async facturarOportunidad(oportunidadId) {
    // 1. Obtener datos de la oportunidad
    const oportunidad = await this.crm.obtenerOportunidad(oportunidadId);
    
    // 2. Validar que está cerrada/ganada
    if (oportunidad.estado !== 'CERRADA_GANADA') {
      throw new Error('La oportunidad debe estar cerrada/ganada');
    }

    // 3. Crear factura
    const factura = await this.afip.crearFactura({
      cliente: oportunidad.cliente,
      items: oportunidad.productos,
      total: oportunidad.monto
    });

    // 4. Actualizar oportunidad con CAE
    await this.crm.actualizarOportunidad(oportunidadId, {
      facturada: true,
      cae: factura.cae,
      fechaFacturacion: new Date()
    });

    // 5. Crear actividad en CRM
    await this.crm.crearActividad({
      tipo: 'FACTURACION',
      oportunidadId: oportunidadId,
      descripcion: `Factura ${factura.numero} - CAE: ${factura.cae}`,
      fecha: new Date()
    });

    return factura;
  }

  /**
   * Sincronizar facturas con CRM
   */
  async sincronizarFacturas() {
    // Obtener facturas del último mes
    const fechaDesde = new Date();
    fechaDesde.setMonth(fechaDesde.getMonth() - 1);

    const facturas = await this.afip.consultarFacturas(fechaDesde);

    for (const factura of facturas) {
      // Buscar cliente en CRM
      const cliente = await this.crm.buscarCliente(factura.cliente.documento);

      if (cliente) {
        // Crear registro de factura en CRM
        await this.crm.crearFactura({
          clienteId: cliente.id,
          numero: factura.numero,
          cae: factura.cae,
          importe: factura.total,
          fecha: factura.fecha
        });
      }
    }
  }
}
```

---

## 4. INTEGRACIÓN CON E-COMMERCE

### 4.1 Flujo de Integración

```javascript
// ecommerce-integration.js
class EcommerceAFIPIntegration {
  /**
   * Facturar pedido completado
   */
  async facturarPedido(pedidoId) {
    try {
      // 1. Obtener pedido
      const pedido = await this.ecommerce.obtenerPedido(pedidoId);

      // 2. Validar estado
      if (pedido.estado !== 'PAGADO') {
        throw new Error('El pedido debe estar pagado');
      }

      // 3. Obtener datos del cliente
      const cliente = await this.ecommerce.obtenerCliente(pedido.clienteId);

      // 4. Preparar items
      const items = pedido.items.map(item => ({
        descripcion: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precio,
        subtotal: item.cantidad * item.precio
      }));

      // 5. Crear factura en AFIP
      const factura = await this.afip.crearFactura({
        tipoComprobante: 11, // Factura C para e-commerce
        cliente: {
          tipoDoc: cliente.tipoDocumento || 96,
          nroDoc: cliente.documento || '0',
          nombre: cliente.nombre
        },
        items: items,
        importeTotal: pedido.total
      });

      // 6. Actualizar pedido
      await this.ecommerce.actualizarPedido(pedidoId, {
        facturado: true,
        cae: factura.cae,
        numeroFactura: `${factura.puntoVenta}-${factura.numero}`
      });

      // 7. Enviar factura por email
      await this.enviarFacturaPorEmail(cliente.email, factura);

      // 8. Generar PDF y adjuntar al pedido
      const pdf = await this.generarPDFFactura(factura);
      await this.ecommerce.adjuntarArchivo(pedidoId, pdf);

      return factura;

    } catch (error) {
      console.error('Error al facturar pedido:', error);
      
      // Marcar pedido con error
      await this.ecommerce.marcarErrorFacturacion(pedidoId, error.message);
      
      throw error;
    }
  }

  /**
   * Procesar devolución
   */
  async procesarDevolucion(devolucionId) {
    // 1. Obtener devolución
    const devolucion = await this.ecommerce.obtenerDevolucion(devolucionId);

    // 2. Obtener pedido original
    const pedido = await this.ecommerce.obtenerPedido(devolucion.pedidoId);

    // 3. Crear nota de crédito
    const nc = await this.afip.crearNotaCredito({
      facturaAsociada: {
        tipo: 11,
        puntoVenta: pedido.factura.puntoVenta,
        numero: pedido.factura.numero,
        cae: pedido.factura.cae
      },
      importeTotal: devolucion.importeDevolucion
    });

    // 4. Actualizar devolución
    await this.ecommerce.actualizarDevolucion(devolucionId, {
      notaCreditoCAE: nc.cae,
      notaCreditoNumero: `${nc.puntoVenta}-${nc.numero}`
    });

    // 5. Procesar reembolso
    await this.procesarReembolso(devolucionId, devolucion.importeDevolucion);

    return nc;
  }

  /**
   * Webhook para procesar pedidos automáticamente
   */
  async webhookPedidoPagado(pedido) {
    try {
      // Facturar automáticamente cuando se paga
      await this.facturarPedido(pedido.id);
      
      console.log(`Pedido ${pedido.id} facturado automáticamente`);
    } catch (error) {
      console.error(`Error al facturar pedido ${pedido.id}:`, error);
      
      // Notificar al administrador
      await this.notificarError(pedido.id, error);
    }
  }
}

// Uso con WooCommerce
const woocommerce = new WooCommerceAPI({
  url: 'https://tu-tienda.com',
  consumerKey: 'ck_...',
  consumerSecret: 'cs_...'
});

const integration = new EcommerceAFIPIntegration(woocommerce);

// Webhook de WooCommerce
app.post('/webhooks/woocommerce/order-paid', async (req, res) => {
  const pedido = req.body;
  await integration.webhookPedidoPagado(pedido);
  res.json({ success: true });
});
```

---

## 5. EJEMPLOS DE CÓDIGO

### 5.1 API Server Completo

**Archivo: `api-server.js`**

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { autenticar, crearFactura, crearNotaCredito, consultarComprobante } = require('./afip-service');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por ventana
});
app.use('/api/', limiter);

// Middleware de autenticación
app.use('/api/', async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  next();
});

// Endpoints

/**
 * POST /api/facturas
 * Crear una factura
 */
app.post('/api/facturas', async (req, res) => {
  try {
    const { tipoComprobante, cliente, items, importeTotal, observaciones } = req.body;

    // Validaciones
    if (!tipoComprobante || !cliente || !items || !importeTotal) {
      return res.status(400).json({
        error: 'Faltan datos requeridos'
      });
    }

    // Autenticar con AFIP
    await autenticar();

    // Crear factura
    const resultado = await crearFactura({
      tipoComprobante,
      cliente,
      items,
      importeTotal,
      observaciones
    });

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('Error al crear factura:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/notas-credito
 * Crear una nota de crédito
 */
app.post('/api/notas-credito', async (req, res) => {
  try {
    const { facturaAsociada, motivo } = req.body;

    if (!facturaAsociada) {
      return res.status(400).json({
        error: 'Debe especificar la factura asociada'
      });
    }

    await autenticar();

    const resultado = await crearNotaCredito({
      facturaAsociada,
      motivo
    });

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('Error al crear NC:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/comprobantes/:tipo/:pv/:numero
 * Consultar un comprobante
 */
app.get('/api/comprobantes/:tipo/:pv/:numero', async (req, res) => {
  try {
    const { tipo, pv, numero } = req.params;

    await autenticar();

    const resultado = await consultarComprobante(
      parseInt(tipo),
      parseInt(pv),
      parseInt(numero)
    );

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('Error al consultar comprobante:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API Server corriendo en puerto ${PORT}`);
});

module.exports = app;
```

### 5.2 Cliente para Consumir la API

**Archivo: `afip-client.js`**

```javascript
const axios = require('axios');

class AFIPClient {
  constructor(baseURL, apiKey) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      timeout: 30000
    });
  }

  /**
   * Crear factura
   */
  async crearFactura(datos) {
    try {
      const response = await this.client.post('/api/facturas', datos);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Crear nota de crédito
   */
  async crearNotaCredito(datos) {
    try {
      const response = await this.client.post('/api/notas-credito', datos);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Consultar comprobante
   */
  async consultarComprobante(tipo, pv, numero) {
    try {
      const response = await this.client.get(
        `/api/comprobantes/${tipo}/${pv}/${numero}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/api/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      return new Error(error.response.data.error || 'Error en la API');
    } else if (error.request) {
      return new Error('No se pudo conectar con el servidor');
    } else {
      return error;
    }
  }
}

// Uso
const client = new AFIPClient('http://localhost:3001', 'tu-api-key');

// Ejemplo: Crear factura
client.crearFactura({
  tipoComprobante: 11,
  cliente: {
    tipoDoc: 96,
    nroDoc: '12345678',
    nombre: 'Cliente Ejemplo'
  },
  items: [
    { descripcion: 'Producto 1', cantidad: 1, precio: 100 }
  ],
  importeTotal: 100
})
.then(resultado => console.log('Factura creada:', resultado.data.cae))
.catch(error => console.error('Error:', error.message));

module.exports = AFIPClient;
```

---

## 6. BASE DE DATOS

### 6.1 Esquema de Base de Datos

```sql
-- Tabla de comprobantes
CREATE TABLE comprobantes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo INT NOT NULL,
  punto_venta INT NOT NULL,
  numero INT NOT NULL,
  fecha DATE NOT NULL,
  cae VARCHAR(14) NOT NULL,
  vencimiento_cae DATE NOT NULL,
  cliente_tipo_doc INT,
  cliente_nro_doc VARCHAR(20),
  cliente_nombre VARCHAR(255),
  importe_total DECIMAL(15,2) NOT NULL,
  importe_neto DECIMAL(15,2),
  importe_iva DECIMAL(15,2),
  estado VARCHAR(20) DEFAULT 'APROBADO',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_comprobante (tipo, punto_venta, numero)
);

-- Tabla de items de comprobantes
CREATE TABLE comprobante_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  comprobante_id INT NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  precio_unitario DECIMAL(15,2) NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (comprobante_id) REFERENCES comprobantes(id)
);

-- Tabla de logs
CREATE TABLE afip_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  operacion VARCHAR(50) NOT NULL,
  comprobante_id INT,
  request TEXT,
  response TEXT,
  estado VARCHAR(20),
  error TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comprobante_id) REFERENCES comprobantes(id)
);

-- Índices
CREATE INDEX idx_comprobantes_fecha ON comprobantes(fecha);
CREATE INDEX idx_comprobantes_cliente ON comprobantes(cliente_nro_doc);
CREATE INDEX idx_comprobantes_cae ON comprobantes(cae);
```

### 6.2 Modelo de Datos (Sequelize)

```javascript
// models/Comprobante.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Comprobante = sequelize.define('Comprobante', {
    tipo: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    puntoVenta: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    cae: {
      type: DataTypes.STRING(14),
      allowNull: false
    },
    vencimientoCae: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    clienteTipoDoc: DataTypes.INTEGER,
    clienteNroDoc: DataTypes.STRING(20),
    clienteNombre: DataTypes.STRING(255),
    importeTotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    importeNeto: DataTypes.DECIMAL(15, 2),
    importeIva: DataTypes.DECIMAL(15, 2),
    estado: {
      type: DataTypes.STRING(20),
      defaultValue: 'APROBADO'
    },
    observaciones: DataTypes.TEXT
  }, {
    indexes: [
      {
        unique: true,
        fields: ['tipo', 'puntoVenta', 'numero']
      }
    ]
  });

  return Comprobante;
};
```

---

## 7. SINCRONIZACIÓN

### 7.1 Sincronización Automática

```javascript
// sync-service.js
class SyncService {
  constructor(afipClient, database) {
    this.afipClient = afipClient;
    this.database = database;
  }

  /**
   * Sincronizar comprobantes del día
   */
  async sincronizarDia() {
    const hoy = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    // Consultar comprobantes del día en AFIP
    const comprobantes = await this.afipClient.consultarRango(hoy, hoy);

    for (const comp of comprobantes) {
      // Verificar si ya existe en la base de datos
      const existe = await this.database.comprobantes.findOne({
        where: {
          tipo: comp.tipo,
          puntoVenta: comp.puntoVenta,
          numero: comp.numero
        }
      });

      if (!existe) {
        // Insertar en base de datos
        await this.database.comprobantes.create({
          tipo: comp.tipo,
          puntoVenta: comp.puntoVenta,
          numero: comp.numero,
          fecha: comp.fecha,
          cae: comp.cae,
          vencimientoCae: comp.vencimientoCae,
          importeTotal: comp.importeTotal
        });

        console.log(`Comprobante ${comp.tipo}-${comp.puntoVenta}-${comp.numero} sincronizado`);
      }
    }
  }

  /**
   * Ejecutar sincronización periódica
   */
  iniciarSincronizacionAutomatica() {
    // Sincronizar cada hora
    setInterval(() => {
      this.sincronizarDia()
        .then(() => console.log('Sincronización completada'))
        .catch(error => console.error('Error en sincronización:', error));
    }, 60 * 60 * 1000); // 1 hora
  }
}

module.exports = SyncService;
```

---

**Última actualización:** 20 de Diciembre de 2025
