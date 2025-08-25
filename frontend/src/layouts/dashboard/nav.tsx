import type { Theme, SxProps, Breakpoint } from '@mui/material/styles';

import { useEffect } from 'react';

import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';
import { Scrollbar } from 'src/components/scrollbar';

import { WorkspacesPopover } from '../components/workspaces-popover';

import type { NavItem } from '../nav-config-dashboard';
import type { WorkspacesPopoverProps } from '../components/workspaces-popover';

// ----------------------------------------------------------------------

export type NavContentProps = {
  data: NavItem[];
  slots?: {
    topArea?: React.ReactNode;
    bottomArea?: React.ReactNode;
  };
  workspaces: WorkspacesPopoverProps['data'];
  sx?: SxProps<Theme>;
};

export function NavDesktop({
  sx,
  data,
  slots,
  workspaces,
  layoutQuery,
}: NavContentProps & { layoutQuery: Breakpoint }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        pt: 2.5,
        px: 2.5,
        top: 0,
        left: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        background: 'var(--sidebar-bg)',
        borderRight: `1px solid var(--sidebar-border)`,
        boxShadow: 'var(--sidebar-shadow)',
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      <NavContent data={data} slots={slots} workspaces={workspaces} />
    </Box>
  );
}

// ----------------------------------------------------------------------

export function NavMobile({
  sx,
  data,
  open,
  slots,
  onClose,
  workspaces,
}: NavContentProps & { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          pt: 2.5,
          px: 2.5,
          overflow: 'unset',
          width: 'var(--layout-nav-mobile-width)',
          background: 'var(--sidebar-bg)',
          borderRight: `1px solid var(--sidebar-border)`,
          boxShadow: 'var(--sidebar-shadow)',
          ...sx,
        },
      }}
    >
      <NavContent data={data} slots={slots} workspaces={workspaces} />
    </Drawer>
  );
}

// ----------------------------------------------------------------------

export function NavContent({ data, slots, workspaces, sx }: NavContentProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Enhanced Logo Section */}
      <Box
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Logo  />
        <Typography variant="h6" sx={{ mt: 1 }}>
          Insurance App
        </Typography>
      </Box>

      {slots?.topArea}

      <WorkspacesPopover data={workspaces} sx={{ my: 2 }} />

      {/* Navigation Section */}
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          mb: 2,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            px: 2,
            py: 1,
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Navigation
        </Typography>
        
        <Scrollbar fillContent>
          <Box
            component="nav"
            sx={[
              {
                display: 'flex',
                flex: '1 1 auto',
                flexDirection: 'column',
              },
              ...(Array.isArray(sx) ? sx : [sx]),
            ]}
          >
            <Box
              component="ul"
              sx={{
                gap: 0.75,
                display: 'flex',
                flexDirection: 'column',
                mt: 1,
              }}
            >
              {data.map((item) => {
                const isActived = item.path === pathname;

                return (
                  <ListItem disableGutters disablePadding key={item.title}>
                    <ListItemButton
                      disableGutters
                      component={RouterLink}
                      href={item.path}
                      sx={[
                        (themeInner) => ({
                          pl: 1,
                          py: 1,
                          gap: 2.5,
                          pr: 1,
                          borderRadius: 1.5,
                          typography: 'body2',
                          fontWeight: isActived ? 'fontWeightSemiBold' : 'fontWeightMedium',
                          color: isActived 
                            ? 'var(--sidebar-item-active-text)' 
                            : 'var(--sidebar-item-inactive)',
                          minHeight: 40,
                          transition: 'all 0.15s ease',
                          position: 'relative',
                          overflow: 'hidden',                          
                          // Default state
                          backgroundColor: 'transparent',
                          '&:hover': {
                            backgroundColor: 'var(--sidebar-item-hover)',
                            color: 'text.primary',
                            borderColor: 'var(--sidebar-item-border)',
                          },
                          
                          // Active state with optimized styling
                          ...(isActived && {
                            fontWeight: 'fontWeightSemiBold',
                            color: 'var(--sidebar-item-active-text)',
                            backgroundColor: 'var(--sidebar-item-active)',
                            borderColor: 'var(--sidebar-item-active)',
                            '&:hover': {
                              backgroundColor: 'var(--sidebar-item-active-dark)',
                            },
                          }),
                        }),
                      ]}
                    >
                      {/* Enhanced Icon with better styling */}
                      <Box 
                        component="span" 
                        sx={{ 
                          width: 24, 
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          scale: 0.8,
                          color: isActived ? 'inherit' : 'var(--sidebar-item-inactive-icon)',
                          opacity: isActived ? 1 : 0.8,
                          filter: isActived ? 'brightness(1.2)' : 'none',
                        }}
                      >
                        {item.icon}
                      </Box>

                      {/* Enhanced Title with better typography */}
                      <Box component="span" sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isActived ? 600 : 500,
                            color: 'inherit',
                            fontSize: '0.8rem',
                          }}
                        >
                          {item.title}
                        </Typography>
                      </Box>

                      {/* Enhanced Badge with premium styling */}
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          color={item.badgeColor || 'primary'}
                          sx={{
                            height: 20,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: isActived 
                              ? 'rgba(255, 255, 255, 0.2)' 
                              : 'var(--sidebar-badge-bg)',
                            color: isActived 
                              ? 'inherit' 
                              : 'var(--sidebar-badge-text)',
                            border: isActived ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </Box>
          </Box>
        </Scrollbar>
      </Box>

      {slots?.bottomArea}

    </>
  );
}
