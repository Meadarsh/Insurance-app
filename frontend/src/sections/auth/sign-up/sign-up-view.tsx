import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';
import { authAPI } from 'src/services/auth';

import { Iconify } from 'src/components/iconify';
import { useAuth } from 'src/contexts/AuthContext';

// ----------------------------------------------------------------------

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function SignUpView() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    setApiError('');
  };

  const handleSignUp = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      // First, send OTP for signup verification
      await authAPI.sendOTP(formData.email, 'signup');
      
      // Redirect to OTP verification page
      router.push(`/auth/otp-verification?email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.name)}&password=${encodeURIComponent(formData.password)}`);
    } catch (error: any) {
      setApiError(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }, [formData, router]);

  const toggleShowPassword = (field: 'password' | 'confirmPassword') => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

   const {isAuthenticated } = useAuth();
   if(isAuthenticated){
      router.push('/');
   }

  const renderForm = (
    <Box
      component="form"
      onSubmit={(e) => { e.preventDefault(); handleSignUp(); }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
      }}
    >
      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiError}
        </Alert>
      )}

      <TextField
        fullWidth
        name="name"
        label="Full Name"
        placeholder="Enter your full name"
        value={formData.name}
        onChange={handleInputChange('name')}
        error={!!errors.name}
        helperText={errors.name}
        required
      />

      <TextField
        fullWidth
        name="email"
        type="email"
        label="Email address"
        placeholder="Enter your email"
        value={formData.email}
        onChange={handleInputChange('email')}
        error={!!errors.email}
        helperText={errors.email}
        required
      />

      <TextField
        fullWidth
        name="password"
        label="Password"
        placeholder="Create a password"
        type={showPassword.password ? 'text' : 'password'}
        value={formData.password}
        onChange={handleInputChange('password')}
        error={!!errors.password}
        helperText={errors.password}
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
        value={formData.confirmPassword}
        onChange={handleInputChange('confirmPassword')}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword}
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
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Create Account'}
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
