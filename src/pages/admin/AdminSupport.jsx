import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, LifeBuoy, MessageCircle, RefreshCw, Send, Shield, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import api, { formatApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { ListSkeleton } from '../../components/LoadingSkeletons';

const STATUS_LABEL = { open: 'Aberto', in_progress: 'Em atendimento', waiting_user: 'Aguardando usuário', resolved: 'Resolvido', closed: 'Encerrado' };
const STATUS_STYLE = { open: 'bg-[#EAF1FB] text-[#426A9A]', in_progress: 'bg-[#FFF5D9] text-[#8B6A18]', waiting_user: 'bg-[#EEEAFE] text-[#7354A8]', resolved: 'bg-[#E9F6EE] text-[#2B7A48]', closed: 'bg-[#F3EEEA] text-ink-2' };
const CATEGORY_LABEL = { general: 'Dúvida geral', account: 'Conta', activities: 'Atividades', privacy: 'Privacidade', bug: 'Problema técnico', suggestion: 'Sugestão' };
const PRIORITY_LABEL = { low: 'Baixa', normal: 'Normal', high: 'Alta', urgent: 'Urgente' };

function dateLabel(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }

export default function AdminSupport() {
    const [items, setItems] = useState([]);
    const [selected, setSelected] = useState(null);
    const [filters, setFilters] = useState({ status: '', priority: '', q: '' });
    const [reply, setReply] = useState('');
    const [internalNote, setInternalNote] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async (nextFilters = filters) => {
        setLoading(true); setError('');
        try { const params = Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value)); const { data } = await api.get('/admin/support-tickets', { params }); setItems(data || []); } catch (e) { setError(formatApiError(e.response?.data?.detail || e.message)); } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []); // eslint-disable-line

    const openTicket = async (id) => {
        setLoadingDetail(true);
        try { const { data } = await api.get(`/admin/support-tickets/${id}`); setSelected(data); } catch (e) { toast.error(formatApiError(e.response?.data?.detail || e.message)); } finally { setLoadingDetail(false); }
    };

    const updateTicket = async (key, value) => {
        if (!selected) return;
        const next = { ...selected, [key]: value };
        setSelected(next);
        try { await api.put(`/admin/support-tickets/${selected.id}`, { status: next.status, priority: next.priority, category: next.category, assigned_to: next.assigned_to }); await load(); toast.success('Chamado atualizado.'); } catch (e) { toast.error(formatApiError(e.response?.data?.detail || e.message)); }
    };

    const sendReply = async (event) => {
        event.preventDefault();
        if (!selected || !reply.trim()) return;
        setSaving(true);
        try { await api.post(`/admin/support-tickets/${selected.id}/messages`, { body: reply, internal_note: internalNote }); setReply(''); setInternalNote(false); await openTicket(selected.id); await load(); toast.success(internalNote ? 'Nota interna adicionada.' : 'Resposta enviada ao usuário.'); } catch (e) { toast.error(formatApiError(e.response?.data?.detail || e.message)); } finally { setSaving(false); }
    };

    return <div className="space-y-6"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] font-bold text-coral">Atendimento</p><h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">Contato e suporte</h1><p className="text-ink-2 mt-1">Acompanhe solicitações, responda usuários e registre notas internas.</p></div><Button variant="outline" onClick={() => load()} className="rounded-full border-[#EADFD8] bg-white"><RefreshCw size={16} className="mr-2" /> Atualizar</Button></div>

        <div className="grid xl:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.4fr)] gap-6"><section className="rounded-3xl border border-[#EADFD8] bg-white p-5 shadow-warm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FDECE8] text-coral"><LifeBuoy size={20} /></div><div><h2 className="font-display text-xl font-bold text-ink">Caixa de entrada</h2><p className="text-sm text-ink-2 mt-1">{items.length} chamado(s) exibido(s)</p></div></div><div className="mt-4 space-y-3"><Input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="Buscar por assunto" className="h-10 rounded-xl border-[#EADFD8]" /><div className="grid grid-cols-2 gap-2"><Select value={filters.status || 'all'} onValueChange={(value) => { const next = { ...filters, status: value === 'all' ? '' : value }; setFilters(next); load(next); }}><SelectTrigger className="h-10 rounded-xl border-[#EADFD8] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem>{Object.entries(STATUS_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select><Select value={filters.priority || 'all'} onValueChange={(value) => { const next = { ...filters, priority: value === 'all' ? '' : value }; setFilters(next); load(next); }}><SelectTrigger className="h-10 rounded-xl border-[#EADFD8] bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Prioridades</SelectItem>{Object.entries(PRIORITY_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><Button onClick={() => load()} className="h-10 w-full rounded-full bg-ink"><RefreshCw size={14} className="mr-2" /> Atualizar lista</Button></div>{loading ? <ListSkeleton compact count={4} /> : error ? <div className="mt-5 rounded-2xl bg-[#FCFAF8] p-5 text-center"><p className="font-semibold text-ink">Não foi possível carregar</p><p className="mt-1 text-sm text-ink-2">{error}</p><Button onClick={() => load()} className="mt-4 rounded-full bg-coral">Tentar novamente</Button></div> : items.length === 0 ? <div className="mt-5 rounded-2xl bg-[#FCFAF8] p-7 text-center"><MessageCircle size={28} className="mx-auto text-ink-2" /><p className="mt-2 font-semibold text-ink">Nenhum chamado</p></div> : <div className="mt-5 max-h-[620px] space-y-2 overflow-auto pr-1">{items.map((item) => <button key={item.id} type="button" onClick={() => openTicket(item.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === item.id ? 'border-coral bg-[#FFF9F6]' : 'border-[#F0E7E1] bg-[#FCFAF8] hover:bg-white'}`}><div className="flex items-start gap-2"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-coral"><MessageCircle size={16} /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[item.status] || STATUS_STYLE.open}`}>{STATUS_LABEL[item.status] || item.status}</span><span className="truncate text-[11px] text-ink-2">{item.users?.email || item.user_id}</span></div><p className="mt-1 truncate font-semibold text-ink">{item.subject}</p><p className="mt-1 text-[11px] text-ink-2">{CATEGORY_LABEL[item.category] || item.category} · {dateLabel(item.updated_at)}</p></div><ChevronRight size={16} className="mt-2 text-ink-2" /></div></button>)}</div>}</section>

            <section className="rounded-3xl border border-[#EADFD8] bg-white p-5 shadow-warm min-h-[520px]">{!selected ? <div className="flex min-h-[480px] flex-col items-center justify-center text-center"><LifeBuoy size={42} className="text-ink-2" /><h2 className="mt-4 font-display text-xl font-bold text-ink">Selecione um chamado</h2><p className="mt-1 max-w-sm text-sm text-ink-2">Veja o histórico e responda sem sair do painel.</p></div> : <><div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-[#F0E7E1] pb-5"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[selected.status] || STATUS_STYLE.open}`}>{STATUS_LABEL[selected.status] || selected.status}</span><span className="text-xs text-ink-2">{selected.users?.email || selected.user_id}</span></div><h2 className="mt-2 font-display text-xl font-bold text-ink">{selected.subject}</h2><p className="mt-1 text-sm text-ink-2">Criado em {dateLabel(selected.created_at)}</p></div><div className="grid grid-cols-2 gap-2 sm:flex"><div><Label className="text-xs">Status</Label><Select value={selected.status} onValueChange={(value) => updateTicket('status', value)}><SelectTrigger className="mt-1 h-10 w-36 rounded-xl border-[#EADFD8] bg-white"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs">Prioridade</Label><Select value={selected.priority} onValueChange={(value) => updateTicket('priority', value)}><SelectTrigger className="mt-1 h-10 w-28 rounded-xl border-[#EADFD8] bg-white"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PRIORITY_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div></div></div><div className="mt-5 space-y-3 max-h-[470px] overflow-auto pr-1">{loadingDetail ? <ListSkeleton compact count={3} /> : (selected.messages || []).map((message) => <div key={message.id} className={`rounded-2xl p-4 ${message.internal_note ? 'border border-[#F1D98A] bg-[#FFF9E8]' : message.author_user_id === selected.user_id ? 'bg-[#FCFAF8]' : 'bg-[#FFF1EB]'}`}><div className="flex items-center gap-2 text-xs text-ink-2">{message.internal_note ? <Shield size={14} className="text-[#8B6A18]" /> : message.author_user_id === selected.user_id ? <UserRound size={14} /> : <CheckCircle2 size={14} className="text-coral" />}{message.internal_note ? 'Nota interna' : message.author_user_id === selected.user_id ? 'Usuário' : 'Equipe Crescer+'}<span>· {dateLabel(message.created_at)}</span></div><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{message.body}</p></div>)}</div><form onSubmit={sendReply} className="mt-5 border-t border-[#F0E7E1] pt-5"><Label htmlFor="admin-reply">{internalNote ? 'Nota interna' : 'Resposta ao usuário'}</Label><Textarea id="admin-reply" value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder={internalNote ? 'Visível somente para a equipe…' : 'Escreva uma resposta clara e acolhedora…'} className="mt-2 rounded-2xl border-[#EADFD8]" required /><div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3"><label className="flex items-center gap-2 text-sm text-ink-2"><input type="checkbox" checked={internalNote} onChange={(e) => setInternalNote(e.target.checked)} className="h-4 w-4 accent-[#E87A5D]" /> Adicionar como nota interna</label><Button type="submit" disabled={saving || !reply.trim()} className="rounded-full bg-coral hover:bg-[#D9684C] sm:ml-auto"><Send size={15} className="mr-2" />{saving ? 'Enviando…' : internalNote ? 'Salvar nota' : 'Responder usuário'}</Button></div></form></>}</section></div></div>;
}
