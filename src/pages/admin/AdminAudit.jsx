import { useEffect, useState } from 'react';
import { Activity, AlertCircle, CalendarDays, Filter, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import api, { formatApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AdminTableSkeleton } from '../../components/LoadingSkeletons';

const ACTIONS = [
    { value: '', label: 'Todas as ações' },
    { value: 'SELECT', label: 'SELECT — leitura' },
    { value: 'INSERT', label: 'INSERT — criação' },
    { value: 'UPDATE', label: 'UPDATE — alteração' },
    { value: 'DELETE', label: 'DELETE — exclusão' },
    { value: 'LOGIN', label: 'LOGIN' },
    { value: 'LOGOUT', label: 'LOGOUT' },
    { value: 'SEND_EMAIL', label: 'SEND_EMAIL — e-mail' },
    { value: 'SYSTEM', label: 'SYSTEM — sistema' },
];

const ACTION_STYLE = {
    SELECT: 'bg-[#EAF1FB] text-[#426A9A]',
    INSERT: 'bg-[#E9F6EE] text-[#2B7A48]',
    UPDATE: 'bg-[#FFF5D9] text-[#8B6A18]',
    DELETE: 'bg-[#FDECE8] text-[#B24C3C]',
    LOGIN: 'bg-[#EEEAFE] text-[#7354A8]',
    LOGOUT: 'bg-[#F3EEEA] text-ink-2',
    SEND_EMAIL: 'bg-[#FFF1EB] text-coral',
    SYSTEM: 'bg-[#F3EEEA] text-ink-2',
};

function formatDetails(details) {
    if (!details || typeof details !== 'object' || !Object.keys(details).length) return '—';
    return JSON.stringify(details, null, 2);
}

export default function AdminAudit() {
    const [items, setItems] = useState([]);
    const [filters, setFilters] = useState({ action: '', resource: '', actor_email: '', from: '', to: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(null);

    const load = async (nextFilters = filters) => {
        setLoading(true);
        setError('');
        try {
            const params = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value));
            const { data } = await api.get('/admin/audit-logs', { params: { ...params, limit: 100 } });
            setItems(data || []);
        } catch (e) {
            const detail = formatApiError(e.response?.data?.detail || e.message);
            setError(detail);
            toast.error(detail);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line

    const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
    const clear = () => {
        const next = { action: '', resource: '', actor_email: '', from: '', to: '' };
        setFilters(next);
        load(next);
    };

    return <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] font-bold text-coral">Segurança e conformidade</p><h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">Auditoria</h1><p className="text-ink-2 mt-1">Consulte ações realizadas no catálogo, usuários, convites, configurações e e-mails.</p></div><Button variant="outline" onClick={() => load()} className="rounded-full border-[#EADFD8] bg-white"><RefreshCw size={16} className="mr-2" /> Atualizar</Button></div>

        <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm p-5 sm:p-6"><div className="flex items-start gap-3 mb-5"><div className="w-11 h-11 rounded-2xl bg-[#EEEAFE] text-[#7354A8] flex items-center justify-center"><Filter size={20} /></div><div><h2 className="font-display text-xl font-bold text-ink">Filtrar registros</h2><p className="text-sm text-ink-2 mt-1">Os filtros são aplicados diretamente no Supabase e retornam no máximo 100 registros por consulta.</p></div></div><div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3"><div><Label>Ação</Label><Select value={filters.action || 'all'} onValueChange={(value) => update('action', value === 'all' ? '' : value)}><SelectTrigger className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl"><SelectItem value="all">Todas as ações</SelectItem>{ACTIONS.filter((item) => item.value).map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div><div><Label>Recurso</Label><Input value={filters.resource} onChange={(e) => update('resource', e.target.value)} className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]" placeholder="users, activities..." /></div><div><Label>E-mail do ator</Label><Input type="email" value={filters.actor_email} onChange={(e) => update('actor_email', e.target.value)} className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]" placeholder="admin@..." /></div><div><Label>De</Label><Input type="date" value={filters.from} onChange={(e) => update('from', e.target.value ? `${e.target.value}T00:00:00.000Z` : '')} className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]" /></div><div><Label>Até</Label><Input type="date" value={filters.to ? filters.to.slice(0, 10) : ''} onChange={(e) => update('to', e.target.value ? `${e.target.value}T23:59:59.999Z` : '')} className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]" /></div></div><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => load()} className="rounded-full bg-coral hover:bg-[#D9684C]"><Search size={16} className="mr-2" /> Aplicar filtros</Button><Button variant="outline" onClick={clear} className="rounded-full border-[#EADFD8] bg-white">Limpar</Button></div></section>

        {loading ? <AdminTableSkeleton rows={5} /> : error ? <div className="rounded-3xl bg-white p-8 border border-[#EADFD8] shadow-warm text-center"><AlertCircle className="mx-auto text-coral mb-3" size={28} /><h2 className="font-display text-xl font-bold text-ink">Não foi possível carregar a auditoria</h2><p className="text-ink-2 mt-2">{error}</p><Button onClick={() => load()} className="mt-5 rounded-full bg-ink"><RefreshCw size={16} className="mr-2" /> Tentar novamente</Button></div> : items.length === 0 ? <div className="rounded-3xl bg-white p-10 border border-[#EADFD8] shadow-warm text-center"><Activity size={34} className="mx-auto text-ink-2" /><h2 className="mt-3 font-display text-xl font-bold text-ink">Nenhum registro encontrado</h2><p className="text-sm text-ink-2 mt-1">Ajuste os filtros ou aguarde novas ações administrativas.</p></div> : <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm overflow-hidden"><div className="px-5 py-4 border-b border-[#F0E7E1] flex items-center justify-between"><p className="text-sm font-bold text-ink">{items.length} registro(s) exibido(s)</p><span className="text-xs text-ink-2 inline-flex items-center gap-1"><ShieldCheck size={14} /> Visível apenas para Super Admin</span></div><div className="divide-y divide-[#F0E7E1]">{items.map((item) => <div key={item.id} className="p-4 sm:p-5"><div className="flex flex-col lg:flex-row lg:items-center gap-3"><span className={`self-start rounded-full px-3 py-1 text-xs font-bold ${ACTION_STYLE[item.action] || ACTION_STYLE.SYSTEM}`}>{item.action}</span><div className="flex-1 min-w-0"><p className="font-semibold text-ink break-words">{item.resource}{item.resource_id ? <span className="font-normal text-ink-2"> · {item.resource_id}</span> : ''}</p><p className="mt-1 text-xs text-ink-2">{item.actor_name || 'Sistema'} · {item.actor_email || 'sistema'} · {new Date(item.created_at).toLocaleString('pt-BR')}</p></div><Button variant="outline" onClick={() => setExpanded(expanded === item.id ? null : item.id)} className="h-9 rounded-full border-[#EADFD8] bg-white">{expanded === item.id ? 'Fechar detalhes' : 'Detalhes'}</Button></div>{expanded === item.id && <pre className="mt-4 max-h-72 overflow-auto rounded-2xl bg-[#211D1B] text-[#FCEFE7] p-4 text-xs leading-relaxed">{formatDetails(item.details)}</pre>}</div>)}</div></section>}
    </div>;
}
