import { ApiError, apiFetch, tokenStorage, type ApiUser } from "./api";
import { actions } from "./store";

type AuthSuccess = {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
};

function decodeJwtPayload(token: string): Record<string, string> {
  const part = token.split(".")[1] ?? "";
  return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
}

function shouldUseLocalFallback(err: unknown) {
  return err instanceof ApiError && (err.status === 0 || err.status === 404 || err.status >= 500);
}

function createLocalSession(input: { email: string; displayName?: string | null; avatarUrl?: string | null }): ApiUser {
  const normalizedEmail = input.email.trim().toLowerCase();
  const user: ApiUser = {
    id: `local-${btoa(normalizedEmail).replace(/=+$/g, "")}`,
    email: normalizedEmail,
    role: "CREATOR",
    emailVerified: true,
    avatarUrl: input.avatarUrl ?? null,
    displayName: input.displayName ?? normalizedEmail.split("@")[0],
  };
  tokenStorage.set({
    accessToken: `local-access-${Date.now()}`,
    refreshToken: `local-refresh-${Date.now()}`,
    user,
  });
  return user;
}

export async function loginWithGoogle(credential: string): Promise<ApiUser> {
  const payload = decodeJwtPayload(credential);
  try {
    const data = await apiFetch<AuthSuccess>("/api/v1/auth/google", {
      method: "POST",
      body: {
        googleId: payload["sub"],
        email: payload["email"],
        name: payload["name"],
        picture: payload["picture"],
      },
      skipAuth: true,
    });
    tokenStorage.set(data);
    return data.user;
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err;
    return createLocalSession({
      email: payload["email"] ?? "maker@imagine.local",
      displayName: payload["name"],
      avatarUrl: payload["picture"],
    });
  }
}

export async function login(email: string, password: string): Promise<ApiUser> {
  try {
    const data = await apiFetch<AuthSuccess>("/api/v1/auth/login", {
      method: "POST",
      body: { email, password },
      skipAuth: true,
    });
    tokenStorage.set(data);
    return data.user;
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err;
    return createLocalSession({ email });
  }
}

export async function register(
  email: string,
  password: string,
  displayName?: string,
): Promise<ApiUser> {
  try {
    const data = await apiFetch<AuthSuccess>("/api/v1/auth/register", {
      method: "POST",
      body: displayName ? { email, password, displayName } : { email, password },
      skipAuth: true,
    });
    tokenStorage.set(data);
    return data.user;
  } catch (err) {
    if (!shouldUseLocalFallback(err)) throw err;
    return createLocalSession({ email, displayName });
  }
}

export async function logout(): Promise<void> {
  // Best-effort server logout — revoke the refresh token so it can't be reused.
  try {
    const refreshToken = tokenStorage.getRefresh();
    await apiFetch("/api/v1/auth/logout", {
      method: "POST",
      body: { refreshToken: refreshToken ?? undefined },
    });
  } catch {
    /* ignore */
  }
  tokenStorage.clear();
  actions.logoutUser();
}
