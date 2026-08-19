import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { formatApiError } from '../lib/api';
import AppShell from '../components/AppShell';
import BottomNav from '../components/BottomNav';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '../components/ui/dialog';
import { LogOut, Trash2, Edit3, Shield, ChevronRight, Plus, ShieldCheck, Baby, Bell, LifeBuoy } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
    const { user, children, activeChild, isAdmin, refreshChildren, logout, deleteAccount } = useAuth();
    const nav = useNavigate();
    const [editing, setEditing] = useState(null); // child being edited
    const [nome, setNome] = useState('');
    const [dob, setDob] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const openEdit = (c) => {
        setNome(c.nome);
        setDob(c.dob);
        setError('');
        setEditing(c);
    };

    const saveChild = async () => {
        setSaving(true);
        setError('');
        try {
            await api.put(`/children/${editing.id}`, { nome, dob });
            await refreshChildren();
            toast.success('Perfil da criança atualizado.');
            setEditing(null);
        } catch (e) {
            setError(formatApiError(e.response?.data?.detail));
        } finally {
            setSaving(false);
        }
    };

    const removeChild = async (c) => {
        try {
            await api.delete(`/children/${c.id}`);
            await refreshChildren();
            toast.success(`Perfil de ${c.nome} removido.`);
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    const onLogout = async () => {
        await logout();
        nav('/login');
    };

    const onDelete = async () => {
        await deleteAccount();
        toast.success('Sua conta foi excluída.');
        nav('/login');
    };

    return (
        <AppShell>
            <div className="px-6 pt-10 safe-bottom">
                <h1 className="font-display text-2xl font-bold text-ink">Perfil</h1>

                <div className="mt-6 p-5 rounded-3xl bg-white shadow-warm border border-[#EADFD8]">
                    <p className="font-display font-bold text-ink text-lg">{user?.name}</p>
                    <p className="text-sm text-ink-2">{user?.email}</p>
                    {isAdmin && (
                        <Button
                            data-testid="profile-admin-btn"
                            onClick={() => nav('/admin')}
                            className="mt-4 rounded-full bg-ink hover:bg-ink/90 w-full h-12"
                        >
                            <ShieldCheck size={18} className="mr-2" />
                            Abrir painel de administração
                        </Button>
                    )}
                </div>

                <div className="mt-4 rounded-3xl bg-white shadow-warm border border-[#EADFD8] divide-y divide-[#EADFD8] overflow-hidden">
                    <button type="button" onClick={() => nav('/notificacoes')} className="w-full flex items-center gap-3 p-4 min-h-[58px] text-left hover:bg-[#FDF6F0]"><Bell size={20} className="text-coral" /><span className="flex-1"><span className="block font-medium text-ink">Notificações</span><span className="block text-xs text-ink-2 mt-0.5">Avisos, dicas e preferências de recebimento</span></span><ChevronRight size={18} className="text-ink-2" /></button>
                    <button type="button" onClick={() => nav('/suporte')} className="w-full flex items-center gap-3 p-4 min-h-[58px] text-left hover:bg-[#FDF6F0]"><LifeBuoy size={20} className="text-sage" /><span className="flex-1"><span className="block font-medium text-ink">Contato e suporte</span><span className="block text-xs text-ink-2 mt-0.5">Envie uma mensagem e acompanhe o atendimento</span></span><ChevronRight size={18} className="text-ink-2" /></button>
                </div>

                {/* Children list */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-display text-lg font-bold text-ink">Suas crianças</h2>
                        <button
                            data-testid="profile-add-child-btn"
                            onClick={() => nav('/cadastro-crianca')}
                            className="text-sm text-coral font-semibold flex items-center gap-1"
                        >
                            <Plus size={14} /> Adicionar
                        </button>
                    </div>
                    <div className="space-y-3">
                        {children.map((c) => (
                            <div key={c.id} data-testid={`child-item-${c.id}`} className="p-4 rounded-3xl bg-white shadow-warm border border-[#EADFD8] flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[#FDECE8] flex items-center justify-center flex-shrink-0">
                                    <span className="font-display text-xl font-bold text-coral">
                                        {c.nome.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-ink truncate">
                                        {c.nome}
                                        {c.id === activeChild?.id && <span className="ml-2 text-xs text-coral">ativa</span>}
                                    </p>
                                    <p className="text-xs text-ink-2">Nasc.: {c.dob}</p>
                                </div>
                                <Button
                                    data-testid={`edit-child-btn-${c.id}`}
                                    variant="outline"
                                    onClick={() => openEdit(c)}
                                    className="h-10 rounded-full border-[#EADFD8]"
                                >
                                    <Edit3 size={14} />
                                </Button>
                                {children.length > 1 && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                data-testid={`del-child-btn-${c.id}`}
                                                variant="outline"
                                                className="h-10 rounded-full border-destructive/30 text-destructive"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-3xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Remover {c.nome}?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    O perfil, atividades concluídas e favoritos desta criança serão apagados.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    data-testid={`del-child-confirm-${c.id}`}
                                                    onClick={() => removeChild(c)}
                                                    className="rounded-full bg-destructive hover:bg-destructive/90"
                                                >
                                                    Remover
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        ))}
                        {children.length === 0 && (
                            <button
                                onClick={() => nav('/cadastro-crianca')}
                                className="w-full p-6 rounded-3xl bg-[#FCF6EA] flex flex-col items-center text-center"
                            >
                                <Baby size={28} className="text-coral" />
                                <p className="mt-2 font-semibold text-ink">Cadastre sua primeira criança</p>
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-6 rounded-3xl bg-white shadow-warm border border-[#EADFD8] divide-y divide-[#EADFD8] overflow-hidden">
                    <div className="w-full flex items-center gap-3 p-4 min-h-[56px]">
                        <Shield size={20} className="text-sage" />
                        <div className="flex-1">
                            <p className="font-medium text-ink">Privacidade e LGPD</p>
                            <p className="text-xs text-ink-2">Seus dados ficam apenas no seu dispositivo e no nosso servidor seguro.</p>
                        </div>
                    </div>

                    <button data-testid="profile-logout-btn" onClick={onLogout} className="w-full flex items-center gap-3 p-4 min-h-[56px] text-left hover:bg-[#FDF6F0]">
                        <LogOut size={20} className="text-ink-2" />
                        <span className="flex-1 font-medium text-ink">Sair</span>
                        <ChevronRight size={18} className="text-ink-2" />
                    </button>
                </div>

                <div className="mt-8">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-2 mb-2 px-2">Zona sensível</p>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                data-testid="profile-delete-account-btn"
                                className="w-full flex items-center gap-3 p-4 min-h-[56px] rounded-3xl bg-white border border-destructive/30 text-destructive hover:bg-[#FDECE8]"
                            >
                                <Trash2 size={20} />
                                <span className="flex-1 text-left font-medium">Excluir minha conta</span>
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="font-display">Excluir sua conta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação apaga todos os seus dados: perfil, crianças, atividades concluídas e favoritos. Não é possível desfazer.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    data-testid="confirm-delete-account-btn"
                                    onClick={onDelete}
                                    className="rounded-full bg-destructive hover:bg-destructive/90"
                                >
                                    Sim, excluir tudo
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Edit child dialog */}
            <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent className="rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-display">Editar {editing?.nome}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Nome</Label>
                            <Input
                                id="edit-name"
                                data-testid="edit-child-name"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="mt-2 h-12 rounded-2xl border-[#EADFD8]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-dob">Data de nascimento</Label>
                            <Input
                                id="edit-dob"
                                type="date"
                                max={new Date().toISOString().slice(0, 10)}
                                data-testid="edit-child-dob"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="mt-2 h-12 rounded-2xl border-[#EADFD8]"
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="outline" onClick={() => setEditing(null)} className="rounded-full">Cancelar</Button>
                        <Button data-testid="edit-child-save" onClick={saveChild} disabled={saving} className="rounded-full bg-coral hover:bg-[#D9684C]">
                            {saving ? 'Salvando…' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <BottomNav />
        </AppShell>
    );
}
