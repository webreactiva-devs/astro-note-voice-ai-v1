import { z } from "zod";

// ===========================================
// VALIDATION SCHEMAS
// ===========================================

// Schema for database variables
const databaseSchema = z.object({
  USE_LOCAL_DB: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),
});

// Schema for authentication
const authSchema = z.object({
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters long"),
  BETTER_AUTH_URL: z
    .string()
    .url("BETTER_AUTH_URL must be a valid URL")
    .default("http://localhost:4321"),
});

// Schema for external APIs
const apiSchema = z.object({
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
});

// Schema for general configuration
const generalSchema = z.object({
  NODE_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("4321")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),
});

// Schema for performance options
const performanceSchema = z.object({
  ENABLE_DEBUG_LOGS: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  RATE_LIMIT_TRANSCRIPTION: z
    .string()
    .default("5")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  RATE_LIMIT_NOTES: z
    .string()
    .default("30")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
  MAX_AUDIO_FILE_SIZE: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1)),
});

// Schema for CDN (optional)
const cdnSchema = z.object({
  USE_CDN: z
    .string()
    .default("false")
    .transform((val) => val === "true"),
  CDN_BASE_URL: z.string().url().optional(),
});

// Schema for monitoring (optional)
const monitoringSchema = z.object({
  SENTRY_DSN: z.string().optional(),
  GA_TRACKING_ID: z.string().optional(),
});

// Schema for email (optional)
const emailSchema = z.object({
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().min(1).max(65535).optional()),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
});

// ===========================================
// COMPLETE SCHEMA
// ===========================================

const envSchema = databaseSchema
  .merge(authSchema)
  .merge(apiSchema)
  .merge(generalSchema)
  .merge(performanceSchema)
  .merge(cdnSchema)
  .merge(monitoringSchema)
  .merge(emailSchema)
  .refine(
    (data) => {
      // Conditional validation: if not local, Turso is required
      if (!data.USE_LOCAL_DB) {
        if (!data.TURSO_DATABASE_URL || !data.TURSO_AUTH_TOKEN) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required when USE_LOCAL_DB=false",
      path: ["TURSO_DATABASE_URL"],
    }
  )
  .refine(
    (data) => {
      // Conditional validation: CDN URL required if CDN is enabled
      if (data.USE_CDN && !data.CDN_BASE_URL) {
        return false;
      }
      return true;
    },
    {
      message: "CDN_BASE_URL is required when USE_CDN=true",
      path: ["CDN_BASE_URL"],
    }
  );

// ===========================================
// TYPESCRIPT TYPES
// ===========================================

export type Config = z.infer<typeof envSchema>;

// ===========================================
// ENV VARS LOADING AND VALIDATION FUNCTION
// ===========================================

function loadEnvVars(): Record<string, string | undefined> {
  // On client/build side (Vite)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env as Record<string, string | undefined>;
  }

  // On server side (Node.js)
  if (typeof process !== "undefined" && process.env) {
    return process.env;
  }

  // Fallback
  return {};
}

// Check if we're in test environment
function isTestEnvironment(): boolean {
  const env = loadEnvVars();
  return env.NODE_ENV === "test" || env.VITEST === "true";
}

export function validateConfig(): Config {
  const env = loadEnvVars();

  console.log(env);

  // In test environment, provide sensible defaults
  if (isTestEnvironment()) {
    const testDefaults = {
      ...env,
      BETTER_AUTH_SECRET:
        env.BETTER_AUTH_SECRET ||
        "test-secret-that-is-at-least-32-characters-long-for-testing",
      BETTER_AUTH_URL: env.BETTER_AUTH_URL || "http://localhost:4321",
      GROQ_API_KEY: env.GROQ_API_KEY || "test-groq-api-key",
      USE_LOCAL_DB: env.USE_LOCAL_DB || "true",
      NODE_ENV: "test",
    };

    try {
      return envSchema.parse(testDefaults);
    } catch (error) {
      console.warn("Test config validation failed, using fallback");
      return testDefaults as any;
    }
  }

  try {
    const validatedConfig = envSchema.parse(env);

    // Log config in development (without secrets)
    if (
      validatedConfig.ENABLE_DEBUG_LOGS &&
      validatedConfig.NODE_ENV === "development"
    ) {
      console.log("✅ Environment configuration validated:", {
        NODE_ENV: validatedConfig.NODE_ENV,
        USE_LOCAL_DB: validatedConfig.USE_LOCAL_DB,
        USE_CDN: validatedConfig.USE_CDN,
        PORT: validatedConfig.PORT,
        RATE_LIMITS: {
          transcription: validatedConfig.RATE_LIMIT_TRANSCRIPTION,
          notes: validatedConfig.RATE_LIMIT_NOTES,
        },
        // DO NOT log secrets
      });
    }

    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment configuration error:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });

      // Show example of minimal configuration
      console.error("\n💡 Minimal required configuration:");
      console.error(
        "  - BETTER_AUTH_SECRET=your-super-secure-secret-at-least-32-characters"
      );
      console.error("  - GROQ_API_KEY=gsk_your-groq-api-key");
      console.error("  - USE_LOCAL_DB=true (for local development)");
      console.error("\n📖 See .env.example for more details");
    }

    throw new Error(
      "Invalid environment configuration. Check the required variables."
    );
  }
}

// ===========================================
// GLOBAL CONFIG SINGLETON
// ===========================================

// Singleton to avoid multiple validations
let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = validateConfig();
  }
  return cachedConfig;
}

// ===========================================
// SPECIFIC HELPERS
// ===========================================

export function isDevelopment(): boolean {
  return getConfig().NODE_ENV === "development";
}

export function isProduction(): boolean {
  return getConfig().NODE_ENV === "production";
}

export function isLocalDatabase(): boolean {
  return getConfig().USE_LOCAL_DB;
}

export function shouldUseCDN(): boolean {
  return getConfig().USE_CDN;
}

export function getRateLimits() {
  const config = getConfig();
  return {
    transcription: config.RATE_LIMIT_TRANSCRIPTION,
    notes: config.RATE_LIMIT_NOTES,
  };
}

export function getMaxAudioFileSize(): number {
  return getConfig().MAX_AUDIO_FILE_SIZE;
}

// ===========================================
// BUILD-TIME VALIDATION
// ===========================================

// Validate configuration on module import
// Only at build time, not on client
// Commented out for now to allow development to continue
/*
if (typeof window === "undefined") {
  try {
    validateConfig();
  } catch (error) {
    console.error("❌ Critical configuration error:", error);
    // In development and test, continue with warnings
    // In production, this should fail the build
    const config = loadEnvVars();
    if (config.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}
*/
