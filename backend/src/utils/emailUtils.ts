// src/utils/emailUtils.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const enviarCorreo = async ({
  to,
  subject,
  text,
  html,
  numeroUsuario,
  nombreUsuario = 'Sin nombre'
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  numeroUsuario: string; // ← Requerido
  nombreUsuario?: string; // ← Opcional
}) => {
  // 📌 Generar thread-id único para el usuario
  const userThreadId = `chat-${numeroUsuario}@aszimotos.local`;

  const messageId = `<${Date.now()}-${Math.random().toString(36).slice(2)}@aszimotos.local>`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `[${nombreUsuario} | ${numeroUsuario}] ${subject}`,
    ...(text ? { text } : {}),
    ...(html ? { html } : {}),
    headers: {
      'Message-ID': messageId,
      'In-Reply-To': `<${userThreadId}>`,
      'References': `<${userThreadId}>`,
    },
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[emailUtils] Correo enviado a ${to} (Usuario: ${numeroUsuario})`);
  } catch (error) {
    console.error('[emailUtils] Error al enviar correo:', error);
  }
};
