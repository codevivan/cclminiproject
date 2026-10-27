import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import AccessDeniedPage from '../pages/AccessDeniedPage';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner text="Checking authentication status..." />;
  }

  if (!isAuthenticated) {
    // Redirect to login page and remember where the user was heading
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization with normalized OWNER / STUDENT checks
  if (allowedRoles) {
    const userRole = String(user?.role || '').toUpperCase();
    const normalizedUserRole = userRole === 'ADMIN' ? 'OWNER' : userRole;
    const normalizedAllowed = allowedRoles.map((r) => {
      const u = String(r).toUpperCase();
      return u === 'ADMIN' ? 'OWNER' : u;
    });

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return <AccessDeniedPage requiredRole={allowedRoles.join(' or ')} />;
    }
  }

  return children;
};

export default ProtectedRoute;
