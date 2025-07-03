# 🚀 Guía de Despliegue

Esta guía detalla cómo configurar y desplegar la aplicación de notas de voz en diferentes entornos.

## 📋 Requisitos Previos

- Node.js 18+ o versión compatible
- npm 9.6.5+
- Cuenta en Groq para transcripción de audio
- Base de datos Turso configurada (para producción)

## 🔐 Configuración de Variables de Entorno

### 1. Configuración Inicial

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores
nano .env
```

### 2. Variables Obligatorias

#### 🔑 Autenticación
```bash
# Secret para JWT (mínimo 32 caracteres, único por entorno)
BETTER_AUTH_SECRET=tu-secret-super-seguro-de-32-caracteres-minimo

# URL base de la aplicación (usar HTTPS en producción)
BETTER_AUTH_URL=https://tu-dominio.com
```

#### 🤖 API Externa
```bash
# Clave de API de Groq para transcripción
GROQ_API_KEY=gsk_tu-api-key-de-groq
```

### 3. Configuración por Entorno

#### 🖥️ Desarrollo Local
```bash
NODE_ENV=development
USE_LOCAL_DB=true
BETTER_AUTH_URL=http://localhost:4321
ENABLE_DEBUG_LOGS=true
```

#### 🧪 Staging
```bash
NODE_ENV=staging
USE_LOCAL_DB=false
TURSO_DATABASE_URL=libsql://your-staging-db.turso.io
TURSO_AUTH_TOKEN=your-staging-auth-token
BETTER_AUTH_URL=https://staging.tu-dominio.com
ENABLE_DEBUG_LOGS=true
```

#### 🌐 Producción
```bash
NODE_ENV=production
USE_LOCAL_DB=false
TURSO_DATABASE_URL=libsql://your-prod-db.turso.io
TURSO_AUTH_TOKEN=your-prod-auth-token
BETTER_AUTH_URL=https://tu-dominio.com
ENABLE_DEBUG_LOGS=false

# Configuraciones de seguridad y performance
RATE_LIMIT_TRANSCRIPTION=5
RATE_LIMIT_NOTES=30
MAX_AUDIO_FILE_SIZE=10
```

## 🗃️ Configuración de Base de Datos

### Desarrollo Local (SQLite)
```bash
# Asegurar que el directorio existe
mkdir -p database

# Ejecutar migraciones
npm run migrate
```

### Producción (Turso)
```bash
# 1. Crear cuenta en Turso
turso auth signup

# 2. Crear base de datos
turso db create your-app-name

# 3. Obtener URL y token
turso db show your-app-name
turso db tokens create your-app-name

# 4. Configurar variables de entorno
export TURSO_DATABASE_URL="libsql://your-db-url.turso.io"
export TURSO_AUTH_TOKEN="your-auth-token"

# 5. Ejecutar migraciones
npm run migrate
```

## 🔧 Proceso de Construcción

### 1. Instalar Dependencias
```bash
npm ci --production=false
```

### 2. Validar Configuración
```bash
# La validación ocurre automáticamente al importar config
node -e "require('./src/lib/config.js').validateConfig(); console.log('✅ Config válida')"
```

### 3. Ejecutar Tests
```bash
npm run test:run
```

### 4. Construir para Producción
```bash
npm run build
```

### 5. Preview (Opcional)
```bash
npm run preview
```

## 🌍 Despliegue por Plataforma

### Vercel
```bash
# 1. Instalar CLI
npm i -g vercel

# 2. Configurar proyecto
vercel

# 3. Configurar variables de entorno en dashboard
# 4. Deploy
vercel --prod
```

### Netlify
```bash
# 1. Build command
npm run build

# 2. Publish directory
dist

# 3. Variables de entorno via dashboard
```

### Railway
```bash
# 1. Conectar repositorio
# 2. Configurar variables de entorno
# 3. Deploy automático
```

### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build

EXPOSE 4321
CMD ["npm", "run", "preview"]
```

## ⚙️ Variables de Entorno por Plataforma

### Vercel
- Configurar en dashboard: Project Settings → Environment Variables
- Usar diferentes valores para Preview/Production

### Netlify
- Site Settings → Environment Variables
- Build hooks para auto-deploy

### Railway
- Variables tab en proyecto
- Automatic deployments desde GitHub

## 🔍 Validación Post-Despliegue

### 1. Health Check
```bash
curl https://tu-dominio.com/api/db-check
```

### 2. Verificar Autenticación
```bash
curl https://tu-dominio.com/api/auth/session
```

### 3. Test de Rate Limiting
```bash
# Múltiples requests para verificar límites
for i in {1..10}; do curl -H "Authorization: Bearer token" https://tu-dominio.com/api/notes; done
```

## 🛠️ Troubleshooting

### Errores Comunes

#### ❌ "Invalid environment configuration"
- Verificar que todas las variables obligatorias estén configuradas
- Validar formato de URLs y tokens
- Revisar logs para detalles específicos

#### ❌ "Database connection failed"
- Verificar credenciales de Turso
- Confirmar que migraciones se ejecutaron
- Revisar conectividad de red

#### ❌ "Rate limit exceeded"
- Ajustar valores de RATE_LIMIT_*
- Implementar caching si es necesario
- Revisar patrones de uso

### Logs y Monitoreo

```bash
# Habilitar logs detallados
ENABLE_DEBUG_LOGS=true

# Verificar configuración cargada
# Los logs muestran configuración sanitizada (sin secrets)
```

## 🔒 Consideraciones de Seguridad

### Variables Sensibles
- Nunca commitear .env al repositorio
- Usar secrets management en producción
- Rotar BETTER_AUTH_SECRET regularmente
- Limitar acceso a GROQ_API_KEY

### Headers de Seguridad
```javascript
// Astro middleware automático
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
```

### Rate Limiting
- RATE_LIMIT_TRANSCRIPTION: 5/min (costoso)
- RATE_LIMIT_NOTES: 30/min (moderado)
- Ajustar según plan de Groq

## 📊 Monitoreo y Métricas

### Variables Opcionales
```bash
# Error tracking
SENTRY_DSN=https://your-sentry-dsn

# Analytics
GA_TRACKING_ID=GA-XXXXXXXXX
```

### Health Checks
- `/api/db-check` - Conectividad de base de datos
- `/api/auth/session` - Estado de autenticación
- Logs de aplicación para errores

## 🔄 Proceso de Actualización

### 1. Staging
```bash
git checkout develop
npm run build
npm run test:run
# Deploy to staging
# Verificar functionality
```

### 2. Producción
```bash
git checkout main
git merge develop
npm run build
npm run test:run
# Deploy to production
# Verificar post-deploy
```

### 3. Rollback (si es necesario)
```bash
# Revert deployment
# Verificar base de datos
# Comunicar incidencia
```

---

## 📞 Soporte

Para problemas de despliegue:
1. Revisar logs de aplicación
2. Verificar configuración de variables
3. Consultar troubleshooting section
4. Crear issue en repositorio con detalles

**¡Tu aplicación está lista para producción!** 🎉