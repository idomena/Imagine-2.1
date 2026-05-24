## Goal

Connect the existing Login, Welcome Back, and signup screens to your backend at `https://api.imaginehq.services` using JWT (access + refresh tokens).

## What I'll build

### 1. API client (`src/lib/api.ts`)
- Base URL: `https://api.imaginehq.services`
- `apiFetch(path, options)` helper that:
  - Adds `Authorization: Bearer <accessToken>` from storage
  - Parses the `{ success, data }` envelope your API returns
  - On 401, tries `POST /api/v1/auth/refresh` once with the refresh token; if that fails, clears tokens and redirects to `/login`

### 2. Auth module (`src/lib/auth.ts`)
- `login(email, password)` → `POST /api/v1/auth/login`
- `register(email, password, displayName?)` → `POST /api/v1/auth/register`
- `logout()` → clears tokens (and calls `/api/v1/auth/logout` if it exists)
- Stores `accessToken`, `refreshToken`, and `user` in `localStorage`
- Exposes a small subscribe API so the app reacts to auth changes

### 3. React auth context (`src/contexts/AuthContext.tsx`)
- `useAuth()` hook returning `{ user, isAuthenticated, login, register, logout, loading }`
- Provider wraps the app in `__root.tsx`

### 4. Wire up existing screens
- `src/routes/login.tsx` → call `login()` on submit, show errors from API, redirect to `/dashboard` on success
- `src/routes/welcome-back.tsx` → same login flow (existing returning-user screen)
- A signup form (use the existing Info/welcome screen or add to login) → call `register()`
- Header: show user email + Logout when authenticated; show Login when not

### 5. Route guard
- Create `src/routes/_authenticated.tsx` pathless layout that redirects to `/login` if not authenticated
- (Optional later) move `dashboard.tsx` under `_authenticated/` when you want it protected — leaving routes public for now since you said scope is just auth

## Things to confirm / assumptions

- **CORS**: your backend must allow `https://*.lovable.app` (and your custom domain later) with `Authorization` header. If it doesn't, login will fail with a CORS error in the browser console — you'll need to whitelist origins on the backend.
- **Refresh endpoint**: I'll assume `POST /api/v1/auth/refresh` with `{ refreshToken }` returning a new `accessToken`. If the path or shape differs, tell me and I'll adjust.
- **Token storage**: `localStorage` (simple, works with JWT in Authorization header). If you'd prefer httpOnly cookies, the backend would need to set them and we'd switch to `credentials: 'include'`.
- **No secrets in frontend**: confirmed public API, so no server-side proxy needed.

## Out of scope (for this step)

- Email verification flow
- Password reset
- Protecting specific routes (can do after auth works)
- Avatar upload, profile editing

Ready to build when you approve.