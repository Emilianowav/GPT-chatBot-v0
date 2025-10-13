# 📊 Migración a Base de Datos

## Por qué necesitas una base de datos

Render usa un sistema de archivos **efímero**:
- ❌ Los archivos JSON se pierden al reiniciar
- ❌ No hay persistencia de datos
- ❌ No es escalable

## Solución: MongoDB Atlas (Gratis)

### Paso 1: Crear cuenta en MongoDB Atlas
1. Ve a https://www.mongodb.com/cloud/atlas/register
2. Crea una cuenta gratuita
3. Crea un cluster (M0 - Free tier)
4. Obtén tu connection string

### Paso 2: Instalar dependencias
```bash
npm install mongoose
npm install --save-dev @types/mongoose
```

### Paso 3: Configurar variables de entorno
En Render, agrega:
```
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/chatbot?retryWrites=true&w=majority
```

### Paso 4: Crear modelos de Mongoose

Ver archivos:
- `src/models/Usuario.ts`
- `src/models/Empresa.ts`

### Paso 5: Actualizar `usuarioStore.ts`
Reemplazar funciones de lectura/escritura de archivos por operaciones de MongoDB.

## Alternativa: PostgreSQL en Render

Render ofrece PostgreSQL gratuito:
1. Crea una base de datos PostgreSQL en Render
2. Usa `pg` o `prisma` como ORM
3. Conecta tu aplicación

## Opción temporal: Render Disk

Si no quieres migrar ahora, usa Render Disk:
1. Sube el archivo `render.yaml` a tu repositorio
2. Render detectará automáticamente la configuración
3. Los datos persistirán en `/opt/render/project/src/data`

**Costo**: $0.25/GB/mes (1GB = $0.25/mes)
