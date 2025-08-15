import { useState, useCallback } from 'react';
import { Iconify } from 'src/components/iconify';
import { Button, Popover, MenuList, MenuItem, Typography, menuItemClasses } from '@mui/material';

type PolicySortProps = {
  sortBy: string;
  onSort: (newSort: string) => void;
  options: { value: string; label: string }[];
  sx?: any;
};

export function PolicySort({ options, sortBy, onSort, sx }: PolicySortProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  return (
    <>
      <Button
        disableRipple
        color="inherit"
        onClick={handleOpenPopover}
        endIcon={
          <Iconify
            icon={openPopover ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
          />
        }
        sx={sx}
      >
        Sort By:&nbsp;
        <Typography component="span" variant="subtitle2" sx={{ color: 'text.secondary' }}>
          {options.find((option) => option.value === sortBy)?.label}
        </Typography>
      </Button>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 160,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: { bgcolor: 'action.selected' },
            },
          }}
        >
          {options.map((option) => (
            <MenuItem
              key={option.value}
              selected={option.value === sortBy}
              onClick={() => {
                onSort(option.value);
                handleClosePopover();
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  );
}