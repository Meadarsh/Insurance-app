import { useState } from 'react';
import { Tooltip, IconButton, Box, BoxProps, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import { LuCrown } from 'react-icons/lu';

interface PremiumGuardProps extends BoxProps {
  children: React.ReactNode;
  tooltip?: string;
}

export default function PremiumGuard({
  children,
  tooltip = 'Upgrade to Premium',
  ...other
}: PremiumGuardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Check if subscription has ended
  const isSubscriptionActive = user?.subscriptionEnd && new Date(user.subscriptionEnd) > new Date();

  if (isSubscriptionActive) {
    return <Box {...other}>{children}</Box>;
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  return (
    <>
      <Box
        onClick={handleOpen}
        sx={{ cursor: 'pointer', position: 'relative', display: 'inline-flex' }}
        {...other}
      >
        <Tooltip title={tooltip}>
          <IconButton
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              zIndex: 1,
              p: 0.5,
              bgcolor: 'white',
              '&:hover': {
                bgcolor: 'grey.100',
              },
            }}
          >
            <LuCrown size={16} color="orange" />
          </IconButton>
        </Tooltip>
        <div style={{ pointerEvents: 'none' }}>{children}</div>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Upgrade to Premium</DialogTitle>
        <DialogContent>
          <p>This is a premium feature. Upgrade your plan to access it.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleUpgrade} variant="contained" color="primary">
            View Plans
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
