import { Router } from 'express';
import axios from 'axios';

const router = Router();

/**
 * Handler para probar requests HTTP desde el flow builder
 * Actúa como proxy para evitar problemas de CORS
 */
const testHttpRequest = async (req: any, res: any) => {
  try {
    const { url, method, headers, queryParams, body, timeout } = req.body;

    console.log('🧪 [HTTP PROXY] Test request recibido:', {
      url,
      method,
      queryParams,
      headers: Object.keys(headers || {}),
    });

    if (!url) {
      return res.status(400).json({ error: 'URL es requerida' });
    }

    // Construir URL con query params
    let finalUrl = url;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams(queryParams);
      finalUrl = `${url}?${params.toString()}`;
    }

    console.log('🌐 [HTTP PROXY] URL final:', finalUrl);

    // Ejecutar request
    const response = await axios({
      url: finalUrl,
      method: method || 'GET',
      headers: headers || {},
      data: body && method !== 'GET' ? (typeof body === 'string' ? JSON.parse(body) : body) : undefined,
      timeout: timeout || 30000,
      validateStatus: () => true, // No lanzar error en status codes
    });

    console.log('✅ [HTTP PROXY] Response status:', response.status);

    // Retornar respuesta completa
    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
    });
  } catch (error: any) {
    console.error('❌ [HTTP PROXY] Error:', error.message);
    
    if (error.response) {
      // Error de respuesta HTTP
      return res.status(error.response.status).json({
        error: error.message,
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // Error de red
      return res.status(500).json({
        error: 'Error de red: No se pudo conectar al servidor',
        details: error.message,
      });
    } else {
      // Otro tipo de error
      return res.status(500).json({
        error: error.message || 'Error desconocido',
      });
    }
  }
};

router.post('/test-http-request', testHttpRequest);

export default router;
