import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";

const useLocal = import.meta.env.USE_LOCAL_DB === "true";

const dialect = useLocal 
  ? new LibsqlDialect({
      url: "file:database/dev.db"
    })
  : new LibsqlDialect({
      url: import.meta.env.TURSO_DATABASE_URL || "",
      authToken: import.meta.env.TURSO_AUTH_TOKEN || "",
    });

export const auth = betterAuth({
  database: {
    dialect,
    type: "sqlite"
  },
  emailAndPassword: {
    enabled: true
  },
  secret: import.meta.env.BETTER_AUTH_SECRET,
  baseURL: import.meta.env.BETTER_AUTH_URL || "http://localhost:4321"
});