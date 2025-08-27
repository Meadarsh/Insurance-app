import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  CircularProgress,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { commissionPolicyAPI, policyAPI, PolicyData } from '../../../services/policy';
import { CompanyApi } from 'src/services/company';

interface Company {
  _id: string;
  name: string;
  // Add other company properties as needed
}

interface PolicyDataTableProps {
  refreshTrigger?: number;
}

export default function PolicyDataTable({ refreshTrigger = 0 }: PolicyDataTableProps) {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyData | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<Partial<PolicyData>>({});
  const [company, setCompany] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

   const [companies, setCompanies] = useState<Company[]>([]);
    useEffect(() => {
      CompanyApi.getCompanies().then((res) => {
        setCompanies(res.data);
        setCompany(res.data[0]._id);
      });
    }, []);
  
    const handleChangeCompany = (companyData: string) => {
      setCompany(companyData);
    };

  // Fetch policies and masters
  const fetchData = async () => {
    try {
      if(!company){
        return;
      }
      setLoading(true);
      const policiesResponse = await commissionPolicyAPI.getPolicies(company);
      setPolicies(policiesResponse.data);
      setTotalCount(policiesResponse.pagination.total);
    } catch (error) {
      console.error('Error fetching data:', error);
      setNotification({
        open: true,
        message: 'Failed to fetch data. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, refreshTrigger, company]);

  // Get master product name by ID
  const getMasterProductName = (masterRef: string) => {
    const master = policies.find(m => m._id === masterRef);
    return master?.productName || 'Unknown Product';
  };

  // Handle edit
  const handleEdit = (policy: PolicyData) => {
    setSelectedPolicy(policy);
    setEditingPolicy(policy);
    setEditDialogOpen(true);
  };

  // Handle add
  const handleAdd = () => {
    setSelectedPolicy(null);
    setEditingPolicy({
      policyNo: '',
      productName: '',
      customerName: '',
      PREMIUM: 0,
      sumAssured: 0,
    });
    setAddDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this policy?')) {
      try {
        await policyAPI.deletePolicy(id);
        setNotification({
          open: true,
          message: 'Policy deleted successfully!',
          severity: 'success'
        });
        fetchData();
      } catch (error) {
        setNotification({
          open: true,
          message: 'Failed to delete policy. Please try again.',
          severity: 'error'
        });
      }
    }
  };

  // Handle save (edit or add)
  const handleSave = async () => {
    try {
      if (selectedPolicy?._id) {
        // Edit existing policy
        await policyAPI.updatePolicy(selectedPolicy._id, editingPolicy);
        setNotification({
          open: true,
          message: 'Policy updated successfully!',
          severity: 'success'
        });
      } else {
        // Add new policy
        await policyAPI.createPolicy(editingPolicy as PolicyData);
        setNotification({
          open: true,
          message: 'Policy created successfully!',
          severity: 'success'
        });
      }
      
      setEditDialogOpen(false);
      setAddDialogOpen(false);
      setEditingPolicy({});
      setSelectedPolicy(null);
      fetchData();
    } catch (error) {
      setNotification({
        open: true,
        message: 'Failed to save policy. Please try again.',
        severity: 'error'
      });
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setAddDialogOpen(false);
    setEditingPolicy({});
    setSelectedPolicy(null);
  };

  // Handle notification close
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }
  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <div className='flex gap-2 items-center'>
        <Typography variant="h6">Policy Data Management</Typography>
        <Autocomplete
          disablePortal
          options={companies}
          getOptionLabel={(option) => option.name || ''}
          value={companies.find(c => c._id === company) || null}
          onChange={(_, newValue) => newValue && handleChangeCompany(newValue._id)}
          sx={{ width: 250, '& .MuiInputBase-root': { height: '40px' } }}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Select Company" 
              size="small"
              variant="outlined"
            />
          )}
        />
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Policy
        </Button>
      </Box>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{width: '100px'}}>Policy No</TableCell>
                <TableCell sx={{width: '100px'}}>Product Name</TableCell>
                <TableCell sx={{width: '100px'}}>Variant</TableCell>
                <TableCell sx={{width: '100px'}}>Term (Yrs)</TableCell>
                <TableCell sx={{width: '100px'}}>PPT (Yrs)</TableCell>
                <TableCell sx={{width: '100px'}}>Net Premium (₹)</TableCell>
                <TableCell sx={{width: '100px'}}>Reward (₹)</TableCell>
                <TableCell sx={{width: '100px'}}>Reward %</TableCell>
                <TableCell sx={{width: '100px'}}>Commission (₹)</TableCell>
                <TableCell sx={{width: '100px'}}>Commission %</TableCell>
                <TableCell sx={{width: '100px'}}>Total Profit (₹)</TableCell>
                <TableCell sx={{width: '100px'}}>Total Rate %</TableCell>
                <TableCell sx={{width: '100px'}}>Master Product</TableCell>
                <TableCell sx={{width: '100px'}}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy._id}>
                  <TableCell sx={{width: '100px'}}>{policy.policyNumber}</TableCell>
                  <TableCell sx={{width: '100px'}}>{policy.policyName || 'N/A'}</TableCell>
                  <TableCell sx={{width: '100px'}}>{policy.variant || 'N/A'}</TableCell>
                  <TableCell sx={{width: '100px'}}>{policy.policyTerm || 'N/A'}</TableCell>
                  <TableCell sx={{width: '100px'}}>{policy.ppt || 'N/A'}</TableCell>
                  <TableCell sx={{width: '100px'}}>₹{policy.netPrice?.toLocaleString() || '0'}</TableCell>
                  <TableCell sx={{width: '100px'}}>₹{policy.rewardAmount?.toLocaleString() || '0'}</TableCell>
                  <TableCell sx={{width: '100px'}}>{policy.rewardPct || '0'}%</TableCell>
                  <TableCell sx={{width: '100px'}}>₹{policy.commissionAmount?.toLocaleString() || '0'}</TableCell>
                  <TableCell sx={{width: '100px'}}>{policy.commissionPct || '0'}%</TableCell>
                  <TableCell sx={{width: '100px'}}>₹{policy.totalProfitAmount?.toLocaleString() || '0'}</TableCell>
                  <TableCell sx={{width: '100px'}}>{policy.totalRatePct || '0'}%</TableCell>
                  <TableCell>
                    {policy.masterRef ? (
                      <Chip 
                        label={getMasterProductName(policy.masterRef)} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    ) : (
                      <Chip label="No Master Link" size="small" color="warning" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small" color="info">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Policy">
                      <IconButton size="small" color="primary" onClick={() => handleEdit(policy)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Policy">
                      <IconButton size="small" color="error" onClick={() => handleDelete(policy._id!)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Edit/Add Dialog */}
      <Dialog 
        open={editDialogOpen || addDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedPolicy?._id ? 'Edit Policy' : 'Add New Policy'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="Policy Number"
              value={editingPolicy.policyNo || ''}
              onChange={(e) => setEditingPolicy(prev => ({ ...prev, policyNo: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Customer Name"
              value={editingPolicy.customerName || ''}
              onChange={(e) => setEditingPolicy(prev => ({ ...prev, customerName: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Product Name"
              value={editingPolicy.productName || ''}
              onChange={(e) => setEditingPolicy(prev => ({ ...prev, productName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Premium"
              type="number"
              value={editingPolicy.PREMIUM || ''}
              onChange={(e) => setEditingPolicy(prev => ({ ...prev, PREMIUM: Number(e.target.value) }))}
              fullWidth
            />
            <TextField
              label="Sum Assured"
              type="number"
              value={editingPolicy.sumAssured || ''}
              onChange={(e) => setEditingPolicy(prev => ({ ...prev, sumAssured: Number(e.target.value) }))}
              fullWidth
            />
            <TextField
              label="Application Number"
              value={editingPolicy.applicationNo || ''}
              onChange={(e) => setEditingPolicy(prev => ({ ...prev, applicationNo: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Agent Name"
              value={editingPolicy.agentName || ''}
              onChange={(e) => setEditingPolicy(prev => ({ ...prev, agentName: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Branch Name"
              value={editingPolicy.branchName || ''}
              onChange={(e) => setEditingPolicy(prev => ({ ...prev, branchName: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Product Variant"
              value={editingPolicy.productVariant || ''}
              onChange={(e) => setEditingPolicy(prev => ({ ...prev, productVariant: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedPolicy?._id ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
