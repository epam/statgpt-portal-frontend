# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Development
npm run start                   # Start Next.js dev server on port 4001
npm run build                   # Build all projects + compile Tailwind CSS

# Testing
npm run test                    # Run all tests (monorepo-wide)
npx nx test <project>           # Run tests for a specific project (e.g., ui-components, dial-toolkit)
npx nx test <project> --testFile=<path>  # Run a single test file
npx nx test <project> -- --testNamePattern="test name"  # Filter by test name

# Quality
npm run lint                    # Lint all projects
npm run lint:fix                # Lint and auto-fix
npm run format                  # Check formatting (Prettier)
npm run format:write            # Auto-format
npm run typecheck               # TypeScript type-check all projects
```

Project names for `nx` commands: `portals-example`, `ui-components`, `conversation-view`, `conversation-list`, `dial-toolkit`, `sdmx-toolkit`, `shared-toolkit`, `download-panel`, `share-conversation`, `user-info`.

## Architecture

**Nx monorepo** with one deployable Next.js 15 app (`apps/portals-example`) and multiple library packages (`libs/`).

### App (`apps/portals-example`)

Next.js App Router with i18n prefix (`/en/`). Key routes:

- `/en/conversations/` — welcome/conversation list view
- `/en/conversations/[...id]/` — individual conversation (catch-all: `bucketId` + `conversationId`)
- `/en/share/[invitationId]/` — shared conversation view
- `/api/dial/:path*` — proxied to `DIAL_API_URL/api/:path*` (see `next.config.js` rewrites)
- `/api/auth/[...nextauth]` — NextAuth.js (auth is optional, toggled via `ENABLE_AUTH` env var)

The `[locale]/layout.tsx` is a **Server Component** that fetches deployment config, conversation list, and SDMX metadata at render time and injects them into Context providers. All data fetching for initial page load happens here.

### Libraries

| Package | Description |
|---|---|
| `@epam/statgpt-conversation-view` | Main chat UI — all message rendering, streaming, input, and feature context providers |
| `@epam/statgpt-conversation-list` | Sidebar with conversation history |
| `@epam/statgpt-dial-toolkit` | DIAL API client (chat, conversations, files, buckets) |
| `@epam/statgpt-sdmx-toolkit` | SDMX API client and data transformation utilities |
| `@epam/statgpt-shared-toolkit` | Shared TypeScript interfaces/utilities used across libs and app |
| `@epam/statgpt-ui-components` | Reusable design-system components (Button, Input, Modal, etc.) |
| `@statgpt/download-panel` | SDMX data download UI |
| `@statgpt/share-conversation` | Share conversation via link/QR code |
| `@statgpt/user-info` | User info display component |

Path aliases for all packages are defined in `/tsconfig.base.json`.

### State Management

No Redux or Zustand. State is managed via **React Context + useState** only. Server state is loaded in Server Components and passed down to client providers.

### Streaming

Chat responses use SSE (Server-Sent Events). `ChatMessagesContext` tracks the `isStreaming` flag. The `/api/chat` route proxies streaming responses from the DIAL API.

### Documentation

Specs live in `specs/`:

- `specs/system/` — reference documentation describing how the application works.
  Each subfolder covers one subsystem and is kept in sync with the code.
  - `specs/system/filters/` — full lifecycle of filters, dataset merging, SDMX
    constraints, system-message persistence, grids, Python attachment, applied-filters
    display, and chart attachments. See `specs/system/filters/README.md` for the index
    and file-to-spec mapping.

- `specs/changes/` — design specs for in-progress or planned features. Each file is
  a time-stamped design document produced during brainstorming before implementation
  begins.

When editing files covered by a system spec, update the relevant spec in the same
change — see `.claude/rules/spec-conventions.md`.

### Styling

Tailwind CSS 3.4 with a custom CSS-variable-based color system defined in `tailwind.config.js`. The compiled stylesheet is output to `dist/libs/ui-components/index.css` via `npm run build:styles`.

## Storybook

Stories for `ui-components` live next to their components in `libs/ui-components/src/`. The Storybook app is at `apps/storybook/`.

- Story authoring patterns: `.claude/rules/storybook-conventions.md` (auto-loaded when editing `*.stories.tsx`)
- Brand config, commands, architecture: `apps/storybook/CLAUDE.md`
- To add a new story: `/add-story <ComponentName>`
