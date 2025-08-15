import { useState } from 'react';
import { 
  Box, 
  Stack, 
  Drawer, 
  Button, 
  Select, 
  Divider,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  InputLabel,
  FormControl
} from '@mui/material';
import { Iconify } from 'src/components/iconify';

interface AddPolicyDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (policyData: PolicyFormData) => void;
}

interface PolicyFormData {
  policyNumber: string;
  productName: string;
  variant: string;
  premium: number;
  premiumPayingTerm: number;
  policyTerm: number;
  startDate: string;
  insuranceCompany: string;
}

export function AddPolicyDrawer({ open, onClose, onSubmit }: AddPolicyDrawerProps) {
  const [formData, setFormData] = useState<PolicyFormData>({
    policyNumber: '',
    productName: '',
    variant: '',
    premium: 0,
    premiumPayingTerm: 0,
    policyTerm: 0,
    startDate: new Date().toISOString().split('T')[0],
    insuranceCompany: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'premium' || name === 'premiumPayingTerm' || name === 'policyTerm' 
        ? Number(value) 
        : value
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: 1, sm: 480 } }
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ p: 2.5 }}
      >
        <Typography variant="h6">Add New Policy</Typography>
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <TextField
          fullWidth
          label="Policy Number"
          name="policyNumber"
          value={formData.policyNumber}
          onChange={handleChange}
        />

        <FormControl fullWidth>
          <InputLabel>Product Name</InputLabel>
          <Select
            name="productName"
            value={formData.productName}
            label="Product Name"
            onChange={(e) => setFormData({...formData, productName: e.target.value})}
          >
            <MenuItem value="Term Life Plus">Term Life Plus</MenuItem>
            <MenuItem value="Health Shield">Health Shield</MenuItem>
            <MenuItem value="Investment Plan">Investment Plan</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Variant"
          name="variant"
          value={formData.variant}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          label="Premium Amount"
          name="premium"
          type="number"
          value={formData.premium}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          label="Premium Paying Term (years)"
          name="premiumPayingTerm"
          type="number"
          value={formData.premiumPayingTerm}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          label="Policy Term (years)"
          name="policyTerm"
          type="number"
          value={formData.policyTerm}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          label="Start Date"
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />

        <FormControl fullWidth>
          <InputLabel>Insurance Company</InputLabel>
          <Select
            name="insuranceCompany"
            value={formData.insuranceCompany}
            label="Insurance Company"
            onChange={(e) => setFormData({...formData, insuranceCompany: e.target.value})}
          >
            <MenuItem value="ABC Insurance">ABC Insurance</MenuItem>
            <MenuItem value="XYZ Insurance">XYZ Insurance</MenuItem>
            <MenuItem value="PQR Insurance">PQR Insurance</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ p: 3 }}>
        <Button
          fullWidth
          size="large"
          variant="contained"
          color="primary"
          onClick={handleSubmit}
        >
          Add Policy
        </Button>
      </Box>
    </Drawer>
  );
}