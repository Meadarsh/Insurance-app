import { useState } from 'react';
import { Box, Card, Grid, Button, Typography, CardContent } from '@mui/material';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: React.ReactNode;
  claimed: boolean;
}

// Mock data for rewards
const REWARDS: Reward[] = [
  {
    id: '1',
    title: 'Loyalty Badge',
    description: 'Earn this exclusive badge for being a valued customer',
    points: 500,
    icon: <Iconify icon="custom:medal" width={24} sx={{ color: 'primary.main', mr: 1 }} />,
    claimed: false,
  },
  {
    id: '2',
    title: 'Premium Status',
    description: 'Unlock premium status with exclusive benefits',
    points: 1000,
    icon: <Iconify icon="custom:trophy" width={24} sx={{ color: 'warning.main', mr: 1 }} />,
    claimed: false,
  },
  {
    id: '3',
    title: 'Safety Package',
    description: 'Get a free safety check for your vehicle',
    points: 750,
    icon: <Iconify icon="custom:medal" width={24} sx={{ color: 'success.main', mr: 1 }} />,
    claimed: false,
  },
  {
    id: '4',
    title: 'Star Member',
    description: 'Become a star member with special discounts',
    points: 1500,
    icon: <Iconify icon="custom:star" width={24} sx={{ color: 'warning.main', mr: 1 }} />,
    claimed: false,
  },
];

export default function RewardsView() {
  const [rewards] = useState<Reward[]>(REWARDS);
  const [points, setPoints] = useState(1250); // Example points

  return (
    <DashboardContent title="Rewards">
      <Box sx={{ mb: 5 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Rewards
      </Typography>
        <Card>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid sx={{flexGrow: 1}}>
                <Typography variant="h4" component="div">
                  {points.toLocaleString()} Points
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available for redemption
                </Typography>
              </Grid>
              <Grid  sx={{ textAlign: { md: 'right' }, flexGrow: 1 }}>
                <Button variant="contained" color="primary">
                  Redeem Points
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <Grid container spacing={3}>
        {rewards.map((reward) => (
          <Grid key={reward.id} sx={{flexGrow: 1}}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {reward.icon}
                  <Typography variant="h6">{reward.title}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {reward.description}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="primary">
                    {reward.points.toLocaleString()} pts
                  </Typography>
                  <Button
                    size="small"
                    variant={reward.claimed ? 'outlined' : 'contained'}
                    disabled={reward.claimed}
                  >
                    {reward.claimed ? 'Claimed' : 'Claim'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </DashboardContent>
  );
}
