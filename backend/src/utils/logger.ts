/**
 * Sistema de Logging Profesional
 * Reemplaza console.log con un sistema estructurado y configurable
 */

import winston from 'winston';
import path from 'path';

// Definir niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Definir colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Formato para consola (desarrollo)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Formato para archivos (producción)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Crear transports
const transports: winston.transport[] = [];

// En desarrollo, log a consola
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// En producción, log a archivos
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: fileFormat,
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: fileFormat,
    })
  );
}

// Crear logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  transports,
  exitOnError: false,
});

// Helpers para logging específico
export const loggers = {
  // Sistema general
  system: (message: string, meta?: any) => logger.info(`[SYSTEM] ${message}`, meta),
  
  // Base de datos
  db: (message: string, meta?: any) => logger.info(`[DB] ${message}`, meta),
  
  // API/HTTP
  api: (message: string, meta?: any) => logger.http(`[API] ${message}`, meta),
  
  // WhatsApp
  whatsapp: (message: string, meta?: any) => logger.info(`[WHATSAPP] ${message}`, meta),
  
  // Flujos
  flow: (message: string, meta?: any) => logger.info(`[FLOW] ${message}`, meta),
  
  // Notificaciones
  notification: (message: string, meta?: any) => logger.info(`[NOTIFICATION] ${message}`, meta),
  
  // Turnos
  appointment: (message: string, meta?: any) => logger.info(`[APPOINTMENT] ${message}`, meta),
  
  // Errores
  error: (message: string, error?: Error | any) => {
    if (error instanceof Error) {
      logger.error(`[ERROR] ${message}`, { 
        error: error.message, 
        stack: error.stack 
      });
    } else {
      logger.error(`[ERROR] ${message}`, error);
    }
  },
  
  // Warnings
  warn: (message: string, meta?: any) => logger.warn(`[WARN] ${message}`, meta),
  
  // Debug (solo en desarrollo)
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`[DEBUG] ${message}`, meta);
    }
  },
};

// Stream para Morgan (HTTP logging)
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
