import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Heart, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import api, { formatApiError } from '../lib/api';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Login() {
    const nav = useNavigate();
    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get('invite');
    const { login, refreshUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        const res = await login(email.trim(), password);
        setLoading(false);
        if (res.ok) {
            if (inviteToken) {
                try {
                    const { data } = await api.post(`/invites/${inviteToken}/claim`);
                    await refreshUser();
                    toast.success(`Convite aceito como ${data.role === 'super_admin' ? 'Super Admin' : data.role === 'editor' ? 'Editor' : 'Moderador'}!`);
                    nav('/admin', { replace: true });
                    return;
                } catch (claimError) {
                    setError(formatApiError(claimError.response?.data?.detail || claimError.message));
                    return;
                }
            }
            toast.success('Bem-vindo de volta!');
            const isAdmin = res.user && ['super_admin', 'editor', 'moderador'].includes(res.user.role);
            nav(isAdmin ? '/admin' : '/');
        } else {
            setError(res.error);
        }
    };

    return (
        <AppShell>
            <div className="min-h-screen bg-[#FCF7F2] px-5 py-5 sm:px-6 sm:py-8 flex flex-col">
                <div className="relative overflow-hidden rounded-[2rem] bg-[#F5D7C9] px-5 pt-5 pb-7 shadow-warm">
                    <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[#E99578]/35" aria-hidden="true" />
                    <div className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-[#F9E6A9]/60" aria-hidden="true" />
                    <div className="relative flex items-center justify-between">
                        <button onClick={() => nav(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/75 text-[#4A3A35] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9684C]" aria-label="Voltar" data-testid="login-back-btn">
                            <ArrowLeft size={19} />
                        </button>
                        <div className="flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-2 text-sm font-bold text-[#4A3A35]">
                            <Sparkles size={15} className="text-[#C9684C]" /> Crescer+
                        </div>
                    </div>
                    <div className="relative mt-8">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#8D5A4A]"><Heart size={16} className="fill-[#C9684C] text-[#C9684C]" /> Um espaço para crescer junto</div>
                        <h1 className="mt-3 max-w-xs font-display text-3xl font-extrabold leading-tight text-[#3F302C]">Cada descoberta começa com acolhimento.</h1>
                        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#76564B]">Entre para continuar acompanhando os pequenos momentos que fazem diferença.</p>
                    </div>
                </div>

                <div className="mx-auto flex w-full max-w-md flex-1 flex-col pt-7">
                    <div className="animate-fade-up">
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#C9684C]">Acessar conta</p>
                        <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-[#3F302C]">Que bom te ver novamente.</h2>
                    </div>

                    <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-[1.75rem] border border-[#EADFD8] bg-white p-5 shadow-warm animate-fade-up sm:p-6" style={{ animationDelay: '70ms' }}>
                        <div>
                            <Label htmlFor="email" className="text-sm font-bold text-[#4A3A35]">E-mail</Label>
                            <div className="relative mt-2">
                                <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A48E85]" aria-hidden="true" />
                                <Input id="email" type="email" required autoComplete="email" data-testid="login-email-input" value={email} onChange={(event) => setEmail(event.target.value)} className="h-14 rounded-2xl border-[#EADFD8] bg-[#FFFDFC] pl-11 text-base focus-visible:ring-[#C9684C]" placeholder="voce@exemplo.com" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="password" className="text-sm font-bold text-[#4A3A35]">Senha</Label>
                                <Link to="/recuperar-senha" className="text-xs font-bold text-[#C9684C] transition hover:underline" data-testid="login-forgot-password-link">Esqueci minha senha</Link>
                            </div>
                            <div className="relative mt-2">
                                <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A48E85]" aria-hidden="true" />
                                <Input id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" data-testid="login-password-input" value={password} onChange={(event) => setPassword(event.target.value)} className="h-14 rounded-2xl border-[#EADFD8] bg-[#FFFDFC] pl-11 pr-12 text-base focus-visible:ring-[#C9684C]" placeholder="Sua senha" />
                                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[#A48E85] transition hover:bg-[#FFF1EB] hover:text-[#C9684C]"><span className="sr-only">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </div>
                        {error && <div role="alert" data-testid="login-error" className="rounded-2xl bg-[#FDECE8] px-4 py-3 text-sm leading-relaxed text-[#A54139]">{error}</div>}
                        <Button type="submit" disabled={loading} data-testid="login-submit-btn" className="h-14 w-full rounded-full bg-[#C9684C] text-base font-bold text-white shadow-warm transition hover:bg-[#B9573E] disabled:cursor-not-allowed disabled:opacity-60">
                            {loading ? 'Entrando…' : <>Entrar na minha conta <ArrowRight size={18} /></>}
                        </Button>
                    </form>

                    <div className="mt-auto pt-8 text-center text-sm text-[#766862] animate-fade-up" style={{ animationDelay: '140ms' }}>
                        Ainda não tem conta?{' '}
                        <Link data-testid="login-goto-register" to="/cadastro" className="font-bold text-[#C9684C] hover:underline">Criar agora</Link>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
