// 💳 Rutas centralizadas del módulo Mercado Pago
import { Router } from 'express';
import oauthRoutes from './oauthRoutes.js';
import sellersRoutes from './sellersRoutes.js';
import paymentsRoutes from './paymentsRoutes.js';

const router = Router();

console.log('🟢 [MP] Módulo Mercado Pago - Montando rutas...');

// Montar rutas
router.use('/oauth', oauthRoutes);
router.use('/sellers', sellersRoutes);
router.use('/payments', paymentsRoutes);

// Health check del módulo
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    module: 'mercadopago',
    timestamp: new Date().toISOString() 
  });
});

// Info del módulo
router.get('/', (req, res) => {
  res.json({
    name: 'mercadopago-module',
    version: '1.0.0',
    description: 'Módulo de Mercado Pago integrado al CRM',
    endpoints: {
      oauth: {
        authorize: 'GET /oauth/authorize?internalId=xxx&redirectUrl=xxx',
        callback: 'GET /oauth/callback (interno)',
        refresh: 'POST /oauth/refresh { userId }',
        disconnect: 'DELETE /oauth/disconnect/:userId',
      },
      payments: {
        createPreference: 'POST /payments/create-preference',
        createSplitPreference: 'POST /payments/create-split-preference',
        getPayment: 'GET /payments/:paymentId',
      },
      sellers: {
        list: 'GET /sellers',
        get: 'GET /sellers/:userId',
        getByInternal: 'GET /sellers/by-internal/:internalId',
        delete: 'DELETE /sellers/:userId',
      },
    },
  });
});

console.log('🟢 [MP] Rutas montadas exitosamente');

export default router;
