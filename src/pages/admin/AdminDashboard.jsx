import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { AlertCircle, Users, Baby, BookOpen, CheckCircle2, Heart, Ban, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { AdminDashboardSkeleton } from '../../components/LoadingSkeletons';

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/admin/stats');
            setStats(data);
        } catch (e) {
            setError(e.response?.data?.detail || 'Não foi possível carregar os indicadores.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading) return <AdminDashboardSkeleton />;
    if (error) return <div className="rounded-3xl bg-white p-8 border border-[#EADFD8] shadow-warm text-center"><AlertCircle className="mx-auto text-coral mb-3" size={28} /><h1 className="font-display text-xl font-bold text-ink">Os indicadores não abriram</h1><p className="text-ink-2 mt-2">{error}</p><button type="button" onClick={load} className="mt-5 inline-flex items-center gap-2 h-11 px-4 rounded-full bg-ink text-white text-sm font-bold"><RefreshCw size={15} /> Tentar novamente</button></div>;

    const cards = [
        { label: 'Usuários', value: stats.totals.users, icon: Users, color: '#E87A5D', testId: 'stat-users' },
        { label: 'Crianças', value: stats.totals.children, icon: Baby, color: '#F2949C', testId: 'stat-children' },
        { label: 'Atividades', value: stats.totals.activities, icon: BookOpen, color: '#84A59D', testId: 'stat-activities' },
        { label: 'Conclusões', value: stats.totals.completions, icon: CheckCircle2, color: '#A89BCC', testId: 'stat-completions' },
        { label: 'Favoritos', value: stats.totals.favorites, icon: Heart, color: '#F2CC8F', testId: 'stat-favorites' },
        { label: 'Banidos', value: stats.totals.banned, icon: Ban, color: '#B48A3A', testId: 'stat-banned' },
    ];

    return (
        <div>
            <div className="mb-6"><p className="text-xs uppercase tracking-[0.16em] font-bold text-coral">Monitoramento</p><h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">Visão geral</h1><p className="text-ink-2 mt-1">Acompanhe a saúde do Crescer+ em tempo real.</p></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">{cards.map(({ label, value, icon: Icon, color, testId }) => <div key={label} data-testid={testId} className="p-5 rounded-3xl bg-white shadow-warm border border-[#EADFD8]"><div className="flex items-center justify-between"><div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${color}22`, color }}><Icon size={20} /></div></div><p className="mt-4 font-display text-3xl font-bold text-ink">{value}</p><p className="text-xs text-ink-2 mt-1">{label}</p></div>)}</div>
            <div className="grid md:grid-cols-3 gap-4 mt-6"><ActivityCard label="Cadastros na semana" value={stats.activity.week_signups} icon={TrendingUp} color="#84A59D" testId="stat-week-signups" /><ActivityCard label="Conclusões na semana" value={stats.activity.week_completions} icon={CheckCircle2} color="#E87A5D" testId="stat-week-completions" /><ActivityCard label="Conclusões no mês" value={stats.activity.month_completions} icon={Sparkles} color="#F2CC8F" testId="stat-month-completions" /></div>
            <div className="grid md:grid-cols-2 gap-4 mt-6"><div data-testid="chart-by-category" className="p-6 rounded-3xl bg-white shadow-warm border border-[#EADFD8]"><h2 className="font-display text-lg font-bold text-ink mb-4">Conclusões por categoria</h2><ResponsiveContainer width="100%" height={240}><BarChart data={stats.by_category} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}><XAxis dataKey="nome" tick={{ fontSize: 12, fill: '#6B5E59' }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B5E59' }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #EADFD8', background: '#fff' }} cursor={{ fill: '#FDF6F0' }} /><Bar dataKey="count" radius={[8, 8, 0, 0]}>{stats.by_category.map((c) => <Cell key={c.category_id} fill={c.cor} />)}</Bar></BarChart></ResponsiveContainer></div><div data-testid="top-activities" className="p-6 rounded-3xl bg-white shadow-warm border border-[#EADFD8]"><h2 className="font-display text-lg font-bold text-ink mb-4">Top atividades</h2>{stats.top_activities.length === 0 ? <p className="text-sm text-ink-2">Sem dados ainda.</p> : <ol className="space-y-3">{stats.top_activities.map((a, i) => <li key={a.activity_id} className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-[#FDECE8] text-coral font-display font-bold flex items-center justify-center">{i + 1}</span><span className="flex-1 font-medium text-ink">{a.titulo}</span><span className="text-sm font-semibold text-ink-2">{a.count}</span></li>)}</ol>}</div></div>
        </div>
    );
}

function ActivityCard({ label, value, icon: Icon, color, testId }) { return <div data-testid={testId} className="p-5 rounded-3xl bg-white shadow-warm border border-[#EADFD8] flex items-center gap-4"><div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}22`, color }}><Icon size={22} /></div><div><p className="font-display text-2xl font-bold text-ink">{value}</p><p className="text-xs text-ink-2">{label}</p></div></div>; }
