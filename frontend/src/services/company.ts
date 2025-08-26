import ApiInstance from "./api.instance";

export const CompanyApi = {
    getCompanies: async (): Promise<any> => {
        const response = await ApiInstance.get('/companies/get');
        return response.data;
    },
    
};
