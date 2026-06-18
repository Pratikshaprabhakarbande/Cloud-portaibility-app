/**
 * ProtectedRoute — gates routes behind authentication and (optionally) roles.
 * - While auth is bootstrapping, shows a loader.
 * - Unauthenticated users are redirected to /login (preserving intended path).
 * - Authenticated users lacking the required role get /unauthorized.
 */
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { PageLoader } from '../components/ui/Loading.jsx';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Authenticating..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
