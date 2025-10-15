# 🚀 Configuración de Variables de Entorno en Vercel

## 📋 Variables Requeridas

Tu aplicación necesita estas variables de entorno para conectarse al backend en Render:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://gpt-chatbot-v0.onrender.com` | URL del backend API |
| `NEXT_PUBLIC_WS_URL` | `wss://gpt-chatbot-v0.onrender.com/ws` | URL del WebSocket |

---

## 🔧 Pasos para Configurar en Vercel

### 1️⃣ Accede a tu Proyecto en Vercel

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto: **momento-ebon**

### 2️⃣ Configura las Variables de Entorno

1. Click en **Settings** (⚙️)
2. En el menú lateral, click en **Environment Variables**
3. Agrega cada variable:

#### Variable 1: API URL
```
Name:  NEXT_PUBLIC_API_URL
Value: https://gpt-chatbot-v0.onrender.com
Environment: Production, Preview, Development (seleccionar todos)
```

#### Variable 2: WebSocket URL
```
Name:  NEXT_PUBLIC_WS_URL
Value: wss://gpt-chatbot-v0.onrender.com/ws
Environment: Production, Preview, Development (seleccionar todos)
```

### 3️⃣ Redeploy el Proyecto

Después de agregar las variables:

**Opción A - Desde Vercel Dashboard:**
1. Ve a **Deployments**
2. Click en los 3 puntos (...) del último deployment
3. Click en **Redeploy**
4. Confirma el redeploy

**Opción B - Desde Git:**
```bash
git add .
git commit -m "docs: add environment variables setup"
git push
```

Vercel automáticamente hará un nuevo deploy con las variables configuradas.

---

## ✅ Verificar la Configuración

### 1. Verifica que las variables estén configuradas:
- Ve a **Settings > Environment Variables**
- Deberías ver ambas variables listadas

### 2. Verifica que el deploy fue exitoso:
- Ve a **Deployments**
- El último deployment debe estar en estado **Ready**

### 3. Prueba la aplicación:
1. Abre: `https://momento-ebon.vercel.app`
2. Intenta hacer login
3. Abre la consola del navegador (F12)
4. Verifica que las peticiones vayan a `https://gpt-chatbot-v0.onrender.com`

---

## 🐛 Troubleshooting

### Error: "Failed to fetch" o "ERR_CONNECTION_REFUSED"

**Causa:** Las variables de entorno no están configuradas o el deploy no se hizo después de configurarlas.

**Solución:**
1. Verifica que las variables estén en Vercel
2. Haz un redeploy
3. Limpia la caché del navegador (Ctrl + Shift + R)

### Error: "CORS policy"

**Causa:** El backend no tiene configurado el origen de Vercel.

**Solución:**
Ya está configurado en el backend (`app.ts`):
```typescript
const allowedOrigins = [
  'https://momento-ebon.vercel.app'
];
```

Si cambias el dominio de Vercel, actualiza esta lista en el backend.

---

## 📝 Desarrollo Local

Para desarrollo local, crea un archivo `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws
```

**Nota:** Este archivo está en `.gitignore` y no se sube a Git.

---

## 🔄 Actualizar URLs del Backend

Si cambias la URL del backend en Render:

1. Actualiza las variables en Vercel
2. Actualiza `allowedOrigins` en el backend
3. Redeploy ambos servicios

---

## 📚 Referencias

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
