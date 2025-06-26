import { Request, Response, NextFunction } from "express";

const processedMessages = new Set<string>();
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutos

function getMessageKey(req: Request): string | null {
  try {
    const mensajes = req.body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!mensajes || mensajes.length === 0) return null;

    const mensaje = mensajes[0];
    const id = mensaje.id;
    const timestamp = mensaje.timestamp;

    if (!id || !timestamp) return null;

    return `${id}-${timestamp}`;
  } catch {
    return null;
  }
}

export function deduplicateWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const messageKey = getMessageKey(req);

  if (!messageKey) {
    next();
    return;
  }

  if (processedMessages.has(messageKey)) {
    console.log(`⚠️ Mensaje duplicado ignorado: ${messageKey}`);
    res.sendStatus(200);
    return;
  }

  processedMessages.add(messageKey);
  setTimeout(() => processedMessages.delete(messageKey), CACHE_EXPIRATION);

  next();
}
