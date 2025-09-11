import { useEffect, useState } from 'react';
import { useAuth } from 'src/contexts/AuthContext';
import { Box, Typography, Button, Modal, Paper, Container } from '@mui/material';
import { useRouter } from 'src/routes/hooks';

interface SubscriptionProtectionProps {
  children: React.ReactNode;
}

export default function SubscriptionProtection({ children }: SubscriptionProtectionProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const now = new Date();
      const subscriptionEnd = user.subscriptionEnd ? new Date(user.subscriptionEnd) : null;
      
      if (!subscriptionEnd || subscriptionEnd < now) {
        setShowSubscriptionModal(true);
      } else {
        setShowSubscriptionModal(false);
      }
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) {
    return <>{children}</>; // Or a loading spinner
  }

  const handleUpgrade = () => {
    router.push('/pricing'); // Update this to your pricing/upgrade page
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      
      <Modal
        open={showSubscriptionModal}
        aria-labelledby="subscription-expired-modal"
        aria-describedby="subscription-expired-modal-description"
        disableEscapeKeyDown
        disableAutoFocus
        disableEnforceFocus
        sx={{
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={24}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              borderRadius: 2,
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" component="h2" gutterBottom>
                {!user?.subscriptionEnd ? 'Subscription Required' : 'Subscription Expired'}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {!user?.subscriptionEnd
                  ? 'You need an active subscription to access this content.'
                  : 'Your subscription has expired. Please renew to continue using our services.'}
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleUpgrade}
              sx={{ mt: 2, px: 4, py: 1.5 }}
            >
              {!user?.subscriptionEnd ? 'Subscribe Now' : 'Renew Subscription'}
            </Button>

            <Typography variant="caption" display="block" sx={{ mt: 3, color: 'text.secondary' }}>
              Need help? Contact our support team
            </Typography>
          </Paper>
        </Container>
      </Modal>
    </Box>
  );
}
