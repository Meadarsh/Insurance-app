import { Tooltip, IconButton, Box, BoxProps } from '@mui/material';
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

  // Check if subscription has ended
  const isSubscriptionActive = false;
  // user?.subscriptionEnd && new Date(user.subscriptionEnd) > new Date();

  if (isSubscriptionActive) {
    return <Box {...other}>{children}</Box>;
  }

  const handleUpgradeClick = () => {
    navigate('/pricing');
  };

  return (
    <Box
      onClick={handleUpgradeClick}
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
          }}
        >
          <LuCrown width={16} color="orange" />
        </IconButton>
      </Tooltip>
      <div style={{ pointerEvents: 'none' }}> {children}</div>
    </Box>
  );
}
