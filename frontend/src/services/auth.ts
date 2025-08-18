const API_BASE_URL = 'http://localhost:5002/api';

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
  }) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

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
};

export default authAPI;
