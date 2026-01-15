# Repository Guidelines

## Project Structure & Module Organization
- `packages/frontend/`: React + Vite UI (pages in `src/pages`, reusable UI in `src/components`).
- `packages/backend/`: Hono API server, DB access in `src/db`, routes in `src/routes`, export generators in `src/services/generator`.
- `packages/shared/`: Shared TypeScript types/schemas consumed by frontend/backend.
- `register_excel_parser/`: Rust/WASM plugin for Excel import (build output in `pkg/`).
- `docs/`: Project documentation and supporting assets.

## Build, Test, and Development Commands
- `bun install`: Install workspace dependencies.
- `bun run dev`: Run frontend + backend in watch mode.
- `bun run dev:frontend` / `bun run dev:backend`: Run a single app.
- `bun run build`: Build all packages.
- `bun run lint`: Type-check all packages (`tsc --noEmit`).
- `bun run db:generate` / `bun run db:migrate` / `bun run db:seed`: Manage database schema and seed data.
- `bun run plugin:build`: Build the Rust/WASM Excel parser.

## Coding Style & Naming Conventions
- Indentation: 4 spaces (per existing JSON/TS files).
- TypeScript: `strict` is enabled; keep types explicit at module boundaries.
- React components: PascalCase filenames in `packages/frontend/src/components` and `packages/frontend/src/pages`.
- Backend files: kebab-case for multiword filenames (e.g., `uvm-ral.ts`).
- Formatting: prefer running `bun run lint` before pushing.

## Testing Guidelines
- Test runner: `bun test` (wired for backend/shared). Add tests near the code they cover.
- Naming: `*.test.ts` or `*.spec.ts` (no tests currently tracked; follow Bun defaults).
- Ensure new endpoints and exports have coverage where practical.

## Commit & Pull Request Guidelines
- Commits follow a Conventional Commits style (`feat:`, `chore:`, etc.). Keep scopes short.
- PRs should include: a short summary, key commands run, and screenshots for UI changes.
- Link related issues/tickets and note any DB migrations or plugin changes.

## Security & Configuration Tips
- Backend config lives in `packages/backend/.env` (see `.env.example` in the same folder).
- Keep secrets out of Git; use `DATABASE_URL` for local PostgreSQL.
