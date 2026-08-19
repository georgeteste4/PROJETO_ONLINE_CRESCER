import { useEffect, useState } from 'react';
import api, { formatApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { Mail, Plus, Copy, Trash2, Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABEL = { super_admin: 'Super Admin', editor: 'Editor', moderador: 'Moderador' };

export default function AdminInvites() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('editor');
    const [error, setError] = useState('');
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
    const [lastLink, setLastLink] = useState(null);

    const load = async () => {
        setLoading(true);
        setLoadError('');
        try {
            const { data } = await api.get('/admin/invites');
            setItems(data || []);
        } catch (e) {
            const detail = formatApiError(e.response?.data?.detail);
            setLoadError(detail);
            toast.error(detail);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, []);

    const create = async () => {
        setSaving(true);
        setError('');
        try {
            const { data } = await api.post('/admin/invites', { email, role });
            setLastLink({ link: data.link, email: data.email, email_result: data.email_result });
            setCreating(false);
            setEmail('');
            setRole('editor');
            load();
            if (data.email_result?.sent) {
                toast.success('Convite enviado por e-mail!');
            } else {
                toast.info('Link gerado. Copie e envie manualmente.');
            }
        } catch (e) {
            setError(formatApiError(e.response?.data?.detail));
        } finally {
            setSaving(false);
        }
    };

    const revoke = async (inv) => {
        try {
            await api.delete(`/admin/invites/${inv.id}`);
            toast.success('Convite revogado');
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    const copyLink = async (linkOrToken) => {
        const base = `${window.location.origin}${String(process.env.PUBLIC_URL || '').replace(/\/$/, '')}`;
        const link = String(linkOrToken).startsWith('http') ? linkOrToken : `${base}/convite/${encodeURIComponent(linkOrToken)}`;
        try {
            await navigator.clipboard.writeText(link);
            toast.success('Link copiado!');
        } catch {
            setLastLink({ link, email: 'Convite', email_result: { sent: false, reason: 'Copie o link manualmente.' } });
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Convites</h1>
                    <p className="text-ink-2 mt-1">Convide editores e moderadores por e-mail. O link também pode ser copiado.</p>
                </div>
                <Button data-testid="new-invite-btn" onClick={() => setCreating(true)} className="rounded-full bg-coral hover:bg-[#D9684C]">
                    <Plus size={16} className="mr-1" /> Novo convite
                </Button>
            </div>

            <div className="rounded-3xl bg-white shadow-warm border border-[#EADFD8] overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-ink-2">Carregando…</div>
                ) : loadError ? (
                    <div className="p-10 text-center"><X size={32} className="mx-auto text-destructive" /><p className="mt-3 font-display font-bold text-ink">Não foi possível carregar os convites</p><p className="text-sm text-ink-2 mt-1">{loadError}</p><Button onClick={load} className="mt-4 rounded-full bg-ink"><Clock size={16} className="mr-2" /> Tentar novamente</Button></div>
                ) : items.length === 0 ? (
                    <div data-testid="invites-empty" className="p-10 text-center">
                        <Mail size={32} className="mx-auto text-ink-2" />
                        <p className="mt-3 font-display font-bold text-ink">Nenhum convite ainda</p>
                        <p className="text-sm text-ink-2 mt-1">Crie o primeiro para convidar um editor ou moderador.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-[#EADFD8]">
                        {items.map((inv) => (
                            <li key={inv.id} data-testid={`invite-row-${inv.id}`} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-[#FCF6EA] flex items-center justify-center flex-shrink-0 text-coral">
                                    <Mail size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-ink truncate">{inv.email}</p>
                                        <Badge className="rounded-full text-xs bg-[#84A59D22] text-sage border-transparent">
                                            {ROLE_LABEL[inv.role] || inv.role}
                                        </Badge>
                                        {inv.used ? (
                                            <Badge className="rounded-full text-xs bg-[#84A59D22] text-sage border-transparent">
                                                <Check size={12} className="mr-1" /> Aceito
                                            </Badge>
                                        ) : inv.expired ? (
                                            <Badge variant="destructive" className="rounded-full text-xs">
                                                <X size={12} className="mr-1" /> Expirado
                                            </Badge>
                                        ) : (
                                            <Badge className="rounded-full text-xs bg-[#F2CC8F44] text-[#B48A3A] border-transparent">
                                                <Clock size={12} className="mr-1" /> Pendente
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-ink-2 mt-1">
                                        Convidado por {inv.invited_by_name} • expira em {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {!inv.used && !inv.expired && (
                                        <Button
                                            data-testid={`invite-copy-${inv.id}`}
                                            variant="outline"
                                            onClick={() => copyLink(inv.token)}
                                            className="h-10 rounded-full border-[#EADFD8]"
                                        >
                                            <Copy size={14} className="mr-1" /> Copiar link
                                        </Button>
                                    )}
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                data-testid={`invite-revoke-${inv.id}`}
                                                variant="outline"
                                                className="h-10 rounded-full border-destructive/30 text-destructive"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-3xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Revogar convite?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    O link deste convite deixará de funcionar imediatamente.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    data-testid={`invite-revoke-confirm-${inv.id}`}
                                                    onClick={() => revoke(inv)}
                                                    className="rounded-full bg-destructive hover:bg-destructive/90"
                                                >
                                                    Revogar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Create dialog */}
            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent className="rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-display">Novo convite</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="inv-email">E-mail do convidado</Label>
                            <Input
                                id="inv-email"
                                type="email"
                                data-testid="invite-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="pessoa@exemplo.com"
                                className="mt-1 h-12 rounded-2xl border-[#EADFD8]"
                            />
                        </div>
                        <div>
                            <Label>Papel</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger data-testid="invite-role" className="mt-1 h-12 rounded-2xl bg-white border-[#EADFD8]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="moderador">Moderador (usuários)</SelectItem>
                                    <SelectItem value="editor">Editor (conteúdo)</SelectItem>
                                    <SelectItem value="super_admin">Super Admin (tudo)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <p className="text-xs text-ink-2">
                            O provedor padrão pode enviar o convite automaticamente. Se o envio falhar ou estiver no modo nativo, o link continua disponível para compartilhamento manual; a validade pode ser ajustada em Configurações.
                        </p>
                    </div>
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="outline" onClick={() => setCreating(false)} className="rounded-full">Cancelar</Button>
                        <Button
                            data-testid="invite-create-btn"
                            onClick={create}
                            disabled={saving || !email || !role}
                            className="rounded-full bg-coral hover:bg-[#D9684C]"
                        >
                            {saving ? 'Gerando…' : 'Gerar convite'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Last-link modal */}
            <Dialog open={!!lastLink} onOpenChange={(o) => !o && setLastLink(null)}>
                <DialogContent className="rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-display">Convite pronto</DialogTitle>
                    </DialogHeader>
                    {lastLink && (
                        <div className="space-y-3">
                            <p className="text-sm text-ink-2">
                                {lastLink.email_result?.sent
                                    ? `E-mail enviado para ${lastLink.email} pelo provedor ${lastLink.email_result.provider || 'padrão'}.`
                                    : `Compartilhe manualmente o link abaixo. ${lastLink.email_result?.reason || ''}`}
                            </p>
                            <div className="p-4 rounded-2xl bg-[#FDF6F0] flex items-center gap-3">
                                <code data-testid="last-invite-link" className="font-mono text-xs sm:text-sm text-ink flex-1 break-all">
                                    {lastLink.link}
                                </code>
                                <Button
                                    variant="ghost"
                                    onClick={() => copyLink(lastLink.link)}
                                    className="rounded-full"
                                >
                                    <Copy size={16} />
                                </Button>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setLastLink(null)} className="rounded-full bg-ink hover:bg-ink/90">Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
