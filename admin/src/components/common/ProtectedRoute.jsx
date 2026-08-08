import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SkeletonLoader from './SkeletonLoader';

export default function ProtectedRoute({ children }) {
  const { auth, loading } = useAuth();

  if (loading) return <SkeletonLoader variant="text" />;
  if (!auth) return <Navigate to="/login" replace />;
  return children;
}
