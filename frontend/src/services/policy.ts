import ApiInstance from "./api.instance";


export interface PolicyData {
  _id?: string;
  SRC?: string;
  FIN_YR?: number;
  FIN_MONTH?: number;
  applicationNo?: string;
  policyNo: string;
  CHDRSTCDB?: string;
  proposalDate?: Date;
  originalIssueDate?: Date;
  contractCommencementDate?: Date;
  premiumPayingTerm?: number;
  policyTerm?: number;
  branchCode?: string;
  branchName?: string;
  productCode?: string;
  productName: string;
  productVariant?: string;
  PREMIUM?: number;
  netPremium?: number;
  sumAssured?: number;
  FYWRP?: number;
  transactionDateFinal?: Date;
  transactionDate?: Date;
  cancellationDate?: Date;
  transactionNo?: string;
  FYFLG?: string;
  lineGroup?: string;
  salesUnit?: string;
  ZBANCNUM?: string;
  REPNUM?: string;
  IACode?: string;
  channel?: string;
  subChannel?: string;
  payeeCode?: string;
  payeeName?: string;
  relationshipCode?: string;
  relationshipName?: string;
  clientId?: string;
  customerName?: string;
  agentNo?: string;
  agentName?: string;
  agentType?: string;
  agentAppointedDt?: Date;
  agentTerminatedDt?: Date;
  AGNTNUM_1_TO_MANY?: string;
  totalRate?: number;
  commission?: number;
  reward?: number;
  masterRef?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadPolicyResponse {
  message: string;
  totalProcessed: number;
  totalErrors: number;
  errors: Array<{ policyNo: string; error: string }>;
}

export interface PoliciesResponse {
  data: PolicyData[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface PolicyResponse {
  data: PolicyData;
}

// Create a non-authenticated API instance for READ operations (commission section)
const createPolicyReadApiInstance = () => {
  const baseURL = 'http://localhost:3001/api';
  
  return {
    get: async (endpoint: string) => {
      const response = await fetch(`${baseURL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  };
};

// Create an authenticated API instance for WRITE operations
const createPolicyWriteApiInstance = () => {
  const baseURL = 'http://localhost:3001/api';
  
  return {
    post: async (endpoint: string, data?: any) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please login to perform this operation.');
      }
      
      const config: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: data instanceof FormData ? data : JSON.stringify(data),
      };
      
      const response = await fetch(`${baseURL}${endpoint}`, config);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    
    put: async (endpoint: string, data: any) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please login to perform this operation.');
      }
      
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    
    delete: async (endpoint: string) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required. Please login to perform this operation.');
      }
      
      const response = await fetch(`${baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  };
};

export const policyAPI = {
  // Get all policies with pagination (READ - no auth required)
  getPolicies: async (page: number = 1, limit: number = 10): Promise<PoliciesResponse> => {
    const api = createPolicyReadApiInstance();
    const response = await api.get(`/policies?page=${page}&limit=${limit}`);
    return response;
  },

  // Get single policy by ID (READ - no auth required)
  getPolicy: async (id: string): Promise<PolicyResponse> => {
    const api = createPolicyReadApiInstance();
    const response = await api.get(`/policies/${id}`);
    return response;
  },

  // Create new policy (WRITE - requires authentication)
  createPolicy: async (policyData: Omit<PolicyData, '_id' | 'createdAt' | 'updatedAt'>): Promise<PolicyResponse> => {
    const api = createPolicyWriteApiInstance();
    const response = await api.post('/policies', policyData);
    return response;
  },

  // Update policy (WRITE - requires authentication)
  updatePolicy: async (id: string, policyData: Partial<PolicyData>): Promise<PolicyResponse> => {
    const api = createPolicyWriteApiInstance();
    const response = await api.put(`/policies/${id}`, policyData);
    return response;
  },

  // Delete policy (WRITE - requires authentication)
  deletePolicy: async (id: string): Promise<{ message: string }> => {
    const api = createPolicyWriteApiInstance();
    const response = await api.delete(`/policies/${id}`);
    return response;
  },

  // Upload CSV file (WRITE - requires authentication)
  uploadCSV: async (file: File): Promise<UploadPolicyResponse> => {
    const api = createPolicyWriteApiInstance();
    const response = await api.post('/policies/upload', file);
    return response;
  },

  // Search policies (READ - no auth required)
  searchPolicies: async (query: string): Promise<PolicyData[]> => {
    const api = createPolicyReadApiInstance();
    const response = await api.get(`/policies/search?query=${encodeURIComponent(query)}`);
    return response;
  },

  // Get policy statistics (READ - no auth required)
  getPolicyStats: async (): Promise<any> => {
    const api = createPolicyReadApiInstance();
    const response = await api.get('/policies/stats');
    return response;
  },
};

// Special function for commission section - allows policy upload without authentication
export const commissionPolicyAPI = {
  // Get all policies with pagination (READ - no auth required)
  getPolicies: async (page: number = 1, limit: number = 10): Promise<PoliciesResponse> => {
    const api = createPolicyReadApiInstance();
    const response = await api.get(`/policies?page=${page}&limit=${limit}`);
    return response;
  },

  // Get single policy by ID (READ - no auth required)
  getPolicy: async (id: string): Promise<PolicyResponse> => {
    const api = createPolicyReadApiInstance();
    const response = await api.get(`/policies/${id}`);
    return response;
  },

  // Upload CSV file for commission section (no authentication required)
  uploadCSV: async (file: File): Promise<UploadPolicyResponse> => {
    const baseURL = 'http://localhost:3001/api';
    const formData = new FormData();
    formData.append('file', file);
    
    const response:any = await ApiInstance.post(`${baseURL}/policies/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    
    if (!response) {
      throw new Error(`Upload failed! status: ${response.status}`);
    }
    
    return response;
  },
};

export default policyAPI;
