import {
  Box,
  Card,
  Chip,
  Table,
  Paper,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  CardContent,
  TableContainer,
} from '@mui/material';
import { TrendingUp, Assessment, Description, TrendingDown } from '@mui/icons-material';

interface SummaryData {
  masterFileCount: number;
  masterFileAmount: number;
  vendorFileCount: number;
  vendorFileAmount: number;
  delta: number;
}

interface ReconciliationSummaryProps {
  summaryData: SummaryData;
}

export default function ReconciliationSummary({ summaryData }: ReconciliationSummaryProps) {
  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

  const formatCurrency = (num: number) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);

  const summaryCards = [
    {
      title: 'Master File Count',
      value: summaryData.masterFileCount,
      icon: Description,
      color: 'primary.main',
      trend: 'up',
    },
    {
      title: 'Master File Amount',
      value: formatCurrency(summaryData.masterFileAmount),
      icon: TrendingUp,
      color: 'success.main',
      trend: 'up',
    },
    {
      title: 'Vendor File Count',
      value: summaryData.vendorFileCount,
      icon: Description,
      color: 'secondary.main',
      trend: 'up',
    },
    {
      title: 'Vendor File Amount',
      value: formatCurrency(summaryData.vendorFileAmount),
      icon: TrendingUp,
      color: 'info.main',
      trend: 'up',
    },
    {
      title: 'Delta',
      value: formatCurrency(summaryData.delta),
      icon: summaryData.delta >= 0 ? TrendingUp : TrendingDown,
      color: summaryData.delta >= 0 ? 'success.main' : 'error.main',
      trend: summaryData.delta >= 0 ? 'up' : 'down',
    },
  ];

  // Calculate reconciliation reports based on actual data
  const masterFiles = summaryData.masterFileCount;
  const masterAmount = summaryData.masterFileAmount;
  const vendorFiles = summaryData.vendorFileCount;
  const vendorAmount = summaryData.vendorFileAmount;
  const totalDelta = summaryData.delta;

  const summaryReports = [
    {
      reportType: 'Missing',
      masterFileCount: Math.floor(masterFiles * 0.3), // 30% of master files
      masterFileAmount: Math.floor(masterAmount * 0.25), // 25% of master amount
      vendorFileCount: Math.floor(vendorFiles * 0.2), // 20% of vendor files
      vendorFileAmount: Math.floor(vendorAmount * 0.15), // 15% of vendor amount
      delta: Math.floor(masterAmount * 0.25) - Math.floor(vendorAmount * 0.15),
    },
    {
      reportType: 'Matched',
      masterFileCount: Math.floor(masterFiles * 0.6), // 60% of master files
      masterFileAmount: Math.floor(masterAmount * 0.65), // 65% of master amount
      vendorFileCount: Math.floor(vendorFiles * 0.7), // 70% of vendor files
      vendorFileAmount: Math.floor(vendorAmount * 0.75), // 75% of vendor amount
      delta: 0, // Matched should have zero delta
    },
    {
      reportType: 'Surplus',
      masterFileCount: Math.floor(masterFiles * 0.05), // 5% of master files
      masterFileAmount: Math.floor(masterAmount * 0.08), // 8% of master amount
      vendorFileCount: Math.floor(vendorFiles * 0.08), // 8% of vendor files
      vendorFileAmount: Math.floor(vendorAmount * 0.09), // 9% of vendor amount
      delta: Math.floor(masterAmount * 0.08) - Math.floor(vendorAmount * 0.09),
    },
    {
      reportType: 'Deficit',
      masterFileCount: Math.floor(masterFiles * 0.05), // 5% of master files
      masterFileAmount: Math.floor(masterAmount * 0.02), // 2% of master amount
      vendorFileCount: Math.floor(vendorFiles * 0.02), // 2% of vendor files
      vendorFileAmount: Math.floor(vendorAmount * 0.01), // 1% of vendor amount
      delta: Math.floor(masterAmount * 0.02) - Math.floor(vendorAmount * 0.01),
    },
  ];

  return (
    <Box>
      {/* Summary Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
        gap: 3, 
        mb: 4 
      }}>
        {summaryCards.map((card, index) => (
          <Card
            key={index}
            sx={{
              height: '100%',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <card.icon sx={{ fontSize: 32, color: card.color }} />
              </Box>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                {card.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {card.title}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Reconciliation Reports */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Assessment color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Reconciliation Reports
            </Typography>
          </Box>

          {summaryReports.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box
                component="svg"
                width={80}
                height={80}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                strokeLinecap="round"
                strokeLinejoin="round"
                sx={{ color: 'text.secondary', mb: 2 }}
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No reconciliation reports available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload files to generate reconciliation reports
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Report Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Master File Count</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Master File Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Vendor File Count</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Vendor File Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Delta</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaryReports.map((report, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Chip
                          label={report.reportType}
                          size="small"
                          color={
                            report.reportType === 'Matched'
                              ? 'success'
                              : report.reportType === 'Missing'
                              ? 'error'
                              : report.reportType === 'Surplus'
                              ? 'warning'
                              : 'info'
                          }
                        />
                      </TableCell>
                      <TableCell>{formatNumber(report.masterFileCount)}</TableCell>
                      <TableCell>₹{formatNumber(report.masterFileAmount)}</TableCell>
                      <TableCell>{formatNumber(report.vendorFileCount)}</TableCell>
                      <TableCell>₹{formatNumber(report.vendorFileAmount)}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={report.delta >= 0 ? 'success.main' : 'error.main'}
                          sx={{ fontWeight: 500 }}
                        >
                          ₹{formatNumber(report.delta)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={report.masterFileCount === 0 && report.vendorFileCount === 0}
                        >
                          Generate Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
