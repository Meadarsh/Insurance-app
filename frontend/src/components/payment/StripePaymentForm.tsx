import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from 'src/contexts/AuthContext';
import { useSnackbar } from 'notistack';
import ApiInstance from 'src/services/api.instance';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentFormProps {
  plan: {
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    buttonText: string;
    icon: string;
    billingCycle: string;
    originalPrice?: number;
    discount?: number;
  };
  onClose: () => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ plan, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const handleCheckout = async () => {
    if (!user) {
      enqueueSnackbar('Please log in to continue', { variant: 'error' });
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create a checkout session on your server
      const { data } = await ApiInstance.post('/payments/create-checkout-session', {
        amount: plan.price,
        planName: plan.name,
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
        customerEmail: user.email,
      });

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to initialize');
      
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) {
        throw stripeError;
      }
    } catch (err: any) {
      console.error('Error during checkout:', err);
      setError(err.message || 'Failed to start checkout');
      enqueueSnackbar(err.message || 'Failed to start checkout', { variant: 'error' });
      setLoading(false);
    }
  };

  return (
    <Card sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {plan.name} Plan - ${plan.price}
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          {plan.description}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckout}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StripePaymentForm;
