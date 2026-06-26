import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/";
export const WS_BASE_URL = BASE_URL.replace(/^http/, "ws").replace(/\/$/, "");

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function refreshAccessToken(): Promise<string> {
  const { data } = await axios.post(
    `${BASE_URL}api/auth/login/refresh/`,
    {},
    { withCredentials: true },
  );
  const newToken: string = data.access;
  localStorage.setItem("access_token", newToken);
  return newToken;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const flushQueue = (token: string | null, error: unknown = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (original.url?.includes("/auth/login/")) {
      return Promise.reject(error);
    }

    console.log("[auth] Interceptor: got 401, attempting refresh");
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }
    original._retry = true;
    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      flushQueue(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      console.log("[auth] Interceptor: refresh success");
      return api(original);
    } catch (refreshError) {
      flushQueue(null, refreshError);
      localStorage.removeItem("access_token");
      console.log("[auth] Interceptor: refresh failed, redirecting to login");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post("api/auth/login/", data),

  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
  }) => api.post("api/auth/register/", data),

  logout: () => api.post("api/auth/logout/"),

  verifyEmail: (token: string) =>
    api.get(`api/auth/verify-email/?token=${token}`),

  resendVerification: (email: string) =>
    api.post("api/auth/resend-verification/", { email }),
};

export const userAPI = {
  getProfile: () => api.get("api/profile/"),
  getProfileById: (userId: string) => api.get(`api/profile/${userId}/`),
  updateProfile: (data: { cursor?: string | null; canvas?: string | null }) =>
    api.patch("api/profile/update/", data),
};

export const serversAPI = {
  getServers: () => api.get("api/servers/"),
  createServer: (max_players: number) => api.post("api/servers/", { max_players }),
  joinServer: (room_code: string) => api.post(`api/servers/${room_code}/join/`),
  leaveServer: (room_code: string) => api.post(`api/servers/${room_code}/leave/`),
  getServer: (room_code: string) => api.get(`api/servers/${room_code}/`),
  deleteServer: (room_code: string) => api.delete(`api/servers/${room_code}/delete/`),
};

export const marketAPI = {
  getShop: () => api.get("api/market/"),
  getInventory: () => api.get("api/market/inventory/"),
  buy: (itemId: string, itemType: "cursor" | "canvas") =>
    api.post("api/market/buy/", { item_id: itemId, item_type: itemType }),
  getPurchases: () => api.get("api/market/purchases/"),
};
