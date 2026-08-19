import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { formatApiError } from '../lib/api';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Baby } from 'lucide-react';
import { toast } from 'sonner';

export default function ChildRegistration() {
    const nav = useNavigate();
    const { refreshChild } = useAuth();
    const [nome, setNome] = useState('');
    const [dob, setDob] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/children', { nome, dob });
            await refreshChild();
            toast.success(`Que alegria conhecer ${nome}!`);
            nav('/');
        } catch (err) {
            setError(formatApiError(err.response?.data?.detail));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppShell>
            <div className="px-6 pt-10 pb-10 min-h-screen flex flex-col">
                <div className="mx-auto w-24 h-24 rounded-3xl bg-[#FDECE8] flex items-center justify-center shadow-warm">
                    <Baby size={44} className="text-coral" strokeWidth={1.8} />
                </div>

                <h1 className="mt-6 font-display text-3xl font-bold text-ink text-center">
                    Conte sobre sua criança
                </h1>
                <p className="mt-2 text-ink-2 text-center">
                    Vamos personalizar as sugestões pela idade dela.
                </p>

                <form onSubmit={onSubmit} className="mt-8 space-y-5">
                    <div>
                        <Label htmlFor="nome" className="text-ink font-medium">Nome</Label>
                        <Input
                            id="nome"
                            required
                            data-testid="child-name-input"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="mt-2 h-14 rounded-2xl bg-white border-[#EADFD8] text-base"
                            placeholder="Ex: Alice"
                        />
                    </div>
                    <div>
                        <Label htmlFor="dob" className="text-ink font-medium">Data de nascimento</Label>
                        <Input
                            id="dob"
                            type="date"
                            required
                            max={new Date().toISOString().slice(0, 10)}
                            data-testid="child-dob-input"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="mt-2 h-14 rounded-2xl bg-white border-[#EADFD8] text-base"
                        />
                    </div>

                    {error && (
                        <div data-testid="child-error" className="text-sm text-destructive bg-[#FDECE8] rounded-xl px-4 py-3">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            data-testid="child-submit-btn"
                            className="w-full h-14 rounded-full bg-coral hover:bg-[#D9684C] text-white text-base font-bold shadow-warm"
                        >
                            {loading ? 'Salvando…' : 'Continuar'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            data-testid="child-cancel-btn"
                            className="w-full h-12 rounded-full text-ink-2 hover:text-ink font-medium"
                            onClick={() => nav('/')}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>
        </AppShell>
    );
}
