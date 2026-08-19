import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { formatApiError } from '../lib/api';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShieldCheck, Mail, AlertCircle, CheckCircle2, LogIn } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABEL = { super_admin: 'Super Admin', editor: 'Editor', moderador: 'Moderador' };

export default function AcceptInvite() {
    const { token } = useParams();
    const nav = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, refreshUser } = useAuth();
    const [invite, setInvite] = useState(null);
    const [error, setError] = useState('');
    const [loadingInv, setLoadingInv] = useState(true);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        api.get(`/invites/${token}`)
            .then((response) => setInvite(response.data))
            .catch((e) => setError(formatApiError(e.response?.data?.detail)))
            .finally(() => setLoadingInv(false));
    }, [token]);

    const claimAuthenticatedInvite = async () => {
        const { data } = await api.post(`/invites/${token}/claim`);
        await refreshUser();
        toast.success(`Convite aceito como ${ROLE_LABEL[data.role] || data.role}!`);
        nav('/admin', { replace: true });
    };

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (user) {
                await claimAuthenticatedInvite();
                return;
            }
            const { data } = await api.post(`/invites/${token}/accept`, { name: name.trim(), password });
            if (data.pending_confirmation) {
                setSuccess(`A conta foi criada para ${data.email}. Confirme o e-mail recebido e depois entre para concluir o aceite.`);
                toast.success('Confira seu e-mail para continuar.');
                return;
            }
            await refreshUser();
            toast.success('Convite aceito com sucesso!');
            nav('/admin', { replace: true });
        } catch (err) {
            const detail = formatApiError(err.response?.data?.detail || err.message);
            if (!user && /already|já existe|registered|cadastrad/i.test(detail)) {
                nav(`/login?invite=${encodeURIComponent(token)}`, { replace: true });
                return;
            }
            setError(detail);
        } finally {
            setSaving(false);
        }
    };

    if (loadingInv) return <AppShell><div className="p-8 text-center text-ink-2" aria-busy="true">Carregando convite…</div></AppShell>;

    if (error && !invite) return <AppShell><div className="px-6 pt-16 pb-10 min-h-screen flex flex-col"><div className="mx-auto w-20 h-20 rounded-3xl bg-[#FDECE8] flex items-center justify-center"><AlertCircle size={40} className="text-destructive" /></div><h1 className="mt-6 font-display text-2xl font-bold text-ink text-center">Convite inválido</h1><p data-testid="invite-error" className="mt-2 text-ink-2 text-center">{error}</p><Button onClick={() => nav('/login')} className="mt-8 rounded-full bg-coral hover:bg-[#D9684C] mx-auto h-12 px-8">Ir para o login</Button></div></AppShell>;

    return <AppShell><div className="px-6 pt-10 pb-10 min-h-screen flex flex-col"><div className="mx-auto w-20 h-20 rounded-3xl bg-ink text-white flex items-center justify-center shadow-warm"><ShieldCheck size={40} /></div><h1 className="mt-6 font-display text-2xl sm:text-3xl font-bold text-ink text-center">Você foi convidado!</h1><p className="mt-2 text-ink-2 text-center"><strong>{invite?.invited_by_name}</strong> te convidou para atuar como <strong>{ROLE_LABEL[invite?.role] || invite?.role}</strong> no Crescer+.</p><div className="mt-6 p-4 rounded-2xl bg-[#FDF6F0] flex items-center gap-3"><Mail size={18} className="text-coral flex-shrink-0" /><p className="text-sm text-ink">Sua conta: <strong data-testid="invite-email">{invite?.email}</strong></p></div>{error && <div role="alert" className="mt-4 text-sm text-destructive bg-[#FDECE8] rounded-xl px-4 py-3">{error}</div>}{success ? <div className="mt-8 rounded-3xl bg-[#E9F6EE] p-6 text-center"><CheckCircle2 size={30} className="mx-auto text-[#2B7A48]" /><h2 className="mt-3 font-display font-bold text-ink">Quase lá!</h2><p className="mt-2 text-sm text-ink-2 leading-relaxed">{success}</p><Button onClick={() => nav(`/login?invite=${encodeURIComponent(token)}`)} className="mt-5 rounded-full bg-ink">Ir para o login</Button></div> : user ? <div className="mt-8 rounded-3xl bg-white border border-[#EADFD8] p-6 text-center"><p className="text-sm text-ink-2">Você está conectado como <strong className="text-ink">{user.email}</strong>.</p><Button onClick={submit} disabled={saving} className="mt-5 w-full h-14 rounded-full bg-coral hover:bg-[#D9684C] text-white text-base font-bold shadow-warm"><CheckCircle2 size={18} className="mr-2" />{saving ? 'Aceitando…' : 'Aceitar convite'}</Button></div> : <><form onSubmit={submit} className="mt-8 space-y-4"><div><Label htmlFor="acc-name">Seu nome</Label><Input id="acc-name" required data-testid="accept-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-14 rounded-2xl bg-white border-[#EADFD8] text-base" placeholder="Como podemos te chamar?" /></div><div><Label htmlFor="acc-pwd">Crie uma senha</Label><Input id="acc-pwd" type="password" required minLength={6} data-testid="accept-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-14 rounded-2xl bg-white border-[#EADFD8] text-base" placeholder="Mínimo 6 caracteres" /></div><Button type="submit" data-testid="accept-submit" disabled={saving} className="w-full h-14 rounded-full bg-coral hover:bg-[#D9684C] text-white text-base font-bold shadow-warm">{saving ? 'Aceitando…' : 'Aceitar convite e criar conta'}</Button></form><p className="mt-5 text-center text-sm text-ink-2">Já possui uma conta? <Link to={`/login?invite=${encodeURIComponent(token)}`} className="font-bold text-coral hover:underline"><LogIn size={14} className="inline mr-1" />Entre para aceitar</Link>.</p></>}</div></AppShell>;
}
