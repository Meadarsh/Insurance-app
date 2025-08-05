import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function SignUpView() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  const handleSignUp = useCallback(() => {
    // TODO: Implement sign up logic
    router.push('/auth/sign-in');
  }, [router]);

  const toggleShowPassword = (field: 'password' | 'confirmPassword') => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const renderForm = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      <TextField
        fullWidth
        name="fullName"
        label="Full Name"
        placeholder="Enter your full name"
        required
      />

      <TextField
        fullWidth
        name="email"
        type="email"
        label="Email address"
        placeholder="Enter your email"
        required
      />

      <TextField
        fullWidth
        name="password"
        label="Password"
        placeholder="Create a password"
        type={showPassword.password ? 'text' : 'password'}
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => toggleShowPassword('password')}
                edge="end"
                aria-label="toggle password visibility"
              >
                <Iconify icon={showPassword.password ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <TextField
        fullWidth
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Confirm your password"
        type={showPassword.confirmPassword ? 'text' : 'password'}
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => toggleShowPassword('confirmPassword')}
                edge="end"
                aria-label="toggle confirm password visibility"
              >
                <Iconify icon={showPassword.confirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        onClick={handleSignUp}
        sx={{ mt: 2 }}
      >
        Create Account
      </Button>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Typography variant="h5">Create an Account</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          Already have an account?{' '}
          <Link href="/auth/sign-in" variant="subtitle2">
            Sign in
          </Link>
        </Typography>
      </Box>
      
      {renderForm}
      
      <Divider sx={{ my: 3, '&::before, &::after': { borderTopStyle: 'dashed' } }}>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', fontWeight: 'fontWeightMedium' }}
        >
          OR
        </Typography>
      </Divider>
      
      <Box
        sx={{
          gap: 1,
          display: 'flex',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:google" />
        </IconButton>
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:github" />
        </IconButton>
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:twitter" />
        </IconButton>
      </Box>
      
      <Typography variant="body2" color="text.secondary" align="center">
        By signing up, you agree to our{' '}
        <Link href="#" color="primary">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="#" color="primary">
          Privacy Policy
        </Link>
      </Typography>
    </>
  );
}
