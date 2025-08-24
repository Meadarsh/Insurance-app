import { useEffect, useState, useCallback } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

import { DashboardContent } from 'src/layouts/dashboard';
import { analyticsAPI, type AnalyticsData } from 'src/services/analytics';

import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

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
      
      console.log('Dashboard: Fetching analytics data...');
      const data = await analyticsAPI.getDashboardAnalytics();
      console.log('Dashboard: Analytics data received:', data);
      setAnalyticsData(data);
      setRetryCount(0); // Reset retry count on success
      
      if (isRefresh) {
        setSuccess('Data refreshed successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Dashboard: Failed to fetch analytics data:', err);
      setError('Failed to load dashboard data. Using fallback data.');
      // Don't set analyticsData to null, let it use fallback data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isNavigating]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes
    
    try {
      // Clear cache to force fresh data
      analyticsAPI.clearCache();
      
      // Check if backend is available first
      const isHealthy = await analyticsAPI.healthCheck();
      if (!isHealthy) {
        setError('Backend server is not available. Using fallback data.');
        return;
      }
      
      await fetchAnalyticsData(true);
    } catch (err) {
      console.error('Refresh failed:', err);
      setError('Refresh failed. Using fallback data.');
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
            setAnalyticsData(prev => prev ? { 
              ...prev, 
              stats: { ...prev.stats, ...realTimeData.stats } 
            } : null);
          }
        } catch (err) {
          console.warn('Failed to fetch real-time data:', err);
          // Don't show error for real-time updates, just log it
        }
      }
    }, 120000); // Increased to 120 seconds for better performance

    return () => clearInterval(interval);
  }, [fetchAnalyticsData]); // Removed analyticsData and loading/refreshing from dependencies

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

  // Show error with retry option, but still display dashboard with fallback data
  if (error && !analyticsData) {
    return (
      <DashboardContent maxWidth="xl">
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <Alert severity="warning" sx={{ mb: 2, maxWidth: 500 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={handleRetry}
            disabled={retryCount >= 3}
          >
            {retryCount >= 3 ? 'Max retries reached' : 'Retry'}
          </Button>
        </Box>
      </DashboardContent>
    );
  }

  // Always show dashboard, even if there's an error (will use fallback data)
  const { stats, currentVisits, websiteVisits } = analyticsData || {};

  return (
    <DashboardContent maxWidth="xl">
      {/* Header with status indicator */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={{ xs: 3, md: 5 }}>
        <Typography variant="h4">
          Hi, Welcome back 👋
        </Typography>
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
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Weekly sales"
            percent={stats?.weeklySales?.percent || 0}
            total={stats?.weeklySales?.total || 0}
            icon={<img alt="Weekly sales" src="/assets/icons/glass/ic-glass-bag.svg" />}
            chart={stats?.weeklySales?.chart || { categories: [], series: [] }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="New users"
            percent={stats?.newUsers?.percent || 0}
            total={stats?.newUsers?.total || 0}
            color="secondary"
            icon={<img alt="New users" src="/assets/icons/glass/ic-glass-users.svg" />}
            chart={stats?.newUsers?.chart || { categories: [], series: [] }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Purchase orders"
            percent={stats?.purchaseOrders?.percent || 0}
            total={stats?.purchaseOrders?.total || 0}
            color="warning"
            icon={<img alt="Purchase orders" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={stats?.purchaseOrders?.chart || { categories: [], series: [] }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Messages"
            percent={stats?.messages?.percent || 0}
            total={stats?.messages?.total || 0}
            color="error"
            icon={<img alt="Messages" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={stats?.messages?.chart || { categories: [], series: [] }}
          />
        </Grid>

        {/* Charts Section */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }} height={{ xs: 400, md: 600 }}>
          <AnalyticsCurrentVisits
            title="Current visits"
            chart={currentVisits || { series: [] }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }} height={{ xs: 400, md: 600 }}>
          <AnalyticsWebsiteVisits
            title="Website visits"
            subheader="(+43%) than last year"
            chart={websiteVisits || { categories: [], series: [] }}
          />
        </Grid>
      </Grid>

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
