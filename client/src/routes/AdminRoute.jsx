import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Protects Admin & Manager routes (/admin/*).
 * Redirects non-admin users back to the home page.
 */
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, initializing } = useSelector(
    (state) => state.auth
  );

  if (initializing) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'manager')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
