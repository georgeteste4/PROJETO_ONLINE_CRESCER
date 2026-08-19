import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Heart, Sparkles } from 'lucide-react';

const HERO = 'https://images.unsplash.com/photo-1739208683618-1b4409f8b7df?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxwYXJlbnQlMjBwbGF5aW5nJTIwd2l0aCUyMHRvZGRsZXIlMjB3YXJtJTIwbGlnaHRpbmd8ZW58MHx8fHwxNzg2NTY4ODIwfDA&ixlib=rb-4.1.0&q=85';

export default function Onboarding() {
    const nav = useNavigate();
    return (
        <AppShell>
            <div className="flex flex-col min-h-screen">
                <div className="relative h-[52vh] overflow-hidden rounded-b-[2rem] grain">
                    <img
                        src={HERO}
                        alt="Mãe carinhosa segurando bebê com luz quente"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-6 left-6 bg-white/85 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 shadow-warm">
                        <Sparkles size={16} className="text-coral" />
                        <span className="font-display font-bold text-ink">Crescer+</span>
                    </div>
                </div>

                <div className="flex-1 px-6 pt-8 flex flex-col">
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight animate-fade-up">
                        O companheiro do desenvolvimento do seu bebê.
                    </h1>
                    <p className="mt-4 text-base text-ink-2 leading-relaxed animate-fade-up" style={{ animationDelay: '80ms' }}>
                        Atividades diárias por faixa etária, marcos e muito afeto reunidos em um só lugar — feito com carinho para pais e cuidadores.
                    </p>

                    <div className="mt-6 flex items-center gap-2 text-ink-2 text-sm">
                        <Heart size={16} className="text-blush" />
                        <span>Conteúdo educativo, com tom acolhedor.</span>
                    </div>

                    <div className="mt-auto pt-8 pb-8 space-y-3">
                        <Button
                            data-testid="onboarding-start-btn"
                            className="w-full h-14 rounded-full bg-coral hover:bg-[#D9684C] text-white text-base font-bold shadow-warm"
                            onClick={() => nav('/cadastro')}
                        >
                            Começar agora
                        </Button>
                        <Button
                            variant="ghost"
                            data-testid="onboarding-login-btn"
                            className="w-full h-12 rounded-full text-ink"
                            onClick={() => nav('/login')}
                        >
                            Já tenho conta
                        </Button>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
