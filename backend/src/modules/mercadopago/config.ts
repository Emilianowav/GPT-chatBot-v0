// 💳 Configuración del módulo Mercado Pago

export const mpConfig = {
  // Credenciales de Mercado Pago (Marketplace/Integrador)
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  publicKey: process.env.MP_PUBLIC_KEY || '',
  clientId: process.env.MP_CLIENT_ID || '',
  clientSecret: process.env.MP_CLIENT_SECRET || '',
  webhookSecret: process.env.MP_WEBHOOK_SECRET || '',
  
  // Comisión del marketplace (porcentaje)
  marketplaceFeePercent: parseFloat(process.env.MP_MARKETPLACE_FEE_PERCENT || '10'),
  
  // URLs - se construyen dinámicamente basado en APP_URL
  get appUrl() {
    return process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  },
  get frontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:3001';
  },
};

export default mpConfig;
