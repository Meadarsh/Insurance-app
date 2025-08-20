

// Create a non-authenticated API instance for master operations
const createMasterApiInstance = () => {
  const baseURL = 'http://localhost:3001/api';
  
  return {
    get: async (endpoint: string) => {
      const response = await fetch(`${baseURL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    
    post: async (endpoint: string, data?: any) => {
      const config: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json',
        },
        body: data instanceof FormData ? data : JSON.stringify(data),
      };
      
      const response = await fetch(`${baseURL}${endpoint}`, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    
    put: async (endpoint: string, data: any) => {
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    
    delete: async (endpoint: string) => {
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  };
};

export interface MasterData {
  _id?: string;
  productName: string;
  premiumPayingTerm: {
    min: number;
    max: number | null;
  };
  policyTerm: number;
  policyNumber: string;
  policyPrices: Array<{
    price: number;
    date: Date;
  }>;
  productVariant?: string;
  totalRate: number;
  commission: number;
  reward: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadResponse {
  success: boolean;
  count: number;
  data: MasterData[];
}

export interface MastersResponse {
  success: boolean;
  count: number;
  data: MasterData[];
}

export interface MasterResponse {
  success: boolean;
  data: MasterData;
}

export const masterAPI = {
  // Get all master records
  getMasters: async (): Promise<MastersResponse> => {
    const api = createMasterApiInstance();
    const response = await api.get('/masters/get');
    return response;
  },

  // Get single master record
  getMaster: async (id: string): Promise<MasterResponse> => {
    const api = createMasterApiInstance();
    const response = await api.get(`/masters/get/${id}`);
    return response;
  },

  // Create new master record
  createMaster: async (masterData: Omit<MasterData, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<MasterResponse> => {
    const api = createMasterApiInstance();
    const response = await api.post('/masters/create', masterData);
    return response;
  },

  // Update master record
  updateMaster: async (id: string, masterData: Partial<MasterData>): Promise<MasterResponse> => {
    const api = createMasterApiInstance();
    const response = await api.put(`/masters/update/${id}`, masterData);
    return response;
  },

  // Delete master record
  deleteMaster: async (id: string): Promise<{ success: boolean; data: {} }> => {
    const api = createMasterApiInstance();
    const response = await api.delete(`/masters/delete/${id}`);
    return response;
  },

  // Upload CSV file
  uploadCSV: async (file: File): Promise<UploadResponse> => {
    const baseURL = 'http://localhost:3001/api';
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${baseURL}/masters/upload-csv`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};

export default masterAPI;
