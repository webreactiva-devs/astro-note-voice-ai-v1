import { turso } from "@/lib/turso";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    // Realiza una consulta simple para comprobar la conexión
    await turso.execute("SELECT 1");
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
