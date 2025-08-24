import axios from "axios";

const ApiInstance = axios.create({
    baseURL: "http://localhost:3001/api",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('accessToken')}`,
    },
});

// Add a request interceptor to update the token before each request
ApiInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
);

// Add a response interceptor to handle token expiration
ApiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If the error is 401 (Unauthorized) and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    // Try to refresh the token
                    const refreshResponse = await axios.post('http://localhost:3001/api/auth/refresh-token', {
                        refreshToken
                    });
                    
                    if (refreshResponse.data.success) {
                        // Store new tokens
                        localStorage.setItem('accessToken', refreshResponse.data.tokens.accessToken);
                        localStorage.setItem('refreshToken', refreshResponse.data.tokens.refreshToken);
                        
                        // Update the original request with new token
                        originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.tokens.accessToken}`;
                        
                        // Retry the original request
                        return ApiInstance(originalRequest);
                    }
                }
            } catch (refreshError) {
                // If refresh fails, redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/auth/sign-in';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default ApiInstance;
