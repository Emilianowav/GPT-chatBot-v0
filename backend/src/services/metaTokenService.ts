// services/metaTokenService.ts
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const tokenPath = path.resolve('./data/token-meta.json');

export const getMetaToken = (): string => {
  const data = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  return data.access_token;
};

export const refreshMetaToken = async (): Promise<void> => {
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const shortToken = process.env.META_WHATSAPP_TOKEN!;

  const url = `https://graph.facebook.com/v18.0/oauth/access_token` +
    `?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}` +
    `&fb_exchange_token=${shortToken}`;

  try {
    const res = await axios.get(url);
    const newToken = res.data.access_token;
    const expiresIn = res.data.expires_in || 5184000; // 60 días por defecto (en segundos)

    fs.writeFileSync(tokenPath, JSON.stringify({
      access_token: newToken,
      created_at: Date.now(),
      expires_in: expiresIn
    }, null, 2));

    console.log('✅ Meta token actualizado automáticamente');
  } catch (error) {
    console.error('❌ Error al refrescar el token Meta:');
  }
};

export const shouldRefreshMetaToken = (): boolean => {
  try {
    const { created_at, expires_in } = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    const now = Date.now();
    const timePassed = now - created_at;
    const expiryThreshold = (expires_in - 3600) * 1000; // 1 hora antes de expirar
    return timePassed >= expiryThreshold;
  } catch (e) {
    console.warn('⚠️ No se pudo leer el token actual. Se forzará una renovación.');
    return true;
  }
};
