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
import UploadVendorFileDialog from '../components/UploadVendorFileDialog';
import CommissionTable from '../components/CommissionTable';
import ReconciliationSummary from '../components/ReconciliationSummary';

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
  const [reconciliationData, setReconciliationData] = useState<ReconciliationRecord[]>([
    {
      id: '1',
      source: 'Master',
      month: 'July 2024',
      fileName: 'master_data.csv',
      uploadedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      totalProcessedRecords: 12450,
      totalReconValue: 23820349,
      outputReconValue: 18765432,
      status: 'PROCESSED',
    },
    {
      id: '2',
      source: 'Vendor 1',
      month: 'July 2024',
      fileName: 'vendor1_data.csv',
      uploadedAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      totalProcessedRecords: 8430,
      totalReconValue: 4384634,
      outputReconValue: 3987654,
      status: 'PROCESSED',
    },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Upload dialogs
  const [masterFileDialogOpen, setMasterFileDialogOpen] = useState(false);
  const [vendorFileDialogOpen, setVendorFileDialogOpen] = useState(false);
  
  // Filters
  const [sourceFilter, setSourceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data refresh by updating timestamps and regenerating some data
    setTimeout(() => {
      setReconciliationData(prev => 
        prev.map(record => ({
          ...record,
          uploadedAt: new Date().toISOString(),
          totalProcessedRecords: record.totalProcessedRecords + Math.floor(Math.random() * 100),
          totalReconValue: record.totalReconValue + Math.floor(Math.random() * 100000),
          outputReconValue: record.outputReconValue + Math.floor(Math.random() * 80000),
        }))
      );
      setIsRefreshing(false);
      setSuccessMessage('Data refreshed successfully!');
      setShowSuccessMessage(true);
    }, 1500);
  };

  const handleMasterFileUploaded = (fileName: string) => {
    const newRecord: ReconciliationRecord = {
      id: Date.now().toString(),
      source: 'Master',
      month: 'July 2024',
      fileName,
      uploadedAt: new Date().toISOString(),
      totalProcessedRecords: Math.floor(Math.random() * 15000) + 5000,
      totalReconValue: Math.floor(Math.random() * 50000000) + 20000000,
      outputReconValue: Math.floor(Math.random() * 40000000) + 15000000,
      status: 'PROCESSED',
    };
    
    setReconciliationData(prev => [newRecord, ...prev]);
    setSuccessMessage(`Master file "${fileName}" uploaded successfully! Processing ${newRecord.totalProcessedRecords.toLocaleString()} records.`);
    setShowSuccessMessage(true);
    setIsUploading(false);
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
    
    setReconciliationData(prev => [newRecord, ...prev]);
    setSuccessMessage(`Vendor file "${fileName}" uploaded successfully! Processing ${newRecord.totalProcessedRecords.toLocaleString()} records for ${vendor}.`);
    setShowSuccessMessage(true);
    setIsUploading(false);
  };

  const handleDownloadFormat = (type: 'master' | 'vendor') => {
    // Create sample format data based on type
    let csvContent = '';
    let filename = '';
    
    if (type === 'master') {
      filename = 'master_format.csv';
      csvContent = `Policy Number,Policy Holder Name,Policy Type,Start Date,End Date,Premium Amount,Commission Rate,Commission Amount
POL001,John Doe,Life Insurance,2024-01-01,2025-01-01,1200.00,0.15,180.00
POL002,Jane Smith,Health Insurance,2024-01-15,2025-01-15,800.00,0.12,96.00
POL003,Mike Johnson,Car Insurance,2024-01-20,2025-01-20,600.00,0.10,60.00`;
    } else {
      filename = 'vendor_format.csv';
      csvContent = `Vendor Name,Policy Number,Commission Amount,Payment Date,Status
Vendor A,POL001,180.00,2024-01-15,Paid
Vendor B,POL002,96.00,2024-01-20,Paid
Vendor C,POL003,60.00,2024-01-25,Pending`;
    }
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccessMessage(`${type === 'master' ? 'Master' : 'Vendor'} format file downloaded successfully!`);
    setShowSuccessMessage(true);
  };

  const filteredData = reconciliationData.filter(record => {
    if (sourceFilter !== 'All' && record.source !== sourceFilter) return false;
    if (statusFilter !== 'All' && record.status !== statusFilter) return false;
    if (monthFilter !== 'All' && record.month !== monthFilter) return false;
    return true;
  });

  const dynamicSummaryData = {
    masterFileCount: reconciliationData.filter(record => record.source === 'Master').length,
    masterFileAmount: reconciliationData
      .filter(record => record.source === 'Master')
      .reduce((sum, record) => sum + record.totalReconValue, 0),
    vendorFileCount: reconciliationData.filter(record => record.source !== 'Master').length,
    vendorFileAmount: reconciliationData
      .filter(record => record.source !== 'Master')
      .reduce((sum, record) => sum + record.totalReconValue, 0),
    delta: reconciliationData
      .filter(record => record.source === 'Master')
      .reduce((sum, record) => sum + record.totalReconValue, 0) -
      reconciliationData
        .filter(record => record.source !== 'Master')
        .reduce((sum, record) => sum + record.totalReconValue, 0),
  };

  const clearFilters = () => {
    setSourceFilter('All');
    setStatusFilter('All');
    setMonthFilter('All');
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
            {isUploading ? 'Uploading...' : 'Upload Master File'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Description />}
            onClick={() => handleDownloadFormat('master')}
            sx={{ px: 3, py: 1.5 }}
          >
            Download Master Format
          </Button>
          
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setVendorFileDialogOpen(true)}
            disabled={isUploading}
            sx={{ px: 3, py: 1.5 }}
          >
            {isUploading ? 'Uploading...' : 'Upload Vendor File'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Description />}
            onClick={() => handleDownloadFormat('vendor')}
            sx={{ px: 3, py: 1.5 }}
          >
            Download Vendor Format
          </Button>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="commission tabs">
            <Tab label="Dashboard" />
            <Tab label="Upload File" />
            <Tab label="Explore Records" />
            <Tab label="Generate Report" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <Box>
            {/* Add Filters Section */}
            <Card sx={{ mb: 3 }}>
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
                      {Array.from(new Set(reconciliationData.filter(r => r.source !== 'Master').map(r => r.source))).map(source => (
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
            </Card>

            {/* Summary Cards and Reconciliation Reports */}
            <ReconciliationSummary summaryData={dynamicSummaryData} />
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
        )}

        {activeTab === 3 && (
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
      
      <UploadVendorFileDialog
        open={vendorFileDialogOpen}
        onOpenChange={setVendorFileDialogOpen}
        onFileUploaded={handleVendorFileUploaded}
      />
    </DashboardContent>
  );
}
