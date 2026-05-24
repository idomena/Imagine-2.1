import { apiFetch, tokenStorage, type ApiUser } from "./api";

type AuthSuccess = {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
};

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
