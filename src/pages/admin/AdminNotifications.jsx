import { useEffect, useState } from 'react';
import { Archive, Bell, CalendarClock, CheckCircle2, Edit3, Megaphone, Plus, RefreshCw, Send, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import api, { formatApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const STATUS_LABEL = { draft: 'Rascunho', scheduled: 'Agendada', published: 'Publicada', archived: 'Arquivada' };
const STATUS_STYLE = { draft: 'bg-[#FFF5D9] text-[#8B6A18]', scheduled: 'bg-[#EAF1FB] text-[#426A9A]', published: 'bg-[#E9F6EE] text-[#2B7A48]', archived: 'bg-[#F3EEEA] text-ink-2' };
const ROLE_LABEL = { user: 'Cuidadores', editor: 'Editores', moderador: 'Moderadores', super_admin: 'Super Admins' };
const EMPTY_FORM = { title: '', body: '', kind: 'announcement', priority: 'normal', action_url: '', expires_at: '', audience_type: 'all', audience_value: '', scheduled_for: '' };

function audienceLabel(item, users, stages) {
    if (item.audience_type === 'all') return 'Todos os usuários';
    if (item.audience_type === 'role') return ROLE_LABEL[item.audience_value] || item.audience_value;
    if (item.audience_type === 'user') return users.find((user) => user.id === item.audience_value)?.email || 'Usuário específico';
    if (item.audience_type === 'age_stage') return stages.find((stage) => stage.id === item.audience_value)?.titulo || 'Fase específica';
    return item.audience_value || 'Público';
}

export default function AdminNotifications() {
    const [items, setItems] = useState([]);
    const [users, setUsers] = useState([]);
    const [stages, setStages] = useState([]);
    const [status, setStatus] = useState('');
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [campaigns, userResponse, stageResponse] = await Promise.all([api.get('/admin/notification-campaigns', { params: status ? { status } : {} }), api.get('/admin/users'), api.get('/age-stages')]);
            setItems(campaigns.data || []);
            setUsers(userResponse.data || []);
            setStages(stageResponse.data || []);
        } catch (e) {
            setError(formatApiError(e.response?.data?.detail || e.message));
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [status]); // eslint-disable-line

    const openCreate = () => { setEditing('new'); setForm({ ...EMPTY_FORM }); };
    const openEdit = (item) => { setEditing(item.id); setForm({ title: item.title || '', body: item.body || '', kind: item.kind || 'announcement', priority: item.priority || 'normal', action_url: item.action_url || '', expires_at: item.expires_at ? item.expires_at.slice(0, 10) : '', audience_type: item.audience_type || 'all', audience_value: item.audience_value || '', scheduled_for: item.scheduled_for ? item.scheduled_for.slice(0, 16) : '' }); };
    const cancel = () => { setEditing(null); setForm(EMPTY_FORM); };
    const update = (key, value) => setForm((current) => ({ ...current, [key]: value, ...(key === 'audience_type' ? { audience_value: '' } : {}) }));

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        const payload = { ...form, expires_at: form.expires_at ? `${form.expires_at}T23:59:59.999Z` : null, scheduled_for: form.scheduled_for ? new Date(form.scheduled_for).toISOString() : null, action_url: form.action_url || null, audience_value: form.audience_type === 'all' ? null : form.audience_value || null };
        try {
            if (editing === 'new') await api.post('/admin/notification-campaigns', payload);
            else await api.put(`/admin/notification-campaigns/${editing}`, payload);
            toast.success(editing === 'new' ? 'Campanha criada como rascunho.' : 'Campanha atualizada.');
            cancel();
            await load();
        } catch (e) { toast.error(formatApiError(e.response?.data?.detail || e.message)); } finally { setSaving(false); }
    };

    const publish = async (item) => {
        if (!window.confirm(`Publicar “${item.title}” para ${audienceLabel(item, users, stages)}?`)) return;
        try { const { data } = await api.post(`/admin/notification-campaigns/${item.id}/publish`); toast.success(`Notificação publicada para ${data.recipient_count || 0} usuário(s).`); await load(); } catch (e) { toast.error(formatApiError(e.response?.data?.detail || e.message)); }
    };

    const archive = async (item) => {
        try { await api.put(`/admin/notification-campaigns/${item.id}`, { title: item.title, body: item.body, kind: item.kind, priority: item.priority, action_url: item.action_url, expires_at: item.expires_at, audience_type: item.audience_type, audience_value: item.audience_value, status: 'archived', scheduled_for: item.scheduled_for }); toast.success('Campanha arquivada.'); await load(); } catch (e) { toast.error(formatApiError(e.response?.data?.detail || e.message)); }
    };

    const remove = async (item) => {
        if (!window.confirm('Excluir este rascunho?')) return;
        try { await api.delete(`/admin/notification-campaigns/${item.id}`); toast.success('Rascunho excluído.'); await load(); } catch (e) { toast.error(formatApiError(e.response?.data?.detail || e.message)); }
    };

    const audienceInput = form.audience_type === 'role' ? <Select value={form.audience_value} onValueChange={(value) => update('audience_value', value)}><SelectTrigger className="mt-1 h-11 rounded-xl border-[#EADFD8] bg-white"><SelectValue placeholder="Escolha o papel" /></SelectTrigger><SelectContent><SelectItem value="user">Cuidadores</SelectItem><SelectItem value="editor">Editores</SelectItem><SelectItem value="moderador">Moderadores</SelectItem><SelectItem value="super_admin">Super Admins</SelectItem></SelectContent></Select> : form.audience_type === 'user' ? <Select value={form.audience_value} onValueChange={(value) => update('audience_value', value)}><SelectTrigger className="mt-1 h-11 rounded-xl border-[#EADFD8] bg-white"><SelectValue placeholder="Escolha o usuário" /></SelectTrigger><SelectContent>{users.map((user) => <SelectItem key={user.id} value={user.id}>{user.email}</SelectItem>)}</SelectContent></Select> : form.audience_type === 'age_stage' ? <Select value={form.audience_value} onValueChange={(value) => update('audience_value', value)}><SelectTrigger className="mt-1 h-11 rounded-xl border-[#EADFD8] bg-white"><SelectValue placeholder="Escolha a fase" /></SelectTrigger><SelectContent>{stages.map((stage) => <SelectItem key={stage.id} value={stage.id}>{stage.titulo}</SelectItem>)}</SelectContent></Select> : <div className="mt-1 h-11 rounded-xl border border-[#EADFD8] bg-[#FCFAF8] px-3 flex items-center text-sm text-ink-2">Todos os usuários ativos</div>;

    return <div className="space-y-6"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] font-bold text-coral">Comunicação</p><h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">Notificações</h1><p className="text-ink-2 mt-1">Crie avisos segmentados e publique dentro do app.</p></div><Button onClick={openCreate} className="rounded-full bg-coral hover:bg-[#D9684C]"><Plus size={16} className="mr-2" /> Nova campanha</Button></div>

        {editing && <form onSubmit={save} className="rounded-3xl border border-coral/30 bg-white p-5 sm:p-6 shadow-warm"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FDECE8] text-coral"><Megaphone size={20} /></div><div><h2 className="font-display text-xl font-bold text-ink">{editing === 'new' ? 'Nova campanha' : 'Editar campanha'}</h2><p className="text-sm text-ink-2">Campanhas começam como rascunho e só chegam aos usuários após publicação.</p></div></div><button type="button" onClick={cancel} aria-label="Fechar editor" className="rounded-full p-2 text-ink-2 hover:bg-[#FDF6F0]"><X size={18} /></button></div><div className="mt-5 grid sm:grid-cols-2 gap-4"><div className="sm:col-span-2"><Label htmlFor="campaign-title">Título</Label><Input id="campaign-title" value={form.title} onChange={(e) => update('title', e.target.value)} className="mt-1 h-11 rounded-xl border-[#EADFD8]" placeholder="Ex: Novas atividades para esta semana" required /></div><div className="sm:col-span-2"><Label htmlFor="campaign-body">Mensagem</Label><Textarea id="campaign-body" value={form.body} onChange={(e) => update('body', e.target.value)} rows={5} className="mt-1 rounded-2xl border-[#EADFD8]" placeholder="Escreva uma mensagem acolhedora e objetiva…" required /></div><div><Label>Tipo</Label><Select value={form.kind} onValueChange={(value) => update('kind', value)}><SelectTrigger className="mt-1 h-11 rounded-xl border-[#EADFD8] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="announcement">Aviso</SelectItem><SelectItem value="tip">Dica</SelectItem><SelectItem value="system">Sistema</SelectItem><SelectItem value="support">Suporte</SelectItem><SelectItem value="reminder">Lembrete</SelectItem></SelectContent></Select></div><div><Label>Prioridade</Label><Select value={form.priority} onValueChange={(value) => update('priority', value)}><SelectTrigger className="mt-1 h-11 rounded-xl border-[#EADFD8] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent></Select></div><div><Label>Público</Label><Select value={form.audience_type} onValueChange={(value) => update('audience_type', value)}><SelectTrigger className="mt-1 h-11 rounded-xl border-[#EADFD8] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="role">Por papel</SelectItem><SelectItem value="user">Usuário específico</SelectItem><SelectItem value="age_stage">Por fase da criança</SelectItem></SelectContent></Select></div><div><Label>Segmento</Label>{audienceInput}</div><div><Label htmlFor="campaign-schedule">Agendar para</Label><Input id="campaign-schedule" type="datetime-local" value={form.scheduled_for} onChange={(e) => update('scheduled_for', e.target.value)} className="mt-1 h-11 rounded-xl border-[#EADFD8]" /></div><div><Label htmlFor="campaign-expires">Expira em</Label><Input id="campaign-expires" type="date" value={form.expires_at} onChange={(e) => update('expires_at', e.target.value)} className="mt-1 h-11 rounded-xl border-[#EADFD8]" /></div><div className="sm:col-span-2"><Label htmlFor="campaign-action">Link opcional</Label><Input id="campaign-action" value={form.action_url} onChange={(e) => update('action_url', e.target.value)} className="mt-1 h-11 rounded-xl border-[#EADFD8]" placeholder="/atividades ou https://…" /></div></div><div className="mt-5 flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={cancel} className="rounded-full border-[#EADFD8] bg-white">Cancelar</Button><Button type="submit" disabled={saving} className="rounded-full bg-ink">{saving ? 'Salvando…' : 'Salvar rascunho'}</Button></div></form>}

        <section className="rounded-3xl border border-[#EADFD8] bg-white p-5 shadow-warm"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h2 className="font-display text-xl font-bold text-ink">Campanhas</h2><p className="text-sm text-ink-2 mt-1">O público é calculado no momento da publicação.</p></div><Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}><SelectTrigger className="h-10 w-full sm:w-44 rounded-full border-[#EADFD8] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="draft">Rascunhos</SelectItem><SelectItem value="scheduled">Agendadas</SelectItem><SelectItem value="published">Publicadas</SelectItem><SelectItem value="archived">Arquivadas</SelectItem></SelectContent></Select></div>{loading ? <div className="mt-5 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 rounded-3xl bg-[#FCFAF8] animate-pulse" />)}</div> : error ? <div className="mt-5 rounded-2xl bg-[#FCFAF8] p-6 text-center"><p className="font-semibold text-ink">Não foi possível carregar campanhas</p><p className="mt-1 text-sm text-ink-2">{error}</p><Button onClick={load} className="mt-4 rounded-full bg-ink"><RefreshCw size={15} className="mr-2" /> Tentar novamente</Button></div> : items.length === 0 ? <div className="mt-5 rounded-2xl bg-[#FCFAF8] p-8 text-center"><Bell size={30} className="mx-auto text-ink-2" /><p className="mt-2 font-semibold text-ink">Nenhuma campanha encontrada</p><p className="mt-1 text-sm text-ink-2">Crie um rascunho para começar.</p></div> : <div className="mt-5 space-y-3">{items.map((item) => <div key={item.id} className="rounded-3xl border border-[#F0E7E1] bg-[#FCFAF8] p-4"><div className="flex flex-col lg:flex-row lg:items-start gap-3"><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[item.status] || STATUS_STYLE.draft}`}>{STATUS_LABEL[item.status] || item.status}</span><span className="text-xs text-ink-2 inline-flex items-center gap-1"><Users size={13} /> {audienceLabel(item, users, stages)}</span></div><p className="mt-2 font-display text-lg font-bold text-ink">{item.title}</p><p className="mt-1 line-clamp-2 text-sm text-ink-2">{item.body}</p><p className="mt-2 text-xs text-ink-2">{item.recipient_count || 0} destinatário(s) · criado em {new Date(item.created_at).toLocaleString('pt-BR')}</p></div><div className="flex flex-wrap gap-2">{['draft', 'scheduled'].includes(item.status) && <><Button variant="outline" onClick={() => openEdit(item)} className="h-9 rounded-full border-[#EADFD8] bg-white"><Edit3 size={14} className="mr-1.5" /> Editar</Button><Button onClick={() => publish(item)} className="h-9 rounded-full bg-coral"><Send size={14} className="mr-1.5" /> Publicar</Button></>}{item.status === 'published' && <span className="inline-flex h-9 items-center rounded-full bg-[#E9F6EE] px-3 text-xs font-bold text-[#2B7A48]"><CheckCircle2 size={14} className="mr-1.5" /> Entregue no app</span>}{item.status !== 'archived' && <Button variant="outline" onClick={() => archive(item)} className="h-9 rounded-full border-[#EADFD8] bg-white"><Archive size={14} /></Button>}{['draft', 'archived'].includes(item.status) && <Button variant="outline" onClick={() => remove(item)} className="h-9 rounded-full border-destructive/30 bg-white text-destructive"><Trash2 size={14} /></Button>}</div></div></div>)}</div>}</section>
    </div>;
}
