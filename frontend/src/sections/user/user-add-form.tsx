import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { Drawer } from '@mui/material';

const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

type UserFormValues = z.infer<typeof userFormSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormValues) => void;
};

const UserAddForm = ({ open, onClose, onSubmit }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const handleFormSubmit = (data: UserFormValues) => {
    onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Drawer sx={{ width: '400px' }} open={open} onClose={handleClose} anchor='right'>
      <Box component="form" sx={{ minWidth: '400px', p: 3 }} onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <h2>Add New User</h2>
        <Box>
          <Stack spacing={3}>
            <TextField
              {...register('name')}
              label="Full Name"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              {...register('email')}
              label="Email Address"
              fullWidth
              type="email"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Stack>
        </Box>
        <Box sx={{pt: 3, display: 'flex', alignItems: 'center',gap: 2, justifyContent: 'right' }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Add User
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

export default UserAddForm;
