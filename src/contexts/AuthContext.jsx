import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api, { formatApiError, recordAuditEvent } from '../lib/api';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children: kids }) {
    const [user, setUser] = useState(null); // null = loading, false = anon, obj = authenticated profile
    const [children, setChildren] = useState([]);
    const [activeChild, setActiveChild] = useState(null);
    const [childrenLoading, setChildrenLoading] = useState(true);
    const [childrenLoaded, setChildrenLoaded] = useState(false);
    const [childrenError, setChildrenError] = useState('');
    const childrenRequestRef = useRef(0);

    const refreshChildren = useCallback(async () => {
        const requestId = ++childrenRequestRef.current;
        setChildrenLoading(true);
        setChildrenError('');
        try {
            const { data } = await api.get('/children/context');
            if (requestId !== childrenRequestRef.current) return data?.activeChild || null;
            setChildren(data?.children || []);
            setActiveChild(data?.activeChild || null);
            setChildrenLoaded(true);
            return data?.activeChild || null;
        } catch (error) {
            if (requestId !== childrenRequestRef.current) return null;
            // Não descarte a criança já carregada por uma falha transitória de rede.
            setChildrenError(error?.message || 'Não foi possível carregar o cadastro da criança.');
            return null;
        } finally {
            if (requestId === childrenRequestRef.current) setChildrenLoading(false);
        }
    }, []);

    const refreshUser = useCallback(async () => {
        const { data } = await api.get('/auth/me');
        setUser(data);
        return data;
    }, []);

    const checkSession = useCallback(async () => {
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                setUser(false);
                setChildren([]);
                setActiveChild(null);
                setChildrenLoading(false);
                setChildrenLoaded(false);
                setChildrenError('');
                return;
            }
            await refreshUser();
            await refreshChildren();
        } catch {
            setUser(false);
            setChildren([]);
            setActiveChild(null);
            setChildrenLoading(false);
            setChildrenLoaded(false);
            setChildrenError('');
        }
    }, [refreshChildren, refreshUser]);

    useEffect(() => {
        checkSession();
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                setUser(false);
                setChildren([]);
                setActiveChild(null);
                setChildrenLoading(false);
                setChildrenLoaded(false);
                setChildrenError('');
                return;
            }
            // A sessão recém-criada precisa de um ciclo assíncrono fora do callback do SDK.
            window.setTimeout(() => checkSession(), 0);
        });
        return () => listener.subscription.unsubscribe();
    }, [checkSession]);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setUser(data);
            setChildrenLoaded(false);
            setChildrenError('');
            await refreshChildren();
            void recordAuditEvent('LOGIN', 'auth', data?.id || null, { method: 'password' });
            return { ok: true, user: data };
        } catch (e) {
            return { ok: false, error: formatApiError(e.response?.data?.detail) };
        }
    };

    const register = async (payload) => {
        try {
            const { data } = await api.post('/auth/register', payload);
            if (data.pending_confirmation) {
                setUser(false);
                setChildren([]);
                setActiveChild(null);
                setChildrenLoaded(false);
                setChildrenError('');
                return {
                    ok: false,
                    pending_confirmation: true,
                    error: 'Conta criada. Confirme seu e-mail para entrar no Crescer+.',
                };
            }
            setUser(data);
            setChildren([]);
            setActiveChild(null);
            setChildrenLoaded(false);
            setChildrenError('');
            return { ok: true, user: data };
        } catch (e) {
            return { ok: false, error: formatApiError(e.response?.data?.detail) };
        }
    };

    const logout = async () => {
        void recordAuditEvent('LOGOUT', 'auth', user?.id || null, { method: 'password' });
        try { await api.post('/auth/logout'); } catch {}
        setUser(false);
        setChildren([]);
        setActiveChild(null);
        setChildrenLoaded(false);
        setChildrenError('');
    };

    const deleteAccount = async () => {
        try { await api.delete('/auth/account'); } catch {}
        setUser(false);
        setChildren([]);
        setActiveChild(null);
        setChildrenLoaded(false);
        setChildrenError('');
    };

    const switchChild = async (childId) => {
        await api.post('/children/active', { child_id: childId });
        await refreshChildren();
    };

    const isAdmin = user && ['super_admin', 'editor', 'moderador'].includes(user.role);

    return (
        <AuthContext.Provider value={{
            user, children, activeChild, childrenLoading, childrenLoaded, childrenError, isAdmin,
            child: activeChild,
            setChild: setActiveChild,
            refreshUser, refreshChild: refreshChildren,
            refreshChildren, switchChild,
            login, register, logout, deleteAccount,
        }}>
            {kids}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
