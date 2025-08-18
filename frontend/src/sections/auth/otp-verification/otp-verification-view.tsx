import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { authAPI } from 'src/services/auth';

// ----------------------------------------------------------------------

export function OtpVerificationView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Get email, name, and password from URL params
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const nameParam = searchParams.get('name');
    const passwordParam = searchParams.get('password');
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    // Store user data for registration after OTP verification
    if (nameParam && passwordParam) {
      localStorage.setItem('pendingRegistration', JSON.stringify({
        name: nameParam,
        email: emailParam,
        password: passwordParam
      }));
    }
  }, [searchParams]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
      return undefined;
    }
  }, [countdown]);

  const handleVerifyOTP = useCallback(async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP
      await authAPI.verifyOTP(email, otp, 'signup');
      
      // Check if we have pending registration data
      const pendingRegistration = localStorage.getItem('pendingRegistration');
      
      if (pendingRegistration) {
        try {
          // Register the user
          const userData = JSON.parse(pendingRegistration);
          await authAPI.register(userData);
          
          // Clear pending registration data
          localStorage.removeItem('pendingRegistration');
          
          setSuccess('Account created successfully! Redirecting to sign-in...');
          
          // Redirect to sign-in page after successful registration
          setTimeout(() => {
            navigate('/auth/sign-in');
          }, 2000);
        } catch (regError: any) {
          setError('OTP verified but failed to create account: ' + regError.message);
        }
      } else {
        setSuccess('OTP verified successfully! Redirecting...');
        
        // Redirect to sign-in page after successful verification
        setTimeout(() => {
          navigate('/auth/sign-in');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  }, [otp, email, navigate]);

  const handleResendOTP = useCallback(async () => {
    if (!email) {
      setError('Email is required to resend OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authAPI.sendOTP(email, 'signup');
      setSuccess('OTP resent successfully!');
      setCountdown(60); // 60 second countdown
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleOtpChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

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
        <Typography variant="h5">Verify Your Email</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          We&apos;ve sent a 6-digit verification code to{' '}
          <strong>{email || 'your email'}</strong>
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          mb: 3,
        }}
      >
        <TextField
          fullWidth
          name="otp"
          label="Enter OTP"
          placeholder="000000"
          value={otp}
          onChange={handleOtpChange}
          inputProps={{
            maxLength: 6,
            style: { textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' },
          }}
          required
        />

        <Button
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          onClick={handleVerifyOTP}
          disabled={loading || otp.length !== 6}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Didn&apos;t receive the code?
        </Typography>
        
        {canResend ? (
          <Button
            onClick={handleResendOTP}
            disabled={loading}
            sx={{ mt: 1 }}
          >
            Resend OTP
          </Button>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Resend available in {countdown} seconds
          </Typography>
        )}
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Back to{' '}
          <Link href="/auth/sign-in" variant="subtitle2">
            Sign In
          </Link>
        </Typography>
      </Box>
    </>
  );
}
