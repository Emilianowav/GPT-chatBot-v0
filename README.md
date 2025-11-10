# 🤖 GPT ChatBot - Sistema de Gestión de Turnos con WhatsApp

Sistema integral de gestión de turnos y atención al cliente vía WhatsApp, potenciado por IA (GPT) y plantillas de Meta.

## 📋 Características Principales

- 🤖 **Bot Conversacional** con GPT para atención automatizada
- 📅 **Gestión de Turnos** completa con calendario
- 👥 **Gestión de Agentes** y disponibilidad
- 📱 **Integración WhatsApp** con Meta Business API
- 🔔 **Notificaciones Automáticas** con plantillas de Meta
- 📊 **Dashboard Web** para administración
- 🔐 **Sistema de Autenticación** multi-empresa
- 🌐 **WebSocket** para actualizaciones en tiempo real

## 🏗️ Arquitectura

```
GPT-chatBot-v0/
├── backend/           # API Node.js + Express + MongoDB
│   ├── src/
│   │   ├── modules/calendar/  # Módulo de calendario
│   │   ├── flows/             # Flujos conversacionales
│   │   ├── services/          # Lógica de negocio
│   │   ├── utils/             # Utilidades (logger, etc)
│   │   └── types/             # Definiciones de tipos
│   └── docs/          # Documentación técnica
│
└── front_crm/         # Frontend Next.js
    └── bot_crm/
        └── src/
            ├── app/           # Páginas y rutas
            ├── components/    # Componentes React
            └── lib/           # APIs y utilidades
```

## 🚀 Inicio Rápido

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Configurar variables de entorno
npm run dev
```

### Frontend

```bash
cd front_crm/bot_crm
npm install
npm run dev
```

## 📚 Documentación

La documentación completa está organizada en `/docs`:

- **[Arquitectura](./docs/arquitectura/)** - Diseño del sistema
- **[Flujos](./docs/flujos/)** - Flujos conversacionales y notificaciones
- **[Migraciones](./docs/migraciones/)** - Historial de migraciones de BD
- **[Changelog](./docs/changelog/)** - Cambios y actualizaciones

## 🛠️ Scripts Disponibles

### Backend

```bash
npm run dev              # Desarrollo con hot-reload
npm run build            # Compilar TypeScript
npm start                # Producción
npm run tunnel           # Exponer con ngrok
npm run config:plantillas-meta    # Configurar plantillas
npm run migrate:sistema  # Migrar sistema de notificaciones
npm run verify:config    # Verificar configuración
```

### Frontend

```bash
npm run dev     # Desarrollo (puerto 3001)
npm run build   # Build de producción
npm start       # Servidor de producción
```

## 🔧 Tecnologías

### Backend
- Node.js + TypeScript
- Express.js
- MongoDB + Mongoose
- WebSocket (ws)
- OpenAI API
- Meta WhatsApp Business API
- Winston (logging)

### Frontend
- Next.js 15
- React 19
- TypeScript
- Lucide Icons
- CSS Modules

## 📦 Variables de Entorno

### Backend (.env)

```env
PORT=3000
MONGODB_URI=mongodb://...
OPENAI_API_KEY=sk-...
META_PHONE_NUMBER_ID=...
META_ACCESS_TOKEN=...
META_VERIFY_TOKEN=...
JWT_SECRET=...
```

## 🔐 Autenticación

El sistema utiliza JWT para autenticación. Cada empresa tiene su propio espacio aislado.

## 📱 Integración WhatsApp

El sistema se integra con Meta WhatsApp Business API para:
- Recibir mensajes de clientes
- Enviar respuestas automáticas
- Enviar notificaciones con plantillas aprobadas
- Gestionar conversaciones en tiempo real

## 🔔 Sistema de Notificaciones

Dos tipos de notificaciones automáticas:

1. **Confirmación de Turnos** - Recordatorios a clientes
2. **Notificaciones Diarias** - Agenda del día para agentes

Ambas usan plantillas de Meta para garantizar entrega fuera de la ventana de 24h.

## 🤝 Contribución

Este es un proyecto privado. Para contribuir, contacta al equipo de desarrollo.

## 📄 Licencia

Propietario - Todos los derechos reservados

## 📞 Soporte

Para soporte técnico, contacta al equipo de desarrollo.

---

**Última actualización:** Noviembre 2025
