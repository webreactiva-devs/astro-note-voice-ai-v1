# AI Voice Notes Application - Copilot Instructions

## Project Architecture

This is an **Astro 5 + React 19** voice recording app with AI transcription and organization. The user records audio (max 2min), transcribes via Groq API, then AI generates titles/tags and organizes content.

### Core Tech Stack

- **Astro 5**: SSG with API routes (`/pages/api/*`)
- **React 19**: Interactive components (`*.tsx`)
- **Better Auth**: Email/password authentication with session middleware
- **Groq API**: Audio transcription and content processing
- **SQLite/Turso**: Dual database mode via `USE_LOCAL_DB` env var
- **Tailwind + shadcn/ui**: Component styling

## Key Patterns & Workflows

### 1. Database Architecture

- **Dual mode**: Local SQLite (`database/dev.db`) or Turso cloud
- **Migration system**: Custom incremental migrations in `database/migrations/`
- **Commands**: `npm run migrate` (custom), `npx @better-auth/cli migrate --y` (auth tables)
- **Config**: Database client in `src/lib/database.ts` switches based on `USE_LOCAL_DB`

### 2. Authentication Flow

- **Better Auth** configuration in `src/lib/auth.ts`
- **Middleware**: `authenticateRequest()` in `src/lib/middleware.ts` for API protection
- **Session-based**: All API routes require authentication via request headers

### 3. AI Processing Pipeline

- **Service**: `src/lib/ai-service.ts` contains all Groq API calls
- **Prompts**: Markdown files in `src/lib/prompts/` with YAML frontmatter for config
- **Flow**: transcription → `organizeIdeas()` → `generateTitleAndTags()` → save with `isTranscription: true`
- **Models**: Currently uses `mistral-saba-24b` (verify this exists in Groq API)

### 4. Audio Recording Architecture

- **Main component**: `VoiceRecorder.tsx` orchestrates entire flow
- **Hook**: `useAudioRecorder.ts` handles MediaRecorder API with 2-min timer
- **Visualizer**: `AudioVisualizer.tsx` + `useAudioVisualizer.ts` for real-time waveform
- **Flow**: Record → Stop → Transcribe → Edit in modal → Save with AI processing

### 5. API Endpoints Pattern

- **POST `/api/transcribe`**: FormData with audio blob → Groq transcription
- **POST `/api/notes`**: Save transcription, process with AI if `isTranscription: true`
- **GET `/api/notes`**: List user's notes with filtering (`search`, `tag`, `startDate`, etc.)
- **PUT/DELETE `/api/notes/[id]`**: Note CRUD operations

## Development Commands

```bash
# Start dev (includes both Astro and API)
npm run dev

# Database operations
npm run migrate                    # Custom migrations
npm run migrate:status             # Check migration state
npx @better-auth/cli migrate --y   # Auth tables

# Testing
npm test                          # Vitest unit tests
npm run test:integration          # Full app flow tests
```

## Critical Configuration

### Environment Variables

- **GROQ_API_KEY**: Required for all AI features
- **BETTER_AUTH_SECRET**: 32+ chars for session signing
- **USE_LOCAL_DB**: `true` for SQLite, `false` for Turso
- **TURSO_DATABASE_URL** + **TURSO_AUTH_TOKEN**: Required if USE_LOCAL_DB=false

### File Structure Conventions

- **Components**: Mix of `.astro` (static) and `.tsx` (interactive)
- **API Routes**: File-based routing in `/pages/api/`
- **Path Alias**: `@/*` → `./src/*`
- **Hooks**: Custom hooks in `src/lib/hooks/` for reusable logic

## Common Issues & Solutions

1. **AI not generating tags/content**: Check GROQ_API_KEY and verify model name exists
2. **Database errors**: Ensure migrations run (`npm run migrate` + auth migrations)
3. **Audio recording fails**: Browser permissions and MediaRecorder API support
4. **Rate limiting**: Built into `/src/lib/rate-limiter.ts` for API protection
5. **Logout 500 error**: Always use `authClient.signOut()` instead of manual fetch to `/api/auth/sign-out`

## Testing Strategy

- **Unit**: Components and utilities in `src/test/`
- **Integration**: Full voice-to-note flow in `src/test/integration/`
- **API**: Endpoint testing with mocked auth in `src/test/api/`
