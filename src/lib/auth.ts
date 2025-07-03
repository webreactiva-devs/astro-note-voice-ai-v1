import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { getConfig } from "./config";

const config = getConfig();

const dialect = config.USE_LOCAL_DB 
  ? new LibsqlDialect({
      url: "file:database/dev.db"
    })
  : new LibsqlDialect({
      url: config.TURSO_DATABASE_URL!,
      authToken: config.TURSO_AUTH_TOKEN!,
    });

export const auth = betterAuth({
  database: {
    dialect,
    type: "sqlite"
  },
  emailAndPassword: {
    enabled: true
  },
  secret: config.BETTER_AUTH_SECRET,
  baseURL: config.BETTER_AUTH_URL
});