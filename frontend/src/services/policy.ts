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

// Policy API functions
export const policyAPI = {
  // Get all policies with pagination
  getPolicies: async (page: number = 1, limit: number = 10) => 
    apiRequest(`/policies?page=${page}&limit=${limit}`),

  // Get policy by ID
  getPolicyById: async (id: string) => 
    apiRequest(`/policies/${id}`),

  // Create new policy
  createPolicy: async (policyData: any) => 
    apiRequest('/policies', {
      method: 'POST',
      body: JSON.stringify(policyData),
    }),

  // Update policy
  updatePolicy: async (id: string, policyData: any) => 
    apiRequest(`/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policyData),
    }),

  // Delete policy
  deletePolicy: async (id: string) => 
    apiRequest(`/policies/${id}`, {
      method: 'DELETE',
    }),

  // Search policies
  searchPolicies: async (query: string) => 
    apiRequest(`/policies/search?query=${encodeURIComponent(query)}`),

  // Get policy statistics
  getPolicyStats: async () => 
    apiRequest('/policies/stats'),

  // Upload policies from CSV file
  uploadPolicies: async (file: File): Promise<{
    message: string;
    processed: number;
    errors?: any[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/policies/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed! status: ${response.status}`);
    }
    
    return await response.json();
  },
};

export default policyAPI;
