import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { tokenManager } from '../services/auth';
import ApiInstance from '../services/api.instance';
import { redirect } from 'react-router-dom';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  subscriptionEnd: string | null;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isSubscriptionExpired: boolean;
  daysUntilExpiry: number | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  subscriptionStatus: SubscriptionStatus;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  checkSubscriptionStatus: () => SubscriptionStatus;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    isSubscriptionExpired: true,
    daysUntilExpiry: null,
  });

  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await ApiInstance.get('/auth/me');
      if (response.data?.success) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      tokenManager.clearTokens();
      redirect('/auth/sign-in');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
      tokenManager.clearTokens();
    }
  }, []);

  const checkSubscriptionStatus = useCallback((): SubscriptionStatus => {
    if (!user || !user.subscriptionEnd) {
      return {
        hasActiveSubscription: false,
        isSubscriptionExpired: true,
        daysUntilExpiry: null,
      };
    }

    const now = new Date();
    const subscriptionEnd = new Date(user.subscriptionEnd);
    const timeDiff = subscriptionEnd.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const isExpired = subscriptionEnd < now;

    return {
      hasActiveSubscription: !isExpired,
      isSubscriptionExpired: isExpired,
      daysUntilExpiry: isExpired ? 0 : daysUntilExpiry,
    };
  }, [user]);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        return false;
      }

      // Check if token is expired
      if (tokenManager.isTokenExpired(token)) {
        const refreshToken = tokenManager.getRefreshToken();
        
        // If we have a valid refresh token, try to refresh
        if (refreshToken && !tokenManager.isTokenExpired(refreshToken)) {
          try {
            const response = await ApiInstance.post('/auth/refresh-token', { refreshToken });
            if (response.data?.success) {
              const { accessToken, refreshToken: newRefreshToken } = response.data.tokens || {};
              if (accessToken && newRefreshToken) {
                tokenManager.setTokens(accessToken, newRefreshToken);
                const userData = await fetchUser();
                if (userData) {
                  setUser(userData);
                  return true;
                }
              }
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
            // If refresh fails, clear tokens and user
            tokenManager.clearTokens();
            setUser(null);
            return false;
          }
        }
        // If we get here, refresh failed or tokens are invalid
        tokenManager.clearTokens();
        setUser(null);
        return false;
      }

      // Token is valid, fetch user data if not already loaded
      if (!user) {
        const userData = await fetchUser();
        if (userData) {
          setUser(userData);
          return true;
        }
        return false;
      }
      
      return true; // User is already loaded and token is valid
    } catch (error) {
      console.error('Auth check failed:', error);
      tokenManager.clearTokens();
      setUser(null);
      return false;
    }
  }, [user, fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await ApiInstance.post('/auth/login', { email, password });
      
      if (response.data?.success) {
        // Check both response structures
        const userData = response.data.user || response.data.data?.user;
        const tokens = response.data.tokens || response.data.data?.tokens;
        
        if (userData && tokens?.accessToken) {
          tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
          setUser(userData);
          return { success: true };
        }
      }
      
      return { 
        success: false, 
        message: response.data?.message || 'Invalid response from server' 
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'An error occurred during login' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const verifyAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth verification error:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [checkAuth]);

  // Update subscription status when user changes
  useEffect(() => {
    if (user) {
      setSubscriptionStatus(checkSubscriptionStatus());
    }
  }, [user, checkSubscriptionStatus]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    subscriptionStatus,
    login,
    logout,
    checkAuth,
    checkSubscriptionStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
