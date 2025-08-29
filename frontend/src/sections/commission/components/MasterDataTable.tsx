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
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { masterAPI, MasterData } from '../../../services/master';

interface MasterDataTableProps {
  refreshTrigger?: number;
}

export default function MasterDataTable({ refreshTrigger = 0 }: MasterDataTableProps) {
  const [masters, setMasters] = useState<MasterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<MasterData | null>(null);
  const [formData, setFormData] = useState<Partial<MasterData>>({});
  
  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const fetchMasters = async () => {
    setLoading(true);
    try {
      const response = await masterAPI.getMasters({
        page: page + 1, // MUI TablePagination is 0-indexed, API is 1-indexed
        limit: rowsPerPage,
      });
      setMasters(response.data);
      setTotalCount(response.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch masters:', error);
      setNotification({
        open: true,
        message: 'Failed to fetch master data',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, [refreshTrigger, page, rowsPerPage]);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (master: MasterData) => {
    setSelectedMaster(master);
    setFormData({
      ...master,
      premiumPayingTermMin: master.premiumPayingTermMin,
      premiumPayingTermMax: master.premiumPayingTermMax,
    });
    setEditDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedMaster(null);
    setFormData({
      productName: '',
      productVariant: '',
      premiumPayingTermMin: 0,
      premiumPayingTermMax: null,
      policyTerm: 0,
      policyNumber: '',
      totalRate: 0,
      commission: 0,
      reward: 0,
    });
    setAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this master record?')) {
      try {
        await masterAPI.deleteMaster(id);
        setNotification({
          open: true,
          message: 'Master record deleted successfully',
          severity: 'success',
        });
        fetchMasters();
      } catch (error) {
        setNotification({
          open: true,
          message: error instanceof Error ? error.message : 'Failed to delete master record',
          severity: 'error',
        });
      }
    }
  };

  const handleSave = async () => {
    try {
      if (selectedMaster) {
        // Update existing
        await masterAPI.updateMaster(selectedMaster._id!, formData);
        setNotification({
          open: true,
          message: 'Master record updated successfully',
          severity: 'success',
        });
      } else {
        // Create new
        await masterAPI.createMaster(formData as Omit<MasterData, '_id' | 'userId' | 'createdAt' | 'updatedAt'>);
        setNotification({
          open: true,
          message: 'Master record created successfully',
          severity: 'success',
        });
      }
      
      setEditDialogOpen(false);
      setAddDialogOpen(false);
      fetchMasters();
    } catch (error) {
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save master record',
        severity: 'error',
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const formatPremiumTerm = (min: number, max: number | null) => {
    if (max === null) {
      return `${min}+ years`;
    }
    return min === max ? `${min} years` : `${min}-${max} years`;
  };

  const formatPercentage = (value: number) => `${value}%`;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Master Data</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchMasters}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            Add Master
          </Button>
        </Box>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Policy Number</TableCell>
                <TableCell>Premium Term</TableCell>
                <TableCell>Policy Term</TableCell>
                <TableCell>Total Rate</TableCell>
                <TableCell>Commission</TableCell>
                <TableCell>Reward</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {masters.map((master) => (
                  <TableRow key={master._id}>
                    <TableCell>{master.productName} {master.productVariant ? `(${master.productVariant})` : ''}</TableCell>
                    <TableCell>{master.policyNumber}</TableCell>
                    <TableCell>{formatPremiumTerm(master.premiumPayingTermMin, master.premiumPayingTermMax)}</TableCell>
                    <TableCell>{master.policyTerm} years</TableCell>
                    <TableCell>{formatPercentage(master.totalRate)}</TableCell>
                    <TableCell>{formatPercentage(master.commission)}</TableCell>
                    <TableCell>{formatPercentage(master.reward)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(master)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(master._id!)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Master Record</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="Product Name"
              value={formData.productName || ''}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Policy Number"
              value={formData.policyNumber || ''}
              onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
              fullWidth
            />
            <TextField
              label="Premium Term Min (years)"
              type="number"
              value={formData.premiumPayingTermMin || 0}
              onChange={(e) => setFormData({
                ...formData,
                premiumPayingTermMin: parseInt(e.target.value) || 0
              })}
              fullWidth
            />
            <TextField
              label="Premium Term Max (years, optional)"
              type="number"
              value={formData.premiumPayingTermMax || ''}
              onChange={(e) => setFormData({
                ...formData,
                premiumPayingTermMax: e.target.value ? parseInt(e.target.value) : null
              })}
              fullWidth
            />
            <TextField
              label="Policy Term (years)"
              type="number"
              value={formData.policyTerm || 0}
              onChange={(e) => setFormData({ ...formData, policyTerm: parseInt(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Product Variant"
              value={formData.productVariant || ''}
              onChange={(e) => setFormData({ ...formData, productVariant: e.target.value })}
              fullWidth
            />
            <TextField
              label="Total Rate (%)"
              type="number"
              value={formData.totalRate || 0}
              onChange={(e) => setFormData({ ...formData, totalRate: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Commission (%)"
              type="number"
              value={formData.commission || 0}
              onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Reward (%)"
              type="number"
              value={formData.reward || 0}
              onChange={(e) => setFormData({ ...formData, reward: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Master Record</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="Product Name"
              value={formData.productName || ''}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Policy Number"
              value={formData.policyNumber || ''}
              onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Premium Term Min (years)"
              type="number"
              value={formData.premiumPayingTermMin || 0}
              onChange={(e) => setFormData({
                ...formData,
                premiumPayingTermMin: parseInt(e.target.value) || 0
              })}
              fullWidth
              required
            />
            <TextField
              label="Premium Term Max (years, optional)"
              type="number"
              value={formData.premiumPayingTermMax || ''}
              onChange={(e) => setFormData({
                ...formData,
                premiumPayingTermMax: e.target.value ? parseInt(e.target.value) : null
              })}
              fullWidth
            />
            <TextField
              label="Policy Term (years)"
              type="number"
              value={formData.policyTerm || 0}
              onChange={(e) => setFormData({ ...formData, policyTerm: parseInt(e.target.value) || 0 })}
              fullWidth
              required
            />
            <TextField
              label="Product Variant"
              value={formData.productVariant || ''}
              onChange={(e) => setFormData({ ...formData, productVariant: e.target.value })}
              fullWidth
            />
            <TextField
              label="Total Rate (%)"
              type="number"
              value={formData.totalRate || 0}
              onChange={(e) => setFormData({ ...formData, totalRate: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
            />
            <TextField
              label="Commission (%)"
              type="number"
              value={formData.commission || 0}
              onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
            />
            <TextField
              label="Reward (%)"
              type="number"
              value={formData.reward || 0}
              onChange={(e) => setFormData({ ...formData, reward: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

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
