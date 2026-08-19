import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
    const nav = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await login(email, password);
        setLoading(false);
        if (res.ok) {
            toast.success('Bem-vindo de volta!');
            const isAdmin = res.user && ['super_admin', 'editor', 'moderador'].includes(res.user.role);
            nav(isAdmin ? '/admin' : '/');
        } else {
            setError(res.error);
        }
    };

    return (
        <AppShell>
            <div className="px-6 pt-8 pb-10 min-h-screen flex flex-col">
                <button
                    data-testid="login-back-btn"
                    onClick={() => nav(-1)}
                    className="w-11 h-11 rounded-full bg-white shadow-warm flex items-center justify-center text-ink"
                    aria-label="Voltar"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="mt-8">
                    <h1 className="font-display text-3xl font-bold text-ink">Bem-vindo de volta</h1>
                    <p className="mt-2 text-ink-2">Que bom te ver aqui novamente.</p>
                </div>

                <form onSubmit={onSubmit} className="mt-8 space-y-5">
                    <div>
                        <Label htmlFor="email" className="text-ink font-medium">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            data-testid="login-email-input"
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
                            data-testid="login-password-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-2 h-14 rounded-2xl bg-white border-[#EADFD8] text-base"
                            placeholder="Sua senha"
                        />
                    </div>

                    {error && (
                        <div data-testid="login-error" className="text-sm text-destructive bg-[#FDECE8] rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        data-testid="login-submit-btn"
                        className="w-full h-14 rounded-full bg-coral hover:bg-[#D9684C] text-white text-base font-bold shadow-warm"
                    >
                        {loading ? 'Entrando…' : 'Entrar'}
                    </Button>
                </form>

                <div className="mt-auto pt-8 text-center text-ink-2">
                    Ainda não tem conta?{' '}
                    <Link data-testid="login-goto-register" to="/cadastro" className="text-coral font-semibold">
                        Criar agora
                    </Link>
                </div>
            </div>
        </AppShell>
    );
}
