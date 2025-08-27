import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Dialog,
  Button,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { X, CloudUpload, Description } from '@mui/icons-material';
import { masterAPI } from '../../../services/master';
import { commissionPolicyAPI } from '../../../services/policy';

interface UploadMasterFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUploaded?: (fileName: string, fileType: 'master' | 'policy') => void;
}

export default function UploadMasterFileDialog({
  open,
  onOpenChange,
  onFileUploaded,
}: UploadMasterFileDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [detectedFileType, setDetectedFileType] = useState<'master' | 'policy' | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Function to detect file type based on conten

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Detect file type
      setUploadedFile(file);
    }
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Detect file type
      setUploadedFile(file);
    }
  }, []);

  const handleUpload = async () => {
    if (uploadedFile) {
      setIsUploading(true);
      try {
        let response;
        let message;
        
        if (detectedFileType === 'policy') {
          // Upload to policy API using commission endpoint (no auth required)
          response = await commissionPolicyAPI.uploadCSV(uploadedFile);
          message = `Successfully uploaded ${response.totalProcessed} policy records!`;
        } else {
          // Upload to master API
          response = await masterAPI.uploadCSV(uploadedFile);
          message = `Successfully uploaded ${response.count} master records!`;
        }
        
        setNotification({
          open: true,
          message,
          severity: 'success',
        });

        if (onFileUploaded) {
          onFileUploaded(uploadedFile.name,"master");
        }

        // Close dialog after successful upload
        setTimeout(() => {
          onOpenChange(false);
          setUploadedFile(null);
          setDetectedFileType(null);
          setIsUploading(false);
        }, 2000);
      } catch (error:any) {
        setNotification({
          open: true,
          message: error ? error.response.data.message : 'Upload failed. Please try again.',
          severity: 'error',
        });
        setIsUploading(false);
      }
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
      setUploadedFile(null);
      setDetectedFileType(null);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload color="primary" />
          Upload File (Master or Policy)
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload your master or policy file. The system will automatically detect the file type and route it to the appropriate database.
        </Typography>

        {detectedFileType && (
          <Alert severity="info" sx={{ mb: 2 }}>
            File type detected: <strong>{detectedFileType === 'policy' ? 'Policy File' : 'Master File'}</strong>
          </Alert>
        )}

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            border: dragActive ? '2px dashed' : '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'divider',
            backgroundColor: dragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            },
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            onChange={handleFileInput}
            style={{ display: 'none' }}
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
                {detectedFileType && (
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                    Type: {detectedFileType === 'policy' ? 'Policy' : 'Master'}
                  </Typography>
                )}
              </Box>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedFile(null);
                  setDetectedFileType(null);
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
                Drop your file here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse files
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Supports: Master files (Product rates) and Policy files (Customer data)
              </Typography>
            </Box>
          )}
        </Paper>

        {detectedFileType === 'policy' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Note:</strong> Policy files require master data to exist first. Make sure you have uploaded master data before uploading policies.
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!uploadedFile || isUploading}
          startIcon={isUploading ? <CircularProgress size={16} /> : <CloudUpload />}
        >
          {isUploading ? 'Uploading...' : `Upload ${detectedFileType === 'policy' ? 'Policy' : 'Master'} File`}
        </Button>
      </DialogActions>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
