import { useEffect, useState, useCallback } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DashboardContent } from 'src/layouts/dashboard';
import { analyticsAPI } from 'src/services/analytics';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { Autocomplete, MenuItem, Select, TextField } from '@mui/material';
import { CompanyApi } from 'src/services/company';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [company, setCompany] = useState('');

  const fetchAnalyticsData = useCallback(async (isRefresh = false) => {
    // Don't fetch if navigating
    if (isNavigating) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setSuccess(null);
      
      const data = await analyticsAPI.getDashboardAnalytics(company);
      
      setAnalyticsData(data);
      setRetryCount(0); // Reset retry count on success
      
      if (isRefresh) {
        setSuccess('Data refreshed successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Dashboard: Failed to fetch analytics data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setAnalyticsData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isNavigating,company]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes
    
    try {
      // Clear cache to force fresh data
      analyticsAPI.clearCache();
      
      await fetchAnalyticsData(true);
    } catch (err) {
      console.error('Refresh failed:', err);
      setError('Refresh failed. Please try again.');
    }
  }, [refreshing, fetchAnalyticsData]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  useEffect(() => {
    fetchAnalyticsData();

    // Set up real-time updates every 120 seconds (reduced from 60s for better performance)
    const interval = setInterval(async () => {
      // Only update if not currently loading or refreshing
      if (!loading && !refreshing && analyticsData) {
        try {
          const realTimeData = await analyticsAPI.getRealTimeData();
          if (realTimeData.stats && analyticsData) {
            setAnalyticsData((prev:any) => prev ? { 
              ...prev, 
              stats: { ...prev.stats, ...realTimeData.stats } 
            } : null);
          }
        } catch (err) {
          console.warn('Failed to fetch real-time data:', err instanceof Error ? err.message : 'Unknown error');
          // Don't show error for real-time updates, just log it
        }
      }
    }, 120000); // Increased to 120 seconds for better performance

    return () => clearInterval(interval);
  }, [fetchAnalyticsData]); // Removed analyticsData and loading/refreshing from dependencies

  const [companies, setCompanies] = useState([]);
  useEffect(() => {
    CompanyApi.getCompanies().then((res) => {
      setCompanies(res.data);
      setCompany(res.data[0]._id);
    });
  }, []);

  const handleChangeCompany = (companyData: string) => {
    setCompany(companyData);
  };

  // Show loading only on initial load
  if (loading && !analyticsData) {
    return (
      <DashboardContent maxWidth="xl">
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading dashboard data...
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      {/* Header with status indicator */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={{ xs: 3, md: 5 }}>
        <Box>
        <Typography variant="h4">
          Hi, Welcome back 👋
        </Typography>
         <Autocomplete
                disablePortal
                options={companies}
                getOptionLabel={(option:any) => option.name || ''}
                value={companies.find((c:any) => c._id === company) || null}
                onChange={(_, newValue) => newValue && handleChangeCompany(newValue._id)}
                sx={{ width: 250,mt:1, '& .MuiInputBase-root': { height: '40px' } }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Select Company" 
                    size="small"
                    variant="outlined"
                  />
                )}
              />
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          {error && (
            <Alert severity="info" sx={{ maxWidth: 300 }}>
              Using fallback data
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ maxWidth: 300 }} icon={<CheckCircleIcon />}>
              {success}
            </Alert>
          )}
        </Box>
      </Box>

      {/* Analytics Widgets Grid */}
     {(company&&analyticsData) && <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Premium "
            total={analyticsData.totals?.premium || 0}
            icon={<img alt="Weekly sales" src="/assets/icons/glass/ic-glass-bag.svg" />}
            chart={analyticsData.stats?.weeklySales?.chart || { categories: [], series: [] }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Commission"
            total={analyticsData.totals?.commission|| 0}
            color="secondary"
            icon={<img alt="New users" src="/assets/icons/glass/ic-glass-users.svg" />}
            chart={analyticsData.stats?.newUsers?.chart || { categories: [], series: [] }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Reward"
            total={analyticsData.totals?.reward || 0}
            color="warning"
            icon={<img alt="Purchase orders" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={analyticsData.stats?.purchaseOrders?.chart || { categories: [], series: [] }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Additional Reward"
            total={analyticsData.totals?.policies || 0}
            color="error"
            icon={<img alt="Messages" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={analyticsData.stats?.messages?.chart || { categories: [], series: [] }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Profit"
            total={analyticsData.totals?.profit || 0}
            color="error"
            icon={<img alt="Messages" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={analyticsData.stats?.messages?.chart || { categories: [], series: [] }}
          />
        </Grid>

      </Grid>}

      {/* Enhanced Footer with Refresh Button */}
      <Box display="flex" justifyContent="center" mt={4} mb={2}>
        <Button 
          variant="contained"
          startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing || loading}
          sx={{
            minWidth: 140,
            height: 40,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '&:disabled': {
              backgroundColor: 'primary.light',
            },
          }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>

      {/* Status Information */}
      <Box display="flex" justifyContent="center" mb={2}>
        <Typography 
          variant="body2" 
          color="primary.main" 
          textAlign="center"
          sx={{ fontWeight: 500 }}
        >
          {refreshing ? 'Fetching latest data...' : 
           error ? 'Using fallback data - Backend unavailable' : 
           'Data updated automatically every 30 seconds'}
        </Typography>
      </Box>
    </DashboardContent>
  );
}
