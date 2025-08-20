const API_BASE_URL = 'http://localhost:3001/api';

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Token management functions
export const tokenManager = {
  // Get access token from localStorage
  getAccessToken: (): string | null => localStorage.getItem('accessToken'),

  // Get refresh token from localStorage
  getRefreshToken: (): string | null => localStorage.getItem('refreshToken'),

  // Set tokens in localStorage
  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  // Clear tokens from localStorage
  clearTokens: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  // Check if token is expired
  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },
};

// Authentication API functions
export const authAPI = {
  // User registration
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  // User login
  login: async (credentials: {
    email: string;
    password: string;
  }) => {
    const response = await apiRequest<{
      success: boolean;
      data: {
        user: any;
        accessToken: string;
        refreshToken: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      tokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  },

  // Refresh authentication token
  refreshToken: async (refreshToken: string) => apiRequest('/auth/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  }),

  // Send OTP
  sendOTP: async (email: string, type: 'signup' | 'login' | 'reset' | 'verification' = 'verification') => apiRequest('/otp/send', {
    method: 'POST',
    body: JSON.stringify({ email, type }),
  }),

  // Verify OTP
  verifyOTP: async (email: string, otp: string, type: 'signup' | 'login' | 'reset' | 'verification' = 'verification') => apiRequest('/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, otp, type }),
  }),

  // Logout
  logout: (): void => {
    tokenManager.clearTokens();
  },
};

export default authAPI;
