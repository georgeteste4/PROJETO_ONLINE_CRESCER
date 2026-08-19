import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard, Users, BookOpen, Layers, Tags, Pin, LogOut, ArrowLeft, ShieldCheck, Upload, Mail, Settings, Wand2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';

const items = [
    { to: '/admin', end: true, label: 'Visão geral', icon: LayoutDashboard, testId: 'admin-nav-overview', roles: ['super_admin', 'editor', 'moderador'] },
    { to: '/admin/usuarios', label: 'Usuários', icon: Users, testId: 'admin-nav-users', roles: ['super_admin', 'moderador'] },
    { to: '/admin/convites', label: 'Convites', icon: Mail, testId: 'admin-nav-invites', roles: ['super_admin'] },
    { to: '/admin/atividades', label: 'Atividades', icon: BookOpen, testId: 'admin-nav-activities', roles: ['super_admin', 'editor'] },
    { to: '/admin/importar', label: 'Importar', icon: Upload, testId: 'admin-nav-import', roles: ['super_admin', 'editor'] },
    { to: '/admin/fases', label: 'Fases', icon: Layers, testId: 'admin-nav-stages', roles: ['super_admin', 'editor'] },
    { to: '/admin/categorias', label: 'Categorias', icon: Tags, testId: 'admin-nav-categories', roles: ['super_admin', 'editor'] },
    { to: '/admin/sugestoes', label: 'Sugestões fixas', icon: Pin, testId: 'admin-nav-pinned', roles: ['super_admin', 'editor'] },
    { to: '/admin/gerar-ia', label: 'Gerar com IA', icon: Wand2, testId: 'admin-nav-ai', roles: ['super_admin', 'editor'] },
    { to: '/admin/configuracoes', label: 'Configurações', icon: Settings, testId: 'admin-nav-settings', roles: ['super_admin'] },
];

const ROLE_LABEL = { super_admin: 'Super Admin', editor: 'Editor', moderador: 'Moderador' };

export default function AdminLayout() {
    const { user, children, logout } = useAuth();
    const nav = useNavigate();
    const allowed = items.filter((i) => i.roles.includes(user?.role));
    const hasChild = children && children.length > 0;

    const doLogout = async () => {
        await logout();
        nav('/login');
    };

    return (
        <div className="min-h-screen bg-[#F5EFE9]">
            {/* Top bar */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#EADFD8]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
                    {hasChild && (
                        <button
                            data-testid="admin-back-app-btn"
                            onClick={() => nav('/')}
                            className="w-11 h-11 rounded-full hover:bg-[#FDF6F0] flex items-center justify-center text-ink"
                            aria-label="Voltar para o app"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <p className="font-display font-bold text-ink leading-tight">Painel Crescer+</p>
                            <p className="text-xs text-ink-2 leading-tight">{ROLE_LABEL[user?.role] || 'Admin'}</p>
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-semibold text-ink">{user?.name}</span>
                            <span className="text-xs text-ink-2">{user?.email}</span>
                        </div>
                        <Button
                            data-testid="admin-logout-btn"
                            variant="ghost"
                            onClick={doLogout}
                            className="rounded-full text-ink hover:bg-[#FDECE8]"
                        >
                            <LogOut size={18} className="sm:mr-2" />
                            <span className="hidden sm:inline">Sair</span>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 flex gap-6">
                {/* Sidebar */}
                <aside className="hidden md:block w-60 flex-shrink-0">
                    <nav className="sticky top-24 space-y-1">
                        {allowed.map(({ to, end, label, icon: Icon, testId }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                data-testid={testId}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 h-12 rounded-2xl text-sm font-semibold transition ${
                                        isActive
                                            ? 'bg-ink text-white shadow-warm'
                                            : 'text-ink hover:bg-white'
                                    }`
                                }
                            >
                                <Icon size={18} />
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                {/* Mobile top nav */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EADFD8] z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                    <div className="flex overflow-x-auto no-scrollbar">
                        {allowed.map(({ to, end, label, icon: Icon, testId }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                data-testid={`m-${testId}`}
                                className={({ isActive }) =>
                                    `flex-1 min-w-[80px] flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold ${
                                        isActive ? 'text-coral' : 'text-ink-2'
                                    }`
                                }
                            >
                                <Icon size={18} />
                                {label}
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* Main */}
                <main className="flex-1 min-w-0 pb-24 md:pb-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
