import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireChild = false, requireRole }) {
    const { user, activeChild } = useAuth();
    const location = useLocation();

    if (user === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-ink-2">Carregando…</div>
            </div>
        );
    }
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (requireRole) {
        const allowed = Array.isArray(requireRole) ? requireRole : [requireRole];
        if (!allowed.includes(user.role)) {
            return <Navigate to="/" replace />;
        }
    }
    if (requireChild && !activeChild) {
        const isAdmin = user && ['super_admin', 'editor', 'moderador'].includes(user.role);
        if (isAdmin) return <Navigate to="/admin" replace />;
        return <Navigate to="/cadastro-crianca" replace />;
    }
    return children;
}
