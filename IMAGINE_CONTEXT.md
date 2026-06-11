# Imagine — Full Stack Context & Lovable Sync Guide

## Project Overview
Imagine is an AI tools marketplace. Users submit tools via URL, the backend scrapes metadata, and published tools appear on a public discovery feed.

- **Frontend**: `C:\Users\OR\imagine-web` — Next.js/Vite + TanStack Router, deployed on **Vercel** → `imaginehq.services`
- **Backend**: `C:\Users\OR\imagine-api` — Fastify + Prisma + BullMQ, deployed on **Railway** → `api.imaginehq.services`
- **Frontend repo**: `idomena/Imagine-2.1` (GitHub → Vercel auto-deploy)
- **Backend repo**: `idomena/imagine-api` (GitHub → Railway auto-deploy)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Routing | TanStack Router (file-based, `src/routes/`) |
| Data fetching | TanStack Query (`useQuery`, `useMutation`) |
| API client | `apiFetch` / `apiUpload` in `src/lib/api.ts` |
| Auth | `useAuth()` from `src/contexts/AuthContext.tsx` |
| Global state | Zustand store via `useStore()` / `actions` in `src/lib/store.ts` |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Toasts | Sonner (`toast.success`, `toast.error`, `toast.info`) |
| Build | Vite |

---

## File Structure (key files)

```
src/
  routes/
    __root.tsx          # Root layout, nav, auth provider
    index.tsx           # Home / discovery feed
    submit.tsx          # App submission flow
    tool.$toolId.tsx    # Single tool view page
    trending.tsx        # Trending tools list
    dashboard.tsx       # Creator dashboard
    login.tsx           # Auth page
    u.$username.tsx     # Public creator profile
  lib/
    api.ts              # apiFetch, apiUpload, tokenStorage, ApiError
    auth.ts             # loginWithGoogle, login, register, logout
    store.ts            # Zustand store, actions, REACTION_EMOJIS
    utils.ts            # cn() and helpers
  contexts/
    AuthContext.tsx      # useAuth() — isAuthenticated, user, loading
  hooks/
    use-apps.ts         # useApps(), useCategories() — TanStack Query wrappers
  components/
    ToolCard.tsx        # App card used on home + trending
    CloudsBackground.tsx
```

---

## API Endpoints (never remove these calls)

### App endpoints
| Method | Path | Used in | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/apps/:id` | `tool.$toolId.tsx` | Fetch app data |
| `PATCH` | `/api/v1/apps/:id` | `tool.$toolId.tsx` | Owner saves color/logo |
| `POST` | `/api/v1/apps/:id/view` | `tool.$toolId.tsx` | Track Launch click (sidebar) |
| `POST` | `/api/v1/apps/:id/visit` | `tool.$toolId.tsx` | Track Launch click (mobile CTA) |
| `POST` | `/api/v1/apps/:id/logo` | `tool.$toolId.tsx` | Upload custom logo (multipart) |
| `GET` | `/api/v1/apps/:id/reviews` | `tool.$toolId.tsx` | Fetch reviews list |
| `POST` | `/api/v1/apps/:id/reviews` | `tool.$toolId.tsx` | Submit a review |
| `POST` | `/api/v1/apps` | `submit.tsx` | Create new app (DRAFT) |
| `POST` | `/api/v1/apps/:id/submit` | `submit.tsx` | Trigger async scan + publish |
| `POST` | `/api/v1/apps/:id/screenshots` | `submit.tsx` | Upload screenshots (multipart) |
| `POST` | `/api/v1/apps/scrape` | `submit.tsx` | Scrape URL metadata |
| `POST` | `/api/v1/track-view` | `tool.$toolId.tsx` | Track page view on load |

### Auth endpoints (in `src/lib/auth.ts`)
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/v1/auth/google` | Google OAuth login |
| `POST` | `/api/v1/auth/login` | Email/password login |
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token |
| `POST` | `/api/v1/auth/refresh` | Rotate access token |

---

## API Response Envelope
All responses follow `{ success: true, data: ... }`. `apiFetch` unwraps `data` automatically — callers receive the payload directly.

---

## Critical Logic — NEVER modify

### `apiFetch` / `apiUpload` (`src/lib/api.ts`)
- Adds `Authorization: Bearer <token>` header automatically
- On 401: auto-retries once after refreshing the access token
- 12-second timeout via `AbortSignal.timeout(12_000)`
- Throws `ApiError` with `.status` and `.data`

### TanStack Router patterns
```tsx
// Route definition — always at top of file
export const Route = createFileRoute("/tool/$toolId")({ component: ToolDetail });

// Params
const { toolId } = Route.useParams();

// Navigation
const navigate = useNavigate();
navigate({ to: "/tool/$toolId", params: { toolId: slug } });

// Links
<Link to="/" />
<Link to="/tool/$toolId" params={{ toolId: app.slug }} />
```

### Submit flow — polling loop (submit.tsx)
```tsx
// After POST /submit, polls until status === "PUBLISHED"
for (let i = 0; i < 45; i++) {
  await new Promise((r) => setTimeout(r, 1500));
  const app = await apiFetch<{ status: string }>(`/api/v1/apps/${created.id}`);
  if (app.status === "PUBLISHED") break;
  if (app.status === "REJECTED") throw new Error("Your app was flagged...");
}
```
This loop must never be removed or shortened — the backend publishes asynchronously.

### Owner detection (tool.$toolId.tsx)
```tsx
const isOwner =
  isAuthenticated &&
  !!app.creator?.user?.email &&
  authUser?.email === app.creator.user.email;
```

### Anonymous guard (tool.$toolId.tsx)
```tsx
{app.creator && !app.anonymous && (
  // creator section — only shown when maker didn't submit anonymously
)}
```

### Store actions
```tsx
actions.toggleUpvote(toolId)     // upvote button
actions.toggleBookmark(toolId)   // save button
actions.toggleReaction(toolId, emoji)  // emoji reactions
```

---

## Design System

### Colors
| Token | Value | Usage |
|---|---|---|
| Background | `#06060a` | Page base |
| Card | `bg-card` / `bg-white/[0.04]` | Surface cards |
| Border | `border-border` / `border-white/[0.06]` | Subtle separators |
| Mint/Teal accent | `#14b8a6` | CTAs, badges, highlights |
| Muted text | `text-muted-foreground` | Secondary copy |

### Typography
- Display font: `font-display` (variable `--font-display`)
- Body: Inter
- Style: `tracking-tight`, generous `leading-loose` for body copy
- Headings: large, `font-bold`, no letter-spacing

### Components
- Buttons: `rounded-full`, `px-5 py-2.5`, `hover:-translate-y-0.5 transition`
- Cards: `rounded-2xl` or `rounded-3xl`, `border border-border`, `bg-card`
- Glassmorphism: `bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]`
- Glow effect: `box-shadow: 0 0 40px -10px {color}66`
- Layout: `max-w-6xl mx-auto px-4 sm:px-6`

---

## Deployment

### Push backend changes
```powershell
cd C:\Users\OR\imagine-api
& "C:\laragon\bin\git\cmd\git.exe" add <files>
& "C:\laragon\bin\git\cmd\git.exe" commit -m "..."
& "C:\laragon\bin\git\cmd\git.exe" push
# Railway auto-deploys from main
```

### Push frontend changes
```powershell
cd C:\Users\OR\imagine-web
vercel --prod
# Deploys to imaginehq.services
```

---

## Lovable Sync Rules

When applying Lovable-generated code to this codebase:

1. **Extract only** JSX structure + Tailwind classNames from Lovable output
2. **Never replace** import statements for `apiFetch`, `useAuth`, `useStore`, `actions`, TanStack Router, TanStack Query
3. **Never replace** `createFileRoute(...)` at the top of route files
4. **Never replace** `useQuery`/`useMutation` hook bodies
5. **Never replace** event handlers that call `apiFetch` or `actions.*`
6. **Style-only changes** are safe: classNames, layout structure, new sub-components for pure UI
7. If Lovable adds new imports, verify they exist in `package.json` first

---

## Key Decisions & History

- **Scraper**: uses full Chrome 124 headers to bypass WAF/bot detection. On 403 returns `{ partial: true }` with URL-derived data instead of throwing. See `app.scraper.ts`.
- **Async publish**: `POST /submit` returns immediately (DRAFT→SUBMITTED), scan+publish runs in background void IIFE on the server. Frontend polls for PUBLISHED.
- **Deployed router**: `apps.router.secure.ts` is the live router (with rate-limiting, HTTPS enforcement). `apps.router.ts` is the baseline/dev version.
- **Prisma on Railway**: `package.json` start script runs `prisma generate && tsx src/server.ts` to avoid stale client after schema changes.
- **`anonymous` field**: apps submitted anonymously hide the creator section on the tool page.
