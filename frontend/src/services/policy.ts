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




export const policyAPI = {
  // Get all policies with pagination (READ - no auth required)
  getPolicies: async (companyIds: string[],page: number = 1, limit: number = 10): Promise<PoliciesResponse> => {
    console.log("companyIds",companyIds);
    const response = await ApiInstance.post(`/policies/get?page=${page}&limit=${limit}`,{
      companyIds
    });
    return response.data;
  },

  // Get single policy by ID (READ - no auth required)
  getPolicy: async (id: string): Promise<PolicyResponse> => {
    const response = await ApiInstance.get(`/policies/get/${id}`);
    return response.data;
  },

  // Create new policy (WRITE - requires authentication)
  createPolicy: async (policyData: Omit<PolicyData, '_id' | 'createdAt' | 'updatedAt'>): Promise<PolicyResponse> => {
    const response = await ApiInstance.post('/policies/create', policyData);
    return response;
  },

  // Update policy (WRITE - requires authentication)
  updatePolicy: async (id: string, policyData: Partial<PolicyData>): Promise<PolicyResponse> => {
    const response = await ApiInstance.put(`/policies/update/${id}`, policyData);
    return response.data;
  },

  // Delete policy (WRITE - requires authentication)
  deletePolicy: async (id: string): Promise<{ message: string }> => {
    const response = await ApiInstance.delete(`/policies/delete/${id}`);
    return response.data;
  },

  // Upload CSV file (WRITE - requires authentication)
  uploadCSV: async (file: File): Promise<UploadPolicyResponse> => {
    const fd = new FormData();
    fd.append('file', file);
    const response = await ApiInstance.post('/policies/upload', fd, {
      withCredentials: true,
    });
    return response.data;
  },

  // Search policies (READ - no auth required)
  searchPolicies: async (query: string): Promise<PolicyData[]> => {
    const response = await ApiInstance.get(`/policies/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get policy statistics (READ - no auth required)
  getPolicyStats: async (): Promise<any> => {
    const response = await ApiInstance.get('/policies/stats');
    return response.data;
  },
};

// Special function for commission section - allows policy upload without authentication
export const commissionPolicyAPI = {
  // Get company policies with pagination (supports infinite scroll)
  getPolicies: async (companyId: string, page: number = 1, limit: number = 50): Promise<PoliciesResponse> => {
    const response = await ApiInstance.get(`/analytics/company/${companyId}/policies`, {
      params: { page, limit },
      withCredentials: true,
    });
    return response.data;
  },

  getPolicy: async (id: string): Promise<PolicyResponse> => {
    const response = await ApiInstance.get(`/policies/get/${id}`, { withCredentials: true });
    return response.data;
  },

  // ✅ Upload CSV using FormData (do NOT set Content-Type)
  uploadCSV: async (file: File): Promise<UploadPolicyResponse> => {
    const fd = new FormData();
    fd.append('file', file);
    const response = await ApiInstance.post(`/policies/upload`, fd, {
      withCredentials: true,
    });
    return response.data;
  },
};
export default policyAPI;
