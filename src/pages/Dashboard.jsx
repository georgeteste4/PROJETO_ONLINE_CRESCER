import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import AppShell from '../components/AppShell';
import BottomNav from '../components/BottomNav';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { Clock, ChevronRight, Baby, ChevronDown, Plus, Info, Sparkles, Shield, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import { DashboardSkeleton, ListSkeleton } from '../components/LoadingSkeletons';

function greet() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

function formatAge(days) {
    if (days < 30) return `${days} dia${days === 1 ? '' : 's'}`;
    if (days < 365) return `${Math.floor(days / 30)} mês${Math.floor(days / 30) === 1 ? '' : 'es'}`;
    const y = Math.floor(days / 365);
    return `${y} ano${y === 1 ? '' : 's'}`;
}

const CAT_COLORS = { cat_sensorial: '#F2CC8F', cat_motor: '#E87A5D', cat_cognitivo: '#84A59D', cat_linguagem: '#A89BCC', cat_social: '#F2949C' };
const CAT_NAMES = { cat_sensorial: 'Sensorial', cat_motor: 'Motor', cat_cognitivo: 'Cognitivo', cat_linguagem: 'Linguagem', cat_social: 'Social' };

export default function Dashboard() {
    const nav = useNavigate();
    const { user, activeChild, children, switchChild, isAdmin } = useAuth();
    const [suggestions, setSuggestions] = useState([]);
    const [stage, setStage] = useState(null);
    const [tab, setTab] = useState('geral'); // geral | desenvolvimento | dicas | cuidados
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [loadingStage, setLoadingStage] = useState(true);
    const [suggestionsError, setSuggestionsError] = useState('');
    const [stageError, setStageError] = useState('');

    const loadSuggestions = async () => {
        setLoadingSuggestions(true);
        setSuggestionsError('');
        try {
            const { data } = await api.get('/activities/suggestions');
            setSuggestions(data || []);
        } catch (error) {
            setSuggestionsError(error.response?.data?.detail || 'Não foi possível carregar as sugestões.');
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const loadStage = async () => {
        setLoadingStage(true);
        if (!activeChild?.age_stage_id) { setStage(null); setStageError(''); setLoadingStage(false); return; }
        setStageError('');
        try {
            const { data } = await api.get(`/age-stages/${activeChild.age_stage_id}`);
            setStage(data);
        } catch (error) {
            setStage(null);
            setStageError(error.response?.data?.detail || 'Não foi possível carregar os detalhes desta fase.');
        } finally {
            setLoadingStage(false);
        }
    };

    useEffect(() => { loadSuggestions(); }, [activeChild?.id]); // eslint-disable-line
    useEffect(() => { loadStage(); }, [activeChild?.age_stage_id]); // eslint-disable-line

    if (loadingSuggestions || loadingStage) return <AppShell><div className="px-6 pt-10 safe-bottom"><DashboardSkeleton /></div><BottomNav /></AppShell>;

    return (
        <AppShell>
            <div className="px-6 pt-10 safe-bottom">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-ink-2 text-sm">{greet()},</p>
                        <h1 className="font-display text-2xl font-bold text-ink">{user?.name || 'família'} 👋</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        {isAdmin ? (
                            <button
                                data-testid="dashboard-admin-btn"
                                onClick={() => nav('/admin')}
                                className="h-11 px-3 rounded-full bg-ink text-white flex items-center gap-2 shadow-warm text-sm font-semibold"
                            >
                                <ShieldCheck size={16} />
                                Admin
                            </button>
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-[#FDECE8] flex items-center justify-center">
                                <Baby size={22} className="text-coral" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Child selector */}
                {activeChild ? (
                    <div className="mt-6 p-5 rounded-3xl bg-white shadow-warm border border-[#EADFD8]">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    data-testid="child-selector"
                                    className="w-full flex items-center justify-between gap-3 text-left group focus:outline-none"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-14 h-14 rounded-2xl bg-[#FCF6EA] flex items-center justify-center flex-shrink-0">
                                            <span className="font-display text-2xl font-bold text-coral">
                                                {activeChild.nome.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-display font-bold text-ink text-lg flex items-center gap-2">
                                                <span className="truncate">{activeChild.nome}</span>
                                            </p>
                                            <p className="text-sm text-ink-2 truncate">
                                                {formatAge(activeChild.age_days)} • {stage?.titulo || '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-full hover:bg-[#FDECE8] transition-colors flex-shrink-0 flex items-center justify-center">
                                        <ChevronDown size={18} className="text-ink-2 transition-transform group-data-[state=open]:rotate-180" />
                                    </div>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2">
                                <div className="px-3 py-1.5 text-xs font-semibold text-ink-2 uppercase tracking-wider">
                                    {children.length > 1 ? 'Alternar criança' : 'Sua criança'}
                                </div>
                                {children.map((c) => (
                                    <DropdownMenuItem
                                        key={c.id}
                                        data-testid={`child-option-${c.id}`}
                                        onClick={() => switchChild(c.id)}
                                        className="rounded-xl cursor-pointer py-2 px-3 focus:bg-[#FDECE8] focus:text-coral"
                                    >
                                        <div className="flex items-center gap-2.5 w-full">
                                            <span className="w-8 h-8 rounded-xl bg-[#FDECE8] text-coral font-bold flex items-center justify-center text-sm flex-shrink-0">
                                                {c.nome.charAt(0).toUpperCase()}
                                            </span>
                                            <span className="font-medium text-ink truncate">{c.nome}</span>
                                            {c.id === activeChild.id && (
                                                <span className="text-xs font-semibold text-coral bg-[#FDECE8] px-2 py-0.5 rounded-full ml-auto flex-shrink-0">
                                                    ativa
                                                </span>
                                            )}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator className="my-1 border-[#EADFD8]" />
                                <DropdownMenuItem
                                    data-testid="add-child-option"
                                    onClick={() => nav('/cadastro-crianca')}
                                    className="rounded-xl cursor-pointer text-coral font-semibold py-2 px-3 focus:bg-[#FDECE8] focus:text-coral"
                                >
                                    <Plus size={18} className="mr-2 text-coral" /> Adicionar mais criança
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {stage && (
                            <p className="mt-4 text-sm text-ink-2 leading-relaxed bg-[#FDF6F0] rounded-2xl p-4">
                                {stage.descricao}
                            </p>
                        )}
                        {stageError && <div className="mt-4 rounded-2xl bg-[#FFF5D9] text-[#7A5B18] p-3 text-sm flex items-center gap-2"><AlertCircle size={16} />{stageError}<button type="button" onClick={loadStage} className="ml-auto font-bold underline">Tentar</button></div>}
                    </div>
                ) : (
                    <div className="mt-6 p-6 rounded-3xl bg-white shadow-warm border border-[#EADFD8] text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FCF6EA] flex items-center justify-center">
                            <Baby size={32} className="text-coral" />
                        </div>
                        <h3 className="mt-3 font-display font-bold text-ink text-lg">Nenhuma criança cadastrada</h3>
                        <p className="text-sm text-ink-2 mt-1">Cadastre sua criança para ver conteúdos e sugestões adequados.</p>
                        <button
                            data-testid="add-first-child-btn"
                            onClick={() => nav('/cadastro-crianca')}
                            className="mt-4 inline-flex items-center justify-center gap-2 w-full h-12 rounded-full bg-coral text-white font-bold text-sm shadow-warm hover:bg-[#D9684C] transition"
                        >
                            <Plus size={18} /> Adicionar criança
                        </button>
                    </div>
                )}

                {/* Fase enriched content tabs */}
                {stage && (stage.dados_gerais || stage.desenvolvimento || stage.dicas || stage.cuidados) && (
                    <div className="mt-6">
                        <h2 className="font-display text-lg font-bold text-ink mb-3">Sobre esta fase</h2>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {[
                                { k: 'geral', label: 'Geral', icon: Info },
                                { k: 'desenvolvimento', label: 'Desenvolvimento', icon: Sparkles },
                                { k: 'dicas', label: 'Dicas', icon: Baby },
                                { k: 'cuidados', label: 'Cuidados', icon: Shield },
                            ].map(({ k, label, icon: Ic }) => (
                                <button
                                    key={k}
                                    data-testid={`stage-tab-${k}`}
                                    onClick={() => setTab(k)}
                                    className={`px-4 h-11 rounded-full text-sm font-semibold whitespace-nowrap border flex items-center gap-2 transition ${
                                        tab === k
                                            ? 'bg-coral text-white border-coral'
                                            : 'bg-white text-ink border-[#EADFD8]'
                                    }`}
                                >
                                    <Ic size={14} />
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div data-testid={`stage-panel-${tab}`} className="mt-3 p-5 rounded-3xl bg-white shadow-warm border border-[#EADFD8] text-ink-2 text-sm leading-relaxed whitespace-pre-line">
                            {tab === 'geral' && (stage.dados_gerais || '—')}
                            {tab === 'desenvolvimento' && (stage.desenvolvimento || '—')}
                            {tab === 'dicas' && (stage.dicas || '—')}
                            {tab === 'cuidados' && (stage.cuidados || '—')}
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <div className="flex items-baseline justify-between">
                        <div><p className="text-xs uppercase tracking-[0.16em] font-bold text-coral">Curadoria do dia</p><h2 className="font-display text-xl font-bold text-ink mt-1">Hoje para vocês</h2></div>
                        <button data-testid="see-all-btn" onClick={() => nav('/atividades')} className="text-sm text-coral font-semibold">Ver todas</button>
                    </div>

                    {loadingSuggestions ? (
                        <div className="mt-4"><ListSkeleton count={3} /></div>
                    ) : suggestionsError ? (
                        <div className="mt-4 p-6 rounded-3xl bg-white border border-[#EADFD8] text-center"><AlertCircle className="mx-auto text-coral" size={24} /><p className="font-display font-bold text-ink mt-2">Não conseguimos carregar as sugestões</p><p className="text-sm text-ink-2 mt-1">{suggestionsError}</p><button type="button" onClick={loadSuggestions} className="mt-4 inline-flex items-center gap-2 h-11 px-4 rounded-full bg-ink text-white text-sm font-bold"><RefreshCw size={15} /> Tentar novamente</button></div>
                    ) : suggestions.length === 0 ? (
                        <div data-testid="empty-suggestions" className="mt-4 p-6 rounded-3xl bg-[#FCF6EA] text-center"><p className="font-display font-bold text-ink">Vamos começar nossa jornada!</p><p className="text-sm text-ink-2 mt-1">Escolha uma atividade para hoje.</p></div>
                    ) : (
                        <>
                            <button type="button" onClick={() => nav(`/atividade/${suggestions[0].id}`)} className="mt-4 w-full text-left rounded-[2rem] overflow-hidden bg-ink shadow-warm relative min-h-[190px] group" data-testid="today-hero-card">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#3B3330] via-[#2A2523] to-[#5D4740]" />
                                <div className="absolute -right-10 -top-12 w-44 h-44 rounded-full bg-coral/30 blur-2xl" />
                                <div className="absolute -bottom-20 -left-8 w-40 h-40 rounded-full bg-[#F2CC8F]/20 blur-2xl" />
                                <div className="relative p-6 flex flex-col justify-between min-h-[190px]"><div className="flex items-center gap-2 text-[#FDE5D6] text-xs font-bold uppercase tracking-[0.16em]"><Sparkles size={14} /> Uma ideia simples para hoje</div><div className="mt-8"><h3 className="font-display text-2xl font-bold text-white leading-tight max-w-[80%]">{suggestions[0].titulo}</h3><div className="flex items-center gap-3 mt-3 text-sm text-[#FBEDE5]"><span className="inline-flex items-center gap-1"><Clock size={14} /> {suggestions[0].duracao_min} min</span><span className="text-[#DCC9C0]">•</span><span>{CAT_NAMES[suggestions[0].category_id] || suggestions[0].category_name || 'Para explorar juntos'}</span><ChevronRight size={18} className="ml-auto" /></div></div></div>
                            </button>
                            <div className="mt-4 space-y-3">
                            {suggestions.slice(1).map((a, i) => (
                                <button
                                    key={a.id}
                                    data-testid={`suggestion-card-${i}`}
                                    onClick={() => nav(`/atividade/${a.id}`)}
                                    className="w-full text-left p-4 rounded-3xl bg-white shadow-warm border border-[#EADFD8] flex items-center gap-4 hover:scale-[0.99] transition-transform"
                                >
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${CAT_COLORS[a.category_id]}33` }}>
                                        <span className="font-display font-bold text-lg" style={{ color: CAT_COLORS[a.category_id] }}>
                                            {CAT_NAMES[a.category_id]?.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-display font-bold text-ink truncate">{a.titulo}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-ink-2">
                                            <Clock size={12} />
                                            <span>{a.duracao_min} min</span>
                                            <span>•</span>
                                            <span style={{ color: CAT_COLORS[a.category_id] }} className="font-semibold">
                                                {CAT_NAMES[a.category_id]}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-ink-2 flex-shrink-0" />
                                </button>
                            ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <BottomNav />
        </AppShell>
    );
}
