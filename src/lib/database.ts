import { createClient } from "@libsql/client";

const useLocal = import.meta.env.USE_LOCAL_DB === "true";

export const database = useLocal
  ? createClient({ url: "file:database/dev.db" })
  : createClient({
      url: import.meta.env.TURSO_DATABASE_URL,
      authToken: import.meta.env.TURSO_AUTH_TOKEN,
    });
