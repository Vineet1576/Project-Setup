import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { auth, loading } = useAuth();

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;
  if (!auth) return <Navigate to="/login" replace />;
  return children;
}
