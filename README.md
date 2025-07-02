# AI ASTRO VOICE

{add more content here}

## Configuración e inicialización de BetterAuth

Este proyecto utiliza [BetterAuth](https://better-auth.dev/) para la autenticación por email y contraseña. Aquí te explicamos cómo inicializarlo y aplicar las migraciones necesarias en tu base de datos libSQL.

### Instalación de dependencias

Primero, instala las dependencias necesarias:

```bash
npm install better-auth @libsql/kysely-libsql @better-auth/cli
```

---

### Generación del secret para BetterAuth

BetterAuth necesita un secret para firmar las sesiones. Puedes generar uno con el siguiente comando:

```bash
npx @better-auth/cli secret
```

Esto te generará una línea similar a esta:

```bash
BETTER_AUTH_SECRET=c01fdfc5c2b1847a9ddd3474d515732b0e3cf49d38163f97f93063bb5d0123a6
```

Añádela en tu archivo `.env`:

```dotenv
# Better Auth Configuration
BETTER_AUTH_SECRET=c01fdfc5c2b1847a9ddd3474d515732b0e3cf49d38163f97f93063bb5d0123a6
BETTER_AUTH_URL=http://localhost:4321
```

> La URL es solo para desarrollo local. Ajusta según tu entorno.

---

### Aplicación de migraciones

BetterAuth incluye su propio sistema de migraciones para crear las tablas necesarias (usuarios, sesiones, etc.) dentro de tu base de datos libSQL.

Para ver un resumen previo de los cambios que se van a aplicar:

```bash
npx @better-auth/cli migrate
```

Si quieres aplicar directamente las migraciones sin confirmación interactiva:

```bash
npx @better-auth/cli migrate --y
```

Esto creará las tablas necesarias como `users`, con campos como `name`, `email`, `emailVerified`, `image`, `createdAt` y `updatedAt`.

---

### Resumen rápido de comandos

| Acción                     | Comando                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| Instalar dependencias      | `npm install better-auth @libsql/kysely-libsql @better-auth/cli` |
| Generar secret             | `npx @better-auth/cli secret`                                    |
| Ver migraciones pendientes | `npx @better-auth/cli migrate`                                   |
| Aplicar migraciones        | `npx @better-auth/cli migrate --y`                               |

---

## Sistema de Migraciones Personalizadas

Además de las migraciones de BetterAuth, este proyecto incluye un sistema de migraciones incrementales para gestionar cambios en la base de datos de manera ordenada.

### Estructura de migraciones

Las migraciones se almacenan en `database/migrations/` con el formato:
```
001_create_notes_table.sql
002_add_user_preferences.sql
003_add_indexes.sql
```

### Comandos de migración

```bash
# Ejecutar migraciones pendientes
npm run migrate

# Ver estado de migraciones
npm run migrate:status

# Limpiar registro de migración específica (para re-ejecutar)
node scripts/clean-migration.js <filename>

# Ejecutar directamente con Node.js
node scripts/migrate.js
node scripts/migrate.js status
```

### Crear una nueva migración

1. Crea un archivo SQL en `database/migrations/` con formato `XXX_description.sql`
2. Utiliza numeración secuencial (001, 002, 003...)
3. Incluye comentarios descriptivos en el archivo

Ejemplo de migración:
```sql
-- Migration: Add user preferences table
-- Created: 2025-07-02
-- Description: Stores user configuration and preferences

CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'es',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_userId ON user_preferences(userId);
```

### Características del sistema

- ✅ **Incremental**: Solo ejecuta migraciones no aplicadas
- ✅ **Tracking**: Registra migraciones ejecutadas en `migrations_log`
- ✅ **Checksum**: Detecta cambios en archivos ya ejecutados
- ✅ **Compatible**: Funciona con SQLite local y Turso cloud
- ✅ **Limpieza**: Herramienta para limpiar registros y re-ejecutar migraciones
- ✅ **Multi-entorno**: Respeta la configuración `USE_LOCAL_DB`

### Solución de problemas

Si una migración falla o necesitas re-ejecutarla:

```bash
# 1. Limpiar el registro de la migración fallida
node scripts/clean-migration.js 001_create_notes_table.sql

# 2. Verificar que está marcada como pendiente
npm run migrate:status

# 3. Ejecutar nuevamente
npm run migrate
```

**Notas importantes:**
- El sistema respeta `USE_LOCAL_DB` - cambia entre SQLite local y Turso
- Evita comentarios inline en SQL (`--`) ya que pueden romper el parsing
- Cada migración debe ser idempotente (usar `IF NOT EXISTS`)

### Resumen de comandos completos

| Acción                          | Comando                                 |
| ------------------------------- | --------------------------------------- |
| Migraciones BetterAuth          | `npx @better-auth/cli migrate --y`     |
| Migraciones personalizadas      | `npm run migrate`                       |
| Estado migraciones personalizadas | `npm run migrate:status`              |
| Limpiar migración específica    | `node scripts/clean-migration.js <file>` |
