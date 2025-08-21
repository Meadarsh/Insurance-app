import ApiInstance from "./api.instance";

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
    const response = await ApiInstance.get('/masters/get');
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
