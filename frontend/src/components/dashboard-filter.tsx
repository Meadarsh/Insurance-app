import { Autocomplete, TextField, IconButton, CircularProgress, Alert, Snackbar, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Stack, MenuItem, FormControl, InputLabel, Select, SelectChangeEvent, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React, { useCallback, useEffect, useState } from 'react';
import { Company, useFilter } from 'src/contexts/FilterContext';

interface DashboardFilterProps {
  onFilterChange?: (companyIds: string[]) => void;
  onError?: (error: string | null) => void;
  onLoadingChange?: (isLoading: boolean) => void;
  handleApplyFilters?: () => void;
}

const DashboardFilter: React.FC<DashboardFilterProps> = ({ 
  onFilterChange, 
  onError, 
  onLoadingChange ,
  handleApplyFilters
}) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);
  
  const {
    year,
    setYear,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedCompanyIds,
    setSelectedCompanyIds,
    companies,
    companiesLoading,
    companiesError,
    deleteCompany
  } = useFilter();
console.log(endDate);
console.log(startDate);

  // Notify parent when loading state changes
  useEffect(() => {
    onLoadingChange?.(companiesLoading);
  }, [companiesLoading, onLoadingChange]);

  // Notify parent when error state changes
  useEffect(() => {
    if (companiesError) {
      onError?.(companiesError);
    }
  }, [companiesError, onError]);

  const handleChangeCompany = useCallback((companyIds: string[]) => {
    // Update URL with selected company IDs
    
    // Update the selected company
    const firstCompany = companyIds.length > 0 ? companies.find(c => c._id === companyIds[0]) || null : null;
    setSelectedCompany(firstCompany);
    
    // Update filter context
    setSelectedCompanyIds(companyIds);
    
    // Notify parent component
    onFilterChange?.(companyIds);
  }, [companies, onFilterChange, setSelectedCompanyIds]);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setYear(Number(event.target.value));
  };

  const handleStartMonthChange = (event: SelectChangeEvent<number>) => {
    const month = Number(event.target.value);
    setStartDate(month);
    
    // If end date is before start date, update it to be the same as start date
    if (endDate && month > endDate) {
      setEndDate(month);
    }
  };

  const handleEndMonthChange = (event: SelectChangeEvent<number>) => {
    const month = Number(event.target.value);
    setEndDate(month);
    
    // If start date is after end date, update it to be the same as end date
    if (startDate && month < startDate) {
      setStartDate(month);
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;
    
    try {
      const success = await deleteCompany(selectedCompany._id);
      if (success) {
        setSuccessMessage(`${selectedCompany.name} has been deleted successfully`);
        setShowSuccessMessage(true);
        setSelectedCompany(null);
      } else {
        onError?.('Failed to delete company');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete company';
      onError?.(errorMessage);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{position: 'fixed', top: 16, right: 16}}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Delete Company</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete &quot;{selectedCompany?.name}&quot;? This action cannot be undone.
            <br /><br />
            <strong>Warning:</strong> This will also delete all associated data including policies and master records.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={companiesLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteCompany} 
            color="error" 
            disabled={companiesLoading}
            startIcon={companiesLoading ? <CircularProgress size={20} /> : null}
          >
            {companiesLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{display: 'flex', flexDirection: 'row', width: '100%', gap: 2, alignItems: 'center', justifyContent: 'center', '@media (max-width:600px)': {flexWrap: 'wrap'}}}>
          <Autocomplete
            multiple
            size="small"
            options={companies}
            getOptionLabel={(option) => option.name}
            value={companies.filter(c => selectedCompanyIds.includes(c._id))}
            onChange={(_, newValue) => {
              if (Array.isArray(newValue)) {
                handleChangeCompany(newValue.map(c => c._id));
              }
            }}
            loading={companiesLoading}
            sx={{ 
              minWidth: 300,
              '& .MuiInputBase-root': { 
                minHeight: '40px',
                width: '100%'
              },
              '& .MuiAutocomplete-inputRoot': {
                width: '100%'
              }
            }}
            renderOption={(props, option) => (
              <li {...props} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>{option.name}</span>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCompany(option);
                    setDeleteDialogOpen(true);
                  }}
                  color="error"
                  sx={{ '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' } }}
                  title="Delete Company"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Company"
                size="small"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {companiesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {selectedCompanyIds.length > 0 && (
            <>
              <FormControl fullWidth size="small">
                <InputLabel id="year-select-label">Year</InputLabel>
                <Select
                sx={{minWidth: 200}}
labelId="year-select-label"
                  value={year}
                  label="Year"
                  onChange={handleYearChange}
                >
                  {years.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth size="small">
                <InputLabel id="start-month-label">Start Month</InputLabel>
                <Select
                sx={{minWidth: 200}}
                  labelId="start-month-label"
                  value={startDate ? startDate : ''}
                  label="Start Month"
                  onChange={handleStartMonthChange}
                >
                  {months.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel id="end-month-label">End Month</InputLabel>
                <Select
                sx={{minWidth: 200}}
                  labelId="end-month-label"
                  value={endDate ? endDate : ''}
                  label="End Month"
                  onChange={handleEndMonthChange}
                >
                  {months.map((month) => (
                    <MenuItem 
                      key={month.value} 
                      value={month.value}
                      disabled={!startDate || month.value < startDate}
                    >
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={handleApplyFilters} disabled={companiesLoading}>Apply</Button>
            </>
          )}
        </Box>
      </LocalizationProvider>
    </>
  )
}

export default DashboardFilter