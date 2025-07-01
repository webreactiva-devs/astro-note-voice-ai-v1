import { database } from "@/lib/database";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    await database.batch(
      [
        "CREATE TABLE IF NOT EXISTS __temp (id INTEGER);",
        "DROP TABLE IF EXISTS __temp;",
      ],
      "write"
    );
    return new Response(
      JSON.stringify({ ok: true, message: "Conexión exitosa a Turso." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: "Error de conexión a Turso.",
        error: error?.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
