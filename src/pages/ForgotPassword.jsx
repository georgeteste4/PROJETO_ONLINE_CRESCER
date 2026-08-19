import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mail, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { supabase } from '../lib/supabase';

function appBaseUrl() {
    const configuredBase = process.env.PUBLIC_URL;
    if (configuredBase && configuredBase.startsWith('http')) return configuredBase.replace(/\/$/, '');
    if (configuredBase) return `${window.location.origin}${configuredBase}`.replace(/\/$/, '');
    return window.location.origin;
}

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${appBaseUrl()}/redefinir-senha`,
        });
        setLoading(false);
        if (resetError) {
            setError(resetError.message || 'Não conseguimos enviar o link agora. Tente novamente.');
            return;
        }
        setSent(true);
        toast.success('Link enviado!');
    };

    return (
        <AppShell>
            <div className="min-h-screen bg-[#FCF7F2] px-5 py-5 sm:px-6 sm:py-8 flex flex-col">
                <div className="relative overflow-hidden rounded-[2rem] bg-[#F5D7C9] px-5 pt-5 pb-7 shadow-warm">
                    <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[#E99578]/35" aria-hidden="true" />
                    <div className="absolute -bottom-16 -left-8 h-32 w-32 rounded-full bg-[#F9E6A9]/60" aria-hidden="true" />
                    <div className="relative flex items-center justify-between">
                        <Link to="/login" aria-label="Voltar para o login" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/75 text-[#4A3A35] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9684C]">
                            <ArrowLeft size={19} />
                        </Link>
                        <div className="flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-2 text-sm font-bold text-[#4A3A35]">
                            <Sparkles size={15} className="text-[#C9684C]" />
                            Crescer+
                        </div>
                    </div>
                    <div className="relative mt-8 flex items-end justify-between gap-4">
                        <div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-[#C9684C] shadow-sm">
                                <KeyRound size={25} />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-[#8D5A4A]">Acesso seguro e simples</p>
                            <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight text-[#3F302C]">Vamos recuperar seu acesso.</h1>
                        </div>
                    </div>
                </div>

                <div className="mx-auto flex w-full max-w-md flex-1 flex-col pt-7">
                    {sent ? (
                        <div className="animate-fade-up rounded-[1.75rem] border border-[#EADFD8] bg-white p-6 shadow-warm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F3EE] text-[#4E8B74]">
                                <CheckCircle2 size={28} />
                            </div>
                            <h2 className="mt-5 font-display text-2xl font-extrabold text-[#3F302C]">Confira seu e-mail</h2>
                            <p className="mt-2 text-sm leading-relaxed text-[#766862]">
                                Enviamos um link para <strong className="text-[#4A3A35]">{email}</strong>. Abra a mensagem e escolha uma nova senha para voltar a acompanhar cada descoberta.
                            </p>
                            <div className="mt-6 space-y-3">
                                <Button type="button" className="h-14 w-full rounded-full bg-[#C9684C] text-base font-bold text-white shadow-warm hover:bg-[#B9573E]" onClick={() => setSent(false)}>
                                    Tentar outro e-mail
                                </Button>
                                <Link to="/login" className="flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold text-[#C9684C] transition hover:bg-[#FFF1EB]">
                                    Voltar para o login <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-base leading-relaxed text-[#766862]">Digite o e-mail da sua conta e enviaremos um link para criar uma nova senha.</p>
                            <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-[1.75rem] border border-[#EADFD8] bg-white p-5 shadow-warm sm:p-6">
                                <div>
                                    <Label htmlFor="recovery-email" className="text-sm font-bold text-[#4A3A35]">E-mail cadastrado</Label>
                                    <div className="relative mt-2">
                                        <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A48E85]" aria-hidden="true" />
                                        <Input id="recovery-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-14 rounded-2xl border-[#EADFD8] bg-[#FFFDFC] pl-11 text-base focus-visible:ring-[#C9684C]" placeholder="voce@exemplo.com" />
                                    </div>
                                </div>
                                {error && <div role="alert" className="rounded-2xl bg-[#FDECE8] px-4 py-3 text-sm leading-relaxed text-[#A54139]">{error}</div>}
                                <Button type="submit" disabled={loading} className="h-14 w-full rounded-full bg-[#C9684C] text-base font-bold text-white shadow-warm hover:bg-[#B9573E]">
                                    {loading ? 'Enviando link…' : <>Enviar link de recuperação <ArrowRight size={18} /></>}
                                </Button>
                            </form>
                        </>
                    )}
                    <div className="mt-auto pt-8 text-center text-sm text-[#766862]">
                        Lembrou da senha?{' '}
                        <Link to="/login" className="font-bold text-[#C9684C] hover:underline">Entrar na conta</Link>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
