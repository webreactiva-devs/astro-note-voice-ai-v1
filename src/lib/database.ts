import { createClient } from "@libsql/client";
import { getConfig } from "./config";

const config = getConfig();

export const database = config.USE_LOCAL_DB
  ? createClient({ url: "file:database/dev.db" })
  : createClient({
      url: config.TURSO_DATABASE_URL!,
      authToken: config.TURSO_AUTH_TOKEN!,
    });
