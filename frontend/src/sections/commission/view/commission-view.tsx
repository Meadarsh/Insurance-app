import { useState } from 'react';
import { Box, Card, CardContent, Grid, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { DashboardContent } from 'src/layouts/dashboard';

interface Commission {
  id: string;
  policyNumber: string;
  customerName: string;
  policyType: string;
  premium: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'paid' | 'processing';
  date: string;
}

// Mock data for commission history
const COMMISSIONS: Commission[] = [
  {
    id: 'C001',
    policyNumber: 'POL-2023-001',
    customerName: 'John Doe',
    policyType: 'Auto',
    premium: 1200,
    commissionRate: 0.15,
    commissionAmount: 180,
    status: 'paid',
    date: '2023-06-15',
  },
  {
    id: 'C002',
    policyNumber: 'POL-2023-002',
    customerName: 'Jane Smith',
    policyType: 'Home',
    premium: 850,
    commissionRate: 0.12,
    commissionAmount: 102,
    status: 'pending',
    date: '2023-07-20',
  },
  {
    id: 'C003',
    policyNumber: 'POL-2023-003',
    customerName: 'Robert Johnson',
    policyType: 'Life',
    premium: 2500,
    commissionRate: 0.2,
    commissionAmount: 500,
    status: 'processing',
    date: '2023-08-01',
  },
];

export default function CommissionView() {
  const [commissions] = useState<Commission[]>(COMMISSIONS);
  const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const pendingCommission = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success.main';
      case 'pending':
        return 'warning.main';
      case 'processing':
        return 'info.main';
      default:
        return 'text.secondary';
    }
  };

  return (
    <DashboardContent title="Commissions">
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Commission Dashboard
        </Typography>
        
        <Box sx={{ display: 'grid',mb:2, gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Commission
              </Typography>
              <Typography variant="h4" color="primary">
                ${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Pending Commission
              </Typography>
              <Typography variant="h4" color="warning.main">
                ${pendingCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Policies
              </Typography>
              <Typography variant="h4">
                {commissions.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Commission History
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Policy #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Premium</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Commission</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>{commission.policyNumber}</TableCell>
                      <TableCell>{commission.customerName}</TableCell>
                      <TableCell>{commission.policyType}</TableCell>
                      <TableCell align="right">
                        ${commission.premium.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        {(commission.commissionRate * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell align="right">
                        <strong>
                          ${commission.commissionAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </strong>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: getStatusColor(commission.status),
                            textTransform: 'capitalize',
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: getStatusColor(commission.status),
                              mr: 1,
                            }}
                          />
                          {commission.status}
                        </Box>
                      </TableCell>
                      <TableCell>{new Date(commission.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </DashboardContent>
  );
}
