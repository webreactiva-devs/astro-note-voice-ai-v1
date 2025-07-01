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
