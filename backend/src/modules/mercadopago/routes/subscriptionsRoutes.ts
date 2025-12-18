// 💳 Rutas de Suscripciones de Mercado Pago
import { Router, Request, Response } from 'express';
import subscriptionsService from '../services/subscriptionsService.js';
import { Seller } from '../models/Seller.js';

const router = Router();

/**
 * GET /subscriptions/plans?sellerId=xxx
 * Lista todos los planes de un vendedor
 */
router.get('/plans', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.query;
    
    if (!sellerId || typeof sellerId !== 'string') {
      res.status(400).json({ error: 'sellerId es requerido' });
      return;
    }

    const plans = await subscriptionsService.getPlansBySeller(sellerId);
    
    const plansFormatted = plans.map(plan => ({
      id: plan._id,
      name: plan.name,
      description: plan.description,
      amount: plan.amount,
      currency: plan.currency,
      frequency: plan.frequency,
      trialDays: plan.trialDays,
      active: plan.active,
      subscriberCount: plan.subscriberCount,
      createdAt: plan.createdAt
    }));

    res.json({ success: true, plans: plansFormatted });
  } catch (error: any) {
    console.error('[MP] Error listando planes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /subscriptions/plans
 * Crea un nuevo plan de suscripción
 */
router.post('/plans', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId, name, amount, frequency, trialDays, description } = req.body;

    if (!sellerId || !name || !amount) {
      res.status(400).json({ 
        error: 'Campos requeridos: sellerId, name, amount' 
      });
      return;
    }

    // Verificar que el vendedor existe
    const seller = await Seller.findOne({ userId: sellerId });
    if (!seller) {
      res.status(404).json({ 
        error: 'Vendedor no encontrado. Debe conectar su cuenta de MP primero.' 
      });
      return;
    }

    const plan = await subscriptionsService.createPlan({
      sellerId,
      name,
      amount: Number(amount),
      frequency: frequency || 'monthly',
      trialDays: Number(trialDays) || 0,
      description
    });

    res.status(201).json({ 
      success: true, 
      plan: {
        id: plan._id,
        name: plan.name,
        amount: plan.amount,
        frequency: plan.frequency,
        trialDays: plan.trialDays,
        active: plan.active
      }
    });
  } catch (error: any) {
    console.error('[MP] Error creando plan:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /subscriptions/plans/:id
 * Obtiene un plan por ID
 */
router.get('/plans/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const plan = await subscriptionsService.getPlanById(req.params.id);
    
    if (!plan) {
      res.status(404).json({ error: 'Plan no encontrado' });
      return;
    }

    res.json({ success: true, plan });
  } catch (error: any) {
    console.error('[MP] Error obteniendo plan:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /subscriptions/plans/:id
 * Elimina un plan
 */
router.delete('/plans/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await subscriptionsService.deletePlan(req.params.id);
    
    if (!deleted) {
      res.status(404).json({ error: 'Plan no encontrado' });
      return;
    }

    res.json({ success: true, message: 'Plan eliminado' });
  } catch (error: any) {
    console.error('[MP] Error eliminando plan:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
