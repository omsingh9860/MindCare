import { api } from "./api";

export type User = { id: string; name: string; email: string; emailVerified?: boolean };

export async function signup(name: string, email: string, password: string) {
  const res = await api.post("/api/auth/signup", { name, email, password });
  return res.data as { message: string };
}

export async function login(email: string, password: string, rememberMe: boolean) {
  const res = await api.post("/api/auth/login", { email, password, rememberMe });

  if (res.data?.csrfToken) {
    localStorage.setItem("csrfToken", res.data.csrfToken);
  }

  return res.data;
}

export async function verifyEmail(token: string) {
  const res = await api.post("/api/auth/verify-email", { token });

  if (res.data?.csrfToken) {
    localStorage.setItem("csrfToken", res.data.csrfToken);
  }

  return res.data.user as User;
}

export async function resendVerification(email: string) {
  const res = await api.post("/api/auth/resend-verification", { email });
  return res.data as { message: string };
}

export async function requestPasswordReset(email: string) {
  const res = await api.post("/api/auth/request-password-reset", { email });
  return res.data as { message: string };
}

export async function resetPassword(token: string, password: string) {
  const res = await api.post("/api/auth/reset-password", { token, password });
  return res.data as { message: string };
}

export async function getMe() {
  const res = await api.get("/api/auth/me");
  return res.data.user as User;
}

export async function refreshSession() {
  const res = await api.post("/api/auth/refresh");

  if (res.data?.csrfToken) {
    localStorage.setItem("csrfToken", res.data.csrfToken);
  }

  return res.data.user as User;
}

export async function logout() {
  await api.post("/api/auth/logout");
  localStorage.removeItem("csrfToken");
}
