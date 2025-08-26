import axios from "axios";

const ApiInstance = axios.create({
  baseURL: "http://localhost:3001/api",
  // withCredentials: true, // enable if you use cookies
});

// ---- Request interceptor: add token and smart Content-Type ----
ApiInstance.interceptors.request.use((config) => {
  // Inject Authorization
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // Only set application/json if NOT sending FormData
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  const method = (config.method || "get").toLowerCase();
  const methodHasBody = method === "post" || method === "put" || method === "patch";

  if (methodHasBody && !isFormData) {
    config.headers = config.headers ?? {};
    if (!(config.headers as any)["Content-Type"]) {
      (config.headers as any)["Content-Type"] = "application/json";
    }
  }

  return config;
});

// ---- Response interceptor: refresh token on 401 once ----
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const processQueue = (newToken: string | null) => {
  pendingQueue.forEach((cb) => cb(newToken));
  pendingQueue = [];
};

ApiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: any = error.config;

    // Don’t refresh for refresh endpoint itself
    const isRefreshCall =
      originalRequest?.url?.includes("/auth/refresh-token");

    if (error.response?.status === 401 && !originalRequest?._retry && !isRefreshCall) {
      if (isRefreshing) {
        // Queue the request until refresh completes (fix: consistent return)
        return new Promise((resolve, reject) => {
          pendingQueue.push((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(ApiInstance(originalRequest));
            return;
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const refreshResponse = await axios.post(
          "http://localhost:3001/api/auth/refresh-token",
          { refreshToken }
        );

        if (refreshResponse.data?.success) {
          const { accessToken, refreshToken: newRefresh } =
            refreshResponse.data.tokens || {};

          if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
            if (newRefresh) localStorage.setItem("refreshToken", newRefresh);

            processQueue(accessToken);

            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return ApiInstance(originalRequest);
          }
        }

        throw new Error("Refresh failed");
      } catch (refreshError) {
        processQueue(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/auth/sign-in";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default ApiInstance;
