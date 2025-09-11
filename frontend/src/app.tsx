import 'src/global.css';
import 'src/theme/color-variables.css';

import { useEffect } from 'react';
import { usePathname } from 'src/routes/hooks';

import { ThemeProvider } from 'src/theme/theme-provider';
import { AuthProvider } from './contexts/AuthContext';

// ----------------------------------------------------------------------

type AppProps = {
  children: React.ReactNode;
};

export default function App({ children }: AppProps) {
  useScrollToTop();

  return (
    <ThemeProvider>
      <AuthProvider>
            {children}
      </AuthProvider>
    </ThemeProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
