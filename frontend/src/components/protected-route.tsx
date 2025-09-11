import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from 'src/contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children?: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading,user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show loading indicator while checking auth status
    return <div>Loading...</div>;
  }
  console.log(isAuthenticated)
console.log(user)
  if (!isAuthenticated) {
    // Redirect to sign-in page if not authenticated
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  // Render the child routes if authenticated
  return children ? <>{children}</> : <Outlet />;
}
