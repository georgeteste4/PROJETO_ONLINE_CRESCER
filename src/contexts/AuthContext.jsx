import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { formatApiError } from '../lib/api';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children: kids }) {
    const [user, setUser] = useState(null); // null = loading, false = anon, obj = authenticated profile
    const [children, setChildren] = useState([]);
    const [activeChild, setActiveChild] = useState(null);

    const refreshChildren = useCallback(async () => {
        try {
            const { data } = await api.get('/children');
            setChildren(data || []);
            if (!data?.length) {
                setActiveChild(null);
                return null;
            }
            const active = await api.get('/children/me');
            const selected = active.data || data[0];
            setActiveChild(selected);
            return selected;
        } catch {
            setChildren([]);
            setActiveChild(null);
            return null;
        }
    }, []);

    const checkSession = useCallback(async () => {
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData?.session) {
                setUser(false);
                setChildren([]);
                setActiveChild(null);
                return;
            }
            const { data } = await api.get('/auth/me');
            setUser(data);
            await refreshChildren();
        } catch {
            setUser(false);
            setChildren([]);
            setActiveChild(null);
        }
    }, [refreshChildren]);

    useEffect(() => {
        checkSession();
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                setUser(false);
                setChildren([]);
                setActiveChild(null);
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
            await refreshChildren();
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
                return {
                    ok: false,
                    pending_confirmation: true,
                    error: 'Conta criada. Confirme seu e-mail para entrar no Crescer+.',
                };
            }
            setUser(data);
            setChildren([]);
            setActiveChild(null);
            return { ok: true, user: data };
        } catch (e) {
            return { ok: false, error: formatApiError(e.response?.data?.detail) };
        }
    };

    const logout = async () => {
        try { await api.post('/auth/logout'); } catch {}
        setUser(false);
        setChildren([]);
        setActiveChild(null);
    };

    const deleteAccount = async () => {
        try { await api.delete('/auth/account'); } catch {}
        setUser(false);
        setChildren([]);
        setActiveChild(null);
    };

    const switchChild = async (childId) => {
        await api.post('/children/active', { child_id: childId });
        await refreshChildren();
    };

    const isAdmin = user && ['super_admin', 'editor', 'moderador'].includes(user.role);

    return (
        <AuthContext.Provider value={{
            user, children, activeChild, isAdmin,
            child: activeChild,
            setChild: setActiveChild,
            refreshChild: refreshChildren,
            refreshChildren, switchChild,
            login, register, logout, deleteAccount,
        }}>
            {kids}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
