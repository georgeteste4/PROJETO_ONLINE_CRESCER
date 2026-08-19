import { useEffect, useMemo, useState } from 'react';
import api, { formatApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select';
import { Pin, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPinned() {
    const [stages, setStages] = useState([]);
    const [activities, setActivities] = useState([]);
    const [pinned, setPinned] = useState([]);
    const [selectedStage, setSelectedStage] = useState('');
    const [toAdd, setToAdd] = useState('');

    useEffect(() => {
        api.get('/age-stages').then((r) => {
            setStages(r.data);
            if (r.data.length && !selectedStage) setSelectedStage(r.data[0].id);
        });
        api.get('/admin/activities').then((r) => setActivities(r.data));
    }, []); // eslint-disable-line

    const load = async () => {
        if (!selectedStage) return;
        const { data } = await api.get('/admin/pinned-suggestions', { params: { age_stage_id: selectedStage } });
        setPinned(data);
    };
    useEffect(() => { load(); }, [selectedStage]); // eslint-disable-line

    const stageActs = useMemo(
        () => activities.filter((a) => a.age_stage_id === selectedStage),
        [activities, selectedStage],
    );
    const actMap = useMemo(() => Object.fromEntries(activities.map((a) => [a.id, a])), [activities]);
    const pinnedIds = new Set(pinned.map((p) => p.activity_id));
    const available = stageActs.filter((a) => !pinnedIds.has(a.id));

    const doPin = async () => {
        if (!toAdd) return;
        try {
            await api.post('/admin/pinned-suggestions', { age_stage_id: selectedStage, activity_id: toAdd });
            toast.success('Atividade fixada');
            setToAdd('');
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    const doUnpin = async (pin) => {
        try {
            await api.delete(`/admin/pinned-suggestions/${pin.id}`);
            toast.success('Removida');
            load();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Sugestões fixas</h1>
                <p className="text-ink-2 mt-1">Escolha atividades que sempre aparecerão como sugestão do dia para uma fase. Se nenhuma estiver fixada, o sistema faz seleção automática.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end mb-4">
                <div className="flex-1">
                    <label className="text-sm text-ink-2 font-medium">Fase</label>
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                        <SelectTrigger data-testid="pin-stage-select" className="mt-1 h-12 rounded-full bg-white border-[#EADFD8]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.titulo}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1">
                    <label className="text-sm text-ink-2 font-medium">Adicionar atividade</label>
                    <div className="mt-1 flex gap-2">
                        <Select value={toAdd} onValueChange={setToAdd}>
                            <SelectTrigger data-testid="pin-activity-select" className="h-12 rounded-full bg-white border-[#EADFD8]">
                                <SelectValue placeholder="Escolher…" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                                {available.length === 0 && <SelectItem value="none" disabled>Todas fixadas</SelectItem>}
                                {available.map((a) => <SelectItem key={a.id} value={a.id}>{a.titulo}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button data-testid="pin-add-btn" onClick={doPin} disabled={!toAdd || toAdd === 'none'} className="rounded-full bg-coral hover:bg-[#D9684C]">
                            <Plus size={14} className="mr-1" /> Fixar
                        </Button>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl bg-white shadow-warm border border-[#EADFD8] p-2">
                {pinned.length === 0 ? (
                    <div data-testid="pinned-empty" className="p-6 text-center text-ink-2">
                        Nenhuma atividade fixada — o sistema vai rotacionar automaticamente.
                    </div>
                ) : (
                    <ul className="divide-y divide-[#EADFD8]">
                        {pinned.map((p) => (
                            <li key={p.id} data-testid={`pinned-${p.id}`} className="p-3 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#FCF6EA] text-coral flex items-center justify-center">
                                    <Pin size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-ink truncate">{actMap[p.activity_id]?.titulo || p.activity_id}</p>
                                </div>
                                <Button data-testid={`unpin-${p.id}`} variant="outline" onClick={() => doUnpin(p)} className="h-10 rounded-full border-destructive/30 text-destructive">
                                    <Trash2 size={14} />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
