import { NavLink } from 'react-router-dom';
import { Home, BookOpen, TrendingUp, User } from 'lucide-react';

const tabs = [
    { to: '/', label: 'Início', icon: Home, testId: 'nav-home' },
    { to: '/atividades', label: 'Atividades', icon: BookOpen, testId: 'nav-library' },
    { to: '/progresso', label: 'Progresso', icon: TrendingUp, testId: 'nav-progress' },
    { to: '/perfil', label: 'Perfil', icon: User, testId: 'nav-profile' },
];

export default function BottomNav() {
    return (
        <nav
            data-testid="bottom-nav"
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-[#EADFD8] z-40"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="grid grid-cols-4 h-20">
                {tabs.map(({ to, label, icon: Icon, testId }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        data-testid={testId}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 min-h-[48px] transition-colors ${
                                isActive ? 'text-coral' : 'text-ink-2'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                                <span className="text-xs font-medium">{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
