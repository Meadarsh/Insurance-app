import { Container, Card, CardHeader, CardContent, Button, Typography, Box, Stack, useTheme, alpha, Grid, Dialog } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Iconify } from 'src/components/iconify';
import { useAuth } from 'src/contexts/AuthContext';
import { useState } from 'react';
import StripePaymentForm from 'src/components/payment/StripePaymentForm';

// ----------------------------------------------------------------------

const PLANS = [
  {
    name: 'Monthly',
    price: 29,
    description: 'Pay as you go',
    features: [
      'All premium features',
      'Priority support',
      'Team collaboration',
      'Advanced security',
      'Cancel anytime'
    ],
    recommended: false,
    buttonText: 'Get Started',
    icon: 'ant-design:clock-circle-filled' as const,
    billingCycle: 'month',
    originalPrice: 29
  },
  {
    name: 'Yearly',
    price: 250,
    description: '2 months free',
    features: [
      'Everything in Monthly',
      'Priority 24/7 support',
      'Save $48 annually',
      'Free updates included',
      'Billed $300 yearly'
    ],
    recommended: true,
    buttonText: 'Save 15%',
    icon: 'ant-design:calendar-filled' as const,
    billingCycle: 'year',
    originalPrice: 348,
    discount: 48
  }
];

export default function PricingPage() {
  const theme = useTheme();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = (plan: any) => {
    if (!user) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }
    setSelectedPlan(plan);
    setIsPaymentFormOpen(true);
  };

  const handleClosePaymentForm = () => {
    setIsPaymentFormOpen(false);
    setSelectedPlan(null);
  };

  return (
    <Box sx={{ bgcolor: 'background.neutral', minHeight: '100vh', py: 10 }}>
      <Container>
        <Stack spacing={3} sx={{ mb: 10, textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
          <Typography variant="overline" sx={{ 
            color: 'primary.main', 
            fontWeight: 'bold',
            letterSpacing: '2px',
            fontSize: '0.8rem',
            display: 'inline-block',
            px: 2,
            py: 0.5,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderRadius: 2,
            mb: 1
          }}>
            PRICING
          </Typography>
          <Typography variant="h2" sx={{ 
            mb: 2,
            fontSize: { xs: '2rem', md: '2.75rem' },
            lineHeight: 1.2,
            fontWeight: 700
          }}>
            Simple, Fair Pricing
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ 
            fontSize: '1.05rem',
            maxWidth: 600,
            mx: 'auto',
            lineHeight: 1.7
          }}>
            Start with a 14-day free trial. No credit card required.
            <Box component="span" sx={{ display: 'block', mt: 1 }}>
              Cancel or change plans anytime.
            </Box>
          </Typography>
        </Stack>

        <Grid container spacing={4} justifyContent="center">
          {PLANS.map((plan) => (
            <Grid size={{ xs: 12, md: 5 }} key={plan.name}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px) scale(1.003)',
                    boxShadow: theme.shadows[16],
                  },
                  border: 'none',
                  boxShadow: plan.recommended 
                    ? `0 8px 16px 0 ${alpha(theme.palette.primary.main, 0.16)}`
                    : '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
                  position: 'relative',
                  ...(plan.recommended && {
                    boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                  }),
                }}
              >
                {plan.recommended && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: 12,
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Popular
                  </Box>
                )}
                
                <CardHeader
                  title={
                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                      <Iconify 
                        icon={plan.icon} 
                        width={28} 
                        sx={{ 
                          color: plan.recommended 
                            ? theme.palette.primary.main 
                            : theme.palette.text.primary 
                        }} 
                      />
                      <Typography variant="h4" component="div">
                        {plan.name}
                      </Typography>
                    </Stack>
                  }
                  subheader={
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {plan.description}
                    </Typography>
                  }
                  sx={{ 
                    textAlign: 'center', 
                    pt: 4,
                    pb: 0,
                    '& .MuiCardHeader-content': {
                      width: '100%',
                    }
                  }}
                />
                
                <CardContent sx={{ px: 4, pt: 4, pb: 0 }}>
                  <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
                  {plan.discount && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -130,
                        left: 0,
                        mx: 'auto',
                        bgcolor: 'success.lighter',
                        color: 'success.dark',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: 12,
                        fontWeight: 'bold',
                        width: 'fit-content',
                      }}
                    >
                      Save ${plan.discount}
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <Typography variant="h4" component="span" sx={{ mt: 0.5, mr: 0.5 }}>
                      $
                    </Typography>
                    <Typography variant="h2" component="span" sx={{ lineHeight: 1 }}>
                      {plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, ml: 0.5 }}>
                      /{plan.billingCycle}
                    </Typography>
                  </Box>
                  {plan.originalPrice && plan.billingCycle === 'year' && (
                    <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                      ${plan.originalPrice} / year
                    </Typography>
                  )}  
                  </Box>

                  <Stack spacing={2} sx={{ mb: 4 }}>
                    {plan.features.map((feature, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          py: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            mr: 1.5,
                            flexShrink: 0,
                          }}
                        >
                          <Iconify 
                            icon="eva:checkmark-fill" 
                            width={14} 
                            sx={{ 
                              color: theme.palette.primary.main,
                            }} 
                          />
                        </Box>
                        <Typography variant="body2">{feature}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>

                <Box sx={{ p: 4, pt: 0, mt: 'auto' }}>
                  <Button
                    fullWidth
                    size="large"
                    variant={plan.recommended ? 'contained' : 'outlined'}
                    sx={{
                      py: 1.75,
                      borderRadius: 2,
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      letterSpacing: '0.5px',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {plan.buttonText}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 10, textAlign: 'center' }}>
          <Box
            sx={{
              maxWidth: 800,
              mx: 'auto',
              p: 5,
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: theme.shadows[5],
            }}
          >
            <Typography variant="h4" sx={{ mb: 2 }}>
              Need a custom solution?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              We offer custom solutions for businesses with specific needs. Contact our sales team to discuss
              your requirements and get a personalized quote.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 1.5,
                fontWeight: 'bold',
                boxShadow: `0 8px 16px 0 ${alpha(theme.palette.primary.main, 0.24)}`,
                '&:hover': {
                  boxShadow: `0 12px 20px 0 ${alpha(theme.palette.primary.main, 0.32)}`,
                },
              }}
            >
              Contact Sales
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Payment Dialog */}
      <Dialog open={isPaymentFormOpen} onClose={handleClosePaymentForm} maxWidth="md" fullWidth>
        {selectedPlan && (
          <StripePaymentForm
            plan={selectedPlan}
            onClose={handleClosePaymentForm}
          />
        )}
      </Dialog>
    </Box>

  );}
