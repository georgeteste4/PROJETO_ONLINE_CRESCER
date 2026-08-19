import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Heart, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';

export default function Register() {
    const nav = useNavigate();
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [accept, setAccept] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();
        setError('');
        if (!accept) {
            setError('É preciso aceitar os termos para continuar.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não conferem.');
            return;
        }
        setLoading(true);
        const res = await register({ name: name.trim(), email: email.trim(), password, accept_terms: true });
        setLoading(false);
        if (res.ok) {
            toast.success('Conta criada com carinho!');
            nav('/cadastro-crianca');
        } else {
            setError(res.error);
        }
    };

    const fieldClass = 'mt-2 h-14 rounded-2xl border-[#EADFD8] bg-[#FFFDFC] text-base focus-visible:ring-[#C9684C]';

    return (
        <AppShell>
            <div className="min-h-screen bg-[#FCF7F2] px-5 py-5 sm:px-6 sm:py-8 flex flex-col">
                <div className="relative overflow-hidden rounded-[2rem] bg-[#E4E8D5] px-5 pt-5 pb-7 shadow-warm">
                    <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-[#A8B597]/40" aria-hidden="true" />
                    <div className="absolute -bottom-16 -left-8 h-32 w-32 rounded-full bg-[#F9E6A9]/65" aria-hidden="true" />
                    <div className="relative flex items-center justify-between">
                        <button onClick={() => nav(-1)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/75 text-[#4A3A35] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#4E8B74]" aria-label="Voltar" data-testid="register-back-btn">
                            <ArrowLeft size={19} />
                        </button>
                        <div className="flex items-center gap-2 rounded-full bg-white/75 px-3.5 py-2 text-sm font-bold text-[#4A3A35]">
                            <Sparkles size={15} className="text-[#4E8B74]" /> Crescer+
                        </div>
                    </div>
                    <div className="relative mt-8">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#597363]"><Heart size={16} className="fill-[#4E8B74] text-[#4E8B74]" /> Um começo leve, do seu jeito</div>
                        <h1 className="mt-3 max-w-xs font-display text-3xl font-extrabold leading-tight text-[#3F302C]">Vamos criar seu espaço de cuidado.</h1>
                        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#5C6A5D]">Em poucos passos, você poderá acompanhar atividades pensadas para cada fase.</p>
                    </div>
                </div>

                <div className="mx-auto flex w-full max-w-md flex-1 flex-col pt-7">
                    <div className="animate-fade-up">
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#4E8B74]">Primeiro passo</p>
                        <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight text-[#3F302C]">Sua conta começa aqui.</h2>
                    </div>

                    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-[1.75rem] border border-[#EADFD8] bg-white p-5 shadow-warm animate-fade-up sm:p-6" style={{ animationDelay: '70ms' }}>
                        <div>
                            <Label htmlFor="name" className="text-sm font-bold text-[#4A3A35]">Seu nome</Label>
                            <div className="relative mt-2">
                                <UserRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A48E85]" aria-hidden="true" />
                                <Input id="name" required autoComplete="name" data-testid="register-name-input" value={name} onChange={(event) => setName(event.target.value)} className={`pl-11 ${fieldClass}`} placeholder="Como podemos te chamar?" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="email" className="text-sm font-bold text-[#4A3A35]">E-mail</Label>
                            <div className="relative mt-2">
                                <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A48E85]" aria-hidden="true" />
                                <Input id="email" type="email" required autoComplete="email" data-testid="register-email-input" value={email} onChange={(event) => setEmail(event.target.value)} className={`pl-11 ${fieldClass}`} placeholder="voce@exemplo.com" />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="password" className="text-sm font-bold text-[#4A3A35]">Senha</Label>
                            <div className="relative mt-2">
                                <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A48E85]" aria-hidden="true" />
                                <Input id="password" type={showPassword ? 'text' : 'password'} required minLength={6} autoComplete="new-password" data-testid="register-password-input" value={password} onChange={(event) => setPassword(event.target.value)} className={`pl-11 pr-12 ${fieldClass}`} placeholder="Pelo menos 6 caracteres" />
                                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[#A48E85] transition hover:bg-[#F1F5EA] hover:text-[#4E8B74]"><span className="sr-only">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="confirm-password" className="text-sm font-bold text-[#4A3A35]">Repita a senha</Label>
                            <div className="relative mt-2">
                                <LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A48E85]" aria-hidden="true" />
                                <Input id="confirm-password" type={showConfirm ? 'text' : 'password'} required minLength={6} autoComplete="new-password" data-testid="register-password-confirm-input" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={`pl-11 pr-12 ${fieldClass}`} placeholder="Digite novamente" />
                                <button type="button" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[#A48E85] transition hover:bg-[#F1F5EA] hover:text-[#4E8B74]"><span className="sr-only">{showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}</span>{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </div>

                        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#FAF7F0] p-3.5">
                            <Checkbox data-testid="register-accept-terms" checked={accept} onCheckedChange={(value) => setAccept(Boolean(value))} className="mt-0.5" />
                            <span className="text-sm leading-relaxed text-[#766862]">Concordo com os <Link to="/termos" className="font-bold text-[#C9684C] hover:underline">termos de uso</Link> e a <Link to="/privacidade" className="font-bold text-[#C9684C] hover:underline">política de privacidade</Link>, conforme a LGPD.</span>
                        </label>

                        {error && <div role="alert" data-testid="register-error" className="rounded-2xl bg-[#FDECE8] px-4 py-3 text-sm leading-relaxed text-[#A54139]">{error}</div>}
                        <div className="flex items-center gap-2 text-xs text-[#8D7B73]"><Check size={15} className="text-[#4E8B74]" /> Seus dados ficam protegidos por uma sessão segura.</div>
                        <Button type="submit" disabled={loading} data-testid="register-submit-btn" className="h-14 w-full rounded-full bg-[#C9684C] text-base font-bold text-white shadow-warm transition hover:bg-[#B9573E] disabled:cursor-not-allowed disabled:opacity-60">
                            {loading ? 'Criando sua conta…' : <>Criar minha conta <ArrowRight size={18} /></>}
                        </Button>
                    </form>

                    <div className="mt-auto pt-8 text-center text-sm text-[#766862] animate-fade-up" style={{ animationDelay: '140ms' }}>
                        Já tem uma conta?{' '}
                        <Link data-testid="register-goto-login" to="/login" className="font-bold text-[#C9684C] hover:underline">Entrar</Link>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
