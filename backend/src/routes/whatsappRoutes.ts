import { Router } from "express";
import { recibirMensaje } from "../controllers/whatsappController.js"
import { deduplicateWebhook } from "../middlewares/deDuplicadorMeta.js";

const router = Router();

router.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado con Meta.");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});


router.post("/webhook", deduplicateWebhook, recibirMensaje);

// Endpoint de prueba para verificar que el servidor está funcionando
router.post("/webhook-test", (req, res) => {
  console.log('\n🧪 [TEST] Webhook de prueba recibido');
  console.log('🧪 [TEST] Body:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ 
    success: true, 
    message: 'Webhook test recibido correctamente',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para probar la configuración de WhatsApp
router.post("/test-webhook", async (req, res) => {
  try {
    const { phoneNumberId, accessToken } = req.body;
    
    console.log('\n🧪 [TEST WEBHOOK] Probando configuración de WhatsApp...');
    console.log('📱 Phone Number ID:', phoneNumberId);
    
    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'phoneNumberId y accessToken son requeridos'
      });
    }
    
    // Probar la conexión con la API de WhatsApp
    const testUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ [TEST WEBHOOK] Conexión exitosa con WhatsApp API');
      console.log('📞 Número verificado:', data.display_phone_number);
      
      res.status(200).json({
        success: true,
        message: 'Webhook configurado correctamente',
        phoneNumber: data.display_phone_number,
        verified: data.verified_name || 'No verificado',
      });
    } else {
      const errorData = await response.json();
      console.error('❌ [TEST WEBHOOK] Error en la API de WhatsApp:', errorData);
      
      res.status(400).json({
        success: false,
        error: errorData.error?.message || 'Error al verificar credenciales',
      });
    }
  } catch (error: any) {
    console.error('❌ [TEST WEBHOOK] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al probar webhook',
    });
  }
});

export default router;
