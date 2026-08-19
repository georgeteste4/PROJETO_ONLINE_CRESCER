import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import AppShell from '../components/AppShell';
import BottomNav from '../components/BottomNav';
import { AlertCircle, Clock, ChevronRight, Heart, RefreshCw, Search } from 'lucide-react';
import { Input } from '../components/ui/input';

export default function Library() {
    const nav = useNavigate();
    const [categories, setCategories] = useState([]);
    const [activities, setActivities] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [selected, setSelected] = useState('all');
    const [query, setQuery] = useState('');
    const [favoriteOnly, setFavoriteOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [categoryResponse, activityResponse, favoriteResponse] = await Promise.all([
                api.get('/categories'),
                api.get('/activities'),
                api.get('/favorites'),
            ]);
            setCategories(categoryResponse.data || []);
            setActivities(activityResponse.data || []);
            setFavoriteIds(new Set((favoriteResponse.data || []).map((item) => item.activity_id)));
        } catch (e) {
            setError(e.response?.data?.detail || 'Não foi possível carregar a biblioteca.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase('pt-BR');
        return activities.filter((activity) => {
            const categoryMatch = selected === 'all' || activity.category_id === selected;
            const favoriteMatch = !favoriteOnly || favoriteIds.has(activity.id);
            const textMatch = !normalized || `${activity.titulo} ${activity.objetivo}`.toLocaleLowerCase('pt-BR').includes(normalized);
            return categoryMatch && favoriteMatch && textMatch;
        });
    }, [activities, selected, query, favoriteOnly, favoriteIds]);

    const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

    return (
        <AppShell>
            <div className="px-6 pt-10 safe-bottom">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] font-bold text-coral">Biblioteca</p><h1 className="font-display text-2xl font-bold text-ink mt-1">Atividades</h1><p className="text-ink-2 text-sm mt-1">Explore ideias por categoria ou encontre uma atividade específica.</p></div><button type="button" aria-label="Ver favoritas" aria-pressed={favoriteOnly} onClick={() => setFavoriteOnly((value) => !value)} className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition ${favoriteOnly ? 'bg-coral text-white' : 'bg-white text-coral border border-[#EADFD8]'}`}><Heart size={19} fill={favoriteOnly ? 'currentColor' : 'none'} /></button></div>

                <div className="relative mt-6"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-2" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por título ou objetivo" aria-label="Buscar atividades" className="h-12 pl-11 pr-4 rounded-2xl bg-white border-[#EADFD8] shadow-sm" /></div>

                <div className="mt-4 -mx-6 px-6 overflow-x-auto no-scrollbar"><div className="flex gap-2 pb-2 w-max"><Chip active={selected === 'all'} onClick={() => setSelected('all')} testId="chip-all">Todas</Chip>{categories.map((c) => <Chip key={c.id} active={selected === c.id} onClick={() => setSelected(c.id)} color={c.cor} testId={`chip-${c.slug}`}>{c.nome}</Chip>)}<Chip active={favoriteOnly} onClick={() => setFavoriteOnly((value) => !value)} testId="chip-favorites" color="#E87A5D"><Heart size={14} fill={favoriteOnly ? 'currentColor' : 'none'} /> Favoritas</Chip></div></div>

                {loading ? <div className="mt-6 space-y-3" aria-busy="true"><div className="h-24 rounded-3xl bg-white/70 animate-pulse" /><div className="h-24 rounded-3xl bg-white/70 animate-pulse" /><div className="h-24 rounded-3xl bg-white/70 animate-pulse" /></div> : error ? <div className="mt-8 p-7 rounded-3xl bg-white border border-[#EADFD8] text-center"><AlertCircle size={28} className="mx-auto text-coral" /><p className="mt-3 font-display font-bold text-ink">A biblioteca não abriu</p><p className="text-sm text-ink-2 mt-1">{error}</p><button type="button" onClick={load} className="mt-4 inline-flex items-center gap-2 h-11 px-4 rounded-full bg-ink text-white text-sm font-bold"><RefreshCw size={15} /> Tentar novamente</button></div> : filtered.length === 0 ? <div data-testid="library-empty" className="mt-8 p-8 rounded-3xl bg-[#FCF6EA] text-center"><Search size={32} className="mx-auto text-ink-2" /><p className="mt-3 font-display font-bold text-ink">Nenhuma atividade encontrada</p><p className="text-sm text-ink-2 mt-1">Tente outro termo, categoria ou retire o filtro de favoritas.</p></div> : <div className="mt-6 space-y-3">{filtered.map((a, i) => <button key={a.id} data-testid={`activity-card-${i}`} onClick={() => nav(`/atividade/${a.id}`)} className="w-full text-left p-4 rounded-3xl bg-white shadow-warm border border-[#EADFD8] flex items-center gap-4 hover:scale-[0.99] transition-transform"><div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${catMap[a.category_id]?.cor || '#F2CC8F'}33` }}><span className="font-display font-bold text-xl" style={{ color: catMap[a.category_id]?.cor || '#F2CC8F' }}>{catMap[a.category_id]?.nome?.charAt(0) || 'A'}</span></div><div className="flex-1 min-w-0"><p className="font-display font-bold text-ink truncate">{a.titulo}</p><p className="text-xs text-ink-2 mt-0.5 line-clamp-1">{a.objetivo}</p><div className="flex items-center gap-2 mt-1.5 text-xs text-ink-2"><Clock size={12} /><span>{a.duracao_min} min</span><span>•</span><span style={{ color: catMap[a.category_id]?.cor }} className="font-semibold">{catMap[a.category_id]?.nome}</span></div></div>{favoriteIds.has(a.id) && <Heart size={16} className="text-coral flex-shrink-0" fill="currentColor" />}<ChevronRight size={20} className="text-ink-2 flex-shrink-0" /></button>)}</div>}
            </div>
            <BottomNav />
        </AppShell>
    );
}

function Chip({ active, onClick, color, children, testId }) {
    return <button type="button" data-testid={testId} onClick={onClick} className={`px-4 min-h-[44px] rounded-full text-sm font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${active ? 'bg-coral text-white border-coral shadow-warm' : 'bg-white text-ink border-[#EADFD8]'}`} style={active && color ? { background: color, borderColor: color, color: '#3D3430' } : undefined}>{children}</button>;
}
