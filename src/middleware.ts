import { defineMiddleware } from "astro:middleware";

// Ensure dotenv is loaded in development
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config();
}

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth.api.getSession({
      headers: context.request.headers,
    });

    context.locals.user = session?.user ?? null;
    context.locals.session = session?.session ?? null;
  } catch (error) {
    console.error("Auth middleware error:", error);
    // Set defaults in case of error
    context.locals.user = null;
    context.locals.session = null;
  }

  return next();
});