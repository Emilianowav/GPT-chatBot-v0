import express from 'express';

const router = express.Router();

/**
 * Endpoint proxy para hacer requests HTTP desde el backend
 * Evita problemas de CORS al hacer requests desde el frontend
 */
router.post('/test-http-request', async (req, res) => {
  try {
    const { url, method, headers, queryParams, body, timeout } = req.body;

    console.log('🔧 [HTTP Proxy] Request recibido:', {
      url,
      method,
      queryParams
    });

    // Construir URL con query params
    let finalUrl = url;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams(queryParams);
      finalUrl = `${url}?${params.toString()}`;
    }

    console.log('🌐 [HTTP Proxy] URL final:', finalUrl);

    // Preparar opciones del fetch
    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: headers || {},
      signal: AbortSignal.timeout(timeout || 30000),
    };

    // Agregar body si no es GET
    if (body && method !== 'GET') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Ejecutar request
    const response = await fetch(finalUrl, fetchOptions);

    console.log('📊 [HTTP Proxy] Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [HTTP Proxy] Error:', errorText);
      return res.status(response.status).json({
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: errorText
      });
    }

    // Intentar parsear como JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    console.log('✅ [HTTP Proxy] Respuesta exitosa');

    res.json(data);
  } catch (error: any) {
    console.error('❌ [HTTP Proxy] Error:', error);
    res.status(500).json({
      error: error.message || 'Error al ejecutar la solicitud HTTP',
      details: error.toString()
    });
  }
});

export default router;
