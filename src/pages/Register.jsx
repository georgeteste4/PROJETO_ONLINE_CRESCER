import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
    const nav = useNavigate();
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accept, setAccept] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!accept) {
            setError('É preciso aceitar os termos para continuar.');
            return;
        }
        setLoading(true);
        const res = await register({ name, email, password, accept_terms: true });
        setLoading(false);
        if (res.ok) {
            toast.success('Conta criada com carinho!');
            nav('/cadastro-crianca');
        } else {
            setError(res.error);
        }
    };

    return (
        <AppShell>
            <div className="px-6 pt-8 pb-10 min-h-screen flex flex-col">
                <button
                    data-testid="register-back-btn"
                    onClick={() => nav(-1)}
                    className="w-11 h-11 rounded-full bg-white shadow-warm flex items-center justify-center text-ink"
                    aria-label="Voltar"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="mt-8">
                    <h1 className="font-display text-3xl font-bold text-ink">Vamos criar sua conta</h1>
                    <p className="mt-2 text-ink-2">Alguns dados rápidos para começar.</p>
                </div>

                <form onSubmit={onSubmit} className="mt-8 space-y-4">
                    <div>
                        <Label htmlFor="name" className="text-ink font-medium">Seu nome</Label>
                        <Input
                            id="name"
                            required
                            data-testid="register-name-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-2 h-14 rounded-2xl bg-white border-[#EADFD8] text-base"
                            placeholder="Como podemos te chamar?"
                        />
                    </div>
                    <div>
                        <Label htmlFor="email" className="text-ink font-medium">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            data-testid="register-email-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-2 h-14 rounded-2xl bg-white border-[#EADFD8] text-base"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <Label htmlFor="password" className="text-ink font-medium">Senha</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            minLength={6}
                            data-testid="register-password-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-2 h-14 rounded-2xl bg-white border-[#EADFD8] text-base"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <label className="flex items-start gap-3 pt-2 cursor-pointer">
                        <Checkbox
                            data-testid="register-accept-terms"
                            checked={accept}
                            onCheckedChange={(v) => setAccept(!!v)}
                            className="mt-0.5"
                        />
                        <span className="text-sm text-ink-2 leading-relaxed">
                            Concordo com os termos de uso e a política de privacidade, conforme LGPD.
                        </span>
                    </label>

                    {error && (
                        <div data-testid="register-error" className="text-sm text-destructive bg-[#FDECE8] rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        data-testid="register-submit-btn"
                        className="w-full h-14 rounded-full bg-coral hover:bg-[#D9684C] text-white text-base font-bold shadow-warm mt-2"
                    >
                        {loading ? 'Criando…' : 'Criar conta'}
                    </Button>
                </form>

                <div className="mt-auto pt-8 text-center text-ink-2">
                    Já tem uma conta?{' '}
                    <Link data-testid="register-goto-login" to="/login" className="text-coral font-semibold">
                        Entrar
                    </Link>
                </div>
            </div>
        </AppShell>
    );
}
