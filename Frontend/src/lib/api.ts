import axios from "axios";

// function readCookie(name: string) {
//   const prefixed = `${name}=`;
//   const cookie = document.cookie
//     .split(";")
//     .map((x) => x.trim())
//     .find((x) => x.startsWith(prefixed));
//   return cookie ? decodeURIComponent(cookie.slice(prefixed.length)) : null;
// }

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrfToken = localStorage.getItem("csrfToken");

  console.log("CSRF from localStorage:", csrfToken);

  if (
    csrfToken &&
    config.method &&
    !["get", "head", "options"].includes(config.method.toLowerCase())
  ) {
    config.headers["x-csrf-token"] = csrfToken;
  }

  return config;
});

let refreshingPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const status = error?.response?.status;
    const requestUrl = originalRequest?.url || "";

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.includes("/api/auth/login") &&
      !requestUrl.includes("/api/auth/signup") &&
      !requestUrl.includes("/api/auth/refresh") &&
      !requestUrl.includes("/api/auth/reset-password") &&
      !requestUrl.includes("/api/auth/request-password-reset")
    ) {
      originalRequest._retry = true;
      if (!refreshingPromise) {
        refreshingPromise = api
  .post("/api/auth/refresh")
  .then((res) => {
    if (res.data?.csrfToken) {
      localStorage.setItem("csrfToken", res.data.csrfToken);
    }
  })
  .finally(() => {
    refreshingPromise = null;
  });
      }

      await refreshingPromise;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);
