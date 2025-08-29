import ApiInstance from "./api.instance";

export interface MasterData {
  _id?: string;
  company?: string;
  productName: string;
  productVariant?: string;
  premiumPayingTermMin: number;
  premiumPayingTermMax: number | null;
  policyTerm: number;
  policyNumber: string;
  totalRate: number;
  commission: number;
  reward: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface UploadResponse {
  success: boolean;
  count: number;
  data: MasterData[];
}

export interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MastersResponse {
  success: boolean;
  data: MasterData[];
  pagination: PaginationInfo;
}

export interface MasterResponse {
  success: boolean;
  data: MasterData;
}

export const masterAPI = {
  // Get all master records with pagination
  getMasters: async (params?: { page?: number; limit?: number }): Promise<MastersResponse> => {
    const response = await ApiInstance.get('/masters/get', { params });
    return response.data;
  },

  // Get single master record
  getMaster: async (id: string): Promise<MasterResponse> => {
    const response = await ApiInstance.get(`/masters/get/${id}`);
    return response.data;
  },

  // Create new master record
  createMaster: async (masterData: Omit<MasterData, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<MasterResponse> => {
    const response = await ApiInstance.post('/masters/create', masterData);
    return response.data;
  },

  // Update master record
  updateMaster: async (id: string, masterData: Partial<MasterData>): Promise<MasterResponse> => {
    const response = await ApiInstance.put(`/masters/update/${id}`, masterData);
    return response.data;
  },

  // Delete master record
  deleteMaster: async (id: string): Promise<{ success: boolean; data: {} }> => {
    const response = await ApiInstance.delete(`/masters/delete/${id}`);
    return response.data;
  },

  // Upload CSV file
  uploadCSV: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await ApiInstance.post('/masters/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
};

export default masterAPI;
