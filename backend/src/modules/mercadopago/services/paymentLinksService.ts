// 💳 Servicio de Payment Links de Mercado Pago
import PaymentLink, { IPaymentLink } from '../models/PaymentLink.js';

/**
 * Genera un slug único a partir del título
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Obtiene todos los links de un vendedor
 */
export async function getLinksBySeller(sellerId: string): Promise<IPaymentLink[]> {
  return PaymentLink.find({ sellerId }).sort({ createdAt: -1 });
}

/**
 * Obtiene un link por ID o slug
 */
export async function getLinkByIdOrSlug(identifier: string): Promise<IPaymentLink | null> {
  // Primero intentar buscar por slug (más común en URLs)
  const bySlug = await PaymentLink.findOne({ slug: identifier });
  if (bySlug) return bySlug;
  
  // Si no se encuentra por slug, intentar por _id (solo si es un ObjectId válido)
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    return PaymentLink.findById(identifier);
  }
  
  return null;
}

/**
 * Crea un nuevo link de pago
 */
export async function createPaymentLink(data: {
  sellerId: string;
  empresaId?: string;
  title: string;
  unitPrice: number;
  description?: string;
  priceType?: 'fixed' | 'variable';
  category?: string;
  imageUrl?: string;
  currency?: string;
}): Promise<IPaymentLink> {
  // Generar slug único
  let baseSlug = generateSlug(data.title);
  let slug = baseSlug;
  let counter = 1;
  
  while (await PaymentLink.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  const link = new PaymentLink({
    sellerId: data.sellerId,
    empresaId: data.empresaId,
    slug,
    title: data.title,
    unitPrice: data.unitPrice,
    description: data.description || '',
    priceType: data.priceType || 'fixed',
    category: data.category || 'services',
    imageUrl: data.imageUrl,
    currency: data.currency || 'ARS',
    active: true,
    totalUses: 0,
    totalRevenue: 0
  });

  await link.save();
  return link;
}

/**
 * Actualiza un link de pago
 */
export async function updatePaymentLink(
  linkId: string, 
  updates: Partial<IPaymentLink>
): Promise<IPaymentLink | null> {
  return PaymentLink.findByIdAndUpdate(linkId, updates, { new: true });
}

/**
 * Desactiva un link de pago
 */
export async function deactivatePaymentLink(linkId: string): Promise<IPaymentLink | null> {
  return PaymentLink.findByIdAndUpdate(linkId, { active: false }, { new: true });
}

/**
 * Elimina un link de pago
 */
export async function deletePaymentLink(linkId: string): Promise<boolean> {
  const result = await PaymentLink.findByIdAndDelete(linkId);
  return !!result;
}

/**
 * Incrementa el contador de usos y revenue
 */
export async function incrementLinkUsage(linkId: string, amount: number): Promise<void> {
  await PaymentLink.findByIdAndUpdate(linkId, {
    $inc: { totalUses: 1, totalRevenue: amount }
  });
}

export default {
  getLinksBySeller,
  getLinkByIdOrSlug,
  createPaymentLink,
  updatePaymentLink,
  deactivatePaymentLink,
  deletePaymentLink,
  incrementLinkUsage
};
