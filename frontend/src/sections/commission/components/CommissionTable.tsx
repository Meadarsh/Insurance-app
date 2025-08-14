import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TablePagination,
} from '@mui/material';
import { Download, Visibility, Edit, Delete } from '@mui/icons-material';

interface ReconciliationRecord {
  id: string;
  source: string;
  month: string;
  fileName: string;
  uploadedAt: string;
  totalProcessedRecords: number;
  totalReconValue: number;
  outputReconValue: number;
  status: 'PROCESSING' | 'PROCESSED' | 'ERROR';
}

interface CommissionTableProps {
  data: ReconciliationRecord[];
}

export default function CommissionTable({ data }: CommissionTableProps) {
  if (data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
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
            sx={{ color: 'text.secondary' }}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </Box>
          <Typography variant="h6" color="text.secondary">
            No files uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload your first file to see reconciliation data here
          </Typography>
        </Box>
      </Paper>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return 'success';
      case 'PROCESSING':
        return 'warning';
      case 'ERROR':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('en-IN').format(num);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>
                SOURCE
              </TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>
                MONTH
              </TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>
                FILE NAME
              </TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>
                UPLOADED AT
              </TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>
                TOTAL PROCESSED RECORDS
              </TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>
                TOTAL RECON VALUE
              </TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>
                OUTPUT RECON VALUE
              </TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>
                STATUS
              </TableCell>
              <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>
                ACTIONS
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((record) => (
              <TableRow key={record.id} hover>
                <TableCell>
                  <Chip
                    label={record.source}
                    size="small"
                    color={record.source === 'Master' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{record.month}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {record.fileName}
                  </Typography>
                </TableCell>
                <TableCell>{formatDate(record.uploadedAt)}</TableCell>
                <TableCell>{formatNumber(record.totalProcessedRecords)}</TableCell>
                <TableCell>₹{formatNumber(record.totalReconValue)}</TableCell>
                <TableCell>₹{formatNumber(record.outputReconValue)}</TableCell>
                <TableCell>
                  <Chip
                    label={record.status}
                    size="small"
                    color={getStatusColor(record.status) as any}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Details">
                      <IconButton size="small" color="primary">
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton size="small" color="secondary">
                        <Download fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="info">
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
