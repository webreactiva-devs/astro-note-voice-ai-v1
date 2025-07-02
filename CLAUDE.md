# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build
- `npm run astro` - Run Astro CLI commands

## Architecture Overview

This is an Astro application with React integration and Tailwind CSS styling. The project uses TypeScript throughout and includes database integration with Turso/libSQL.

### Key Technologies
- **Astro 5** - Static site generator with React integration
- **React 19** - UI components (JSX with react-jsx transform)
- **Tailwind CSS 4** - Styling via Vite plugin
- **libSQL** - Database client for local development and Turso production
- **TypeScript** - Strict configuration extending Astro defaults

### Database Architecture
The application supports dual database modes:
- **Local development**: SQLite database at `database/dev.db`
- **Production**: Turso cloud database
- Mode selection via `USE_LOCAL_DB` environment variable
- Database client configured in `src/lib/database.ts`
- Health check endpoint at `/api/db-check`

### Project Structure
- `src/components/` - Astro and React components
- `src/lib/` - Shared utilities and database configuration
- `src/pages/` - File-based routing (includes API routes)
- `src/styles/` - Global CSS styles
- `docs/project-specs.md` - Detailed project specifications and requirements
- `docs/project-plan.md` - Development roadmap and task checklist
- Path alias `@/*` maps to `./src/*`

### Component Architecture
- Mix of Astro components (`.astro`) and React components (`.tsx`)
- UI components use Radix UI primitives with class-variance-authority
- Styling with Tailwind and clsx/tailwind-merge utilities

## Project Documentation

This project includes comprehensive documentation to guide development:
- **Project Specifications** (`docs/project-specs.md`): Complete technical requirements for the voice notes application
- **Project Plan** (`docs/project-plan.md`): Development roadmap with prioritized tasks and progress tracking

- Write comments, code and code messages in english

When working on this project, always refer to these documents to ensure alignment with requirements and follow the planned development sequence.