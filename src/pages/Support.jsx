import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, HelpCircle, LifeBuoy, MessageCircle, Plus, RefreshCw, Send, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api, { formatApiError } from '../lib/api';
import AppShell from '../components/AppShell';
import BottomNav from '../components/BottomNav';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const STATUS_LABEL = { open: 'Aberto', in_progress: 'Em atendimento', waiting_user: 'Aguardando você', resolved: 'Resolvido', closed: 'Encerrado' };
const STATUS_STYLE = { open: 'bg-[#EAF1FB] text-[#426A9A]', in_progress: 'bg-[#FFF5D9] text-[#8B6A18]', waiting_user: 'bg-[#EEEAFE] text-[#7354A8]', resolved: 'bg-[#E9F6EE] text-[#2B7A48]', closed: 'bg-[#F3EEEA] text-ink-2' };
const CATEGORY_LABEL = { general: 'Dúvida geral', account: 'Minha conta', activities: 'Atividades', privacy: 'Privacidade', bug: 'Problema técnico', suggestion: 'Sugestão' };

function dateLabel(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }

export default function Support() {
    const nav = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [reply, setReply] = useState('');
    const [form, setForm] = useState({ subject: '', category: 'general', priority: 'normal', body: '' });

    const load = async () => {
        setLoading(true);
        setError('');
        try { const { data } = await api.get('/support/tickets'); setTickets(data || []); } catch (e) { setError(formatApiError(e.response?.data?.detail || e.message)); } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []); // eslint-disable-line

    const openTicket = async (id) => {
        setLoadingDetail(true);
        try { const { data } = await api.get(`/support/tickets/${id}`); setSelected(data); } catch (e) { toast.error(formatApiError(e.response?.data?.detail || e.message)); } finally { setLoadingDetail(false); }
    };

    const createTicket = async (event) => {
        event.preventDefault();
        setSaving(true);
        try { const { data } = await api.post('/support/tickets', form); setCreating(false); setForm({ subject: '', category: 'general', priority: 'normal', body: '' }); await load(); await openTicket(data.id); toast.success('Mensagem enviada para o suporte.'); } catch (e) { toast.error(formatApiError(e.response?.data?.detail || e.message)); } finally { setSaving(false); }
    };

    const sendReply = async (event) => {
        event.preventDefault();
        if (!reply.trim() || !selected) return;
        setSaving(true);
        try { await api.post(`/support/tickets/${selected.id}/messages`, { body: reply }); setReply(''); await openTicket(selected.id); await load(); toast.success('Resposta enviada.'); } catch (e) { toast.error(formatApiError(e.response?.data?.detail || e.message)); } finally { setSaving(false); }
    };

    return <AppShell><div className="px-6 pt-10 safe-bottom"><div className="flex items-start gap-3"><button type="button" onClick={() => nav('/')} className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-[#EADFD8] bg-white text-ink-2 hover:bg-[#FDF6F0]" aria-label="Voltar"><ArrowLeft size={18} /></button><div><p className="text-xs uppercase tracking-[0.16em] font-bold text-coral">Estamos aqui</p><h1 className="font-display text-2xl font-bold text-ink mt-1">Contato e suporte</h1><p className="text-sm text-ink-2 mt-1">Conte o que aconteceu. Vamos acompanhar com você.</p></div></div>

        {!selected && <><div className="mt-6 rounded-3xl bg-[#FCF6EA] p-5"><div className="flex items-start gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-coral"><LifeBuoy size={20} /></div><div><p className="font-display font-bold text-ink">Como podemos ajudar?</p><p className="mt-1 text-sm leading-relaxed text-ink-2">Abra um chamado para dúvidas, problemas técnicos, privacidade ou sugestões. Você poderá acompanhar cada resposta aqui.</p></div></div><Button onClick={() => setCreating(true)} className="mt-4 h-11 rounded-full bg-coral hover:bg-[#D9684C]"><Plus size={17} className="mr-2" /> Novo contato</Button></div><div className="mt-7 flex items-center justify-between"><h2 className="font-display text-lg font-bold text-ink">Seus chamados</h2><button type="button" onClick={load} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EADFD8] bg-white text-ink-2" aria-label="Atualizar chamados"><RefreshCw size={15} /></button></div>{loading ? <div className="mt-4 space-y-3">{[1, 2].map((item) => <div key={item} className="h-24 rounded-3xl bg-white/70 animate-pulse" />)}</div> : error ? <div className="mt-4 rounded-3xl border border-[#EADFD8] bg-white p-7 text-center"><p className="font-bold text-ink">Não foi possível carregar seus chamados.</p><p className="mt-1 text-sm text-ink-2">{error}</p><Button onClick={load} className="mt-4 rounded-full bg-ink">Tentar novamente</Button></div> : tickets.length === 0 ? <div className="mt-4 rounded-3xl border border-[#EADFD8] bg-white p-8 text-center shadow-warm"><HelpCircle size={32} className="mx-auto text-ink-2" /><p className="mt-3 font-display font-bold text-ink">Nenhum chamado ainda</p><p className="mt-1 text-sm text-ink-2">Se precisar, estamos a um toque de distância.</p></div> : <div className="mt-4 space-y-3">{tickets.map((ticket) => <button key={ticket.id} type="button" onClick={() => openTicket(ticket.id)} className="w-full rounded-3xl border border-[#EADFD8] bg-white p-4 text-left shadow-warm transition hover:-translate-y-0.5"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FDECE8] text-coral"><MessageCircle size={18} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLE[ticket.status] || STATUS_STYLE.open}`}>{STATUS_LABEL[ticket.status] || ticket.status}</span><span className="text-[11px] text-ink-2">{CATEGORY_LABEL[ticket.category] || ticket.category}</span></div><p className="mt-1 truncate font-display font-bold text-ink">{ticket.subject}</p><p className="mt-1 text-xs text-ink-2">Atualizado {dateLabel(ticket.updated_at)}</p></div><ChevronRight size={18} className="mt-2 text-ink-2" /></div></button>)}</div>}</>}

        {selected && <div className="mt-6"><button type="button" onClick={() => setSelected(null)} className="mb-4 flex items-center gap-2 text-sm font-bold text-coral"><ArrowLeft size={16} /> Voltar aos chamados</button><section className="rounded-3xl border border-[#EADFD8] bg-white p-5 shadow-warm"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[selected.status] || STATUS_STYLE.open}`}>{STATUS_LABEL[selected.status] || selected.status}</span><span className="text-xs text-ink-2">{CATEGORY_LABEL[selected.category] || selected.category}</span></div><h2 className="mt-3 font-display text-xl font-bold text-ink">{selected.subject}</h2><div className="mt-5 space-y-3">{loadingDetail ? <div className="h-16 rounded-2xl bg-[#FCFAF8] animate-pulse" /> : (selected.messages || []).filter((message) => !message.internal_note).map((message) => <div key={message.id} className={`rounded-2xl p-4 ${message.author_user_id === selected.user_id ? 'bg-[#FCFAF8]' : 'bg-[#FFF1EB]'}`}><div className="flex items-center gap-2 text-xs text-ink-2"><UserRound size={13} />{message.author_user_id === selected.user_id ? 'Você' : 'Equipe Crescer+'}<span>· {dateLabel(message.created_at)}</span></div><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{message.body}</p></div>)}</div>{selected.status !== 'closed' && selected.status !== 'resolved' && <form onSubmit={sendReply} className="mt-5 border-t border-[#F0E7E1] pt-5"><Label htmlFor="support-reply">Responder</Label><Textarea id="support-reply" value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Escreva uma resposta ou informação adicional…" className="mt-2 rounded-2xl border-[#EADFD8]" /><Button type="submit" disabled={saving || !reply.trim()} className="mt-3 h-11 rounded-full bg-coral hover:bg-[#D9684C]"><Send size={16} className="mr-2" /> Enviar resposta</Button></form>} {selected.status === 'resolved' && <div className="mt-5 rounded-2xl bg-[#E9F6EE] p-3 text-sm text-[#2B7A48] flex items-center gap-2"><CheckCircle2 size={17} /> Este chamado foi marcado como resolvido. Você ainda pode abrir um novo contato se precisar.</div>}</section></div>}

        {creating && <form onSubmit={createTicket} className="mt-6 rounded-3xl border border-coral/30 bg-white p-5 shadow-warm"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold text-ink">Novo contato</h2><button type="button" onClick={() => setCreating(false)} className="text-sm font-bold text-ink-2">Cancelar</button></div><div className="mt-4 space-y-4"><div><Label htmlFor="support-subject">Assunto</Label><Input id="support-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex: Não consigo concluir uma atividade" className="mt-1 h-11 rounded-xl border-[#EADFD8]" required /></div><div className="grid grid-cols-2 gap-3"><div><Label>Categoria</Label><Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}><SelectTrigger className="mt-1 h-11 rounded-xl border-[#EADFD8]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">Dúvida geral</SelectItem><SelectItem value="account">Minha conta</SelectItem><SelectItem value="activities">Atividades</SelectItem><SelectItem value="privacy">Privacidade</SelectItem><SelectItem value="bug">Problema técnico</SelectItem><SelectItem value="suggestion">Sugestão</SelectItem></SelectContent></Select></div><div><Label>Prioridade</Label><Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}><SelectTrigger className="mt-1 h-11 rounded-xl border-[#EADFD8]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent></Select></div></div><div><Label htmlFor="support-body">Mensagem</Label><Textarea id="support-body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={6} placeholder="Descreva o que aconteceu com o máximo de detalhes possível…" className="mt-1 rounded-2xl border-[#EADFD8]" required minLength={10} /></div><Button type="submit" disabled={saving} className="h-11 rounded-full bg-coral hover:bg-[#D9684C]">{saving ? 'Enviando…' : 'Enviar para o suporte'}</Button></div></form>}
    </div><BottomNav /></AppShell>;
}
