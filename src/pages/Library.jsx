import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import AppShell from '../components/AppShell';
import BottomNav from '../components/BottomNav';
import { Clock, ChevronRight, Search } from 'lucide-react';

export default function Library() {
    const nav = useNavigate();
    const [categories, setCategories] = useState([]);
    const [activities, setActivities] = useState([]);
    const [selected, setSelected] = useState('all');

    useEffect(() => {
        api.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
        api.get('/activities').then((r) => setActivities(r.data)).catch(() => {});
    }, []);

    const filtered = useMemo(() => {
        if (selected === 'all') return activities;
        return activities.filter((a) => a.category_id === selected);
    }, [activities, selected]);

    const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

    return (
        <AppShell>
            <div className="px-6 pt-10 safe-bottom">
                <h1 className="font-display text-2xl font-bold text-ink">Atividades</h1>
                <p className="text-ink-2 text-sm mt-1">Explore ideias por categoria.</p>

                <div className="mt-6 -mx-6 px-6 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 pb-2 w-max">
                        <Chip active={selected === 'all'} onClick={() => setSelected('all')} testId="chip-all">
                            Todos
                        </Chip>
                        {categories.map((c) => (
                            <Chip
                                key={c.id}
                                active={selected === c.id}
                                onClick={() => setSelected(c.id)}
                                color={c.cor}
                                testId={`chip-${c.slug}`}
                            >
                                {c.nome}
                            </Chip>
                        ))}
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div data-testid="library-empty" className="mt-8 p-8 rounded-3xl bg-[#FCF6EA] text-center">
                        <Search size={32} className="mx-auto text-ink-2" />
                        <p className="mt-3 font-display font-bold text-ink">Nenhuma atividade aqui ainda</p>
                        <p className="text-sm text-ink-2 mt-1">Tente outra categoria.</p>
                    </div>
                ) : (
                    <div className="mt-6 space-y-3">
                        {filtered.map((a, i) => (
                            <button
                                key={a.id}
                                data-testid={`activity-card-${i}`}
                                onClick={() => nav(`/atividade/${a.id}`)}
                                className="w-full text-left p-4 rounded-3xl bg-white shadow-warm border border-[#EADFD8] flex items-center gap-4 hover:scale-[0.99] transition-transform"
                            >
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${catMap[a.category_id]?.cor || '#F2CC8F'}33` }}
                                >
                                    <span
                                        className="font-display font-bold text-xl"
                                        style={{ color: catMap[a.category_id]?.cor || '#F2CC8F' }}
                                    >
                                        {catMap[a.category_id]?.nome?.charAt(0) || 'A'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-display font-bold text-ink truncate">{a.titulo}</p>
                                    <p className="text-xs text-ink-2 mt-0.5 line-clamp-1">{a.objetivo}</p>
                                    <div className="flex items-center gap-2 mt-1.5 text-xs text-ink-2">
                                        <Clock size={12} />
                                        <span>{a.duracao_min} min</span>
                                        <span>•</span>
                                        <span
                                            style={{ color: catMap[a.category_id]?.cor }}
                                            className="font-semibold"
                                        >
                                            {catMap[a.category_id]?.nome}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-ink-2 flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <BottomNav />
        </AppShell>
    );
}

function Chip({ active, onClick, color, children, testId }) {
    return (
        <button
            data-testid={testId}
            onClick={onClick}
            className={`px-4 min-h-[44px] rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                active
                    ? 'bg-coral text-white border-coral shadow-warm'
                    : 'bg-white text-ink border-[#EADFD8]'
            }`}
            style={active && color ? { background: color, borderColor: color, color: '#3D3430' } : undefined}
        >
            {children}
        </button>
    );
}
