// 🤖 Servicio para generar prompts con GPT
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Genera un prompt del sistema personalizado para el chatbot de una empresa
 */
export async function generarPromptEmpresa(data: {
  nombreEmpresa: string;
  categoria: string;
  personalidad?: string;
  tipoBot?: string;
  tipoNegocio?: string;
}) {
  try {
    const { nombreEmpresa, categoria, personalidad = '', tipoBot = 'conversacional', tipoNegocio = '' } = data;

    // Construir el contexto para GPT
    let contexto = `Genera un prompt del sistema profesional y efectivo para un chatbot de WhatsApp Business.

Información de la empresa:
- Nombre: ${nombreEmpresa}
- Categoría: ${categoria}
- Tipo de bot: ${tipoBot === 'conversacional' ? 'Conversacional (GPT)' : `Bot de pasos (${tipoNegocio})`}`;

    if (personalidad) {
      contexto += `\n- Personalidad deseada: ${personalidad}`;
    }

    contexto += `

El prompt debe:
1. Definir claramente el rol del asistente
2. Establecer el tono y personalidad apropiados para la categoría
3. Incluir instrucciones sobre cómo responder
4. Ser conciso pero completo (máximo 200 palabras)
5. Estar en español
6. Ser profesional pero amigable
7. Incluir el nombre de la empresa

${tipoBot === 'pasos' ? 'IMPORTANTE: Este bot usa un sistema de pasos/turnos, así que el prompt debe mencionar que el bot ayuda con reservas/turnos/citas.' : ''}

Genera SOLO el prompt, sin explicaciones adicionales.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en crear prompts efectivos para chatbots de atención al cliente. Generas prompts claros, profesionales y optimizados.'
        },
        {
          role: 'user',
          content: contexto
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const promptGenerado = completion.choices[0]?.message?.content?.trim() || '';

    if (!promptGenerado) {
      throw new Error('No se pudo generar el prompt');
    }

    console.log('✅ Prompt generado exitosamente para:', nombreEmpresa);

    return {
      success: true,
      prompt: promptGenerado,
      tokens: completion.usage?.total_tokens || 0
    };
  } catch (error: any) {
    console.error('❌ Error al generar prompt:', error);
    return {
      success: false,
      message: error.message || 'Error al generar prompt',
      prompt: ''
    };
  }
}
