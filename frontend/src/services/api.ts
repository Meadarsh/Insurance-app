import { policyAPI } from './policy';
import { analyticsAPI } from './analytics';
import usersAPI from './users';

const API_BASE_URL = 'http://localhost:3001/api';

// Generic API request function
export async function apiRequest<T>(
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

// Vendor API functions
export const vendorAPI = {
  // Upload vendors from CSV file
  uploadVendors: async (file: File): Promise<{
    message: string;
    processed: number;
    errors?: any[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/vendors/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Get all vendors with pagination
  getVendors: async (page: number = 1, limit: number = 10) => 
    apiRequest(`/vendors?page=${page}&limit=${limit}`),

  // Search vendors
  searchVendors: async (query: string) => 
    apiRequest(`/vendors/search?query=${encodeURIComponent(query)}`),

  // Get vendor by ID
  getVendorById: async (id: string) => 
    apiRequest(`/vendors/${id}`),

  // Create new vendor
  createVendor: async (vendorData: any) => 
    apiRequest('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendorData),
    }),

  // Update vendor
  updateVendor: async (id: string, vendorData: any) => 
    apiRequest(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vendorData),
    }),

  // Delete vendor
  deleteVendor: async (id: string) => 
    apiRequest(`/vendors/${id}`, {
      method: 'DELETE',
    }),
};

// Health check
export const healthCheck = async () => apiRequest('/health');

export default {
  vendorAPI,
  policyAPI,
  analyticsAPI,
  usersAPI,
  healthCheck,
};
