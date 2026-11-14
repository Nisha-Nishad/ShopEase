import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Protects customer routes that require login (e.g., Profile, Checkout, Orders).
 * Redirects unauthenticated users to /login and remembers the page they tried to visit.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, initializing } = useSelector((state) => state.auth);
  const location = useLocation();

  if (initializing) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
