import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  badge?: string;
  badgeColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info';
};

export const navData: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/',
    icon: icon('ic-analytics'),
  },
  {
    title: 'User Management',
    path: '/user',
    icon: icon('ic-user'),
  },
  {
    title: 'Policies',
    path: '/policies',
    icon: icon('ic-cart'),
    badge: '+3',
    badgeColor: 'error',
  },
  {
    title: 'Commissions',
    path: '/commissions',
    icon: icon('ic-cash'),
  },
  {
    title: 'Rewards',
    path: '/rewards',
    icon: icon('ic-crown'), 
  },
  {
    title: 'Contest',
    path: '/contest',
    icon: icon('ic-trophy'),
  },
  {
    title: 'Additional',
    path: '/additional',
    icon: icon('ic-additional'),
  },
];
