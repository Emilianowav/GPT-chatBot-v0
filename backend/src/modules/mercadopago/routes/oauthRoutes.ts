// 💳 Rutas OAuth de Mercado Pago
import { Router } from 'express';
import mpConfig from '../config.js';
import * as mpService from '../services/mercadopagoService.js';
import * as sellersService from '../services/sellersService.js';

const router = Router();

/**
 * GET /oauth/authorize
 * Redirige al vendedor a Mercado Pago para autorizar la conexión
 */
router.get('/authorize', (req: any, res: any) => {
  const { internalId, redirectUrl } = req.query;
  
  // Crear state con información para el callback
  const state = Buffer.from(JSON.stringify({
    internalId: internalId || null,
    redirectUrl: redirectUrl || mpConfig.frontendUrl,
    timestamp: Date.now(),
  })).toString('base64');
  
  const callbackUrl = `${mpConfig.appUrl}/api/modules/mercadopago/oauth/callback`;
  const authUrl = mpService.getAuthorizationUrl(callbackUrl, state);
  
  console.log('🔵 [MP OAuth] Redirigiendo a:', authUrl);
  res.redirect(authUrl);
});

/**
 * GET /oauth/callback
 * Callback de Mercado Pago después de la autorización
 */
router.get('/callback', async (req: any, res: any) => {
  const { code, error, state } = req.query;
  
  // Decodificar state
  let stateData: { redirectUrl: string; internalId?: string } = { 
    redirectUrl: mpConfig.frontendUrl 
  };
  
  try {
    if (state && typeof state === 'string') {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    }
  } catch (err) {
    console.error('❌ [MP OAuth] Error decodificando state:', err);
  }
  
  const redirectUrl = stateData.redirectUrl || mpConfig.frontendUrl;
  
  if (error) {
    console.error('❌ [MP OAuth] Error de autorización:', error);
    return res.redirect(`${redirectUrl}?mp_status=error&mp_error=${encodeURIComponent(String(error))}`);
  }
  
  if (!code || typeof code !== 'string') {
    return res.redirect(`${redirectUrl}?mp_status=error&mp_error=no_code`);
  }
  
  try {
    const callbackUrl = `${mpConfig.appUrl}/api/modules/mercadopago/oauth/callback`;
    const tokenData = await mpService.exchangeCodeForToken(code, callbackUrl);
    
    console.log('✅ [MP OAuth] Vendedor conectado:', tokenData.userId);
    
    // Guardar vendedor en MongoDB
    await sellersService.saveSeller({
      userId: tokenData.userId,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      publicKey: tokenData.publicKey,
      expiresIn: tokenData.expiresIn,
      internalId: stateData.internalId,
    });
    
    // Redirigir con éxito
    res.redirect(`${redirectUrl}?mp_status=success&mp_user_id=${tokenData.userId}`);
    
  } catch (err: any) {
    console.error('❌ [MP OAuth] Error intercambiando código:', err.message);
    res.redirect(`${redirectUrl}?mp_status=error&mp_error=${encodeURIComponent(err.message)}`);
  }
});

/**
 * POST /oauth/refresh
 * Renueva el token de acceso de un vendedor
 */
router.post('/refresh', async (req: any, res: any) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const seller = await sellersService.getSellerByUserId(userId);
  
  if (!seller) {
    return res.status(404).json({ error: 'Seller not found' });
  }
  
  try {
    const newTokens = await mpService.refreshAccessToken(seller.refreshToken);
    
    await sellersService.updateSellerTokens(userId, {
      accessToken: newTokens.accessToken!,
      refreshToken: newTokens.refreshToken,
      expiresIn: newTokens.expiresIn,
    });
    
    res.json({
      success: true,
      expiresIn: newTokens.expiresIn,
    });
    
  } catch (err: any) {
    console.error('❌ [MP OAuth] Error renovando token:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /oauth/disconnect/:userId
 * Desconecta un vendedor
 */
router.delete('/disconnect/:userId', async (req: any, res: any) => {
  const { userId } = req.params;
  
  const success = await sellersService.deactivateSeller(userId);
  
  if (success) {
    res.json({ success: true, message: 'Seller disconnected' });
  } else {
    res.status(404).json({ error: 'Seller not found' });
  }
});

export default router;
