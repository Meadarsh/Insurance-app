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
} from '@mui/material';
import { X, CloudUpload, Description } from '@mui/icons-material';

interface UploadMasterFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUploaded?: (fileName: string) => void;
}

export default function UploadMasterFileDialog({
  open,
  onOpenChange,
  onFileUploaded,
}: UploadMasterFileDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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
      setUploadedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  }, []);

  const handleUpload = () => {
    if (uploadedFile) {
      setIsUploading(true);
      console.log('Uploading file:', uploadedFile.name);
      if (onFileUploaded) {
        onFileUploaded(uploadedFile.name);
      }
      setTimeout(() => {
        onOpenChange(false);
        setUploadedFile(null);
        setIsUploading(false);
      }, 1000);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
      setUploadedFile(null);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload color="primary" />
          Upload Master File
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload your master file to begin the reconciliation process. Supported formats: CSV, Excel, TXT
        </Typography>

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
                Drop your file here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse files
              </Typography>
            </Box>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!uploadedFile || isUploading}
          startIcon={isUploading ? <CircularProgress size={16} /> : null}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
