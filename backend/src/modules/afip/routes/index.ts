// 🧾 Índice de Rutas del Módulo AFIP
import { Router } from 'express';
import sellerRoutes from './sellerRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';

const router = Router();

console.log('🟢 [AFIP] Montando rutas del módulo...');

// Montar rutas
router.use('/sellers', sellerRoutes);
console.log('🟢 [AFIP] -> /sellers montado');

router.use('/invoices', invoiceRoutes);
console.log('🟢 [AFIP] -> /invoices montado');

// Health check del módulo
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: 'AFIP',
    version: '1.0.0',
    endpoints: {
      sellers: {
        list: 'GET /sellers?empresaId=xxx',
        create: 'POST /sellers',
        testAuth: 'POST /sellers/:id/test-auth',
        delete: 'DELETE /sellers/:id'
      },
      invoices: {
        list: 'GET /invoices?empresaId=xxx',
        create: 'POST /invoices',
        get: 'GET /invoices/:id',
        ultimo: 'GET /invoices/ultimo/:tipoComprobante?empresaId=xxx',
        consultar: 'POST /invoices/consultar',
        stats: 'GET /invoices/stats/:empresaId'
      }
    }
  });
});

console.log('✅ [AFIP] Módulo montado exitosamente\n');

export default router;
