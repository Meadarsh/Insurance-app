import ApiInstance from "./api.instance";

export const CompanyApi = {
    getCompanies: async (): Promise<any> => {
        const response = await ApiInstance.get('/companies/get');
        return response.data;
    },
    
    deleteCompany: async (companyId: string): Promise<any> => {
        const response = await ApiInstance.delete(`/companies/delete/${companyId}`);
        return response.data;
    }
};
