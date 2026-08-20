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
import { Search, Ban, RotateCcw, Trash2, ShieldAlert, UserCog, Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { AdminTableSkeleton, ListSkeleton } from '../../components/LoadingSkeletons';

const ROLE_LABEL = { super_admin: 'Super Admin', editor: 'Editor', moderador: 'Moderador', user: 'Usuário' };
const ROLE_COLOR = {
    super_admin: '#E87A5D',
    editor: '#84A59D',
    moderador: '#A89BCC',
    user: '#B0A9A5',
};

export default function AdminUsers() {
    const { user: me } = useAuth();
    const [users, setUsers] = useState([]);
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(true);
    const [editUser, setEditUser] = useState(null);
    const [pwdUser, setPwdUser] = useState(null);
    const [generatedPwd, setGeneratedPwd] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/users', { params: q ? { q } : {} });
            setUsers(data);
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line

    const onSearch = (e) => {
        e.preventDefault();
        load();
    };

    const setRole = async (u, role) => {
        try {
            await api.patch(`/admin/users/${u.id}`, { role });
            toast.success('Papel atualizado');
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    const toggleBan = async (u) => {
        try {
            await api.patch(`/admin/users/${u.id}`, { banned: !u.banned });
            toast.success(u.banned ? 'Usuário desbanido' : 'Usuário banido');
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    const resetPwd = async () => {
        try {
            const { data } = await api.post(`/admin/users/${pwdUser.id}/reset-password`, {});
            setGeneratedPwd(data.new_password);
            toast.success('Senha resetada');
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    const deleteUser = async (u) => {
        try {
            await api.delete(`/admin/users/${u.id}`);
            toast.success('Usuário excluído');
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    const isSuper = me?.role === 'super_admin';

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Usuários</h1>
                    <p className="text-ink-2 mt-1">Gerencie contas, papéis e bloqueios.</p>
                </div>
                <form onSubmit={onSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" />
                        <Input
                            data-testid="users-search-input"
                            placeholder="Buscar por nome ou e-mail"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="pl-9 h-11 rounded-full bg-white border-[#EADFD8]"
                        />
                    </div>
                    <Button data-testid="users-search-btn" type="submit" className="rounded-full bg-ink hover:bg-ink/90">Buscar</Button>
                </form>
            </div>

            <div className="rounded-3xl bg-white shadow-warm border border-[#EADFD8] overflow-hidden">
                {loading ? (
                    <AdminTableSkeleton rows={6} />
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-ink-2">Nenhum usuário encontrado.</div>
                ) : (
                    <ul className="divide-y divide-[#EADFD8]">
                        {users.map((u) => (
                            <li key={u.id} data-testid={`user-row-${u.id}`} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-[#FDECE8] flex items-center justify-center flex-shrink-0">
                                    <span className="font-display font-bold text-coral">
                                        {(u.name || u.email).charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-ink truncate">{u.name}</p>
                                        <Badge
                                            style={{ background: `${ROLE_COLOR[u.role]}22`, color: ROLE_COLOR[u.role], borderColor: 'transparent' }}
                                            className="rounded-full text-xs"
                                        >
                                            {ROLE_LABEL[u.role]}
                                        </Badge>
                                        {u.banned && <Badge variant="destructive" className="rounded-full text-xs">Banido</Badge>}
                                    </div>
                                    <p className="text-sm text-ink-2 truncate">{u.email}</p>
                                    <p className="text-xs text-ink-2 mt-0.5">
                                        {u.children_count} criança(s) • ID {u.id.slice(0, 8)}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {isSuper && (
                                        <Select value={u.role} onValueChange={(v) => setRole(u, v)}>
                                            <SelectTrigger data-testid={`user-role-${u.id}`} className="w-40 h-10 rounded-full bg-white border-[#EADFD8]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                <SelectItem value="user">Usuário</SelectItem>
                                                <SelectItem value="moderador">Moderador</SelectItem>
                                                <SelectItem value="editor">Editor</SelectItem>
                                                <SelectItem value="super_admin">Super Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <Button
                                        data-testid={`user-ban-${u.id}`}
                                        variant="outline"
                                        onClick={() => toggleBan(u)}
                                        disabled={u.id === me.id}
                                        className="h-10 rounded-full border-[#EADFD8]"
                                    >
                                        <Ban size={14} className="mr-1" />
                                        {u.banned ? 'Desbanir' : 'Banir'}
                                    </Button>
                                    <Button
                                        data-testid={`user-pwd-${u.id}`}
                                        variant="outline"
                                        onClick={() => { setPwdUser(u); setGeneratedPwd(''); }}
                                        className="h-10 rounded-full border-[#EADFD8]"
                                    >
                                        <RotateCcw size={14} className="mr-1" />
                                        Senha
                                    </Button>
                                    <Button
                                        data-testid={`user-view-${u.id}`}
                                        variant="outline"
                                        onClick={() => setEditUser(u)}
                                        className="h-10 rounded-full border-[#EADFD8]"
                                    >
                                        <UserCog size={14} className="mr-1" />
                                        Detalhes
                                    </Button>
                                    {isSuper && u.id !== me.id && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    data-testid={`user-delete-${u.id}`}
                                                    variant="outline"
                                                    className="h-10 rounded-full border-destructive/30 text-destructive"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-3xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="font-display flex items-center gap-2">
                                                        <ShieldAlert className="text-destructive" /> Excluir {u.email}?
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Todos os dados desse usuário — crianças, atividades concluídas e favoritos — serão apagados. Não pode ser desfeito.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        data-testid={`user-delete-confirm-${u.id}`}
                                                        onClick={() => deleteUser(u)}
                                                        className="rounded-full bg-destructive hover:bg-destructive/90"
                                                    >
                                                        Excluir tudo
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Details modal */}
            <UserDetailsDialog user={editUser} onClose={() => setEditUser(null)} />

            {/* Reset password modal */}
            <Dialog open={!!pwdUser} onOpenChange={(o) => !o && setPwdUser(null)}>
                <DialogContent className="rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-display">Resetar senha</DialogTitle>
                    </DialogHeader>
                    {!generatedPwd ? (
                        <div className="space-y-3">
                            <p className="text-sm text-ink-2">
                                Uma nova senha aleatória será gerada para <strong>{pwdUser?.email}</strong>. Compartilhe apenas por canal seguro.
                            </p>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setPwdUser(null)} className="rounded-full">Cancelar</Button>
                                <Button data-testid="reset-pwd-confirm" onClick={resetPwd} className="rounded-full bg-coral hover:bg-[#D9684C]">
                                    Gerar nova senha
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-ink-2">Senha temporária:</p>
                            <div className="p-4 rounded-2xl bg-[#FDF6F0] flex items-center gap-3">
                                <code data-testid="new-password-value" className="font-mono text-lg font-bold text-ink flex-1 break-all">{generatedPwd}</code>
                                <Button
                                    variant="ghost"
                                    onClick={() => { navigator.clipboard.writeText(generatedPwd); toast.success('Copiada!'); }}
                                    className="rounded-full"
                                >
                                    <Copy size={16} />
                                </Button>
                            </div>
                            <p className="text-xs text-ink-2">Peça ao usuário para trocar a senha assim que possível.</p>
                            <DialogFooter>
                                <Button onClick={() => setPwdUser(null)} className="rounded-full bg-ink hover:bg-ink/90">Fechar</Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function UserDetailsDialog({ user, onClose }) {
    const [details, setDetails] = useState(null);
    useEffect(() => {
        if (!user) { setDetails(null); return; }
        api.get(`/admin/users/${user.id}`).then((r) => setDetails(r.data)).catch(() => {});
    }, [user]);

    return (
        <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="rounded-3xl max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-display">Detalhes do usuário</DialogTitle>
                </DialogHeader>
                {!details ? (
                    <ListSkeleton compact count={2} />
                ) : (
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-ink-2 uppercase font-semibold">Nome</p>
                            <p className="font-semibold text-ink">{details.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-ink-2 uppercase font-semibold">E-mail</p>
                            <p className="text-ink">{details.email}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-ink-2 uppercase font-semibold">Papel</p>
                                <p className="text-ink">{ROLE_LABEL[details.role]}</p>
                            </div>
                            <div>
                                <p className="text-xs text-ink-2 uppercase font-semibold">Status</p>
                                <p className="text-ink">{details.banned ? 'Banido' : 'Ativo'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-ink-2 uppercase font-semibold mb-2">Crianças ({details.children?.length || 0})</p>
                            <div className="space-y-2">
                                {(details.children || []).map((c) => (
                                    <div key={c.id} className="p-3 rounded-xl bg-[#FDF6F0] flex items-center gap-3">
                                        <span className="w-9 h-9 rounded-lg bg-[#FDECE8] text-coral font-bold flex items-center justify-center">
                                            {c.nome.charAt(0)}
                                        </span>
                                        <div>
                                            <p className="font-medium text-ink text-sm">{c.nome}</p>
                                            <p className="text-xs text-ink-2">Nasc.: {c.dob} • {c.age_days} dias</p>
                                        </div>
                                    </div>
                                ))}
                                {(!details.children || details.children.length === 0) && (
                                    <p className="text-sm text-ink-2">Sem crianças cadastradas.</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-ink-2 uppercase font-semibold">Total de atividades concluídas</p>
                            <p className="text-2xl font-display font-bold text-ink">{details.completions_count}</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
