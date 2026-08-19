import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireChild = false, requireRole }) {
    const { user, activeChild, childrenLoading, childrenLoaded, childrenError, refreshChildren } = useAuth();
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
    if (!requireRole && user && !childrenLoaded && (childrenLoading || childrenError)) {
        return <div className="min-h-screen flex items-center justify-center bg-background px-5"><div className="w-full max-w-md rounded-3xl border border-[#EADFD8] bg-white p-6 text-center shadow-warm"><p className="font-display text-xl font-bold text-ink">Estamos recuperando o perfil da criança</p><p className="mt-2 text-sm leading-relaxed text-ink-2">Aguarde um instante. Não vamos enviar você para o cadastro enquanto seus dados ainda estão carregando.</p>{childrenError ? <button type="button" onClick={() => refreshChildren()} className="mt-4 rounded-full bg-coral px-5 py-3 text-sm font-bold text-white">Tentar novamente</button> : <span className="mt-4 block text-sm text-ink-2">Carregando…</span>}</div></div>;
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
