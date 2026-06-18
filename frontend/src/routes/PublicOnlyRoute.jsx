/**
 * PublicOnlyRoute — for login/register. Redirects authenticated users to the
 * dashboard so they don't see auth screens again.
 */
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { PageLoader } from '../components/ui/Loading.jsx';

export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}
