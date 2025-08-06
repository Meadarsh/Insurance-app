import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export type PolicyFiltersProps = {
  productType: string;
  status: string;
  premiumRange: string;
  startDate: Date | null;
  endDate: Date | null;
};

type FiltersProps = {
  canReset: boolean;
  openFilter: boolean;
  filters: PolicyFiltersProps;
  onOpenFilter: () => void;
  onCloseFilter: () => void;
  onResetFilter: () => void;
  onSetFilters: (updateState: Partial<PolicyFiltersProps>) => void;
  options: {
    productTypes: { value: string; label: string }[];
    statuses: { value: string; label: string }[];
    premiumRanges: { value: string; label: string }[];
  };
};

export function PolicyFilters({
  filters,
  options,
  canReset,
  openFilter,
  onSetFilters,
  onOpenFilter,
  onCloseFilter,
  onResetFilter,
}: FiltersProps) {
  const renderProductType = (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Product Type</Typography>
      <RadioGroup>
        {options.productTypes.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={
              <Radio
                checked={filters.productType === option.value}
                onChange={() => onSetFilters({ productType: option.value })}
              />
            }
            label={option.label}
          />
        ))}
      </RadioGroup>
    </Stack>
  );

  const renderStatus = (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Commission Status</Typography>
      <RadioGroup>
        {options.statuses.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={
              <Radio
                checked={filters.status === option.value}
                onChange={() => onSetFilters({ status: option.value })}
              />
            }
            label={option.label}
          />
        ))}
      </RadioGroup>
    </Stack>
  );

  const renderPremiumRange = (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Premium Range</Typography>
      <RadioGroup>
        {options.premiumRanges.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={
              <Radio
                checked={filters.premiumRange === option.value}
                onChange={() => onSetFilters({ premiumRange: option.value })}
              />
            }
            label={option.label}
          />
        ))}
      </RadioGroup>
    </Stack>
  );

  const renderDateRange = (
    <Stack spacing={1}>
      <Typography variant="subtitle2">Policy Date Range</Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            const today = new Date();
            onSetFilters({
              startDate: new Date(today.getFullYear(), today.getMonth(), 1),
              endDate: today,
            });
          }}
        >
          This Month
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            const today = new Date();
            onSetFilters({
              startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
              endDate: new Date(today.getFullYear(), today.getMonth(), 0),
            });
          }}
        >
          Last Month
        </Button>
      </Box>
    </Stack>
  );

  return (
    <>
      <Button
        disableRipple
        color="inherit"
        endIcon={
          <Badge color="error" variant="dot" invisible={!canReset}>
            <Iconify icon="ic:round-filter-list" />
          </Badge>
        }
        onClick={onOpenFilter}
      >
        Filters
      </Button>

      <Drawer
        anchor="right"
        open={openFilter}
        onClose={onCloseFilter}
        slotProps={{
          paper: {
            sx: { width: 280, overflow: 'hidden' },
          },
        }}
      >
        <Box
          sx={{
            py: 2,
            pl: 2.5,
            pr: 1.5,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Policy Filters
          </Typography>

          <IconButton onClick={onResetFilter}>
            <Badge color="error" variant="dot" invisible={!canReset}>
              <Iconify icon="solar:restart-bold" />
            </Badge>
          </IconButton>

          <IconButton onClick={onCloseFilter}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Box>

        <Divider />

        <Scrollbar>
          <Stack spacing={3} sx={{ p: 3 }}>
            {renderProductType}
            {renderStatus}
            {renderPremiumRange}
            {renderDateRange}
          </Stack>
        </Scrollbar>
      </Drawer>
    </>
  );
}