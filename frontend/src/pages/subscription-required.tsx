import { Button, Container, Stack, Typography } from '@mui/material';
import { useRouter } from 'src/routes/hooks';
import { paths } from '../routes/paths';

// ----------------------------------------------------------------------

export default function SubscriptionRequiredView() {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push(paths.pricing);
  };

  return (
    <Container>
      <Stack
        spacing={3}
        sx={{
          maxWidth: 480,
          mx: 'auto',
          mt: { xs: 8, md: 12 },
          textAlign: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h3" paragraph>
          Subscription Required
        </Typography>

        <Typography sx={{ color: 'text.secondary' }}>
          You need an active subscription to access this content. Please upgrade your plan to continue.
        </Typography>

        <Button
          size="large"
          variant="contained"
          onClick={handleUpgrade}
          sx={{ mt: 3 }}
        >
          View Plans
        </Button>

        <Button
          size="large"
          variant="outlined"
          onClick={() => router.back()}
          sx={{ mt: 1 }}
        >
          Go Back
        </Button>
      </Stack>
    </Container>
  );
}
