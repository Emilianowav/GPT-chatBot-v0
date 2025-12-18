// 💳 Servicio de Suscripciones de Mercado Pago
import SubscriptionPlan, { ISubscriptionPlan } from '../models/SubscriptionPlan.js';

/**
 * Obtiene todos los planes de un vendedor
 */
export async function getPlansBySeller(sellerId: string): Promise<ISubscriptionPlan[]> {
  return SubscriptionPlan.find({ sellerId }).sort({ createdAt: -1 });
}

/**
 * Obtiene un plan por ID
 */
export async function getPlanById(planId: string): Promise<ISubscriptionPlan | null> {
  return SubscriptionPlan.findById(planId);
}

/**
 * Crea un nuevo plan de suscripción
 */
export async function createPlan(data: {
  sellerId: string;
  name: string;
  amount: number;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  trialDays?: number;
  description?: string;
  currency?: string;
}): Promise<ISubscriptionPlan> {
  const plan = new SubscriptionPlan({
    sellerId: data.sellerId,
    name: data.name,
    amount: data.amount,
    frequency: data.frequency || 'monthly',
    trialDays: data.trialDays || 0,
    description: data.description || '',
    currency: data.currency || 'ARS',
    active: true,
    subscriberCount: 0
  });

  await plan.save();
  return plan;
}

/**
 * Actualiza un plan
 */
export async function updatePlan(
  planId: string, 
  updates: Partial<ISubscriptionPlan>
): Promise<ISubscriptionPlan | null> {
  return SubscriptionPlan.findByIdAndUpdate(planId, updates, { new: true });
}

/**
 * Elimina un plan
 */
export async function deletePlan(planId: string): Promise<boolean> {
  const result = await SubscriptionPlan.findByIdAndDelete(planId);
  return !!result;
}

export default {
  getPlansBySeller,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};
