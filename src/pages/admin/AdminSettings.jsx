import { useEffect, useMemo, useState } from 'react';
import { Save, Settings, RefreshCw, CheckCircle2, AlertCircle, Clock3, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api, { formatApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const SETTING_FIELDS = [
    { key: 'ai.default_model', label: 'Modelo padrão', description: 'Slug do modelo OpenRouter usado quando o gerador não recebe outro modelo.', type: 'text', placeholder: 'openai/gpt-4o-mini' },
    { key: 'ai.max_batch_items', label: 'Máximo de itens por lote', description: 'Limite de segurança para cada geração (1 a 20).', type: 'number' },
    { key: 'ai.http_referer', label: 'HTTP Referer', description: 'URL pública opcional para atribuição no OpenRouter.', type: 'text', placeholder: 'https://seu-dominio.com' },
    { key: 'ai.app_title', label: 'Nome da aplicação', description: 'Nome enviado no header X-OpenRouter-Title.', type: 'text', placeholder: 'Crescer+ Conteúdo' },
];

const KIND_LABELS = { categories: 'Categorias', age_stages: 'Fases', activities: 'Atividades', pinned_suggestions: 'Sugestões fixas' };

function toValue(row) {
    if (row?.value_json === null || row?.value_json === undefined) return '';
    return row.value_json;
}

function statusStyle(status) {
    if (status === 'generated') return 'bg-[#E9F6EE] text-[#2B7A48]';
    if (status === 'applied') return 'bg-[#EAF1FB] text-[#426A9A]';
    if (status === 'failed') return 'bg-[#FDECE8] text-[#B24C3C]';
    return 'bg-[#FFF5D9] text-[#8B6A18]';
}

export default function AdminSettings() {
    const [settings, setSettings] = useState({});
    const [prompts, setPrompts] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selectedPromptKey, setSelectedPromptKey] = useState('');
    const [promptDraft, setPromptDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingKey, setSavingKey] = useState('');
    const [savingPrompt, setSavingPrompt] = useState(false);
    const [expandedJob, setExpandedJob] = useState(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [settingsResponse, promptsResponse, jobsResponse] = await Promise.all([
                api.get('/admin/settings'),
                api.get('/admin/prompts'),
                api.get('/admin/ai-jobs', { params: { limit: 30 } }),
            ]);
            const nextSettings = Object.fromEntries((settingsResponse.data || []).map((row) => [row.key, toValue(row)]));
            setSettings(nextSettings);
            setPrompts(promptsResponse.data || []);
            setJobs(jobsResponse.data || []);
            if (!selectedPromptKey && promptsResponse.data?.length) setSelectedPromptKey(promptsResponse.data[0].prompt_key);
        } catch (e) {
            setError(formatApiError(e.response?.data?.detail || e.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line

    const selectedPrompt = useMemo(() => prompts.find((item) => item.prompt_key === selectedPromptKey) || null, [prompts, selectedPromptKey]);

    useEffect(() => {
        if (selectedPrompt) setPromptDraft({ ...selectedPrompt });
    }, [selectedPrompt]);

    const updateSetting = async (field, value) => {
        setSavingKey(field.key);
        try {
            const normalized = field.type === 'number' ? Math.min(20, Math.max(1, Number(value) || 1)) : value;
            await api.put(`/admin/settings/${encodeURIComponent(field.key)}`, { value_json: normalized });
            setSettings((current) => ({ ...current, [field.key]: normalized }));
            toast.success('Configuração salva');
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail || e.message));
        } finally {
            setSavingKey('');
        }
    };

    const savePrompt = async () => {
        if (!promptDraft) return;
        setSavingPrompt(true);
        try {
            const { data } = await api.put(`/admin/prompts/${encodeURIComponent(promptDraft.prompt_key)}`, promptDraft);
            setPrompts((current) => current.map((item) => item.prompt_key === data.prompt_key ? data : item));
            toast.success('Prompt atualizado');
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail || e.message));
        } finally {
            setSavingPrompt(false);
        }
    };

    if (loading) {
        return <div className="space-y-4" aria-busy="true"><div className="h-10 w-64 rounded-2xl bg-white/70 animate-pulse" /><div className="h-48 rounded-3xl bg-white/70 animate-pulse" /><div className="h-64 rounded-3xl bg-white/70 animate-pulse" /></div>;
    }

    if (error) {
        return <div className="rounded-3xl bg-white p-8 border border-[#EADFD8] shadow-warm text-center"><AlertCircle className="mx-auto text-coral mb-3" size={28} /><h1 className="font-display text-xl font-bold text-ink">Não foi possível carregar as configurações</h1><p className="text-ink-2 mt-2">{error}</p><Button onClick={load} className="mt-5 rounded-full bg-ink"><RefreshCw size={16} className="mr-2" /> Tentar novamente</Button></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.16em] font-bold text-coral">Administração</p>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">Configurações</h1>
                    <p className="text-ink-2 mt-1">Controle o conteúdo, a revisão e os parâmetros da geração assistida.</p>
                </div>
                <Button variant="outline" onClick={load} className="rounded-full border-[#EADFD8] bg-white"><RefreshCw size={16} className="mr-2" /> Atualizar</Button>
            </div>

            <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm p-5 sm:p-6">
                <div className="flex items-start gap-3 mb-5"><div className="w-11 h-11 rounded-2xl bg-[#FDECE8] text-coral flex items-center justify-center"><Settings size={20} /></div><div><h2 className="font-display text-xl font-bold text-ink">Configurações de IA</h2><p className="text-sm text-ink-2 mt-1">A chave do OpenRouter permanece somente na Edge Function Supabase.</p></div></div>
                <div className="grid sm:grid-cols-2 gap-4">
                    {SETTING_FIELDS.map((field) => (
                        <div key={field.key} className="rounded-2xl bg-[#FCFAF8] border border-[#F0E7E1] p-4">
                            <Label htmlFor={field.key} className="text-ink">{field.label}</Label>
                            <p className="text-xs leading-relaxed text-ink-2 mt-1 mb-3">{field.description}</p>
                            <div className="flex gap-2">
                                <Input id={field.key} type={field.type} min={field.type === 'number' ? 1 : undefined} max={field.type === 'number' ? 20 : undefined} value={settings[field.key] ?? ''} placeholder={field.placeholder} onChange={(e) => setSettings((current) => ({ ...current, [field.key]: field.type === 'number' ? e.target.value : e.target.value }))} className="h-11 rounded-xl bg-white border-[#EADFD8]" />
                                <Button aria-label={`Salvar ${field.label}`} onClick={() => updateSetting(field, settings[field.key])} disabled={savingKey === field.key} className="h-11 rounded-xl bg-ink hover:bg-ink/90 px-3"><Save size={16} /></Button>
                            </div>
                        </div>
                    ))}
                    <div className="rounded-2xl bg-[#FCFAF8] border border-[#F0E7E1] p-4 sm:col-span-2 flex items-center justify-between gap-4">
                        <div><Label htmlFor="ai.require_review" className="text-ink">Exigir revisão antes de aplicar</Label><p className="text-xs leading-relaxed text-ink-2 mt-1">Recomendado para manter curadoria humana antes da publicação do catálogo.</p></div>
                        <button id="ai.require_review" type="button" role="switch" aria-checked={Boolean(settings['ai.require_review'])} onClick={() => updateSetting({ key: 'ai.require_review', type: 'boolean' }, !settings['ai.require_review'])} className={`relative w-14 h-8 rounded-full transition-colors ${settings['ai.require_review'] ? 'bg-coral' : 'bg-[#D9CEC6]'}`}><span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${settings['ai.require_review'] ? 'translate-x-7' : 'translate-x-1'}`} /></button>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm p-5 sm:p-6">
                <div className="flex items-start gap-3 mb-5"><div className="w-11 h-11 rounded-2xl bg-[#EEEAFE] text-[#7354A8] flex items-center justify-center"><FileText size={20} /></div><div><h2 className="font-display text-xl font-bold text-ink">Gerenciar prompts</h2><p className="text-sm text-ink-2 mt-1">Ajuste o tom editorial sem alterar o contrato estruturado de saída.</p></div></div>
                {prompts.length === 0 ? <p className="text-sm text-ink-2">Nenhum prompt cadastrado.</p> : <div className="grid lg:grid-cols-[220px_1fr] gap-5"><div className="space-y-2">{prompts.map((prompt) => <button key={prompt.prompt_key} type="button" onClick={() => setSelectedPromptKey(prompt.prompt_key)} className={`w-full text-left rounded-2xl px-4 py-3 transition ${prompt.prompt_key === selectedPromptKey ? 'bg-ink text-white' : 'bg-[#FCFAF8] text-ink hover:bg-[#F6EEE8]'}`}><span className="text-xs uppercase tracking-wide opacity-70">{KIND_LABELS[prompt.kind]}</span><span className="block font-semibold mt-1">{prompt.name}</span></button>)}</div><div className="space-y-4">{promptDraft && <><div className="grid sm:grid-cols-2 gap-3"><div><Label>Nome interno</Label><Input value={promptDraft.name} onChange={(e) => setPromptDraft({ ...promptDraft, name: e.target.value })} className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]" /></div><div><Label>Tipo</Label><Input value={KIND_LABELS[promptDraft.kind] || promptDraft.kind} readOnly className="mt-1 h-11 rounded-xl bg-[#FCFAF8] border-[#EADFD8]" /></div></div><div><Label>Instruções do sistema</Label><Textarea value={promptDraft.system_prompt} onChange={(e) => setPromptDraft({ ...promptDraft, system_prompt: e.target.value })} rows={5} className="mt-1 rounded-2xl bg-white border-[#EADFD8]" /></div><div><Label>Prompt do usuário</Label><Textarea value={promptDraft.user_prompt} onChange={(e) => setPromptDraft({ ...promptDraft, user_prompt: e.target.value })} rows={7} className="mt-1 rounded-2xl bg-white border-[#EADFD8]" /><p className="text-xs text-ink-2 mt-2">Variáveis disponíveis dependem do tipo: <code className="font-mono">{'{{count}}'}</code>, <code className="font-mono">{'{{age_stage_id}}'}</code>, <code className="font-mono">{'{{category_id}}'}</code>.</p></div><div className="flex justify-end"><Button onClick={savePrompt} disabled={savingPrompt} className="rounded-full bg-coral hover:bg-[#D9684C]"><Save size={16} className="mr-2" />{savingPrompt ? 'Salvando…' : 'Salvar prompt'}</Button></div></>}</div></div>}
            </section>

            <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm p-5 sm:p-6">
                <div className="flex items-start gap-3 mb-5"><div className="w-11 h-11 rounded-2xl bg-[#EAF1FB] text-[#426A9A] flex items-center justify-center"><Clock3 size={20} /></div><div><h2 className="font-display text-xl font-bold text-ink">Histórico de geração</h2><p className="text-sm text-ink-2 mt-1">Cada job mantém o resultado para auditoria e revisão editorial.</p></div></div>
                {jobs.length === 0 ? <div className="rounded-2xl bg-[#FCFAF8] p-6 text-sm text-ink-2">Ainda não há jobs de geração.</div> : <div className="space-y-2">{jobs.map((job) => <div key={job.id} className="rounded-2xl border border-[#F0E7E1] bg-[#FCFAF8] p-4"><div className="flex flex-col sm:flex-row sm:items-center gap-2"><div className="flex-1 min-w-0"><p className="font-semibold text-ink truncate">{KIND_LABELS[job.kind] || job.kind} <span className="font-normal text-ink-2">· {job.model}</span></p><p className="text-xs text-ink-2 mt-1">{new Date(job.created_at).toLocaleString('pt-BR')} · {Array.isArray(job.output_json) ? job.output_json.length : 0} item(ns)</p></div><span className={`inline-flex items-center gap-1 self-start rounded-full px-3 py-1 text-xs font-bold ${statusStyle(job.status)}`}>{job.status === 'generated' && <CheckCircle2 size={13} />}{job.status === 'failed' && <AlertCircle size={13} />}{job.status}</span><Button variant="outline" onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)} className="h-9 rounded-full border-[#EADFD8] bg-white">{expandedJob === job.id ? 'Fechar' : 'Ver saída'}</Button></div>{job.error_message && <p className="text-xs text-[#B24C3C] mt-3">{job.error_message}</p>}{expandedJob === job.id && <pre className="mt-4 max-h-72 overflow-auto rounded-2xl bg-[#211D1B] text-[#FCEFE7] p-4 text-xs leading-relaxed">{JSON.stringify(job.output_json, null, 2)}</pre>}</div>)}</div>}
            </section>
        </div>
    );
}
