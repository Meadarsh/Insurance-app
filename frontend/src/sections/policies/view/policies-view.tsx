import { useState, useCallback } from 'react';
import { Box, Button, Grid, Pagination, Typography } from '@mui/material';
import { DashboardContent } from 'src/layouts/dashboard';
import { PolicySort } from '../policies-sort';
import { PolicyItem } from '../policies-item';
import { PolicyFilters, PolicyFiltersProps } from '../policies-filters';
import { AddPolicyDrawer } from '../add-policy';
import { Iconify } from 'src/components/iconify';

// Policy filter options
const PRODUCT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Policies' },
  { value: 'term', label: 'Term Life' },
  { value: 'health', label: 'Health Insurance' },
  { value: 'investment', label: 'Investment Plans' },
];

export interface PolicyFormData {
  policyNumber: string;
  productName: string;
  variant: string;
  premium: number;
  premiumPayingTerm: number;
  policyTerm: number;
  startDate: string;
  insuranceCompany: string;
}

const COMMISSION_STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'paid', label: 'Commission Paid' },
  { value: 'pending', label: 'Pending Payment' },
  { value: 'disputed', label: 'Disputed' },
];

const PREMIUM_RANGE_OPTIONS = [
  { value: 'below', label: 'Below ₹10,000' },
  { value: '10k-50k', label: '₹10,000 - ₹50,000' },
  { value: 'above', label: 'Above ₹50,000' },
];

const defaultFilters: PolicyFiltersProps = {
  productType: PRODUCT_TYPE_OPTIONS[0].value,
  status: COMMISSION_STATUS_OPTIONS[0].value,
  premiumRange: '',
  startDate: null,
  endDate: null,
};

export function PoliciesView() {

  const [sortBy, setSortBy] = useState('newest');
  const [openFilter, setOpenFilter] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);

  // Mock policy data using your specified fields
  const mockPolicies = [
    {
      id: 'POL1001',
      policyNumber: 'POL1001',
      productName: 'Term Life Plus',
      variant: 'Standard',
      premium: 5000,
      premiumPayingTerm: 10,
      policyTerm: 20,
      startDate: '2024-01-01',
      endDate: '2044-01-01',
      insuranceCompany: 'ABC Insurance',
      commissionStatus: 'paid',
    },
    {
      id: 'POL1002',
      policyNumber: 'POL1002',
      productName: 'Health Shield',
      variant: 'Gold',
      premium: 12000,
      premiumPayingTerm: 5,
      policyTerm: 5,
      startDate: '2024-02-15',
      endDate: '2029-02-15',
      insuranceCompany: 'XYZ Insurance',
      commissionStatus: 'pending',
    },
  ];

  const handleOpenFilter = useCallback(() => {
    setOpenFilter(true);
  }, []);

  const handleCloseFilter = useCallback(() => {
    setOpenFilter(false);
  }, []);

  const handleSort = useCallback((newSort: string) => {
    setSortBy(newSort);
  }, []);


  const handleSetFilters = useCallback((updateState: Partial<PolicyFiltersProps>) => {
    setFilters((prevValue) => ({ ...prevValue, ...updateState }));
  }, []);

  const canReset = Object.keys(filters).some(
    (key) => filters[key as keyof typeof filters] !== defaultFilters[key as keyof typeof filters]
  );

  // Filter policies based on selected filters
  const filteredPolicies = mockPolicies.filter((policy) => {
    if (filters.productType !== 'all' && !policy.productName.toLowerCase().includes(filters.productType)) {
      return false;
    }
    if (filters.status !== 'all' && policy.commissionStatus !== filters.status) {
      return false;
    }
    if (filters.premiumRange === 'below' && policy.premium >= 10000) {
      return false;
    }
    if (filters.premiumRange === '10k-50k' && (policy.premium < 10000 || policy.premium > 50000)) {
      return false;
    }
    if (filters.premiumRange === 'above' && policy.premium <= 50000) {
      return false;
    }
    return true;
  });

  // Sort policies based on selected sort option
  const sortedPolicies = [...filteredPolicies].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      case 'oldest':
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      case 'premiumHigh':
        return b.premium - a.premium;
      case 'premiumLow':
        return a.premium - b.premium;
      default:
        return 0;
    }
  });

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  const handleAddPolicy = (policyData: PolicyFormData) => {
    // Add your logic to save the new policy
    console.log('New policy:', policyData);
    // You would typically call an API here to save the policy
  };

  return (
    <DashboardContent>
     <Box sx={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap"}}>
     <Typography variant="h4" sx={{ mb: 5 }}>
        Policy Management
      </Typography>
      <Button 
        variant="contained" 
        startIcon={<Iconify icon="mingcute:add-line" />}
        onClick={() => setAddDrawerOpen(true)}
        sx={{ mb: 3 }}
      >
        Add New Policy
      </Button>

      <AddPolicyDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSubmit={handleAddPolicy}
      />
     </Box>
      
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Box sx={{ my: 1, gap: 1, display: 'flex' }}>
          <PolicyFilters
            canReset={canReset}
            filters={filters}
            onSetFilters={handleSetFilters}
            openFilter={openFilter}
            onOpenFilter={handleOpenFilter}
            onCloseFilter={handleCloseFilter}
            onResetFilter={() => setFilters(defaultFilters)}
            options={{
              productTypes: PRODUCT_TYPE_OPTIONS,
              statuses: COMMISSION_STATUS_OPTIONS,
              premiumRanges: PREMIUM_RANGE_OPTIONS,
            }}
          />

          <PolicySort
            sortBy={sortBy}
            onSort={handleSort}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'premiumHigh', label: 'Premium: High to Low' },
              { value: 'premiumLow', label: 'Premium: Low to High' },
            ]}
          />
        </Box>
      </Box>
      <Grid container spacing={3}>
  {sortedPolicies.map((policy) => (
    <Grid sx={{xs: 12, sm: 6, md: 3 }}>
      <PolicyItem policy={policy} />
    </Grid>
  ))}
</Grid>

      <Pagination count={10} color="primary" sx={{ mt: 8, mx: 'auto' }} />
    </DashboardContent>
  );
}