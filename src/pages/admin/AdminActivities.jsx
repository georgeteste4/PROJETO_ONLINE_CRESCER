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
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { Plus, Edit3, Trash2, Search, Clock } from 'lucide-react';
import { toast } from 'sonner';

const empty = {
    age_stage_id: '',
    category_id: '',
    titulo: '',
    objetivo: '',
    materiais_text: '',
    passos_text: '',
    duracao_min: 10,
    cuidados: '',
    imagem_url: '',
    disclaimer: 'Conteúdo educativo, não substitui avaliação profissional.',
};

export default function AdminActivities() {
    const [items, setItems] = useState([]);
    const [stages, setStages] = useState([]);
    const [cats, setCats] = useState([]);
    const [q, setQ] = useState('');
    const [filterStage, setFilterStage] = useState('all');
    const [filterCat, setFilterCat] = useState('all');
    const [editing, setEditing] = useState(null); // null | activity obj | 'new'
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (q) params.q = q;
            if (filterStage !== 'all') params.age_stage_id = filterStage;
            if (filterCat !== 'all') params.category_id = filterCat;
            const { data } = await api.get('/admin/activities', { params });
            setItems(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        api.get('/age-stages').then((r) => setStages(r.data)).catch(() => {});
        api.get('/categories').then((r) => setCats(r.data)).catch(() => {});
        load();
    }, []); // eslint-disable-line

    useEffect(() => { load(); }, [filterStage, filterCat]); // eslint-disable-line

    const openNew = () => {
        setForm({ ...empty });
        setEditing('new');
    };

    const openEdit = (it) => {
        setForm({
            ...it,
            materiais_text: (it.materiais || []).join('\n'),
            passos_text: (it.passos || []).join('\n'),
            imagem_url: it.imagem_url || '',
        });
        setEditing(it);
    };

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                age_stage_id: form.age_stage_id,
                category_id: form.category_id,
                titulo: form.titulo,
                objetivo: form.objetivo,
                materiais: form.materiais_text.split('\n').map((s) => s.trim()).filter(Boolean),
                passos: form.passos_text.split('\n').map((s) => s.trim()).filter(Boolean),
                duracao_min: Number(form.duracao_min) || 10,
                cuidados: form.cuidados,
                imagem_url: form.imagem_url || null,
                disclaimer: form.disclaimer,
            };
            if (editing === 'new') {
                await api.post('/admin/activities', payload);
                toast.success('Atividade criada');
            } else {
                await api.put(`/admin/activities/${editing.id}`, payload);
                toast.success('Atividade atualizada');
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
            await api.delete(`/admin/activities/${it.id}`);
            toast.success('Atividade excluída');
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));
    const stageMap = Object.fromEntries(stages.map((s) => [s.id, s]));

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Atividades</h1>
                    <p className="text-ink-2 mt-1">Crie, edite e organize o conteúdo do Crescer+.</p>
                </div>
                <Button data-testid="new-activity-btn" onClick={openNew} className="rounded-full bg-coral hover:bg-[#D9684C]">
                    <Plus size={16} className="mr-1" /> Nova atividade
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <form
                    onSubmit={(e) => { e.preventDefault(); load(); }}
                    className="flex gap-2 flex-1"
                >
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" />
                        <Input
                            data-testid="activities-search"
                            placeholder="Buscar pelo título"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="pl-9 h-11 rounded-full bg-white border-[#EADFD8]"
                        />
                    </div>
                    <Button type="submit" className="rounded-full bg-ink hover:bg-ink/90">Buscar</Button>
                </form>
                <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger data-testid="filter-stage" className="w-full sm:w-48 h-11 rounded-full bg-white border-[#EADFD8]">
                        <SelectValue placeholder="Fase" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                        <SelectItem value="all">Todas as fases</SelectItem>
                        {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.titulo}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterCat} onValueChange={setFilterCat}>
                    <SelectTrigger data-testid="filter-cat" className="w-full sm:w-48 h-11 rounded-full bg-white border-[#EADFD8]">
                        <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-3xl bg-white shadow-warm border border-[#EADFD8] overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-ink-2">Carregando…</div>
                ) : items.length === 0 ? (
                    <div className="p-8 text-center text-ink-2">Nenhuma atividade.</div>
                ) : (
                    <ul className="divide-y divide-[#EADFD8]">
                        {items.map((it) => (
                            <li key={it.id} data-testid={`admin-activity-${it.id}`} className="p-4 flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                                     style={{ background: `${catMap[it.category_id]?.cor}22`, color: catMap[it.category_id]?.cor }}>
                                    <span className="font-display font-bold">
                                        {catMap[it.category_id]?.nome?.charAt(0) || 'A'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-ink truncate">{it.titulo}</p>
                                    <p className="text-xs text-ink-2 truncate">
                                        {stageMap[it.age_stage_id]?.titulo || '?'} • {catMap[it.category_id]?.nome || '?'}
                                        <span className="mx-1">•</span>
                                        <Clock size={10} className="inline mr-1" />{it.duracao_min}min
                                    </p>
                                </div>
                                <Button
                                    data-testid={`edit-activity-${it.id}`}
                                    variant="outline"
                                    onClick={() => openEdit(it)}
                                    className="h-10 rounded-full border-[#EADFD8]"
                                >
                                    <Edit3 size={14} />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            data-testid={`delete-activity-${it.id}`}
                                            variant="outline"
                                            className="h-10 rounded-full border-destructive/30 text-destructive"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-3xl">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir "{it.titulo}"?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Isso removerá também as fixações desta atividade nas sugestões.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                data-testid={`delete-activity-confirm-${it.id}`}
                                                onClick={() => del(it)}
                                                className="rounded-full bg-destructive hover:bg-destructive/90"
                                            >
                                                Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Editor */}
            <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
                <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-display">
                            {editing === 'new' ? 'Nova atividade' : 'Editar atividade'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                                <Label>Fase</Label>
                                <Select value={form.age_stage_id} onValueChange={(v) => setForm({ ...form, age_stage_id: v })}>
                                    <SelectTrigger data-testid="form-stage" className="mt-1 h-12 rounded-2xl bg-white border-[#EADFD8]">
                                        <SelectValue placeholder="Selecione…" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.titulo}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Categoria</Label>
                                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                                    <SelectTrigger data-testid="form-cat" className="mt-1 h-12 rounded-2xl bg-white border-[#EADFD8]">
                                        <SelectValue placeholder="Selecione…" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Título</Label>
                            <Input data-testid="form-titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="mt-1 h-12 rounded-2xl bg-white border-[#EADFD8]" />
                        </div>
                        <div>
                            <Label>Objetivo</Label>
                            <Textarea data-testid="form-objetivo" value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} className="mt-1 rounded-2xl bg-white border-[#EADFD8]" rows={2} />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                                <Label>Materiais (um por linha)</Label>
                                <Textarea data-testid="form-materiais" value={form.materiais_text} onChange={(e) => setForm({ ...form, materiais_text: e.target.value })} className="mt-1 rounded-2xl bg-white border-[#EADFD8]" rows={4} placeholder={"Cobertor leve\nAmbiente aquecido"} />
                            </div>
                            <div>
                                <Label>Passos (um por linha)</Label>
                                <Textarea data-testid="form-passos" value={form.passos_text} onChange={(e) => setForm({ ...form, passos_text: e.target.value })} className="mt-1 rounded-2xl bg-white border-[#EADFD8]" rows={4} placeholder={"Deite-se em posição confortável\nColoque o bebê sobre o peito"} />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3">
                            <div>
                                <Label>Duração (min)</Label>
                                <Input data-testid="form-duracao" type="number" min={1} value={form.duracao_min} onChange={(e) => setForm({ ...form, duracao_min: e.target.value })} className="mt-1 h-12 rounded-2xl bg-white border-[#EADFD8]" />
                            </div>
                            <div className="sm:col-span-2">
                                <Label>Imagem (URL)</Label>
                                <Input data-testid="form-imagem" value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} className="mt-1 h-12 rounded-2xl bg-white border-[#EADFD8]" placeholder="https://…" />
                            </div>
                        </div>
                        <div>
                            <Label>Cuidados</Label>
                            <Textarea data-testid="form-cuidados" value={form.cuidados} onChange={(e) => setForm({ ...form, cuidados: e.target.value })} className="mt-1 rounded-2xl bg-white border-[#EADFD8]" rows={2} />
                        </div>
                        <div>
                            <Label>Disclaimer</Label>
                            <Textarea data-testid="form-disclaimer" value={form.disclaimer} onChange={(e) => setForm({ ...form, disclaimer: e.target.value })} className="mt-1 rounded-2xl bg-white border-[#EADFD8]" rows={2} />
                        </div>
                    </div>
                    <DialogFooter className="mt-6 gap-2">
                        <Button variant="outline" onClick={() => setEditing(null)} className="rounded-full">Cancelar</Button>
                        <Button
                            data-testid="form-save-btn"
                            onClick={save}
                            disabled={saving || !form.age_stage_id || !form.category_id || !form.titulo}
                            className="rounded-full bg-coral hover:bg-[#D9684C]"
                        >
                            {saving ? 'Salvando…' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
