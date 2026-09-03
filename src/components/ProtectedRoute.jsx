import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
    const { session } = useAuth();

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return children;
};