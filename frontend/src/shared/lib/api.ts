import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// In-Memory Cache Store cho Frontend
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // in milliseconds
}

const apiCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();

export const clearApiCache = (prefix?: string) => {
  if (!prefix) {
    apiCache.clear();
    inFlightRequests.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(prefix)) {
      apiCache.delete(key);
    }
  }
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper lấy Cache Key từ config
const getCacheKey = (config: InternalAxiosRequestConfig | AxiosRequestConfig): string => {
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${config.method?.toUpperCase() || 'GET'}:${url}:${params}`;
};

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      let token =
        localStorage.getItem('auth_token') ||
        localStorage.getItem('finflow_token');

      if (!token) {
        try {
          const userStorage = localStorage.getItem('user-storage');
          if (userStorage) {
            const parsed = JSON.parse(userStorage);
            token = parsed?.state?.token;
          }
        } catch (e) {
          // ignore error
        }
      }

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Kiểm tra In-Memory Cache đối với request GET
    if (config.method?.toLowerCase() === 'get' && !(config as any).bypassCache) {
      const cacheKey = getCacheKey(config);
      const cached = apiCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        // Trả về từ Cache bằng adapter custom
        config.adapter = () =>
          Promise.resolve({
            data: cached.data,
            status: 200,
            statusText: 'OK (from cache)',
            headers: {},
            config,
            request: {},
          } as AxiosResponse);
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();

    // 1. Lưu cache cho request GET thành công (TTL 30 giây)
    if (method === 'get' && response.status === 200 && !(response.config as any).bypassCache) {
      const cacheKey = getCacheKey(response.config);
      const customTtl = (response.config as any).cacheTtl || 30 * 1000; // 30s
      apiCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
        ttl: customTtl,
      });
    }

    // 2. Tự động Invalidate Cache khi có Mutation (POST, PUT, PATCH, DELETE)
    if (['post', 'put', 'patch', 'delete'].includes(method || '')) {
      const url = response.config.url || '';
      if (url.includes('/orders')) {
        clearApiCache('/orders');
        clearApiCache('/analytics');
      } else if (url.includes('/transactions')) {
        clearApiCache('/transactions');
        clearApiCache('/analytics');
        clearApiCache('/wallets');
        clearApiCache('/budgets');
      } else {
        clearApiCache(); // Xóa toàn bộ cache để đảm bảo nhất quán
      }
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const url = error.config?.url || '';
      const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');

      if (!isAuthRequest) {
        console.warn('Phiên đăng nhập đã hết hạn hoặc không hợp lệ (401). Đang làm mới phiên...');
        clearApiCache();
        localStorage.removeItem('auth_token');
        localStorage.removeItem('finflow_token');
        localStorage.removeItem('user-storage');
        setTimeout(() => {
          window.location.href = '/';
        }, 200);
      }
    }
    return Promise.reject(error);
  },
);
