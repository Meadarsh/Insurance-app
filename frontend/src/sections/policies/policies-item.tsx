import { Card, Chip, Stack, Typography } from '@mui/material';

type PolicyItemProps = {
  policy: {
    policyNumber: string;
    productName: string;
    variant: string;
    premium: number;
    premiumPayingTerm: number;
    policyTerm: number;
    startDate: string;
    endDate: string;
    insuranceCompany: string;
    commissionStatus: string;
  };
};

export function PolicyItem({ policy }: PolicyItemProps) {
  const statusColor = policy.commissionStatus === 'paid' ? 'success' : 
                     policy.commissionStatus === 'pending' ? 'warning' : 'error';

  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h6">{policy.productName} - {policy.variant}</Typography>
        
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2">Policy No:</Typography>
          <Typography variant="body2" fontWeight="medium">
            {policy.policyNumber}
          </Typography>
        </Stack>
        
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2">Premium:</Typography>
          <Typography variant="body2" fontWeight="medium">
            ₹{policy.premium.toLocaleString()}
          </Typography>
        </Stack>
        
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2">Term:</Typography>
          <Typography variant="body2">
            {policy.policyTerm} years ({policy.premiumPayingTerm} yrs paying)
          </Typography>
        </Stack>
        
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2">Insurer:</Typography>
          <Typography variant="body2">{policy.insuranceCompany}</Typography>
        </Stack>
        
        <Chip 
          label={policy.commissionStatus.toUpperCase()} 
          color={statusColor}
          size="small"
          sx={{ alignSelf: 'flex-start' }}
        />
      </Stack>
    </Card>
  );
}