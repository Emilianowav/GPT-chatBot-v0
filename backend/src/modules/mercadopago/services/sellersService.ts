// 💳 Servicio de Vendedores - Gestión de vendedores conectados a MP
import Seller, { ISeller } from '../models/Seller.js';

/**
 * Obtiene todos los vendedores conectados
 */
export async function getAllSellers(): Promise<ISeller[]> {
  try {
    return await Seller.find({ active: true }).select('-accessToken -refreshToken');
  } catch (err) {
    console.error('Error obteniendo sellers:', err);
    return [];
  }
}

/**
 * Obtiene un vendedor por su User ID de Mercado Pago
 */
export async function getSellerByUserId(userId: string): Promise<ISeller | null> {
  return await Seller.findOne({ userId });
}

/**
 * Obtiene un vendedor por su ID interno (empresa en nuestro sistema)
 */
export async function getSellerByInternalId(internalId: string): Promise<ISeller | null> {
  return await Seller.findOne({ internalId, active: true });
}

/**
 * Guarda o actualiza un vendedor
 */
export async function saveSeller(sellerData: {
  userId: string;
  accessToken: string;
  refreshToken: string;
  publicKey?: string;
  expiresIn?: number;
  internalId?: string;
  email?: string;
  businessName?: string;
}): Promise<ISeller> {
  const existingSeller = await Seller.findOne({ userId: sellerData.userId });
  
  if (existingSeller) {
    // Actualizar vendedor existente
    existingSeller.accessToken = sellerData.accessToken;
    existingSeller.refreshToken = sellerData.refreshToken;
    existingSeller.publicKey = sellerData.publicKey;
    existingSeller.expiresIn = sellerData.expiresIn;
    existingSeller.internalId = sellerData.internalId || existingSeller.internalId;
    existingSeller.email = sellerData.email || existingSeller.email;
    existingSeller.businessName = sellerData.businessName || existingSeller.businessName;
    existingSeller.active = true;
    existingSeller.updatedAt = new Date();
    
    return await existingSeller.save();
  }
  
  // Crear nuevo vendedor
  const seller = new Seller({
    userId: sellerData.userId,
    accessToken: sellerData.accessToken,
    refreshToken: sellerData.refreshToken,
    publicKey: sellerData.publicKey,
    expiresIn: sellerData.expiresIn,
    internalId: sellerData.internalId,
    email: sellerData.email,
    businessName: sellerData.businessName,
    active: true,
    connectedAt: new Date(),
    updatedAt: new Date(),
  });
  
  return await seller.save();
}

/**
 * Actualiza los tokens de un vendedor
 */
export async function updateSellerTokens(
  userId: string, 
  tokens: { accessToken: string; refreshToken?: string; expiresIn?: number }
): Promise<ISeller | null> {
  const seller = await Seller.findOne({ userId });
  
  if (!seller) return null;
  
  seller.accessToken = tokens.accessToken;
  if (tokens.refreshToken) seller.refreshToken = tokens.refreshToken;
  if (tokens.expiresIn) seller.expiresIn = tokens.expiresIn;
  seller.updatedAt = new Date();
  
  return await seller.save();
}

/**
 * Desactiva un vendedor (desconecta)
 */
export async function deactivateSeller(userId: string): Promise<boolean> {
  const result = await Seller.updateOne(
    { userId },
    { $set: { active: false, updatedAt: new Date() } }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Elimina un vendedor
 */
export async function deleteSeller(userId: string): Promise<boolean> {
  const result = await Seller.deleteOne({ userId });
  return result.deletedCount > 0;
}

/**
 * Verifica si una empresa tiene MP conectado
 */
export async function isConnected(internalId: string): Promise<boolean> {
  const seller = await Seller.findOne({ internalId, active: true });
  return !!seller;
}

export default {
  getAllSellers,
  getSellerByUserId,
  getSellerByInternalId,
  saveSeller,
  updateSellerTokens,
  deactivateSeller,
  deleteSeller,
  isConnected,
};
