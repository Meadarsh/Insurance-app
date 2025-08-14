import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  IconButton,
} from '@mui/material';
import { CloudUpload, Description, X } from '@mui/icons-material';


interface UploadVendorFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUploaded?: (fileName: string, vendor: string, month: Date) => void;
}

const VENDORS = [
  'Vendor 1',
  'Vendor 2', 
  'Vendor 3',
  'Vendor 4',
  'Vendor 5',
  'Vendor 6',
  'Vendor 7',
  'Vendor 8',
  'Vendor 9',
  'Vendor 10',
];



export default function UploadVendorFileDialog({
  open,
  onOpenChange,
  onFileUploaded,
}: UploadVendorFileDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    };

    if (calendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [calendarOpen]);

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

  const handleVendorChange = (event: SelectChangeEvent) => {
    setSelectedVendor(event.target.value);
  };

  const handleMonthChange = (date: Date | null) => {
    setSelectedMonth(date);
  };

  const handleUpload = () => {
    if (uploadedFile && selectedVendor && selectedMonth) {
      setIsUploading(true);
      console.log('Uploading vendor file:', uploadedFile.name, 'Vendor:', selectedVendor, 'Month:', selectedMonth);
      if (onFileUploaded) {
        onFileUploaded(uploadedFile.name, selectedVendor, selectedMonth);
      }
      setTimeout(() => {
        onOpenChange(false);
        setUploadedFile(null);
        setSelectedVendor('');
        setSelectedMonth(null);
        setIsUploading(false);
      }, 1000);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
      setUploadedFile(null);
      setSelectedVendor('');
      setSelectedMonth(null);
    }
  };

  const isFormValid = uploadedFile && selectedVendor && selectedMonth;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload color="primary" />
          Upload Vendor File
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload vendor file and select vendor and month for reconciliation. Supported formats: CSV, Excel, TXT
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Vendor</InputLabel>
            <Select
              value={selectedVendor}
              label="Vendor"
              onChange={handleVendorChange}
              disabled={isUploading}
            >
              {VENDORS.map((vendor) => (
                <MenuItem key={vendor} value={vendor}>
                  {vendor}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ position: 'relative' }} ref={calendarRef}>
            <TextField
              label="Select Month"
              value={selectedMonth ? selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
              onClick={() => setCalendarOpen(!calendarOpen)}
              disabled={isUploading}
              fullWidth
              size="medium"
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Box sx={{ cursor: 'pointer', p: 1 }} onClick={() => setCalendarOpen(!calendarOpen)}>
                    📅
                  </Box>
                ),
              }}
            />
            
            {calendarOpen && (
              <Paper
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  p: 2,
                  mt: 1,
                  boxShadow: 3,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <IconButton
                    size="small"
                    onClick={() => setCurrentYear(currentYear - 1)}
                  >
                    ◀
                  </IconButton>
                  <Typography variant="h6">{currentYear}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => setCurrentYear(currentYear + 1)}
                  >
                    ▶
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  {[
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                  ].map((month, index) => (
                    <Button
                      key={month}
                      variant={selectedMonth && 
                        selectedMonth.getMonth() === index && 
                        selectedMonth.getFullYear() === currentYear ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => {
                        const date = new Date(currentYear, index, 1);
                        setSelectedMonth(date);
                        setCalendarOpen(false);
                      }}
                      sx={{ minWidth: 'auto', p: 1 }}
                    >
                      {month}
                    </Button>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        </Box>

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
          onClick={() => document.getElementById('vendor-file-input')?.click()}
        >
          <input
            id="vendor-file-input"
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
                Drop your vendor file here
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
          disabled={!isFormValid || isUploading}
          startIcon={isUploading ? <CircularProgress size={16} /> : null}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
