import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, Container, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useSnackbar } from 'notistack';
import ApiInstance from 'src/services/api.instance';
import { useAuth } from 'src/contexts/AuthContext';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const {checkAuth} = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async (sessionId: string) => {
      try {
        // Clean up the session ID in case it's malformed
        const cleanSessionId = sessionId.split('?')[0];
        
        const { data } = await ApiInstance.get(`/payments/success?session_id=${encodeURIComponent(cleanSessionId)}`);
        
        if (data.success) {
          setVerificationStatus('success');
          setPaymentDetails(data.data);
          checkAuth();
        } else {
          throw new Error(data.message || 'Payment verification failed');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        enqueueSnackbar(error.message || 'Failed to verify payment', { variant: 'error' });
        setVerificationStatus('error');
      } finally {
        setIsVerifying(false);
      }
    };

    const params = new URLSearchParams(window.location.search);
    let sessionId = params.get('session_id');

    // Handle the case where the session ID might be duplicated in the URL
    if (sessionId && sessionId.includes('?session_id=')) {
      sessionId = sessionId.split('?session_id=')[0];
    }

    if (!sessionId) {
      enqueueSnackbar('No session ID found', { variant: 'error' });
      navigate('/pricing');
      return;
    }

    verifyPayment(sessionId);
  }, [navigate, enqueueSnackbar]);

  if (isVerifying) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            Verifying your payment...
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Please wait while we confirm your payment details.
          </Typography>
        </Box>
      </Container>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <ErrorIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Payment Verification Failed
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            We couldn&apos;t verify your payment. Please contact support if you need assistance.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/pricing')}
            sx={{ mt: 2 }}
          >
            Back to Pricing
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Payment Successful!
        </Typography>
        
        <Card sx={{ mt: 4, p: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Thank you for your purchase!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Your payment of {paymentDetails?.amount ? `$${paymentDetails.amount.toFixed(2)}` : ''} has been processed successfully.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Transaction ID: {paymentDetails?.paymentId || 'N/A'}
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/')}
              sx={{ mt: 2 }}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
