import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Autocomplete, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Snackbar, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { CompanyApi } from 'src/services/company';
import UploadPolicyFileDialog from 'src/sections/commission/components/UploadPolicyFileDialog';
import { CloudUpload } from '@mui/icons-material';
import UploadMasterFileDialog from 'src/sections/commission/components/UploadMasterFileDialog';
import DashboardFilter from 'src/components/dashboard-filter';
import type { Company } from 'src/types/company';
import { useFilter } from 'src/contexts/FilterContext';


// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Get company IDs from URL or use empty array
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [policyFileDialogOpen, setPolicyFileDialogOpen] = useState(false);
  const [masterFileDialogOpen, setMasterFileDialogOpen] = useState(false);

    const {
      year,
      endDate,
      startDate,
      loadCompanies,
      selectedCompanyIds,
      companies,
    } = useFilter();

  const fetchAnalyticsData = async (isRefresh = false, companyIdsToFetch = selectedCompanyIds) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setSuccess(null);
      analyticsAPI.clearCache();
      const ids = companyIdsToFetch.length > 0 ? companyIdsToFetch : [];      
      const data:any = await analyticsAPI.getDashboardAnalytics(ids,year,startDate,endDate);
      
      setAnalyticsData(data);
      setRetryCount(0);
      
      if (isRefresh) {
        setSuccess('Data refreshed successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: unknown) {
      console.error('Dashboard: Failed to fetch analytics data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes
    
    try {
      // Clear cache to force fresh data
      analyticsAPI.clearCache();
      
      await fetchAnalyticsData(true);
    } catch (err: unknown) {
      console.error('Refresh failed:', err);
      setError('Refresh failed. Please try again.');
    }
  };

  // Effect for initial load and when selectedCompanyIds changes
  useEffect(() => {
    fetchAnalyticsData(true,selectedCompanyIds);
  }, []);

  // Set up real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
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
        }
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [loading, refreshing, analyticsData]);

  const handlePolicyFileUploaded = (fileName: string) => {
    setSuccessMessage(`Policy file "${fileName}" uploaded successfully!`);
    setShowSuccessMessage(true);
    setIsUploading(false);
    fetchAnalyticsData(true,selectedCompanyIds)
  }

  const handleMasterFileUploaded = async (fileName: string) => {
    setSuccessMessage(`Master file "${fileName}" uploaded successfully!`);
    setShowSuccessMessage(true);
    setIsUploading(false);
    await loadCompanies()
    await fetchAnalyticsData(true,selectedCompanyIds)
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
    <>
     <Snackbar
              open={showSuccessMessage}
              autoHideDuration={6000}
              onClose={() => setShowSuccessMessage(false)}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Alert 
                onClose={() => setShowSuccessMessage(false)} 
                severity="success" 
                sx={{ width: '100%' }}
              >
                {successMessage}
              </Alert>
            </Snackbar>
      <DashboardContent maxWidth="xl">
      {/* Header with status indicator */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={{ xs: 3, md: 5 }}>
        <Box>
        <Typography variant="h4">
          Hi, Welcome back 👋
        </Typography>
       <DashboardFilter handleApplyFilters={()=> fetchAnalyticsData(true,selectedCompanyIds)}/>
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
      {selectedCompanyIds.length>0 && analyticsData && <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
         {analyticsData.totals?.premium>0 && <AnalyticsWidgetSummary
            title="Premium "
            total={analyticsData.totals?.premium || 0}
            icon={<img alt="Weekly sales" src="/assets/icons/glass/ic-glass-bag.svg" />}
            chart={analyticsData.stats?.weeklySales?.chart || { categories: [], series: [] }}
          />}
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
         {analyticsData.totals?.commission>0 && <AnalyticsWidgetSummary
            title="Commission"
            total={analyticsData.totals?.commission|| 0}
            color="secondary"
            icon={<img alt="New users" src="/assets/icons/glass/ic-glass-users.svg" />}
            chart={analyticsData.stats?.newUsers?.chart || { categories: [], series: [] }}
          />}
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
         {analyticsData.totals?.reward>0 && <AnalyticsWidgetSummary
            title="Reward"
            total={analyticsData.totals?.reward || 0}
            color="warning"
            icon={<img alt="Purchase orders" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={analyticsData.stats?.purchaseOrders?.chart || { categories: [], series: [] }}
          />}
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
         {analyticsData.totals?.policies>0 && <AnalyticsWidgetSummary
            title="Additional Reward"
            total={analyticsData.totals?.policies || 0}
            color="error"
            icon={<img alt="Messages" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={analyticsData.stats?.messages?.chart || { categories: [], series: [] }}
          />}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
         {analyticsData.totals?.profit>0 && <AnalyticsWidgetSummary
            title="Total revenue"
            total={analyticsData.totals?.profit || 0}
            color="error"
            icon={<img alt="Messages" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={analyticsData.stats?.messages?.chart || { categories: [], series: [] }}
          />}
        </Grid>

      </Grid>}

      {/* Enhanced Footer with Refresh Button */}
      {(analyticsData?.totals?.premium>0||analyticsData?.totals?.commission>0||analyticsData?.totals?.reward>0||analyticsData?.totals?.policies>0||analyticsData?.totals?.profit>0) && <Box display="flex" justifyContent="center" mt={4} mb={2}>
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
      </Box>}
      {(analyticsData?.totals?.premium===0&&analyticsData?.totals?.commission===0&&analyticsData?.totals?.reward===0&&analyticsData?.totals?.policies===0|| !analyticsData?.totals) &&<>
      
      {companies.length>0? <Button
            variant="contained"
            size="small"
            startIcon={<CloudUpload />}
            onClick={() => setPolicyFileDialogOpen(true)}
            disabled={isUploading}
            sx={{width: 200,mx:"auto"}}
          >
            {isUploading ? 'Uploading...' : 'Upload File (Policy)'}
          </Button>:
        <Button
           variant="contained"
           startIcon={<CloudUpload />}
           onClick={() => setMasterFileDialogOpen(true)}
           disabled={isUploading}
           size="small"
           sx={{width: 200,mx:"auto"}}
         >
           {isUploading ? 'Uploading...' : 'Upload File (Master)'}
         </Button>}
          </>}

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
       <UploadPolicyFileDialog
            open={policyFileDialogOpen}
            onOpenChange={setPolicyFileDialogOpen}
            onFileUploaded={handlePolicyFileUploaded}
          />
           <UploadMasterFileDialog
                  open={masterFileDialogOpen}
                  onOpenChange={setMasterFileDialogOpen}
                  onFileUploaded={handleMasterFileUploaded}
                />

    </>
  );
}
