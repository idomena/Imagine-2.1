import { apiFetch, tokenStorage, type ApiUser } from "./api";

type AuthSuccess = {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
};

function decodeJwtPayload(token: string): Record<string, string> {
  const part = token.split(".")[1] ?? "";
  return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
}

export async function loginWithGoogle(credential: string): Promise<ApiUser> {
  const payload = decodeJwtPayload(credential);
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
}

export async function login(email: string, password: string): Promise<ApiUser> {
  const data = await apiFetch<AuthSuccess>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
  });
  tokenStorage.set(data);
  return data.user;
}

export async function register(
  email: string,
  password: string,
  displayName?: string,
): Promise<ApiUser> {
  const data = await apiFetch<AuthSuccess>("/api/v1/auth/register", {
    method: "POST",
    body: displayName ? { email, password, displayName } : { email, password },
    skipAuth: true,
  });
  tokenStorage.set(data);
  return data.user;
}

export async function logout(): Promise<void> {
  // Best-effort server logout; ignore errors.
  try {
    await apiFetch("/api/v1/auth/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
  tokenStorage.clear();
}
