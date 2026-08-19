import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
    const nav = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [ready, setReady] = useState(false);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        const checkRecoverySession = async () => {
            const { data } = await supabase.auth.getSession();
            if (mounted) setReady(Boolean(data.session));
        };
        checkRecoverySession();
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;
            if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
        });
        return () => {
            mounted = false;
            listener.subscription.unsubscribe();
        };
    }, []);

    const onSubmit = async (event) => {
        event.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('A nova senha precisa ter pelo menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não conferem.');
            return;
        }
        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setLoading(false);
        if (updateError) {
            setError(updateError.message || 'Não conseguimos atualizar sua senha. Solicite um novo link.');
            return;
        }
        setSuccess(true);
        toast.success('Senha atualizada com sucesso!');
        await supabase.auth.signOut();
    };

    const fieldClass = 'mt-2 h-14 rounded-2xl border-[#EADFD8] bg-[#FFFDFC] pr-12 text-base focus-visible:ring-[#C9684C]';

    return (
        <AppShell>
            <div className="min-h-screen bg-[#FCF7F2] px-5 py-5 sm:px-6 sm:py-8 flex flex-col">
                <div className="relative overflow-hidden rounded-[2rem] bg-[#E4E8D5] px-5 pt-5 pb-7 shadow-warm">
                    <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-[#A8B597]/40" aria-hidden="true" />
                    <div className="absolute -bottom-16 -left-8 h-32 w-32 rounded-full bg-[#F9E6A9]/65" aria-hidden="true" />
                    <div className="relative flex items-center justify-between">
                        <Link to="/login" aria-label="Voltar para o login" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/75 text-[#4A3A35] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#4E8B74]">
                            <ArrowLeft size={19} />
                        </Link>
                        <div className="flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-2 text-sm font-bold text-[#4A3A35]">
                            <Sparkles size={15} className="text-[#4E8B74]" /> Crescer+
                        </div>
                    </div>
                    <div className="relative mt-8 flex items-end gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-[#4E8B74] shadow-sm">
                            <KeyRound size={25} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#597363]">Quase lá</p>
                            <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight text-[#3F302C]">Crie uma nova senha.</h1>
                        </div>
                    </div>
                </div>

                <div className="mx-auto flex w-full max-w-md flex-1 flex-col pt-7">
                    {success ? (
                        <div className="animate-fade-up rounded-[1.75rem] border border-[#EADFD8] bg-white p-6 text-center shadow-warm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#E8F3EE] text-[#4E8B74]"><CheckCircle2 size={32} /></div>
                            <h2 className="mt-5 font-display text-2xl font-extrabold text-[#3F302C]">Tudo certo por aqui.</h2>
                            <p className="mt-2 text-sm leading-relaxed text-[#766862]">Sua senha foi atualizada. Agora você já pode entrar novamente e continuar acompanhando cada descoberta.</p>
                            <Button type="button" onClick={() => nav('/login')} className="mt-6 h-14 w-full rounded-full bg-[#C9684C] text-base font-bold text-white shadow-warm hover:bg-[#B9573E]">Entrar no Crescer+ <ArrowRight size={18} /></Button>
                        </div>
                    ) : !ready ? (
                        <div className="rounded-[1.75rem] border border-[#EADFD8] bg-white p-6 shadow-warm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FDECE8] text-[#C9684C]"><LockKeyhole size={27} /></div>
                            <h2 className="mt-5 font-display text-2xl font-extrabold text-[#3F302C]">Link indisponível</h2>
                            <p className="mt-2 text-sm leading-relaxed text-[#766862]">Esse link pode ter expirado ou já ter sido usado. Solicite uma nova recuperação para continuar.</p>
                            <Link to="/recuperar-senha" className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#C9684C] text-base font-bold text-white shadow-warm hover:bg-[#B9573E]">Solicitar novo link <ArrowRight size={18} /></Link>
                        </div>
                    ) : (
                        <>
                            <p className="text-base leading-relaxed text-[#766862]">Escolha uma senha que seja fácil para você lembrar e difícil para outras pessoas adivinharem.</p>
                            <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-[1.75rem] border border-[#EADFD8] bg-white p-5 shadow-warm sm:p-6">
                                <div>
                                    <Label htmlFor="new-password" className="text-sm font-bold text-[#4A3A35]">Nova senha</Label>
                                    <div className="relative mt-2">
                                        <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A48E85]" aria-hidden="true" />
                                        <Input id="new-password" type={showPassword ? 'text' : 'password'} required minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={`pl-11 ${fieldClass}`} placeholder="Pelo menos 6 caracteres" />
                                        <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[#A48E85] hover:bg-[#FFF1EB] hover:text-[#C9684C]"><span className="sr-only">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="confirm-password" className="text-sm font-bold text-[#4A3A35]">Repita a nova senha</Label>
                                    <div className="relative mt-2">
                                        <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A48E85]" aria-hidden="true" />
                                        <Input id="confirm-password" type={showConfirm ? 'text' : 'password'} required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={`pl-11 ${fieldClass}`} placeholder="Digite novamente" />
                                        <button type="button" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[#A48E85] hover:bg-[#FFF1EB] hover:text-[#C9684C]"><span className="sr-only">{showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}</span>{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                    </div>
                                </div>
                                {error && <div role="alert" className="rounded-2xl bg-[#FDECE8] px-4 py-3 text-sm leading-relaxed text-[#A54139]">{error}</div>}
                                <Button type="submit" disabled={loading} className="h-14 w-full rounded-full bg-[#C9684C] text-base font-bold text-white shadow-warm hover:bg-[#B9573E]">{loading ? 'Salvando…' : <>Salvar nova senha <ArrowRight size={18} /></>}</Button>
                            </form>
                        </>
                    )}
                    <div className="mt-auto pt-8 text-center text-sm text-[#766862]">Precisa de ajuda? <Link to="/login" className="font-bold text-[#C9684C] hover:underline">Voltar ao login</Link></div>
                </div>
            </div>
        </AppShell>
    );
}
