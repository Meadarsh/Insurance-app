import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tokenManager } from '../services/auth';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
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

  const checkAuth = (): boolean => {
    const token = tokenManager.getAccessToken();
    if (!token) {
      return false;
    }

    if (tokenManager.isTokenExpired(token)) {
      // Token is expired, try to refresh
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken && !tokenManager.isTokenExpired(refreshToken)) {
        // TODO: Implement token refresh logic
        return false;
      } else {
        // Both tokens are expired, logout
        logout();
        return false;
      }
    }

    return true;
  };

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    tokenManager.setTokens(accessToken, refreshToken);
    setUser(userData);
  };

  const logout = () => {
    tokenManager.clearTokens();
    setUser(null);
  };

  useEffect(() => {
    // Check authentication status on mount
    const isAuth = checkAuth();
    if (isAuth) {
      // TODO: Fetch user data from token or API
      // For now, we'll just set a basic user object
      setUser({
        _id: 'temp-user-id',
        name: 'User',
        email: 'user@example.com',
        role: 'user'
      });
    }
    setIsLoading(false);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
