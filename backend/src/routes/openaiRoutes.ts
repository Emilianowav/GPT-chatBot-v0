import { Router, Request, Response } from "express";
import { generarRespuesta } from "../controllers/openaiController.js";
import { openai } from "../config/openai.js";

const router = Router();

router.post("/chat", generarRespuesta);

/**
 * POST /api/openai/generar-contexto-variable
 * Genera contexto para una variable usando IA
 */
router.post('/generar-contexto-variable', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombreVariable, tipoNodo, personalidadActual } = req.body;

    if (!nombreVariable) {
      res.status(400).json({ error: 'nombreVariable es requerido' });
      return;
    }

    const prompt = `Genera un contexto breve (1-2 líneas) para esta variable en un GPT de WhatsApp:

Variable: ${nombreVariable}
Tipo de nodo: ${tipoNodo || 'GPT'}
Personalidad del bot: ${personalidadActual || 'Asistente profesional'}

El contexto debe explicar cómo el GPT debe usar esta variable en la conversación. 
Formato: "Tienes acceso a [variable] ({{${nombreVariable}}}). [Cómo usarla]."`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente que ayuda a documentar variables en flujos de WhatsApp. Genera descripciones breves y claras.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const contexto = completion.choices[0]?.message?.content || '';

    res.json({
      success: true,
      contexto,
    });
  } catch (error: any) {
    console.error('❌ Error generando contexto:', error);
    res.status(500).json({
      error: 'Error al generar contexto',
      message: error.message,
    });
  }
});

export default router;
