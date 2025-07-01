## Installation

### Install the Package

Let's start by adding Better Auth to your project:

```
npm install better-auth
```

### Set Environment Variables

Create a `.env` file in the root of your project and add the following environment variables:

1. **Secret Key**

Random value used by the library for encryption and generating hashes. **You can generate one using the button below** or you can use something like openssl.

.env

```
BETTER_AUTH_SECRET=
```

1. **Set Base URL**

.env

```
BETTER_AUTH_URL=http://localhost:3000 #Base URL of your app
```

### Create A Better Auth Instance

Create a file named `auth.ts` in one of these locations:

- Project root
- `lib/` folder
- `utils/` folder

You can also nest any of these folders under `src/`, `app/` or `server/` folder. (e.g. `src/lib/auth.ts`, `app/lib/auth.ts`).

And in this file, import Better Auth and create your auth instance. Make sure to export the auth instance with the variable name `auth` or as a `default` export.

auth.ts

```
import { betterAuth } from "better-auth";

 

export const auth = betterAuth({

    //...

})
```

### Configure Database

Better Auth requires a database to store user data. You can easily configure Better Auth to use SQLite, PostgreSQL, or MySQL, with Kysely handling queries and migrations for these databases.

auth.ts

```
import { betterAuth } from "better-auth";

import Database from "better-sqlite3";

 

export const auth = betterAuth({

    database: new Database("./sqlite.db"),

})
```

You can also provide any Kysely dialect or a Kysely instance to the `database` option.

**Example with LibsqlDialect:**

auth.ts

```
import { betterAuth } from "better-auth";

import { LibsqlDialect } from "@libsql/kysely-libsql";

 

const dialect = new LibsqlDialect({

    url: process.env.TURSO_DATABASE_URL || "",

    authToken: process.env.TURSO_AUTH_TOKEN || "",

})

 

export const auth = betterAuth({

  database: {

    dialect,

    type: "sqlite"

  }

});
```

**Adapters**

If you prefer to use an ORM or if your database is not supported by Kysely, you can use one of the built-in adapters.

auth.ts

```
import { betterAuth } from "better-auth";

import { prismaAdapter } from "better-auth/adapters/prisma";

// If your Prisma file is located elsewhere, you can change the path

import { PrismaClient } from "@/generated/prisma";

 

const prisma = new PrismaClient();

export const auth = betterAuth({

    database: prismaAdapter(prisma, {

        provider: "sqlite", // or "mysql", "postgresql", ...etc

    }),

});
```

### Create Database Tables

Better Auth includes a CLI tool to help manage the schema required by the library.

- **Generate**: This command generates an ORM schema or SQL migration file.

Terminal

```
npx @better-auth/cli generate
```

- **Migrate**: This command creates the required tables directly in the database. (Available only for the built-in Kysely adapter)

Terminal

```
npx @better-auth/cli migrate
```

see the [CLI documentation](https://www.better-auth.com/docs/concepts/cli) for more information.


### Authentication Methods

Configure the authentication methods you want to use. Better Auth comes with built-in support for email/password, and social sign-on providers.

auth.ts

### Mount Handler

To handle API requests, you need to set up a route handler on your server.

Create a new file or route in your framework's designated catch-all route handler. This route should handle requests for the path `/api/auth/*` (unless you've configured a different base path).

/app/api/auth/\[...all\]/route.ts

```
import { auth } from "@/lib/auth"; // path to your auth file

import { toNextJsHandler } from "better-auth/next-js";

 

export const { POST, GET } = toNextJsHandler(auth);
```

### Create Client Instance

The client-side library helps you interact with the auth server. Better Auth comes with a client for all the popular web frameworks, including vanilla JavaScript.

1. Import `createAuthClient` from the package for your framework (e.g., "better-auth/react" for React).
2. Call the function to create your client.
3. Pass the base URL of your auth server. (If the auth server is running on the same domain as your client, you can skip this step.)

lib/auth-client.ts

```
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({

    /** The base URL of the server (optional if you're using the same domain) */

    baseURL: "http://localhost:3000"

})
```### [Comparison](https://www.better-auth.com/docs/comparison)

[

Comparison of Better Auth versus over other auth libraries and services.

](https://www.better-auth.com/docs/comparison)Basic Usage

Getting started with Better Auth

[View original](https://www.better-auth.com/docs/basic-usage)

[Edit on GitHub](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/installation.mdx)

## CLI

Better Auth comes with a built-in CLI to help you manage the database schemas, initialize your project, and generate a secret key for your application.

## Generate

The `generate` command creates the schema required by Better Auth. If you're using a database adapter like Prisma or Drizzle, this command will generate the right schema for your ORM. If you're using the built-in Kysely adapter, it will generate an SQL file you can run directly on your database.

Terminal

```
npx @better-auth/cli@latest generate
```

### Options

- `--output` - Where to save the generated schema. For Prisma, it will be saved in prisma/schema.prisma. For Drizzle, it goes to schema.ts in your project root. For Kysely, it’s an SQL file saved as schema.sql in your project root.
- `--config` - The path to your Better Auth config file. By default, the CLI will search for a auth.ts file in **./**, **./utils**, **./lib**, or any of these directories under `src` directory.
- `--y` - Skip the confirmation prompt and generate the schema directly.

## Migrate

The migrate command applies the Better Auth schema directly to your database. This is available if you’re using the built-in Kysely adapter. For other adapters, you'll need to apply the schema using your ORM's migration tool.

Terminal

```
npx @better-auth/cli@latest migrate
```

### Options

- `--config` - The path to your Better Auth config file. By default, the CLI will search for a auth.ts file in **./**, **./utils**, **./lib**, or any of these directories under `src` directory.
- `--y` - Skip the confirmation prompt and apply the schema directly.

## Init

The `init` command allows you to initialize Better Auth in your project.

Terminal

```
npx @better-auth/cli@latest init
```

### Options

- `--name` - The name of your application. (Defaults to your `package.json` 's `name` property.)
- `--framework` - The framework your codebase is using. Currently, the only supported framework is `nextjs`.
- `--plugins` - The plugins you want to use. You can specify multiple plugins by separating them with a comma.
- `--database` - The database you want to use. Currently, the only supported database is `sqlite`.
- `--package-manager` - The package manager you want to use. Currently, the only supported package managers are `npm`, `pnpm`, `yarn`, `bun`. (Defaults to the manager you used to initialize the CLI.)

## Secret

The CLI also provides a way to generate a secret key for your Better Auth instance.

Terminal

```
npx @better-auth/cli@latest secret
```

## Common Issues

**Error: Cannot find module X**

If you see this error, it means the CLI can’t resolve imported modules in your Better Auth config file. We're working on a fix for many of these issues, but in the meantime, you can try the following:

- Remove any import aliases in your config file and use relative paths instead. After running the CLI, you can revert to using aliases.### [API](https://www.better-auth.com/docs/concepts/api)

[

Better Auth API.

](https://www.better-auth.com/docs/concepts/api)Client

Better Auth client library for authentication.

[View original](https://www.better-auth.com/docs/concepts/client)

[Edit on GitHub](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/concepts/cli.mdx)


## Basic Usage

Better Auth provides built-in authentication support for:

- **Email and password**
- **Social provider (Google, GitHub, Apple, and more)**

But also can easily be extended using plugins, such as: [username](https://www.better-auth.com/docs/plugins/username), [magic link](https://www.better-auth.com/docs/plugins/magic-link), [passkey](https://www.better-auth.com/docs/plugins/passkey), [email-otp](https://www.better-auth.com/docs/plugins/email-otp), and more.

## Email & Password

To enable email and password authentication:

auth.ts

```
import { betterAuth } from "better-auth"

 

export const auth = betterAuth({

    emailAndPassword: {    

        enabled: true

    } 

})
```

### Sign Up

To sign up a user you need to call the client method `signUp.email` with the user's information.

sign-up.ts

By default, the users are automatically signed in after they successfully sign up. To disable this behavior you can set `autoSignIn` to `false`.

auth.ts

```
import { betterAuth } from "better-auth"

 

export const auth = betterAuth({

    emailAndPassword: {

        enabled: true,

        autoSignIn: false //defaults to true

  },

})
```

### Sign In

To sign a user in, you can use the `signIn.email` function provided by the client.

sign-in

```
const { data, error } = await authClient.signIn.email({

        /**

         * The user email

         */

        email,

        /**

         * The user password

         */

        password,

        /**

         * A URL to redirect to after the user verifies their email (optional)

         */

        callbackURL: "/dashboard",

        /**

         * remember the user session after the browser is closed. 

         * @default true

         */

        rememberMe: false

}, {

    //callbacks

})
```

### Server-Side Authentication

To authenticate a user on the server, you can use the `auth.api` methods.

server.ts

```
import { auth } from "./auth"; // path to your Better Auth server instance

 

const response = await auth.api.signInEmail({

    body: {

        email,

        password

    },

    asResponse: true // returns a response object instead of data

});
```

## Social Sign-On

Better Auth supports multiple social providers, including Google, GitHub, Apple, Discord, and more. To use a social provider, you need to configure the ones you need in the `socialProviders` option on your `auth` object.

auth.ts

### Sign in with social providers

To sign in using a social provider you need to call `signIn.social`. It takes an object with the following properties:

sign-in.ts

You can also authenticate using `idToken` or `accessToken` from the social provider instead of redirecting the user to the provider's site. See social providers documentation for more details.

## Signout

To signout a user, you can use the `signOut` function provided by the client.

user-card.tsx

```
await authClient.signOut();
```

you can pass `fetchOptions` to redirect onSuccess

user-card.tsx

## Session

Once a user is signed in, you'll want to access the user session. Better Auth allows you easily to access the session data from the server and client side.

### Client Side

#### Use Session

Better Auth provides a `useSession` hook to easily access session data on the client side. This hook is implemented using nanostore and has support for each supported framework and vanilla client, ensuring that any changes to the session (such as signing out) are immediately reflected in your UI.

user.tsx

```
import { authClient } from "@/lib/auth-client" // import the auth client

 

export function User(){

 

    const { 

        data: session, 

        isPending, //loading state

        error, //error object

        refetch //refetch the session

    } = authClient.useSession() 

 

    return (

        //...

    )

}
```

#### Get Session

If you prefer not to use the hook, you can use the `getSession` method provided by the client.

user.tsx

```
import { authClient } from "@/lib/auth-client" // import the auth client

 

const { data: session, error } = await authClient.getSession()
```

You can also use it with client-side data-fetching libraries like [TanStack Query](https://tanstack.com/query/latest).

### Server Side

The server provides a `session` object that you can use to access the session data. It requires request headers object to be passed to the `getSession` method.

**Example: Using some popular frameworks**

## Using Plugins

One of the unique features of Better Auth is a plugins ecosystem. It allows you to add complex auth related functionality with small lines of code.

Below is an example of how to add two factor authentication using two factor plugin.

### Server Configuration

To add a plugin, you need to import the plugin and pass it to the `plugins` option of the auth instance. For example, to add two factor authentication, you can use the following code:

auth.ts

```
import { betterAuth } from "better-auth"

import { twoFactor } from "better-auth/plugins"

 

export const auth = betterAuth({

    //...rest of the options

    plugins: [ 

        twoFactor() 

    ] 

})
```

now two factor related routes and method will be available on the server.

### Migrate Database

After adding the plugin, you'll need to add the required tables to your database. You can do this by running the `migrate` command, or by using the `generate` command to create the schema and handle the migration manually.

generating the schema:

terminal

```
npx @better-auth/cli generate
```

using the `migrate` command:

terminal

```
npx @better-auth/cli migrate
```

### Client Configuration

Once we're done with the server, we need to add the plugin to the client. To do this, you need to import the plugin and pass it to the `plugins` option of the auth client. For example, to add two factor authentication, you can use the following code:

auth-client.ts

```
import { createAuthClient } from "better-auth/client";

import { twoFactorClient } from "better-auth/client/plugins"; 

 

const authClient = createAuthClient({

    plugins: [ 

        twoFactorClient({ 

            twoFactorPage: "/two-factor" // the page to redirect if a user need to verify 2nd factor

        }) 

    ] 

})
```

now two factor related methods will be available on the client.

profile.ts

```
import { authClient } from "./auth-client"

 

const enableTwoFactor = async() => {

    const data = await authClient.twoFactor.enable({

        password // the user password is required

    }) // this will enable two factor

}

 

const disableTwoFactor = async() => {

    const data = await authClient.twoFactor.disable({

        password // the user password is required

    }) // this will disable two factor

}

 

const signInWith2Factor = async() => {

    const data = await authClient.signIn.email({

        //...

    })

    //if the user has two factor enabled, it will redirect to the two factor page

}

 

const verifyTOTP = async() => {

    const data = await authClient.twoFactor.verifyTOTP({

        code: "123456", // the code entered by the user 

        /**

         * If the device is trusted, the user won't

         * need to pass 2FA again on the same device

         */

        trustDevice: true

    })

}
```

Next step: See the [two factor plugin documentation](https://www.better-auth.com/docs/plugins/2fa).### [Installation](https://www.better-auth.com/docs/installation)

[

Learn how to configure Better Auth in your project.

](https://www.better-auth.com/docs/installation)API

Better Auth API.

[View original](https://www.better-auth.com/docs/concepts/api)

[Edit on GitHub](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/basic-usage.mdx)

## Astro Integration

Better Auth comes with first class support for Astro. This guide will show you how to integrate Better Auth with Astro.

Before you start, make sure you have a Better Auth instance configured. If you haven't done that yet, check out the [installation](https://www.better-auth.com/docs/installation).

### Mount the handler

To enable Better Auth to handle requests, we need to mount the handler to a catch all API route. Create a file inside `/pages/api/auth` called `[...all].ts` and add the following code:

pages/api/auth/\[...all\].ts

## Create a client

Astro supports multiple frontend frameworks, so you can easily import your client based on the framework you're using.

If you're not using a frontend framework, you can still import the vanilla client.

lib/auth-client.ts

```
import { createAuthClient } from "better-auth/client"

export const authClient =  createAuthClient()
```

## Auth Middleware

### Astro Locals types

To have types for your Astro locals, you need to set it inside the `env.d.ts` file.

env.d.ts

```
/// <reference path="../.astro/types.d.ts" />

 

declare namespace App {

    // Note: 'import {} from ""' syntax does not work in .d.ts files.

    interface Locals {

        user: import("better-auth").User | null;

        session: import("better-auth").Session | null;

    }

}
```

### Middleware

To protect your routes, you can check if the user is authenticated using the `getSession` method in middleware and set the user and session data using the Astro locals with the types we set before. Start by creating a `middleware.ts` file in the root of your project and follow the example below:

middleware.ts

### Getting session on the server inside.astro file

You can use `Astro.locals` to check if the user has session and get the user data from the server side. Here is an example of how you can get the session inside an `.astro` file:### [Community Adapters](https://www.better-auth.com/docs/adapters/community-adapters)

[

Integrate Better Auth with community made database adapters.

](https://www.better-auth.com/docs/adapters/community-adapters)Remix Integration

Integrate Better Auth with Remix.

[View original](https://www.better-auth.com/docs/integrations/remix)

[Edit on GitHub](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/integrations/astro.mdx)



## SQLite

SQLite is a lightweight, serverless, self-contained SQL database engine that is widely used for local data storage in applications. Read more [here.](https://www.sqlite.org/)

## Example Usage

Make sure you have SQLite installed and configured. Then, you can connect it straight into Better Auth.

auth.ts

```
import { betterAuth } from "better-auth";

import Database from "better-sqlite3";

 

export const auth = betterAuth({

  database: new Database("database.sqlite"),

});
```

## Schema generation & migration

The [Better Auth CLI](https://www.better-auth.com/docs/concepts/cli) allows you to generate or migrate your database schema based on your Better Auth configuration and plugins.

| SQLite Schema Generation | SQLite Schema Migration |
| ------------------------ | ----------------------- |
| ✅ Supported              | ✅ Supported             |

Schema Generation

```
npx @better-auth/cli@latest generate
```

Schema Migration

```
npx @better-auth/cli@latest migrate
```

## Additional Information

SQLite is supported under the hood via the [Kysely](https://kysely.dev/) adapter, any database supported by Kysely would also be supported. ([Read more here](https://www.better-auth.com/docs/adapters/other-relational-databases))

If you're looking for performance improvements or tips, take a look at our guide to [performance optimizations](https://www.better-auth.com/docs/guides/optimizing-for-performance).### [MySQL](https://www.better-auth.com/docs/adapters/mysql)

[

Integrate Better Auth with MySQL.

](https://www.better-auth.com/docs/adapters/mysql)PostgreSQL

Integrate Better Auth with PostgreSQL.

[View original](https://www.better-auth.com/docs/adapters/postgresql)

[Edit on GitHub](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/adapters/sqlite.mdx)