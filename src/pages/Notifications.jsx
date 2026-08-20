import { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCheck, ChevronRight, Info, Megaphone, RefreshCw, Settings2, ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api, { formatApiError } from '../lib/api';
import AppShell from '../components/AppShell';
import BottomNav from '../components/BottomNav';
import { Button } from '../components/ui/button';
import { ListSkeleton } from '../components/LoadingSkeletons';

const KIND_ICON = { announcement: Megaphone, tip: Sparkles, system: ShieldAlert, support: Bell, reminder: Info };
const KIND_LABEL = { announcement: 'Aviso', tip: 'Dica', system: 'Sistema', support: 'Suporte', reminder: 'Lembrete' };
const PRIORITY_STYLE = { low: 'bg-[#F3EEEA] text-ink-2', normal: 'bg-[#EAF1FB] text-[#426A9A]', high: 'bg-[#FFF5D9] text-[#8B6A18]', urgent: 'bg-[#FDECE8] text-[#B24C3C]' };

function dateLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Notifications() {
    const nav = useNavigate();
    const [items, setItems] = useState([]);
    const [preferences, setPreferences] = useState({ in_app_enabled: true, browser_enabled: false, email_enabled: true });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingPreferences, setSavingPreferences] = useState(false);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [notifications, prefs] = await Promise.all([api.get('/notifications'), api.get('/notification-preferences')]);
            setItems(notifications.data || []);
            setPreferences(prefs.data || preferences);
        } catch (e) {
            setError(formatApiError(e.response?.data?.detail || e.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line

    const markRead = async (item) => {
        if (item.read_at) return;
        try {
            await api.post(`/notifications/${item.id}/read`);
            setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry));
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail || e.message));
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
            toast.success('Notificações marcadas como lidas.');
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail || e.message));
        }
    };

    const updatePreference = async (key, value) => {
        if (key === 'browser_enabled' && value && typeof window !== 'undefined' && 'Notification' in window) {
            const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
            if (permission !== 'granted') {
                toast.error('O navegador não autorizou notificações. Você pode liberar nas configurações do site.');
                return;
            }
        }
        const next = { ...preferences, [key]: value };
        setPreferences(next);
        setSavingPreferences(true);
        try {
            await api.put('/notification-preferences', next);
            toast.success('Preferência atualizada.');
        } catch (e) {
            setPreferences(preferences);
            toast.error(formatApiError(e.response?.data?.detail || e.message));
        } finally {
            setSavingPreferences(false);
        }
    };

    const openNotification = async (item) => {
        await markRead(item);
        if (item.action_url) {
            if (item.action_url.startsWith('/')) nav(item.action_url);
            else window.location.href = item.action_url;
        }
    };

    return <AppShell><div className="px-6 pt-10 safe-bottom"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] font-bold text-coral">Comunicação</p><h1 className="font-display text-2xl font-bold text-ink mt-1">Notificações</h1><p className="text-sm text-ink-2 mt-1">Avisos importantes e dicas para acompanhar o Crescer+.</p></div><button type="button" onClick={() => nav('/')} className="rounded-full px-3 py-2 text-sm font-bold text-coral hover:bg-[#FDF6F0]">Voltar</button></div>

        <section className="mt-6 rounded-3xl border border-[#EADFD8] bg-white p-4 shadow-warm"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FDECE8] text-coral"><Settings2 size={19} /></div><div className="flex-1"><p className="font-display font-bold text-ink">Suas preferências</p><p className="text-xs text-ink-2 mt-1">Escolha como deseja receber avisos.</p></div></div><div className="mt-4 space-y-2">{[['in_app_enabled', 'Notificações dentro do app'], ['browser_enabled', 'Permitir notificações do navegador'], ['email_enabled', 'Receber avisos por e-mail']].map(([key, label]) => <button key={key} type="button" disabled={savingPreferences} onClick={() => updatePreference(key, !preferences[key])} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-[#FDF6F0]"><span className={`relative h-7 w-12 rounded-full transition-colors ${preferences[key] ? 'bg-coral' : 'bg-[#D9CEC6]'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${preferences[key] ? 'translate-x-6' : 'translate-x-1'}`} /></span><span className="flex-1 text-sm font-semibold text-ink">{label}</span>{key === 'browser_enabled' && typeof Notification !== 'undefined' && Notification.permission === 'denied' && <span className="text-[11px] text-[#B24C3C]">Bloqueado no navegador</span>}</button>)}</div></section>

        <div className="mt-6 flex items-center justify-between"><h2 className="font-display text-lg font-bold text-ink">Sua caixa de entrada</h2>{items.some((item) => !item.read_at) && <Button variant="outline" onClick={markAllRead} className="h-9 rounded-full border-[#EADFD8] bg-white text-xs"><CheckCheck size={14} className="mr-1.5" /> Marcar tudo como lido</Button>}</div>

        {loading ? <ListSkeleton count={3} /> : error ? <div className="mt-4 rounded-3xl border border-[#EADFD8] bg-white p-8 text-center shadow-warm"><BellOff className="mx-auto text-coral" size={28} /><p className="mt-3 font-display font-bold text-ink">Não foi possível carregar as notificações</p><p className="mt-1 text-sm text-ink-2">{error}</p><Button onClick={load} className="mt-5 rounded-full bg-ink"><RefreshCw size={15} className="mr-2" /> Tentar novamente</Button></div> : items.length === 0 ? <div className="mt-4 rounded-3xl border border-[#EADFD8] bg-white p-10 text-center shadow-warm"><Bell size={32} className="mx-auto text-ink-2" /><p className="mt-3 font-display font-bold text-ink">Tudo tranquilo por aqui</p><p className="mt-1 text-sm text-ink-2">Quando houver um aviso importante, ele aparecerá nesta caixa.</p></div> : <div className="mt-4 space-y-3">{items.map((item) => { const Icon = KIND_ICON[item.kind] || Bell; return <button type="button" key={item.id} onClick={() => openNotification(item)} className={`w-full rounded-3xl border p-4 text-left shadow-warm transition hover:-translate-y-0.5 ${item.read_at ? 'border-[#EADFD8] bg-white' : 'border-coral/30 bg-[#FFF9F6]'}`}><div className="flex items-start gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.read_at ? 'bg-[#F3EEEA] text-ink-2' : 'bg-[#FDECE8] text-coral'}`}><Icon size={19} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] font-extrabold uppercase tracking-wide text-ink-2">{KIND_LABEL[item.kind] || 'Aviso'}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.normal}`}>{item.priority || 'normal'}</span>{!item.read_at && <span className="h-2 w-2 rounded-full bg-coral" aria-label="Não lida" />}</div><p className="mt-1 font-display text-base font-bold text-ink">{item.title}</p><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-2">{item.body}</p><p className="mt-2 text-[11px] text-ink-2">{dateLabel(item.created_at)}{item.action_url ? ' · Toque para abrir' : ''}</p></div><ChevronRight size={18} className="mt-1 shrink-0 text-ink-2" /></div></button>; })}</div>}
        <div className="mt-8 rounded-3xl bg-[#FCF6EA] p-4"><p className="text-sm font-semibold text-ink">Precisa de ajuda?</p><p className="mt-1 text-xs leading-relaxed text-ink-2">Nossa equipe pode ajudar com sua conta, atividades ou privacidade.</p><Button variant="outline" onClick={() => nav('/suporte')} className="mt-3 h-10 rounded-full border-[#EADFD8] bg-white text-sm">Falar com o suporte</Button></div>
    </div><BottomNav /></AppShell>;
}
