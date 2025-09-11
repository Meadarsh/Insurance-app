// AUTH
const AUTH_ROOT = '/auth';

export const paths = {
  // AUTHENTICATION
  auth: {
    signIn: `${AUTH_ROOT}/sign-in`,
    signUp: `${AUTH_ROOT}/sign-up`,
    subscriptionRequired: `${AUTH_ROOT}/subscription-required`,
  },
  
  // DASHBOARD
  dashboard: {
    root: '/dashboard',
    account: '/account',
    settings: '/settings',
  },
  
  // SUBSCRIPTION
  pricing: '/pricing',
  billing: '/billing',
  
  // MISC
  page404: '/404',
  page500: '/500',
  
  // Fallback to home
  home: '/',
};
