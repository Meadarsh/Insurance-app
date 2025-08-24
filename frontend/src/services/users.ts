import ApiInstance from './api.instance';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendor' | 'executor';
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  total: number;
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export interface UserCountResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    verified: number;
  };
}

// Cache for users data
let usersCache: User[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Check if cache is valid
const isCacheValid = (): boolean => 
  usersCache !== null && (Date.now() - cacheTimestamp) < CACHE_DURATION;

// Get all users
export const getUsers = async (): Promise<User[]> => {
  try {
    // Check cache first
    if (isCacheValid()) {
      console.log('🔍 Users: Returning cached data');
      return usersCache!;
    }

    console.log('🔍 Users: Fetching from API...');
    const response = await ApiInstance.get<UsersResponse>('/users');
    console.log('🔍 Users: API response:', response);
    
    if (response.status === 200 && response.data.success) {
      // Update cache
      usersCache = response.data.data;
      cacheTimestamp = Date.now();
      console.log('🔍 Users: Successfully fetched', response.data.data.length, 'users');
      return response.data.data;
    }
    
    throw new Error('Failed to fetch users');
  } catch (error) {
    console.error('🔍 Users: Error fetching users:', error);
    if ((error as any).response) {
      console.error('🔍 Users: Response status:', (error as any).response.status);
      console.error('🔍 Users: Response data:', (error as any).response.data);
    }
    throw new Error('Failed to fetch users. Please try again.');
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<User> => {
  try {
    const response = await ApiInstance.get<UserResponse>(`/users/${id}`);
    
    if (response.status === 200 && response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch user');
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user. Please try again.');
  }
};

// Update user
export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    const response = await ApiInstance.put<UserResponse>(`/users/${id}`, userData);
    
    if (response.status === 200 && response.data.success) {
      // Invalidate cache to refresh data
      usersCache = null;
      return response.data.data;
    }
    
    throw new Error('Failed to update user');
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user. Please try again.');
  }
};

// Delete user
export const deleteUser = async (id: string): Promise<void> => {
  try {
    const response = await ApiInstance.delete(`/users/${id}`);
    
    if (response.status === 200) {
      // Invalidate cache to refresh data
      usersCache = null;
      return;
    }
    
    throw new Error('Failed to delete user');
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user. Please try again.');
  }
};

// Get users count for analytics
export const getUsersCount = async (): Promise<{ total: number; active: number; verified: number }> => {
  try {
    const response = await ApiInstance.get<UserCountResponse>('/users/count');
    
    if (response.status === 200 && response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to fetch users count');
  } catch (error) {
    console.error('Error fetching users count:', error);
    throw new Error('Failed to fetch users count. Please try again.');
  }
};

// Clear cache
export const clearUsersCache = (): void => {
  usersCache = null;
  cacheTimestamp = 0;
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await ApiInstance.get('/users/count');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

// Default export for the users API
const usersAPI = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersCount,
  clearUsersCache,
  healthCheck,
};

export default usersAPI;
