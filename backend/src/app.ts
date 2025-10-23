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
import { errorHandler } from "./middlewares/errorHandler.js";
import { connectDB } from "./config/database.js";

import {
  refreshMetaToken,
  shouldRefreshMetaToken
} from "./services/metaTokenService.js";
import { iniciarServicioNotificaciones } from "./services/notificacionesService.js";

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

console.log('🔧 WebSocket Server creado');

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
      console.log('❌ Origen bloqueado por CORS:', origin);
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

// Middleware de logging simple (sin bucles infinitos)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/empresas", empresaRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/conversaciones", conversacionesRoutes);
app.use("/api/openai", openaiRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/modules/calendar", calendarRoutes);
app.use("/api", statusRoutes);
app.use(errorHandler);

// Inicialización de la aplicación
(async () => {
  try {
    // 1. Conectar a MongoDB
    console.log('🔌 Conectando a MongoDB...');
    await connectDB();
    
    // 2. Token refresh al iniciar
    if (shouldRefreshMetaToken()) {
      console.log("🔄 Refrescando token Meta al iniciar la app...");
      await refreshMetaToken();
    } else {
      console.log("🟢 Token Meta aún válido al iniciar.");
    }

    // 3. Refresco cada 24 horas (en lugar de 59 días)
    setInterval(async () => {
      if (shouldRefreshMetaToken()) {
        console.log("⏳ Token cercano a vencerse. Renovando...");
        await refreshMetaToken();
      } else {
        console.log("🕒 Token aún vigente. No se renueva.");
      }
    }, 1000 * 60 * 60 * 24); // Cada 24h

    // 4. Configurar WebSocket
    console.log('🔧 Configurando handlers de WebSocket...');
    
    wss.on('connection', (ws: WebSocket, req) => {
      console.log('🔌 Cliente WebSocket conectado desde:', req.socket.remoteAddress);
      console.log('📍 Path:', req.url);
      console.log('👥 Total clientes conectados:', wss.clients.size);
      
      // Enviar confirmación de conexión
      ws.send(JSON.stringify({ type: 'connected', message: 'Conexión establecida' }));
      
      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('📨 Mensaje WebSocket recibido:', data);
          
          // Suscribir cliente a una empresa específica
          if (data.type === 'subscribe' && data.empresaId) {
            (ws as any).empresaId = data.empresaId;
            console.log(`✅ Cliente suscrito a empresa: ${data.empresaId}`);
            ws.send(JSON.stringify({ type: 'subscribed', empresaId: data.empresaId }));
          }
        } catch (error) {
          console.error('❌ Error procesando mensaje WebSocket:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('🔌 Cliente WebSocket desconectado');
        console.log('👥 Total clientes conectados:', wss.clients.size);
      });
      
      ws.on('error', (error: Error) => {
        console.error('❌ Error WebSocket del cliente:', error);
      });
    });
    
    wss.on('error', (error: Error) => {
      console.error('❌ Error del servidor WebSocket:', error);
    });
    
    wss.on('listening', () => {
      console.log('👂 WebSocket Server escuchando...');
    });

    // 5. Iniciar servicio de notificaciones automáticas
    console.log('🔔 Iniciando servicio de notificaciones...');
    iniciarServicioNotificaciones();

    // 6. Iniciar servidor
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📊 MongoDB: Conectado`);
      console.log(`🔌 WebSocket: Activo en /ws`);
      console.log(`🌐 CORS: Orígenes permitidos:`);
      allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
      console.log(`🌐 Endpoints disponibles:`);
      console.log(`   - POST /api/whatsapp/webhook`);
      console.log(`   - GET  /api/status`);
      console.log(`   - GET  /api/usuarios`);
      console.log(`   - WS   ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error);
    process.exit(1);
  }
})();
