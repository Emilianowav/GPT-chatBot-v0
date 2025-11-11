// index.ts o app.ts
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import openaiRoutes from "./routes/openaiRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import statusRoutes from "./routes/statusRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import empresaRoutes from "./routes/empresaRoutes.js";
import conversacionesRoutes from "./routes/conversacionesRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import calendarRoutes from "./modules/calendar/routes/calendarRoutes.js";
import flujosRoutes from "./modules/calendar/routes/flujos.js";
import notificacionesMetaRoutes from "./modules/calendar/routes/notificacionesMeta.js";
import mensajesFlujoRoutes from "./modules/calendar/routes/mensajesFlujoRoutes.js";
import usuarioEmpresaRoutes from "./routes/usuarioEmpresaRoutes.js";
import flowRoutes from "./routes/flowRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { connectDB } from "./config/database.js";
import { loggers } from "./utils/logger.js";

import {
  refreshMetaToken,
  shouldRefreshMetaToken
} from "./services/metaTokenService.js";
import { procesarNotificacionesDiariasAgentes, procesarNotificacionesConfirmacion } from "./services/notificacionesMetaService.js";
import { initializeFlows } from "./flows/index.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Crear servidor HTTP
const server = http.createServer(app);

// Crear servidor WebSocket
export const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  perMessageDeflate: false,
  clientTracking: true
});

loggers.system('WebSocket Server creado');

// CORS configuration - Orígenes permitidos
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://momento-ebon.vercel.app',
  'https://www.momentoia.co',
  'https://momentoia.co' // Sin www también
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      loggers.warn('Origen bloqueado por CORS', { origin });
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging HTTP
app.use((req, res, next) => {
  loggers.api(`${req.method} ${req.originalUrl}`, { origin: req.headers.origin || 'none' });
  next();
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/empresas", empresaRoutes);
app.use("/api/usuarios-empresa", usuarioEmpresaRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/conversaciones", conversacionesRoutes);
app.use("/api/openai", openaiRoutes);
app.use("/api/whatsapp", whatsappRoutes);
// ⚠️ IMPORTANTE: Rutas específicas ANTES de rutas generales
app.use("/api/modules/calendar/notificaciones-meta", notificacionesMetaRoutes);
app.use("/api/modules/calendar/mensajes-flujo", mensajesFlujoRoutes);
app.use("/api/modules/calendar", calendarRoutes);
app.use("/api/flujos", flujosRoutes);
app.use("/api/flows", flowRoutes);
app.use("/api", statusRoutes);
app.use(errorHandler);

// Inicialización de la aplicación
(async () => {
  try {
    // 1. Conectar a MongoDB
    loggers.db('Conectando a MongoDB...');
    await connectDB();
    
    // 1.5. Inicializar sistema de flujos dinámicos
    loggers.flow('Inicializando sistema de flujos...');
    initializeFlows();
    
    // 2. Token refresh al iniciar
    if (shouldRefreshMetaToken()) {
      loggers.system('Refrescando token Meta al iniciar la app...');
      await refreshMetaToken();
    } else {
      loggers.system('Token Meta aún válido al iniciar.');
    }

    // 3. Refresco cada 24 horas (en lugar de 59 días)
    setInterval(async () => {
      if (shouldRefreshMetaToken()) {
        loggers.system('Token cercano a vencerse. Renovando...');
        await refreshMetaToken();
      } else {
        loggers.debug('Token aún vigente. No se renueva.');
      }
    }, 1000 * 60 * 60 * 24); // Cada 24h

    // 4. Configurar WebSocket
    loggers.system('Configurando handlers de WebSocket...');
    
    wss.on('connection', (ws: WebSocket, req) => {
      loggers.system('Cliente WebSocket conectado', { 
        from: req.socket.remoteAddress,
        path: req.url,
        totalClients: wss.clients.size
      });
      
      // Enviar confirmación de conexión
      ws.send(JSON.stringify({ type: 'connected', message: 'Conexión establecida' }));
      
      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          loggers.debug('Mensaje WebSocket recibido', data);
          
          // Suscribir cliente a una empresa específica
          if (data.type === 'subscribe' && data.empresaId) {
            (ws as any).empresaId = data.empresaId;
            loggers.system('Cliente suscrito a empresa', { empresaId: data.empresaId });
            ws.send(JSON.stringify({ type: 'subscribed', empresaId: data.empresaId }));
          }
        } catch (error) {
          loggers.error('Error procesando mensaje WebSocket', error);
        }
      });
      
      ws.on('close', () => {
        loggers.system('Cliente WebSocket desconectado', { totalClients: wss.clients.size });
      });
      
      ws.on('error', (error: Error) => {
        loggers.error('Error WebSocket del cliente', error);
      });
    });
    
    wss.on('error', (error: Error) => {
      loggers.error('Error del servidor WebSocket', error);
    });
    
    wss.on('listening', () => {
      loggers.system('WebSocket Server escuchando...');
    });

    // 5. ✅ NUEVO SISTEMA UNIFICADO DE NOTIFICACIONES
    loggers.notification('Iniciando sistema unificado de notificaciones con Plantillas de Meta...');
    
    // 5.1. Notificaciones diarias para agentes (cada minuto)
    loggers.notification('Notificaciones diarias de agentes: ACTIVAS');
    loggers.debug('Verificación flexible: hora_fija o inicio_jornada_agente');
    loggers.debug('Solo plantillas de Meta (ventana 24h)');
    
    setInterval(async () => {
      try {
        await procesarNotificacionesDiariasAgentes();
      } catch (error) {
        loggers.error('Error en notificaciones diarias', error);
      }
    }, 60 * 1000);

    // 5.2. Notificaciones de confirmación para clientes (cada minuto)
    loggers.notification('Notificaciones de confirmación: ACTIVAS');
    loggers.debug('Verificación flexible: hora_fija o horas_antes_turno');
    loggers.debug('Solo plantillas de Meta (ventana 24h)');
    
    setInterval(async () => {
      try {
        await procesarNotificacionesConfirmacion();
      } catch (error) {
        loggers.error('Error en notificaciones de confirmación', error);
      }
    }, 60 * 1000);

    // Ejecutar una vez al iniciar (después de 5 segundos)
    setTimeout(async () => {
      try {
        await procesarNotificacionesDiariasAgentes();
        await procesarNotificacionesConfirmacion();
      } catch (error) {
        loggers.error('Error en ejecución inicial', error);
      }
    }, 5000);

    // 8. Iniciar servidor
    server.listen(PORT, () => {
      loggers.system(`Servidor corriendo en puerto ${PORT}`);
      loggers.db('MongoDB: Conectado');
      loggers.system('WebSocket: Activo en /ws');
      loggers.system('CORS: Orígenes permitidos', { origins: allowedOrigins });
      loggers.system('Endpoints disponibles', {
        webhook: 'POST /api/whatsapp/webhook',
        status: 'GET /api/status',
        usuarios: 'GET /api/usuarios',
        websocket: `ws://localhost:${PORT}/ws`
      });
    });
  } catch (error) {
    loggers.error('Error al iniciar la aplicación', error);
    process.exit(1);
  }
})();
