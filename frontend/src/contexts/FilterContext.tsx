import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { CompanyApi } from 'src/services/company';

export interface Company {
  _id: string;
  name: string;
}

interface FilterContextType {
  year: number;
  setYear: (year: number) => void;
  startDate: number;
  setStartDate: (date: number) => void;
  endDate: number;
  setEndDate: (date: number) => void;
  selectedCompanyIds: string[];
  companies: Company[];
  companiesLoading: boolean;
  companiesError: string | null;
  addCompanyId: (id: string) => void;
  removeCompanyId: (id: string) => void;
  setSelectedCompanyIds: (ids: string[]) => void;
  clearFilters: () => void;
  loadCompanies: () => Promise<void>;
  deleteCompany: (id: string) => Promise<boolean>;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
  initialYear?: number;
  initialStartDate?: number;
  initialEndDate?: number;
  initialSelectedCompanyIds?: string[];
}

export const FilterProvider: React.FC<FilterProviderProps> = ({
  children,
  initialYear = new Date().getFullYear(),
  initialStartDate =1, // Start of current year
  initialEndDate =12, // Current date
  initialSelectedCompanyIds = [],
}) => {
  const [year, setYear] = useState<number>(initialYear);
  const [startDate, setStartDate] = useState<number>(initialStartDate);
  const [endDate, setEndDate] = useState<number>(initialEndDate);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(
    initialSelectedCompanyIds
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState<boolean>(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  const addCompanyId = useCallback((id: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
  }, []);

  const removeCompanyId = useCallback((id: string) => {
    setSelectedCompanyIds((prev) => prev.filter((companyId) => companyId !== id));
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      setCompaniesLoading(true);
      const response = await CompanyApi.getCompanies();
      setCompanies(response.data as Company[]);
      setCompaniesError(null);
      
      // Only set default company if no company is selected
      if (response.data.length > 0 && selectedCompanyIds.length === 0) {
        setSelectedCompanyIds([response.data[0]._id]);
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load companies';
      setCompaniesError(errorMessage);
      throw error;
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  const deleteCompany = useCallback(async (id: string): Promise<boolean> => {
    try {
      await CompanyApi.deleteCompany(id);
      setCompanies(prev => prev.filter(company => company._id !== id));
      setSelectedCompanyIds(prev => prev.filter(companyId => companyId !== id));
      return true;
    } catch (error) {
      console.error('Error deleting company:', error);
      return false;
    }
  }, []);

  const clearFilters = useCallback(() => {
    const currentYear = new Date().getFullYear();
    setYear(currentYear);
    setStartDate(new Date(currentYear, 0, 1).getMonth());
    setEndDate(new Date().getMonth());
    setSelectedCompanyIds(companies.length > 0 ? [companies[0]._id] : []);
  }, [companies]);

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  return (
    <FilterContext.Provider
      value={{
        year,
        setYear,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        selectedCompanyIds,
        companies,
        companiesLoading,
        companiesError,
        addCompanyId,
        removeCompanyId,
        setSelectedCompanyIds,
        clearFilters,
        loadCompanies,
        deleteCompany,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
