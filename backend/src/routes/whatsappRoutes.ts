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

export default router;
