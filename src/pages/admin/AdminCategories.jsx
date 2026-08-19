import { useEffect, useState } from 'react';
import api, { formatApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const empty = { slug: '', nome: '', cor: '#E87A5D', icone: 'Sparkles' };

export default function AdminCategories() {
    const [items, setItems] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            const { data } = await api.get('/categories');
            setItems(data);
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    useEffect(() => { load(); }, []);

    const openNew = () => { setForm(empty); setEditing('new'); };
    const openEdit = (it) => { setForm({ ...it }); setEditing(it); };

    const save = async () => {
        setSaving(true);
        try {
            const payload = { slug: form.slug, nome: form.nome, cor: form.cor, icone: form.icone };
            if (editing === 'new') {
                await api.post('/admin/categories', payload);
                toast.success('Categoria criada');
            } else {
                await api.put(`/admin/categories/${editing.id}`, payload);
                toast.success('Categoria atualizada');
            }
            setEditing(null);
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        } finally {
            setSaving(false);
        }
    };

    const del = async (it) => {
        try {
            await api.delete(`/admin/categories/${it.id}`);
            toast.success('Categoria excluída');
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Categorias</h1>
                    <p className="text-ink-2 mt-1">Os grupos de atividade que o pai vê nos filtros.</p>
                </div>
                <Button data-testid="new-category-btn" onClick={openNew} className="rounded-full bg-coral hover:bg-[#D9684C]">
                    <Plus size={16} className="mr-1" /> Nova
                </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((c) => (
                    <div key={c.id} data-testid={`category-${c.id}`} className="p-5 rounded-3xl bg-white shadow-warm border border-[#EADFD8]">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: c.cor }}>
                                <span className="font-display font-bold text-white text-lg">{c.nome.charAt(0)}</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-display font-bold text-ink">{c.nome}</p>
                                <p className="text-xs text-ink-2">{c.slug} • {c.icone}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button data-testid={`edit-cat-${c.id}`} variant="outline" onClick={() => openEdit(c)} className="flex-1 h-10 rounded-full border-[#EADFD8]">
                                <Edit3 size={14} className="mr-1" /> Editar
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button data-testid={`del-cat-${c.id}`} variant="outline" className="h-10 rounded-full border-destructive/30 text-destructive">
                                        <Trash2 size={14} />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir {c.nome}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Categorias em uso por atividades não podem ser excluídas.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => del(c)} className="rounded-full bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent className="rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="font-display">{editing === 'new' ? 'Nova categoria' : 'Editar categoria'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label>Nome</Label>
                            <Input data-testid="cat-form-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="mt-1 h-12 rounded-2xl border-[#EADFD8]" />
                        </div>
                        <div>
                            <Label>Slug</Label>
                            <Input data-testid="cat-form-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1 h-12 rounded-2xl border-[#EADFD8]" placeholder="sensorial" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Cor (hex)</Label>
                                <div className="mt-1 flex items-center gap-2">
                                    <input type="color" value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} className="w-12 h-12 rounded-2xl border border-[#EADFD8]" />
                                    <Input data-testid="cat-form-cor" value={form.cor} onChange={(e) => setForm({ ...form, cor: e.target.value })} className="h-12 rounded-2xl border-[#EADFD8]" />
                                </div>
                            </div>
                            <div>
                                <Label>Ícone (Lucide)</Label>
                                <Input data-testid="cat-form-icone" value={form.icone} onChange={(e) => setForm({ ...form, icone: e.target.value })} className="mt-1 h-12 rounded-2xl border-[#EADFD8]" placeholder="Sparkles" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="outline" onClick={() => setEditing(null)} className="rounded-full">Cancelar</Button>
                        <Button data-testid="cat-form-save" onClick={save} disabled={saving || !form.nome || !form.slug} className="rounded-full bg-coral hover:bg-[#D9684C]">
                            {saving ? 'Salvando…' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
