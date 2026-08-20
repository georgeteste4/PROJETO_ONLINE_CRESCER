import { useEffect, useMemo, useState } from 'react';
import { Bot, CheckCircle2, ChevronRight, Database, Layers3, RefreshCw, Sparkles, Wand2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api, { formatApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { PageLoading } from '../../components/LoadingSkeletons';

const KINDS = [
    { value: 'activities', label: 'Atividades', hint: 'Crie atividades completas ligadas a uma fase e categoria.', icon: Sparkles },
    { value: 'categories', label: 'Categorias', hint: 'Crie novos eixos editoriais para a biblioteca.', icon: Database },
    { value: 'age_stages', label: 'Fases', hint: 'Crie faixas de desenvolvimento com textos de apoio.', icon: Layers3 },
    { value: 'pinned_suggestions', label: 'Sugestões fixas', hint: 'Selecione atividades existentes para destacar no início.', icon: CheckCircle2 },
];
const KIND_LABELS = Object.fromEntries(KINDS.map((item) => [item.value, item.label]));

function asId(value) { return value === 'none' ? '' : value; }

export default function AdminAIGeneration() {
    const [kind, setKind] = useState('activities');
    const [prompts, setPrompts] = useState([]);
    const [stages, setStages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [models, setModels] = useState([]);
    const [model, setModel] = useState('');
    const [count, setCount] = useState(5);
    const [ageStageId, setAgeStageId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [promptKey, setPromptKey] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [userPrompt, setUserPrompt] = useState('');
    const [output, setOutput] = useState([]);
    const [jobId, setJobId] = useState('');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState('');
    const [modelError, setModelError] = useState('');

    const loadJobs = async () => {
        try {
            const { data } = await api.get('/admin/ai-jobs', { params: { limit: 20 } });
            setJobs(data || []);
        } catch (e) {
            setJobs([]);
        }
    };

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [stageResponse, categoryResponse, promptResponse, settingsResponse] = await Promise.all([
                api.get('/age-stages'),
                api.get('/categories'),
                api.get('/admin/prompts'),
                api.get('/admin/settings'),
            ]);
            setStages(stageResponse.data || []);
            setCategories(categoryResponse.data || []);
            setPrompts(promptResponse.data || []);
            const settings = Object.fromEntries((settingsResponse.data || []).map((row) => [row.key, row.value_json]));
            setModel(String(settings['ai.default_model'] || 'openai/gpt-4o-mini'));
            setCount(Math.min(20, Math.max(1, Number(settings['ai.max_batch_items']) || 5)));
            await loadJobs();
            try {
                const modelsResponse = await api.get('/admin/ai-models');
                setModels(modelsResponse.data || []);
                setModelError('');
            } catch (e) {
                setModelError(formatApiError(e.response?.data?.detail || e.message));
            }
        } catch (e) {
            setError(formatApiError(e.response?.data?.detail || e.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line

    const kindPrompts = useMemo(() => prompts.filter((item) => item.kind === kind), [prompts, kind]);
    const selectedPrompt = useMemo(() => kindPrompts.find((item) => item.prompt_key === promptKey) || kindPrompts[0] || null, [kindPrompts, promptKey]);

    useEffect(() => {
        if (selectedPrompt) {
            setPromptKey(selectedPrompt.prompt_key);
            setSystemPrompt(selectedPrompt.system_prompt || '');
            setUserPrompt(selectedPrompt.user_prompt || '');
        }
    }, [selectedPrompt]);

    useEffect(() => {
        setOutput([]);
        setJobId('');
    }, [kind]);

    const canGenerate = kind !== 'activities' || (ageStageId && categoryId);

    const generate = async () => {
        if (!canGenerate) {
            toast.error('Selecione a fase e a categoria para gerar atividades.');
            return;
        }
        setGenerating(true);
        setError('');
        try {
            const { data } = await api.post('/admin/ai-generate', {
                kind,
                prompt_key: promptKey,
                model: model.trim(),
                count: Math.min(20, Math.max(1, Number(count) || 1)),
                system_prompt: systemPrompt,
                user_prompt: userPrompt,
                context: { age_stage_id: ageStageId, category_id: categoryId },
            });
            setOutput(data.output_json || []);
            setJobId(data.job_id || '');
            await loadJobs();
            toast.success(`${data.output_json?.length || 0} item(ns) gerado(s) para revisão`);
        } catch (e) {
            setError(formatApiError(e.response?.data?.detail || e.message));
            toast.error(formatApiError(e.response?.data?.detail || e.message));
        } finally {
            setGenerating(false);
        }
    };

    const apply = async () => {
        if (!jobId || !output.length) return;
        setApplying(true);
        try {
            const { data } = await api.post(`/admin/ai-apply/${jobId}`, {});
            toast.success(`${data.created_count || 0} item(ns) aplicado(s) ao catálogo`);
            setOutput([]);
            setJobId('');
            await loadJobs();
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail || e.message));
        } finally {
            setApplying(false);
        }
    };

    const loadJobOutput = (job) => {
        if (job.status === 'generated' && Array.isArray(job.output_json)) {
            setKind(job.kind);
            setModel(job.model);
            setOutput(job.output_json);
            setJobId(job.id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loading) return <PageLoading variant="settings" admin />;
    if (error && !prompts.length) return <div className="rounded-3xl bg-white p-8 border border-[#EADFD8] shadow-warm text-center"><AlertCircle className="mx-auto text-coral mb-3" size={28} /><h1 className="font-display text-xl font-bold text-ink">Não foi possível preparar o gerador</h1><p className="text-ink-2 mt-2">{error}</p><Button onClick={load} className="mt-5 rounded-full bg-ink"><RefreshCw size={16} className="mr-2" /> Tentar novamente</Button></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] font-bold text-coral">Estúdio editorial</p><h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">Gerar com IA</h1><p className="text-ink-2 mt-1">Gere rascunhos estruturados, revise com calma e só então aplique ao catálogo.</p></div><Button variant="outline" onClick={load} className="rounded-full border-[#EADFD8] bg-white"><RefreshCw size={16} className="mr-2" /> Atualizar</Button></div>

            <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm p-5 sm:p-6"><div className="flex items-start gap-3 mb-5"><div className="w-11 h-11 rounded-2xl bg-[#EEEAFE] text-[#7354A8] flex items-center justify-center"><Bot size={21} /></div><div><h2 className="font-display text-xl font-bold text-ink">Novo lote</h2><p className="text-sm text-ink-2 mt-1">A geração usa JSON estruturado e sempre passa por revisão humana.</p></div></div>
                <div className="grid sm:grid-cols-2 gap-3 mb-5">{KINDS.map(({ value, label, hint, icon: Icon }) => <button key={value} type="button" onClick={() => setKind(value)} className={`text-left rounded-2xl border p-4 transition ${kind === value ? 'border-coral bg-[#FFF4EF] shadow-sm' : 'border-[#F0E7E1] bg-[#FCFAF8] hover:bg-white'}`}><div className="flex items-center gap-2"><Icon size={17} className={kind === value ? 'text-coral' : 'text-ink-2'} /><span className="font-bold text-ink">{label}</span>{kind === value && <ChevronRight size={16} className="ml-auto text-coral" />}</div><p className="text-xs text-ink-2 mt-2 leading-relaxed">{hint}</p></button>)}</div>
                <div className="grid sm:grid-cols-3 gap-4"><div><Label>Template de prompt</Label><Select value={promptKey || undefined} onValueChange={setPromptKey}><SelectTrigger className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]"><SelectValue placeholder="Selecione…" /></SelectTrigger><SelectContent className="rounded-2xl">{kindPrompts.map((prompt) => <SelectItem key={prompt.prompt_key} value={prompt.prompt_key}>{prompt.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Modelo OpenRouter</Label><Input value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]" placeholder="provider/model" />{models.length > 0 ? <p className="text-xs text-ink-2 mt-1">{models.length} modelos compatíveis carregados.</p> : modelError ? <p className="text-xs text-[#B24C3C] mt-1">{modelError}</p> : null}</div><div><Label>Quantidade</Label><Input type="number" min={1} max={20} value={count} onChange={(e) => setCount(e.target.value)} className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]" /><p className="text-xs text-ink-2 mt-1">Limite operacional: 20 itens.</p></div></div>
                {(kind === 'activities' || kind === 'pinned_suggestions') && <div className="grid sm:grid-cols-2 gap-4 mt-4"><div><Label>Fase {kind === 'activities' && <span className="text-coral">*</span>}</Label><Select value={ageStageId || 'none'} onValueChange={(value) => setAgeStageId(asId(value))}><SelectTrigger className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]"><SelectValue placeholder="Todas as fases" /></SelectTrigger><SelectContent className="rounded-2xl"><SelectItem value="none">Todas as fases</SelectItem>{stages.map((stage) => <SelectItem key={stage.id} value={stage.id}>{stage.titulo}</SelectItem>)}</SelectContent></Select></div>{kind === 'activities' && <div><Label>Categoria <span className="text-coral">*</span></Label><Select value={categoryId || 'none'} onValueChange={(value) => setCategoryId(asId(value))}><SelectTrigger className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]"><SelectValue placeholder="Selecione…" /></SelectTrigger><SelectContent className="rounded-2xl"><SelectItem value="none">Selecione…</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.nome}</SelectItem>)}</SelectContent></Select></div>}</div>}
                <div className="grid lg:grid-cols-2 gap-4 mt-5"><div><Label>Instruções do sistema</Label><Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={8} className="mt-1 rounded-2xl bg-white border-[#EADFD8]" /></div><div><Label>Prompt editável</Label><Textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} rows={8} className="mt-1 rounded-2xl bg-white border-[#EADFD8]" /><p className="text-xs text-ink-2 mt-2">Use <code className="font-mono">{'{{count}}'}</code>, <code className="font-mono">{'{{age_stage_id}}'}</code> e <code className="font-mono">{'{{category_id}}'}</code> para inserir contexto automaticamente.</p></div></div>
                {error && <div className="mt-4 rounded-2xl bg-[#FDECE8] text-[#9D473B] px-4 py-3 text-sm flex items-start gap-2"><AlertCircle size={17} className="mt-0.5 flex-shrink-0" />{error}</div>}
                <div className="flex justify-end mt-5"><Button onClick={generate} disabled={generating || !model.trim() || !promptKey || !canGenerate} className="rounded-full bg-coral hover:bg-[#D9684C] h-12 px-5"><Wand2 size={17} className="mr-2" />{generating ? 'Gerando…' : 'Gerar rascunho'}</Button></div>
            </section>

            {output.length > 0 && <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm p-5 sm:p-6"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5"><div><p className="text-xs uppercase tracking-[0.16em] font-bold text-[#426A9A]">Revisão obrigatória</p><h2 className="font-display text-xl font-bold text-ink mt-1">Saída gerada</h2><p className="text-sm text-ink-2 mt-1">Leia os itens e confirme se estão adequados ao catálogo. Job: <code className="font-mono text-xs">{jobId}</code></p></div><Button onClick={apply} disabled={applying || !jobId} className="rounded-full bg-ink hover:bg-ink/90"><CheckCircle2 size={16} className="mr-2" />{applying ? 'Aplicando…' : 'Aplicar ao catálogo'}</Button></div><div className="space-y-3">{output.map((item, index) => <article key={`${jobId}-${index}`} className="rounded-2xl bg-[#FCFAF8] border border-[#F0E7E1] p-4"><div className="flex items-center justify-between gap-3 mb-2"><span className="text-xs font-bold uppercase tracking-wide text-coral">Item {index + 1}</span>{item?.titulo && <span className="font-semibold text-ink truncate">{item.titulo}</span>}</div><pre className="max-h-56 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-ink-2">{JSON.stringify(item, null, 2)}</pre></article>)}</div></section>}

            <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm p-5 sm:p-6"><div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-display text-xl font-bold text-ink">Jobs recentes</h2><p className="text-sm text-ink-2 mt-1">Reabra um rascunho gerado anteriormente para revisar ou aplicar.</p></div><span className="rounded-full bg-[#FCFAF8] px-3 py-1 text-xs font-bold text-ink-2">{jobs.length} registros</span></div>{jobs.length === 0 ? <p className="text-sm text-ink-2">Nenhum job gerado ainda.</p> : <div className="space-y-2">{jobs.map((job) => <button type="button" key={job.id} onClick={() => loadJobOutput(job)} disabled={job.status !== 'generated'} className={`w-full text-left rounded-2xl border p-4 transition ${job.status === 'generated' ? 'border-[#F0E7E1] bg-[#FCFAF8] hover:bg-[#FFF4EF]' : 'border-[#F0E7E1] bg-[#FCFAF8] opacity-70 cursor-default'}`}><div className="flex items-center gap-3"><div className="flex-1 min-w-0"><p className="font-semibold text-ink truncate">{KIND_LABELS[job.kind] || job.kind} <span className="font-normal text-ink-2">· {job.model}</span></p><p className="text-xs text-ink-2 mt-1">{new Date(job.created_at).toLocaleString('pt-BR')} · {Array.isArray(job.output_json) ? job.output_json.length : 0} item(ns)</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${job.status === 'generated' ? 'bg-[#E9F6EE] text-[#2B7A48]' : job.status === 'failed' ? 'bg-[#FDECE8] text-[#B24C3C]' : 'bg-[#FFF5D9] text-[#8B6A18]'}`}>{job.status}</span>{job.status === 'generated' && <ChevronRight size={17} className="text-ink-2" />}</div></button>)}</div>}</section>
        </div>
    );
}
