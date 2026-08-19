import { useEffect, useState } from 'react';
import api, { formatApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const empty = {
    slug: '', titulo: '', descricao: '',
    min_days: 0, max_days: 0,
    dados_gerais: '', desenvolvimento: '', dicas: '', cuidados: '',
};

export default function AdminAgeStages() {
    const [items, setItems] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        const { data } = await api.get('/age-stages');
        setItems(data);
    };
    useEffect(() => { load(); }, []);

    const openNew = () => { setForm(empty); setEditing('new'); };
    const openEdit = (it) => { setForm({ ...empty, ...it }); setEditing(it); };

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                slug: form.slug, titulo: form.titulo, descricao: form.descricao,
                min_days: Number(form.min_days), max_days: Number(form.max_days),
                dados_gerais: form.dados_gerais || '',
                desenvolvimento: form.desenvolvimento || '',
                dicas: form.dicas || '',
                cuidados: form.cuidados || '',
            };
            if (editing === 'new') {
                await api.post('/admin/age-stages', payload);
                toast.success('Fase criada');
            } else {
                await api.put(`/admin/age-stages/${editing.id}`, payload);
                toast.success('Fase atualizada');
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
            await api.delete(`/admin/age-stages/${it.id}`);
            toast.success('Fase excluída');
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Fases</h1>
                    <p className="text-ink-2 mt-1">Faixas etárias com dados gerais, desenvolvimento, dicas e cuidados.</p>
                </div>
                <Button data-testid="new-stage-btn" onClick={openNew} className="rounded-full bg-coral hover:bg-[#D9684C]">
                    <Plus size={16} className="mr-1" /> Nova fase
                </Button>
            </div>

            <div className="space-y-3">
                {items.map((s) => (
                    <div key={s.id} data-testid={`stage-${s.id}`} className="p-5 rounded-3xl bg-white shadow-warm border border-[#EADFD8]">
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <p className="font-display font-bold text-ink text-lg">{s.titulo}</p>
                                <p className="text-xs text-ink-2">{s.slug} • {s.min_days}–{s.max_days} dias</p>
                                <p className="text-sm text-ink-2 mt-2">{s.descricao}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <Button data-testid={`edit-stage-${s.id}`} variant="outline" onClick={() => openEdit(s)} className="h-10 rounded-full border-[#EADFD8]">
                                    <Edit3 size={14} />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button data-testid={`del-stage-${s.id}`} variant="outline" className="h-10 rounded-full border-destructive/30 text-destructive">
                                            <Trash2 size={14} />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-3xl">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir {s.titulo}?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Não é possível excluir fases com atividades vinculadas.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => del(s)} className="rounded-full bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                            <StagePreview label="Geral" value={s.dados_gerais} />
                            <StagePreview label="Desenvolvimento" value={s.desenvolvimento} />
                            <StagePreview label="Dicas" value={s.dicas} />
                            <StagePreview label="Cuidados" value={s.cuidados} />
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-display">{editing === 'new' ? 'Nova fase' : 'Editar fase'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                                <Label>Título</Label>
                                <Input data-testid="stage-form-titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="mt-1 h-12 rounded-2xl border-[#EADFD8]" />
                            </div>
                            <div>
                                <Label>Slug</Label>
                                <Input data-testid="stage-form-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1 h-12 rounded-2xl border-[#EADFD8]" />
                            </div>
                        </div>
                        <div>
                            <Label>Descrição curta</Label>
                            <Textarea data-testid="stage-form-desc" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1 rounded-2xl border-[#EADFD8]" rows={2} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Dia mínimo</Label>
                                <Input data-testid="stage-form-min" type="number" min={0} value={form.min_days} onChange={(e) => setForm({ ...form, min_days: e.target.value })} className="mt-1 h-12 rounded-2xl border-[#EADFD8]" />
                            </div>
                            <div>
                                <Label>Dia máximo</Label>
                                <Input data-testid="stage-form-max" type="number" min={0} value={form.max_days} onChange={(e) => setForm({ ...form, max_days: e.target.value })} className="mt-1 h-12 rounded-2xl border-[#EADFD8]" />
                            </div>
                        </div>
                        <div>
                            <Label>Dados gerais</Label>
                            <Textarea data-testid="stage-form-geral" value={form.dados_gerais} onChange={(e) => setForm({ ...form, dados_gerais: e.target.value })} className="mt-1 rounded-2xl border-[#EADFD8]" rows={3} />
                        </div>
                        <div>
                            <Label>Desenvolvimento</Label>
                            <Textarea data-testid="stage-form-desenv" value={form.desenvolvimento} onChange={(e) => setForm({ ...form, desenvolvimento: e.target.value })} className="mt-1 rounded-2xl border-[#EADFD8]" rows={3} />
                        </div>
                        <div>
                            <Label>Dicas</Label>
                            <Textarea data-testid="stage-form-dicas" value={form.dicas} onChange={(e) => setForm({ ...form, dicas: e.target.value })} className="mt-1 rounded-2xl border-[#EADFD8]" rows={3} />
                        </div>
                        <div>
                            <Label>Cuidados</Label>
                            <Textarea data-testid="stage-form-cuidados" value={form.cuidados} onChange={(e) => setForm({ ...form, cuidados: e.target.value })} className="mt-1 rounded-2xl border-[#EADFD8]" rows={3} />
                        </div>
                    </div>
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="outline" onClick={() => setEditing(null)} className="rounded-full">Cancelar</Button>
                        <Button data-testid="stage-form-save" onClick={save} disabled={saving || !form.slug || !form.titulo} className="rounded-full bg-coral hover:bg-[#D9684C]">
                            {saving ? 'Salvando…' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StagePreview({ label, value }) {
    return (
        <div className="p-3 rounded-2xl bg-[#FDF6F0]">
            <p className="text-xs font-semibold uppercase text-ink-2">{label}</p>
            <p className="text-sm text-ink mt-1 line-clamp-3">{value || <span className="text-ink-2 italic">— vazio —</span>}</p>
        </div>
    );
}
