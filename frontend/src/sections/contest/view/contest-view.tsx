import { useState } from 'react';
import { 
  Box, 
  Card, 
  Grid, 
  Chip, 
  Stack, 
  Button,
  TextField,
  CardMedia,
  Typography,
  CardContent,
  InputAdornment
} from '@mui/material';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

interface Contest {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  participants: number;
  prize: string;
  image: string;
}

// Dummy images from Unsplash
const DUMMY_IMAGES = [
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop'
];

// Mock data for contests
const CONTESTS: Contest[] = [
  {
    id: 'CT001',
    name: 'Summer Insurance Challenge',
    description: 'Earn the most policies this summer and win amazing prizes!',
    startDate: '2023-06-01',
    endDate: '2023-08-31',
    status: 'ongoing',
    participants: 145,
    prize: '₹50,000 Cash Prize + Trophy',
    image: DUMMY_IMAGES[0]
  },
  {
    id: 'CT002',
    name: 'New Agent Competition',
    description: 'Exclusive for new agents - show us what you got!',
    startDate: '2023-09-01',
    endDate: '2023-09-30',
    status: 'upcoming',
    participants: 0,
    prize: '₹25,000 Cash Prize',
    image: DUMMY_IMAGES[1]
  },
  {
    id: 'CT003',
    name: 'Annual Sales Contest',
    description: 'Our biggest contest of the year with amazing rewards!',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    status: 'ongoing',
    participants: 342,
    prize: '₹1,00,000 + International Trip',
    image: DUMMY_IMAGES[2]
  },
  {
    id: 'CT004',
    name: 'Q2 Performance Challenge',
    description: 'Top performers in Q2 will be rewarded handsomely!',
    startDate: '2023-04-01',
    endDate: '2023-06-30',
    status: 'completed',
    participants: 128,
    prize: '₹75,000 + Premium Gadgets',
    image: DUMMY_IMAGES[3]
  }
];

export default function ContestView() {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredContests = CONTESTS.filter((contest) => {
    if (filterStatus === 'all') return true;
    return contest.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'success';
      case 'upcoming':
        return 'info';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <DashboardContent>
      <Grid container spacing={3} sx={{ mb: 3, alignItems: 'center' }}>
       <div className='flex justify-between items-end gap-2'>
       <Grid  sx={{ xs: 12, md: 8 }}>
          <Typography variant="h4">
            Current Contests
          </Typography>
        </Grid>

        <Grid  sx={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search contests..."
              InputProps={{
                sx: { 
                  bgcolor: 'background.paper',
                  maxWidth: { md: 300 },
                },
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Grid>

        <Grid  sx={{ xs: 12 }}>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: { xs: 2, md: 3 } }}>
            {['all', 'ongoing', 'upcoming', 'completed'].map((status) => (
              <Chip
                key={status}
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                onClick={() => setFilterStatus(status)}
                color={filterStatus === status ? 'primary' : 'default'}
                variant={filterStatus === status ? 'filled' : 'outlined'}
                sx={{
                  m: '2px !important', // Fix for gap in Safari
                }}
              />
            ))}
          </Stack>
        </Grid>
       </div>

        <Grid sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3, width: '100%' }}>
          {filteredContests.map((contest) => (
            <Box
              key={contest.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minWidth: 0, // Fixes flexbox issues in some browsers
              }}
            >
              <Card 
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: (theme) => theme.customShadows.z20,
                  },
                }}
              >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 0,
                  paddingTop: '56.25%', // 16:9 aspect ratio
                  overflow: 'hidden',
                }}
              >
                <CardMedia
                  component="img"
                  image={contest.image}
                  alt={contest.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = DUMMY_IMAGES[0];
                  }}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                  }}
                />
                <Chip 
                  label={contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
                  color={
                    contest.status === 'ongoing' ? 'success' : 
                    contest.status === 'upcoming' ? 'warning' : 'error'
                  }
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    textTransform: 'capitalize',
                    fontWeight: 'bold',
                  }}
                />
              </Box>
              <CardContent sx={{ 
                flexGrow: 1, 
                display: 'flex',
                flexDirection: 'column',
                p: 3,
                '&:last-child': {
                  paddingBottom: 3, // Override default padding
                },
              }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  noWrap
                  sx={{ 
                    fontWeight: 'bold',
                    mb: 1.5,
                    fontSize: '1.1rem',
                  }}
                >
                  {contest.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2, 
                    minHeight: '60px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {contest.description}
                </Typography>

                <Box sx={{ mt: 'auto', pt: 2 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      icon={<Iconify icon="solar:calendar-bold" width={16} />} 
                      label={new Date(contest.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      size="small"
                      variant="outlined"
                      sx={{
                        maxWidth: '100%',
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        },
                      }}
                    />
                    <Chip 
                      icon={<Iconify icon="solar:users-group-rounded-bold" width={16} />} 
                      label={`${contest.participants}`} 
                      size="small"
                      variant="outlined"
                    />
                  </Stack>

                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                    Prize: {contest.prize}
                  </Typography>

                  <Box sx={{ mt: 'auto', pt: 1 }}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      color="primary"
                      disabled={contest.status !== 'ongoing'}
                      endIcon={<Iconify icon="solar:arrow-right-bold" />}
                      sx={{
                        fontWeight: 'bold',
                        textTransform: 'none',
                        borderRadius: 1.5,
                        py: 1,
                      }}
                    >
                      {contest.status === 'ongoing' ? 'Participate Now' : contest.status === 'upcoming' ? 'Coming Soon' : 'Contest Ended'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Grid>
    </Grid>
  </DashboardContent>
  );
}
