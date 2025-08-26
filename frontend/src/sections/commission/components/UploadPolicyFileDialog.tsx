import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { X, CloudUpload, Description, Warning } from '@mui/icons-material';
import { policyAPI, PolicyData } from '../../../services/policy';
import { masterAPI } from '../../../services/master';

interface UploadPolicyFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUploaded?: (fileName: string) => void;
}

export default function UploadPolicyFileDialog({ 
  open, 
  onOpenChange, 
  onFileUploaded 
}: UploadPolicyFileDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });
  const [masterDataExists, setMasterDataExists] = useState(true);
  const [checkingMasterData, setCheckingMasterData] = useState(false);

  // Check if master data exists
  // useEffect(() => {
  //   const checkMasterData = async () => {
  //     try {
  //       setCheckingMasterData(true);
  //       const response = await masterAPI.getMasters();
  //       setMasterDataExists(response.count > 0);
  //     } catch (error) {
  //       console.error('Error checking master data:', error);
  //       setMasterDataExists(false);
  //     } finally {
  //       setCheckingMasterData(false);
  //     }
  //   };

  //   if (open) {
  //     checkMasterData();
  //   }
  // }, [open]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!uploadedFile) return;

    if (!masterDataExists) {
      setNotification({
        open: true,
        message: 'Master data must be uploaded before policy files can be processed.',
        severity: 'warning'
      });
      return;
    }
    setIsUploading(true);
    try {
      const response = await policyAPI.uploadCSV(uploadedFile);
      
      setNotification({
        open: true,
        message: `Successfully uploaded ${response.totalProcessed} policy records!${response.totalErrors > 0 ? ` (${response.totalErrors} errors)` : ''}`,
        severity: 'success',
      });

      if (onFileUploaded) {
        onFileUploaded(uploadedFile.name);
      }

      // Close dialog after successful upload
      setTimeout(() => {
        onOpenChange(false);
        setUploadedFile(null);
        setIsUploading(false);
      }, 2000);
    } catch (error) {
      console.error('Policy upload failed:', error);
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : 'Upload failed. Please try again.',
        severity: 'error',
      });
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
      setUploadedFile(null);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  if (checkingMasterData) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Checking Master Data...</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload color="primary" />
          Upload Policy File
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload your policy file to process commission calculations. 
          {!masterDataExists && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="warning" fontSize="small" />
              <Chip 
                label="Master data required first" 
                color="warning" 
                size="small" 
                variant="outlined"
              />
            </Box>
          )}
          Supported formats: CSV
        </Typography>

        {!masterDataExists && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Master data required:</strong> You must upload a master file first before uploading policy files. 
              Policy files need master data to calculate commission rates and rewards.
            </Typography>
          </Alert>
        )}

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            cursor: masterDataExists ? 'pointer' : 'not-allowed',
            border: dragActive ? '2px dashed' : '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'divider',
            backgroundColor: dragActive ? 'action.hover' : 'background.paper',
            opacity: masterDataExists ? 1 : 0.6,
            transition: 'all 0.2s ease-in-out',
            '&:hover': masterDataExists ? {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            } : {},
          }}
          onDragEnter={masterDataExists ? handleDrag : undefined}
          onDragLeave={masterDataExists ? handleDrag : undefined}
          onDragOver={masterDataExists ? handleDrag : undefined}
          onDrop={masterDataExists ? handleDrop : undefined}
          onClick={masterDataExists ? () => document.getElementById('policy-file-input')?.click() : undefined}
        >
          <input
            id="policy-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            style={{ display: 'none' }}
            disabled={!masterDataExists}
          />
          
          {uploadedFile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
              <Description color="primary" sx={{ fontSize: 40 }} />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {uploadedFile.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFile(null);
                }}
                sx={{ minWidth: 'auto', p: 0.5 }}
              >
                <X />
              </Button>
            </Box>
          ) : (
            <Box>
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {masterDataExists ? 'Drop your policy file here' : 'Master data required first'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {masterDataExists ? 'or click to browse files' : 'Upload master file before proceeding'}
              </Typography>
            </Box>
          )}
        </Paper>

        {!masterDataExists && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => onOpenChange(false)}
            >
              Go to Master Data Upload
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!uploadedFile || isUploading || !masterDataExists}
          startIcon={isUploading ? <CircularProgress size={16} /> : null}
        >
          {isUploading ? 'Uploading...' : 'Upload Policy'}
        </Button>
      </DialogActions>

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
    </Dialog>
  );
}
