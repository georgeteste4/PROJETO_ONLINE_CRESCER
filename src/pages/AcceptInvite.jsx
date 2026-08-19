import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { formatApiError } from '../lib/api';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShieldCheck, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABEL = { super_admin: 'Super Admin', editor: 'Editor', moderador: 'Moderador' };

export default function AcceptInvite() {
    const { token } = useParams();
    const nav = useNavigate();
    const { refreshChildren } = useAuth();
    const [invite, setInvite] = useState(null);
    const [error, setError] = useState('');
    const [loadingInv, setLoadingInv] = useState(true);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get(`/invites/${token}`)
            .then((r) => setInvite(r.data))
            .catch((e) => setError(formatApiError(e.response?.data?.detail)))
            .finally(() => setLoadingInv(false));
    }, [token]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const { data } = await api.post(`/invites/${token}/accept`, { name, password });
            if (data.token) localStorage.setItem('crescer_token', data.token);
            toast.success('Bem-vindo ao Crescer+!');
            // Force reload of auth context by full navigation
            await refreshChildren?.();
            window.location.href = '/admin';
        } catch (err) {
            setError(formatApiError(err.response?.data?.detail));
            setSaving(false);
        }
    };

    if (loadingInv) {
        return (
            <AppShell>
                <div className="p-8 text-center text-ink-2">Carregando convite…</div>
            </AppShell>
        );
    }

    if (error && !invite) {
        return (
            <AppShell>
                <div className="px-6 pt-16 pb-10 min-h-screen flex flex-col">
                    <div className="mx-auto w-20 h-20 rounded-3xl bg-[#FDECE8] flex items-center justify-center">
                        <AlertCircle size={40} className="text-destructive" />
                    </div>
                    <h1 className="mt-6 font-display text-2xl font-bold text-ink text-center">Convite inválido</h1>
                    <p data-testid="invite-error" className="mt-2 text-ink-2 text-center">{error}</p>
                    <Button
                        onClick={() => nav('/login')}
                        className="mt-8 rounded-full bg-coral hover:bg-[#D9684C] mx-auto h-12 px-8"
                    >
                        Ir para o login
                    </Button>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="px-6 pt-10 pb-10 min-h-screen flex flex-col">
                <div className="mx-auto w-20 h-20 rounded-3xl bg-ink text-white flex items-center justify-center shadow-warm">
                    <ShieldCheck size={40} />
                </div>
                <h1 className="mt-6 font-display text-2xl sm:text-3xl font-bold text-ink text-center">
                    Você foi convidado!
                </h1>
                <p className="mt-2 text-ink-2 text-center">
                    <strong>{invite?.invited_by_name}</strong> te convidou para atuar como <strong>{ROLE_LABEL[invite?.role] || invite?.role}</strong> no Crescer+.
                </p>

                <div className="mt-6 p-4 rounded-2xl bg-[#FDF6F0] flex items-center gap-3">
                    <Mail size={18} className="text-coral flex-shrink-0" />
                    <p className="text-sm text-ink">
                        Sua conta: <strong data-testid="invite-email">{invite?.email}</strong>
                    </p>
                </div>

                <form onSubmit={submit} className="mt-8 space-y-4">
                    <div>
                        <Label htmlFor="acc-name">Seu nome</Label>
                        <Input
                            id="acc-name"
                            required
                            data-testid="accept-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 h-14 rounded-2xl bg-white border-[#EADFD8] text-base"
                            placeholder="Como podemos te chamar?"
                        />
                    </div>
                    <div>
                        <Label htmlFor="acc-pwd">Crie uma senha</Label>
                        <Input
                            id="acc-pwd"
                            type="password"
                            required
                            minLength={6}
                            data-testid="accept-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 h-14 rounded-2xl bg-white border-[#EADFD8] text-base"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-[#FDECE8] rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        data-testid="accept-submit"
                        disabled={saving}
                        className="w-full h-14 rounded-full bg-coral hover:bg-[#D9684C] text-white text-base font-bold shadow-warm"
                    >
                        {saving ? 'Aceitando…' : 'Aceitar convite e entrar'}
                    </Button>
                </form>
            </div>
        </AppShell>
    );
}
