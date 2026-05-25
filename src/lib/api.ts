// Backend API client for https://api.imaginehq.services
// Handles base URL, JWT auth header, refresh-token rotation on 401,
// and the { success, data } response envelope.

export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.imaginehq.services";

const ACCESS_TOKEN_KEY = "imagine.accessToken";
const REFRESH_TOKEN_KEY = "imagine.refreshToken";
const USER_KEY = "imagine.user";

export type ApiUser = {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  avatarUrl: string | null;
  displayName?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// ---------- token storage (localStorage, browser only) ----------
function isBrowser() {
  return typeof window !== "undefined";
}

export const tokenStorage = {
  getAccess(): string | null {
    return isBrowser() ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
  },
  getRefresh(): string | null {
    return isBrowser() ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
  },
  getUser(): ApiUser | null {
    if (!isBrowser()) return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ApiUser;
    } catch {
      return null;
    }
  },
  set(tokens: { accessToken: string; refreshToken: string; user: ApiUser }) {
    if (!isBrowser()) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
    emitAuthChange();
  },
  updateAccess(accessToken: string) {
    if (!isBrowser()) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },
  clear() {
    if (!isBrowser()) return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    emitAuthChange();
  },
};

// ---------- auth-change event bus ----------
type Listener = () => void;
const listeners = new Set<Listener>();

export function onAuthChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emitAuthChange() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      console.error(e);
    }
  });
}

// ---------- fetch wrapper ----------
type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Skip Authorization header (e.g. login/register endpoints). */
  skipAuth?: boolean;
  /** Skip the automatic refresh-on-401 retry (to avoid loops). */
  skipRefresh?: boolean;
};

async function rawFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  if (!opts.skipAuth) {
    const token = tokenStorage.getAccess();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const init: RequestInit = {
    ...opts,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(12_000),
    });
  } catch (e) {
    throw new ApiError(
      "Can't reach the server. Check your connection or try again in a moment.",
      0,
      { cause: e instanceof Error ? e.message : String(e) },
    );
  }

  let payload: any = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!res.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload);
  }

  // API envelope: { success: true, data: ... }
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new ApiError("No refresh token", 401, null);

  if (!refreshPromise) {
    refreshPromise = rawFetch<{ accessToken: string; refreshToken?: string }>(
      "/api/v1/auth/refresh",
      {
        method: "POST",
        body: { refreshToken },
        skipAuth: true,
        skipRefresh: true,
      },
    )
      .then((data) => {
        tokenStorage.updateAccess(data.accessToken);
        if (data.refreshToken && isBrowser()) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  try {
    return await rawFetch<T>(path, opts);
  } catch (err) {
    if (
      err instanceof ApiError &&
      err.status === 401 &&
      !opts.skipAuth &&
      !opts.skipRefresh &&
      tokenStorage.getRefresh()
    ) {
      try {
        await refreshAccessToken();
        return await rawFetch<T>(path, { ...opts, skipRefresh: true });
      } catch {
        tokenStorage.clear();
        throw err;
      }
    }
    throw err;
  }
}
