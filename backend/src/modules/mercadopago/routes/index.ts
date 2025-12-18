// 💳 Rutas centralizadas del módulo Mercado Pago
import { Router } from 'express';
import oauthRoutes from './oauthRoutes.js';
import sellersRoutes from './sellersRoutes.js';
import paymentsRoutes from './paymentsRoutes.js';
import paymentLinksRoutes from './paymentLinksRoutes.js';
import subscriptionsRoutes from './subscriptionsRoutes.js';

const router = Router();

console.log('🟢 [MP] Módulo Mercado Pago - Montando rutas...');

// Montar rutas
router.use('/oauth', oauthRoutes);
router.use('/sellers', sellersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/payment-links', paymentLinksRoutes);
router.use('/subscriptions', subscriptionsRoutes);

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
    version: '1.1.0',
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
      paymentLinks: {
        list: 'GET /payment-links?sellerId=xxx',
        create: 'POST /payment-links { sellerId, title, unitPrice, description?, priceType? }',
        get: 'GET /payment-links/:id',
        delete: 'DELETE /payment-links/:id',
      },
      subscriptions: {
        listPlans: 'GET /subscriptions/plans?sellerId=xxx',
        createPlan: 'POST /subscriptions/plans { sellerId, name, amount, frequency?, trialDays?, description? }',
        getPlan: 'GET /subscriptions/plans/:id',
        deletePlan: 'DELETE /subscriptions/plans/:id',
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
