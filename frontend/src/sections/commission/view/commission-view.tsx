import { useState } from 'react';
import { 
  Box, 
  Tab, 
  Card, 
  Tabs, 
  Alert, 
  Button, 
  Select,
  MenuItem,
  Snackbar,
  Typography,
  InputLabel,
  CardContent,
  FormControl,
  CircularProgress,
} from '@mui/material';
import { Refresh, FilterList, CloudUpload, Description } from '@mui/icons-material';
import { DashboardContent } from 'src/layouts/dashboard';
import UploadMasterFileDialog from '../components/UploadMasterFileDialog';
import PolicyDataTable from '../components/PolicyDataTable';
import UploadVendorFileDialog from '../components/UploadVendorFileDialog';
import CommissionTable from '../components/CommissionTable';
import ReconciliationSummary from '../components/ReconciliationSummary';
import MasterDataTable from '../components/MasterDataTable';
import UploadPolicyFileDialog from '../components/UploadPolicyFileDialog';


interface ReconciliationRecord {
  id: string;
  source: string;
  month: string;
  fileName: string;
  uploadedAt: string;
  totalProcessedRecords: number;
  totalReconValue: number;
  outputReconValue: number;
  status: 'PROCESSING' | 'PROCESSED' | 'ERROR';
}

export default function CommissionView() {
  const [activeTab, setActiveTab] = useState(0);
  const [masterDataRefreshTrigger, setMasterDataRefreshTrigger] = useState(0);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Upload dialogs
  const [masterFileDialogOpen, setMasterFileDialogOpen] = useState(false);
  const [policyFileDialogOpen, setPolicyFileDialogOpen] = useState(false);
  const [vendorFileDialogOpen, setVendorFileDialogOpen] = useState(false);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data refresh by updating timestamps and regenerating some data
    setTimeout(() => {
      setIsRefreshing(false);
      setSuccessMessage('Data refreshed successfully!');
      setShowSuccessMessage(true);
    }, 1500);
  };

  const handleMasterFileUploaded = (fileName: string, fileType: 'master' | 'policy') => {
    const source = fileType === 'policy' ? 'Policy' : 'Master';
    setSuccessMessage(`${source} file "${fileName}" uploaded successfully!`);
    setShowSuccessMessage(true);
    setIsUploading(false);
      // Refresh master data table
      setMasterDataRefreshTrigger(prev => prev + 1);
  };

  const handlePolicyFileUploaded = (fileName: string) => {
    setSuccessMessage(`Policy file "${fileName}" uploaded successfully!`);
    setShowSuccessMessage(true);
    setIsUploading(false);
    
    // Refresh policy data table
    setMasterDataRefreshTrigger(prev => prev + 1);
  };



  const handleVendorFileUploaded = (fileName: string, vendor: string, month: Date) => {
    const monthString = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const newRecord: ReconciliationRecord = {
      id: Date.now().toString(),
      source: vendor,
      month: monthString,
      fileName,
      uploadedAt: new Date().toISOString(),
      totalProcessedRecords: Math.floor(Math.random() * 8000) + 2000,
      totalReconValue: Math.floor(Math.random() * 15000000) + 5000000,
      outputReconValue: Math.floor(Math.random() * 12000000) + 4000000,
      status: 'PROCESSING',
    };
    
    setSuccessMessage(`Vendor file "${fileName}" uploaded successfully! Processing ${newRecord.totalProcessedRecords.toLocaleString()} records for ${vendor}.`);
    setShowSuccessMessage(true);
    setIsUploading(false);
  };

  const handleDownloadmasterAndPolicyFormat = () => {
    // Function to trigger file download
    const downloadFile = (url: string, filename: string) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Download master format
    downloadFile('/format-files/master format.csv', 'master_format.csv');
    
    // Download policy format after a small delay to ensure both downloads work
    setTimeout(() => {
      downloadFile('/format-files/policy format.csv', 'policy_format.csv');
    }, 300);
  };

  return (
    <DashboardContent title="Commission & Reconciliation">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Commission & Reconciliation System
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>

        {/* Success Message */}
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

        {/* Upload Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setMasterFileDialogOpen(true)}
            disabled={isUploading}
            sx={{ px: 3, py: 1.5 }}
          >
            {isUploading ? 'Uploading...' : 'Upload File (Master)'}
          </Button>
          
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setPolicyFileDialogOpen(true)}
            disabled={isUploading}
            sx={{ px: 3, py: 1.5 }}
          >
            {isUploading ? 'Uploading...' : 'Upload File (Policy)'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Description />}
            onClick={() => handleDownloadmasterAndPolicyFormat()}
            sx={{ px: 3, py: 1.5 }}
          >
            Download Master/Policy Format
          </Button>
          
          {/* <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setVendorFileDialogOpen(true)}
            disabled={isUploading}
            sx={{ px: 3, py: 1.5 }}
          >
            {isUploading ? 'Uploading...' : 'Upload Vendor File'}
          </Button> */}
          
          {/* <Button
            variant="outlined"
            startIcon={<Description />}
            onClick={() => handleDownloadFormat('vendor')}
            sx={{ px: 3, py: 1.5 }}
          >
            Download Vendor Format
          </Button> */}
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="commission tabs">
            {/* <Tab label="Dashboard" />
            <Tab label="Upload File" />
            <Tab label="Explore Records" /> */}
            <Tab label="Master Data" />
            <Tab label="Policy Data" />
            <Tab label="Generate Report" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {/* {activeTab === 0 && (
          <Box>
            {/* Add Filters Section */}
            {/* <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <FilterList color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Add Filters
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Source</InputLabel>
                    <Select
                      value={sourceFilter}
                      label="Source"
                      onChange={(e) => setSourceFilter(e.target.value)}
                      size="small"
                    >
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="Master">Master</MenuItem>
                      <MenuItem value="Policy">Policy</MenuItem>
                      {Array.from(new Set(reconciliationData.filter(r => r.source !== 'Master' && r.source !== 'Policy').map(r => r.source))).map(source => (
                        <MenuItem key={source} value={source}>{source}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                      size="small"
                    >
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="PROCESSING">Processing</MenuItem>
                      <MenuItem value="PROCESSED">Processed</MenuItem>
                      <MenuItem value="ERROR">Error</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={monthFilter}
                      label="Month"
                      onChange={(e) => setMonthFilter(e.target.value)}
                      size="small"
                    >
                      <MenuItem value="All">All</MenuItem>
                      {Array.from(new Set(reconciliationData.map(r => r.month))).map(month => (
                        <MenuItem key={month} value={month}>{month}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    size="small"
                  >
                    Clear Filters
                  </Button>
                </Box>
              </CardContent>
            </Card> */}

            {/* Summary Cards and Reconciliation Reports */}
           {/*} <ReconciliationSummary summaryData={dynamicSummaryData} />
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <ReconciliationSummary summaryData={dynamicSummaryData} />
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <CommissionTable data={filteredData} />
          </Box>
        )} */}

        {activeTab === 0 && (
          <Box>
            <MasterDataTable refreshTrigger={masterDataRefreshTrigger} />
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <PolicyDataTable refreshTrigger={masterDataRefreshTrigger} />
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Report Generation
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Generate comprehensive reports based on your reconciliation data
                </Typography>
                <Button variant="contained" size="large">
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Upload Dialogs */}
      <UploadMasterFileDialog
        open={masterFileDialogOpen}
        onOpenChange={setMasterFileDialogOpen}
        onFileUploaded={handleMasterFileUploaded}
      />
      
      <UploadPolicyFileDialog
        open={policyFileDialogOpen}
        onOpenChange={setPolicyFileDialogOpen}
        onFileUploaded={handlePolicyFileUploaded}
      />
      
      <UploadVendorFileDialog
        open={vendorFileDialogOpen}
        onOpenChange={setVendorFileDialogOpen}
        onFileUploaded={handleVendorFileUploaded}
      />
    </DashboardContent>
  );
}
