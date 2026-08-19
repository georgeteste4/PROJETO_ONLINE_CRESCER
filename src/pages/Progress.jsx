import { useEffect, useState } from 'react';
import api from '../lib/api';
import AppShell from '../components/AppShell';
import BottomNav from '../components/BottomNav';
import { AlertCircle, RefreshCw, TrendingUp, Sparkles } from 'lucide-react';

export default function Progress() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/progress/summary');
            setSummary(data);
        } catch (e) {
            setError(e.response?.data?.detail || 'Não foi possível carregar o progresso.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    return (
        <AppShell>
            <div className="px-6 pt-10 safe-bottom">
                <p className="text-xs uppercase tracking-[0.16em] font-bold text-coral">Acompanhamento</p>
                <h1 className="font-display text-2xl font-bold text-ink mt-1">Progresso</h1>
                <p className="text-ink-2 text-sm mt-1">O que vocês vivenciaram juntos.</p>

                {loading ? <ProgressSkeleton /> : error ? <div className="mt-8 p-7 rounded-3xl bg-white border border-[#EADFD8] text-center"><AlertCircle size={28} className="mx-auto text-coral" /><p className="mt-3 font-display font-bold text-ink">O progresso ainda não abriu</p><p className="text-sm text-ink-2 mt-1">{error}</p><button type="button" onClick={load} className="mt-4 inline-flex items-center gap-2 h-11 px-4 rounded-full bg-ink text-white text-sm font-bold"><RefreshCw size={15} /> Tentar novamente</button></div> : <><div className="mt-6 grid grid-cols-2 gap-3"><StatCard label="Esta semana" value={summary.week_count} accent="#E87A5D" testId="stat-week" /><StatCard label="Este mês" value={summary.month_count} accent="#84A59D" testId="stat-month" /></div><div className="mt-8"><h2 className="font-display text-lg font-bold text-ink">Por categoria</h2><div className="mt-4 p-5 rounded-3xl bg-white shadow-warm border border-[#EADFD8]">{summary.by_category.every((c) => c.count === 0) ? <div data-testid="progress-empty" className="text-center py-6"><Sparkles size={32} className="mx-auto text-[#F2CC8F]" /><p className="font-display font-bold text-ink mt-3">Vamos começar!</p><p className="text-sm text-ink-2 mt-1">Conclua sua primeira atividade para ver o progresso aqui.</p></div> : <div className="space-y-4">{summary.by_category.map((c) => <div key={c.category_id} data-testid={`progress-bar-${c.slug}`}><div className="flex justify-between text-sm mb-1.5"><span className="font-semibold text-ink">{c.nome}</span><span className="text-ink-2 font-medium">{c.count}</span></div><div className="h-3 rounded-full bg-[#F5EFE9] overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.count / Math.max(1, ...summary.by_category.map((item) => item.count))) * 100}%`, background: c.cor }} /></div></div>)}</div>}</div></div><div className="mt-6 p-5 rounded-3xl bg-[#FDF6F0] flex gap-3"><TrendingUp size={20} className="text-coral flex-shrink-0 mt-0.5" /><p className="text-sm text-ink-2 leading-relaxed">Cada atividade é um momento único de conexão. Sem pressa e sem cobrança — o que importa é o vínculo.</p></div></>}
            </div>
            <BottomNav />
        </AppShell>
    );
}

function ProgressSkeleton() { return <div className="mt-6 space-y-8" aria-busy="true"><div className="grid grid-cols-2 gap-3"><div className="h-32 rounded-3xl bg-white/70 animate-pulse" /><div className="h-32 rounded-3xl bg-white/70 animate-pulse" /></div><div><div className="h-6 w-40 rounded bg-white/70 animate-pulse" /><div className="mt-4 h-64 rounded-3xl bg-white/70 animate-pulse" /></div></div>; }
function StatCard({ label, value, accent, testId }) { return <div data-testid={testId} className="p-5 rounded-3xl bg-white shadow-warm border border-[#EADFD8]"><p className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>{label}</p><p className="mt-2 font-display text-4xl font-bold text-ink">{value}</p><p className="text-xs text-ink-2 mt-1">atividade{value === 1 ? '' : 's'}</p></div>; }
