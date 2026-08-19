import { useEffect, useMemo, useState } from 'react';
import { Save, Settings, RefreshCw, CheckCircle2, AlertCircle, Clock3, FileText, Mail as MailIcon, Send, ShieldCheck, ExternalLink } from 'lucide-react';
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
const INVITE_SETTING_FIELDS = [
    { key: 'invites.expiration_days', label: 'Validade do convite', description: 'Número de dias até um link deixar de funcionar. O limite é de 1 a 30 dias.', type: 'number', min: 1, max: 30 },
    { key: 'invites.delivery_mode', label: 'Entrega do convite', description: 'O link é gerado pela plataforma e pode ser compartilhado manualmente.', type: 'select', options: [{ value: 'manual', label: 'Manual — copiar link' }] },
];
const EMAIL_SETTING_FIELDS = [
    { key: 'email.fallback_provider', label: 'Provedor de fallback', description: 'Usado se o provedor padrão falhar. Deixe sem fallback para não tentar outro serviço.', type: 'select', options: [{ value: 'none', label: 'Sem fallback' }, { value: 'native', label: 'Supabase Auth nativo' }, { value: 'resend', label: 'Resend' }, { value: 'mailtrap', label: 'Mailtrap' }] },
    { key: 'email.from_name', label: 'Nome padrão do remetente', description: 'Usado como referência para novos provedores.', type: 'text', placeholder: 'Crescer+' },
    { key: 'email.from_email', label: 'E-mail padrão do remetente', description: 'Use um endereço de domínio verificado no provedor escolhido.', type: 'email', placeholder: 'no-reply@seudominio.com' },
    { key: 'email.reply_to', label: 'Responder para', description: 'Endereço opcional para respostas dos usuários.', type: 'email', placeholder: 'suporte@seudominio.com' },
    { key: 'email.test_recipient', label: 'Destinatário de teste', description: 'Endereço usado pelo botão de teste dos provedores.', type: 'email', placeholder: 'seu-email@exemplo.com' },
];

const PROVIDER_LABELS = { native: 'Supabase Auth nativo', resend: 'Resend', mailtrap: 'Mailtrap' };

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

function providerStatusStyle(provider) {
    if (provider.last_test_status === 'ok') return 'bg-[#E9F6EE] text-[#2B7A48]';
    if (provider.last_test_status === 'failed') return 'bg-[#FDECE8] text-[#B24C3C]';
    if (provider.last_test_status === 'manual') return 'bg-[#FFF5D9] text-[#8B6A18]';
    return 'bg-[#F3EEEA] text-ink-2';
}

export default function AdminSettings() {
    const [settings, setSettings] = useState({});
    const [providers, setProviders] = useState([]);
    const [prompts, setPrompts] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selectedPromptKey, setSelectedPromptKey] = useState('');
    const [promptDraft, setPromptDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingKey, setSavingKey] = useState('');
    const [savingProvider, setSavingProvider] = useState('');
    const [testingProvider, setTestingProvider] = useState('');
    const [savingPrompt, setSavingPrompt] = useState(false);
    const [expandedJob, setExpandedJob] = useState(null);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [settingsResponse, providersResponse, promptsResponse, jobsResponse] = await Promise.all([
                api.get('/admin/settings'),
                api.get('/admin/email-providers'),
                api.get('/admin/prompts'),
                api.get('/admin/ai-jobs', { params: { limit: 30 } }),
            ]);
            const nextSettings = Object.fromEntries((settingsResponse.data || []).map((row) => [row.key, toValue(row)]));
            setSettings(nextSettings);
            setProviders(providersResponse.data || []);
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
            const normalized = field.type === 'number' ? Math.min(field.max || 20, Math.max(field.min || 1, Number(value) || field.min || 1)) : value === 'none' ? '' : value;
            await api.put(`/admin/settings/${encodeURIComponent(field.key)}`, { value_json: normalized });
            setSettings((current) => ({ ...current, [field.key]: normalized }));
            toast.success('Configuração salva');
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail || e.message));
        } finally {
            setSavingKey('');
        }
    };

    const saveProvider = async (provider) => {
        setSavingProvider(provider.provider);
        try {
            const { data } = await api.put(`/admin/email-providers/${provider.provider}`, provider);
            setProviders((current) => current.map((item) => item.provider === data.provider ? data : item));
            toast.success(`${PROVIDER_LABELS[provider.provider]} atualizado`);
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail || e.message));
        } finally {
            setSavingProvider('');
        }
    };

    const selectProvider = async (provider) => {
        try {
            await api.put('/admin/email-provider-select', { provider });
            setProviders((current) => current.map((item) => ({ ...item, enabled: item.provider === provider })));
            setSettings((current) => ({ ...current, 'email.default_provider': provider }));
            toast.success(`${PROVIDER_LABELS[provider]} selecionado como padrão`);
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail || e.message));
        }
    };

    const testProvider = async (provider) => {
        const recipient = String(settings['email.test_recipient'] || '').trim();
        if (!recipient) {
            toast.error('Informe o destinatário de teste antes de testar.');
            return;
        }
        setTestingProvider(provider);
        try {
            const { data } = await api.post('/admin/email-test', { provider, recipient });
            setProviders((current) => current.map((item) => item.provider === provider ? { ...item, last_test_status: data.status === 'manual' ? 'manual' : 'ok', last_tested_at: new Date().toISOString(), last_test_message: data.message || 'Teste enviado.' } : item));
            toast.success(data.status === 'manual' ? 'O provedor nativo depende do SMTP configurado no Supabase.' : 'E-mail de teste enviado.');
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail || e.message));
            setProviders((current) => current.map((item) => item.provider === provider ? { ...item, last_test_status: 'failed', last_tested_at: new Date().toISOString(), last_test_message: formatApiError(e.response?.data?.detail || e.message) } : item));
        } finally {
            setTestingProvider('');
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

    if (loading) return <div className="space-y-4" aria-busy="true"><div className="h-10 w-64 rounded-2xl bg-white/70 animate-pulse" /><div className="h-48 rounded-3xl bg-white/70 animate-pulse" /><div className="h-64 rounded-3xl bg-white/70 animate-pulse" /></div>;
    if (error) return <div className="rounded-3xl bg-white p-8 border border-[#EADFD8] shadow-warm text-center"><AlertCircle className="mx-auto text-coral mb-3" size={28} /><h1 className="font-display text-xl font-bold text-ink">Não foi possível carregar as configurações</h1><p className="text-ink-2 mt-2">{error}</p><Button onClick={load} className="mt-5 rounded-full bg-ink"><RefreshCw size={16} className="mr-2" /> Tentar novamente</Button></div>;

    return <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] font-bold text-coral">Administração</p><h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">Configurações</h1><p className="text-ink-2 mt-1">Controle conteúdo, autenticação, provedores e parâmetros operacionais.</p></div><Button variant="outline" onClick={load} className="rounded-full border-[#EADFD8] bg-white"><RefreshCw size={16} className="mr-2" /> Atualizar</Button></div>

        <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm p-5 sm:p-6"><div className="flex items-start gap-3 mb-5"><div className="w-11 h-11 rounded-2xl bg-[#FFF1EB] text-coral flex items-center justify-center"><MailIcon size={20} /></div><div><h2 className="font-display text-xl font-bold text-ink">Provedores de e-mail</h2><p className="text-sm text-ink-2 mt-1">Escolha o provedor padrão para convites e mensagens transacionais. As chaves ficam somente como secrets da Edge Function.</p></div></div><div className="rounded-2xl bg-[#FFF9E8] border border-[#F1D98A] p-4 text-sm text-[#725C18] mb-5"><strong>Como funciona:</strong> cadastro e recuperação de senha continuam usando o Supabase Auth. Para enviá-los por Resend ou Mailtrap, configure o Send Email Hook no dashboard do Supabase apontando para a Edge Function `email-service`. O envio por API de convites e testes usa o provedor selecionado aqui.</div><div className="space-y-4">{providers.map((provider) => <div key={provider.provider} className={`rounded-3xl border p-4 sm:p-5 ${provider.enabled ? 'border-coral bg-[#FFF9F6]' : 'border-[#F0E7E1] bg-[#FCFAF8]'}`}><div className="flex flex-col sm:flex-row sm:items-start gap-4"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-lg font-bold text-ink">{PROVIDER_LABELS[provider.provider]}</h3>{provider.enabled && <span className="rounded-full bg-coral text-white px-2.5 py-1 text-xs font-bold">Padrão</span>}<span className={`rounded-full px-2.5 py-1 text-xs font-bold ${providerStatusStyle(provider)}`}>{provider.last_test_status === 'ok' ? 'Teste ok' : provider.last_test_status === 'failed' ? 'Teste falhou' : provider.last_test_status === 'manual' ? 'Configuração manual' : 'Ainda não testado'}</span></div><p className="text-xs text-ink-2 mt-2">{provider.provider === 'native' ? 'Entrega gerenciada pelo SMTP do Supabase Auth.' : `API protegida pelo secret ${provider.secret_env_name}.`}</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => selectProvider(provider.provider)} disabled={provider.enabled} className="rounded-full bg-ink hover:bg-ink/90">{provider.enabled ? 'Selecionado' : 'Usar como padrão'}</Button><Button variant="outline" onClick={() => testProvider(provider.provider)} disabled={testingProvider === provider.provider} className="rounded-full border-[#EADFD8] bg-white"><Send size={15} className="mr-2" />{testingProvider === provider.provider ? 'Testando…' : 'Testar'}</Button></div></div><div className="mt-4 grid sm:grid-cols-3 gap-3"><div><Label htmlFor={`${provider.provider}-from-email`}>E-mail remetente</Label><Input id={`${provider.provider}-from-email`} type="email" value={provider.from_email || ''} onChange={(e) => setProviders((current) => current.map((item) => item.provider === provider.provider ? { ...item, from_email: e.target.value } : item))} placeholder="no-reply@seudominio.com" className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]" /></div><div><Label htmlFor={`${provider.provider}-from-name`}>Nome</Label><Input id={`${provider.provider}-from-name`} value={provider.from_name || ''} onChange={(e) => setProviders((current) => current.map((item) => item.provider === provider.provider ? { ...item, from_name: e.target.value } : item))} placeholder="Crescer+" className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]" /></div><div><Label htmlFor={`${provider.provider}-reply-to`}>Responder para</Label><Input id={`${provider.provider}-reply-to`} type="email" value={provider.reply_to || ''} onChange={(e) => setProviders((current) => current.map((item) => item.provider === provider.provider ? { ...item, reply_to: e.target.value } : item))} placeholder="suporte@seudominio.com" className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]" /></div></div><div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3"><Button onClick={() => saveProvider(provider)} disabled={savingProvider === provider.provider} className="rounded-full bg-coral hover:bg-[#D9684C]"><Save size={15} className="mr-2" />{savingProvider === provider.provider ? 'Salvando…' : 'Salvar remetente'}</Button>{provider.config_json?.docs_url && <a href={provider.config_json.docs_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-coral hover:underline">Documentação oficial <ExternalLink size={14} /></a>}{provider.provider === 'native' && <span className="text-xs text-ink-2 inline-flex items-center gap-1"><ShieldCheck size={14} /> SMTP configurado no Supabase Auth</span>}</div>{provider.last_test_message && <p className="text-xs text-ink-2 mt-3">{provider.last_test_message}</p>}</div>)}</div></section>

        <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm p-5 sm:p-6"><div className="flex items-start gap-3 mb-5"><div className="w-11 h-11 rounded-2xl bg-[#EAF1FB] text-[#426A9A] flex items-center justify-center"><Settings size={20} /></div><div><h2 className="font-display text-xl font-bold text-ink">Opções de e-mail e autenticação</h2><p className="text-sm text-ink-2 mt-1">Parâmetros gerais usados pelo envio transacional e pelo hook de autenticação.</p></div></div><div className="grid sm:grid-cols-2 gap-4">{EMAIL_SETTING_FIELDS.map((field) => <div key={field.key} className="rounded-2xl bg-[#FCFAF8] border border-[#F0E7E1] p-4"><Label htmlFor={field.key}>{field.label}</Label><p className="text-xs leading-relaxed text-ink-2 mt-1 mb-3">{field.description}</p>{field.type === 'select' ? <div className="flex gap-2"><Select value={String(settings[field.key] || 'none')} onValueChange={(value) => setSettings((current) => ({ ...current, [field.key]: value }))}><SelectTrigger id={field.key} className="h-11 rounded-xl bg-white border-[#EADFD8]"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl">{field.options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select><Button aria-label={`Salvar ${field.label}`} onClick={() => updateSetting(field, settings[field.key])} disabled={savingKey === field.key} className="h-11 rounded-xl bg-ink px-3"><Save size={16} /></Button></div> : <div className="flex gap-2"><Input id={field.key} type={field.type} value={settings[field.key] ?? ''} onChange={(e) => setSettings((current) => ({ ...current, [field.key]: e.target.value }))} placeholder={field.placeholder} className="h-11 rounded-xl bg-white border-[#EADFD8]" /><Button aria-label={`Salvar ${field.label}`} onClick={() => updateSetting(field, settings[field.key])} disabled={savingKey === field.key} className="h-11 rounded-xl bg-ink px-3"><Save size={16} /></Button></div>}</div>)}</div><div className="mt-4 rounded-2xl bg-[#FDF6F0] border border-[#F0E7E1] p-4 flex items-center justify-between gap-4"><div><Label htmlFor="email.auth_hook_enabled">Hook de e-mail Auth configurado</Label><p className="text-xs text-ink-2 mt-1">Marque somente depois de configurar a Edge Function como Send Email Hook no Supabase Auth.</p></div><button id="email.auth_hook_enabled" type="button" role="switch" aria-checked={Boolean(settings['email.auth_hook_enabled'])} onClick={() => updateSetting({ key: 'email.auth_hook_enabled', type: 'boolean' }, !settings['email.auth_hook_enabled'])} className={`relative w-14 h-8 rounded-full transition-colors ${settings['email.auth_hook_enabled'] ? 'bg-coral' : 'bg-[#D9CEC6]'}`}><span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${settings['email.auth_hook_enabled'] ? 'translate-x-7' : 'translate-x-1'}`} /></button></div></section>

        <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm p-5 sm:p-6"><div className="flex items-start gap-3 mb-5"><div className="w-11 h-11 rounded-2xl bg-[#FDECE8] text-coral flex items-center justify-center"><MailIcon size={20} /></div><div><h2 className="font-display text-xl font-bold text-ink">Configurações de convites</h2><p className="text-sm text-ink-2 mt-1">Defina por quanto tempo os links permanecem válidos e como serão compartilhados.</p></div></div><div className="grid sm:grid-cols-2 gap-4">{INVITE_SETTING_FIELDS.map((field) => <div key={field.key} className="rounded-2xl bg-[#FCFAF8] border border-[#F0E7E1] p-4"><Label htmlFor={field.key}>{field.label}</Label><p className="text-xs leading-relaxed text-ink-2 mt-1 mb-3">{field.description}</p>{field.type === 'select' ? <div className="flex gap-2"><Select value={String(settings[field.key] || field.options[0].value)} onValueChange={(value) => setSettings((current) => ({ ...current, [field.key]: value }))}><SelectTrigger id={field.key} className="h-11 rounded-xl bg-white border-[#EADFD8]"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl">{field.options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select><Button aria-label={`Salvar ${field.label}`} onClick={() => updateSetting(field, settings[field.key])} disabled={savingKey === field.key} className="h-11 rounded-xl bg-ink px-3"><Save size={16} /></Button></div> : <div className="flex gap-2"><Input id={field.key} type="number" min={field.min} max={field.max} value={settings[field.key] ?? ''} onChange={(e) => setSettings((current) => ({ ...current, [field.key]: e.target.value }))} className="h-11 rounded-xl bg-white border-[#EADFD8]" /><Button aria-label={`Salvar ${field.label}`} onClick={() => updateSetting(field, settings[field.key])} disabled={savingKey === field.key} className="h-11 rounded-xl bg-ink px-3"><Save size={16} /></Button></div>}</div>)}</div></section>

        <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm p-5 sm:p-6"><div className="flex items-start gap-3 mb-5"><div className="w-11 h-11 rounded-2xl bg-[#EEEAFE] text-[#7354A8] flex items-center justify-center"><FileText size={20} /></div><div><h2 className="font-display text-xl font-bold text-ink">Gerenciar prompts</h2><p className="text-sm text-ink-2 mt-1">Ajuste o tom editorial sem alterar o contrato estruturado de saída.</p></div></div>{prompts.length === 0 ? <p className="text-sm text-ink-2">Nenhum prompt cadastrado.</p> : <div className="grid lg:grid-cols-[220px_1fr] gap-5"><div className="space-y-2">{prompts.map((prompt) => <button key={prompt.prompt_key} type="button" onClick={() => setSelectedPromptKey(prompt.prompt_key)} className={`w-full text-left rounded-2xl px-4 py-3 transition ${prompt.prompt_key === selectedPromptKey ? 'bg-ink text-white' : 'bg-[#FCFAF8] text-ink hover:bg-[#F6EEE8]'}`}><span className="text-xs uppercase tracking-wide opacity-70">{KIND_LABELS[prompt.kind]}</span><span className="block font-semibold mt-1">{prompt.name}</span></button>)}</div><div className="space-y-4">{promptDraft && <><div className="grid sm:grid-cols-2 gap-3"><div><Label>Nome interno</Label><Input value={promptDraft.name} onChange={(e) => setPromptDraft({ ...promptDraft, name: e.target.value })} className="mt-1 h-11 rounded-xl bg-white border-[#EADFD8]" /></div><div><Label>Tipo</Label><Input value={KIND_LABELS[promptDraft.kind] || promptDraft.kind} readOnly className="mt-1 h-11 rounded-xl bg-[#FCFAF8] border-[#EADFD8]" /></div></div><div><Label>Instruções do sistema</Label><Textarea value={promptDraft.system_prompt} onChange={(e) => setPromptDraft({ ...promptDraft, system_prompt: e.target.value })} rows={5} className="mt-1 rounded-2xl bg-white border-[#EADFD8]" /></div><div><Label>Prompt do usuário</Label><Textarea value={promptDraft.user_prompt} onChange={(e) => setPromptDraft({ ...promptDraft, user_prompt: e.target.value })} rows={7} className="mt-1 rounded-2xl bg-white border-[#EADFD8]" /><p className="text-xs text-ink-2 mt-2">Variáveis: <code className="font-mono">{'{{count}}'}</code>, <code className="font-mono">{'{{age_stage_id}}'}</code>, <code className="font-mono">{'{{category_id}}'}</code>.</p></div><div className="flex justify-end"><Button onClick={savePrompt} disabled={savingPrompt} className="rounded-full bg-coral hover:bg-[#D9684C]"><Save size={16} className="mr-2" />{savingPrompt ? 'Salvando…' : 'Salvar prompt'}</Button></div></>}</div></div>}</section>

        <section className="rounded-3xl bg-white border border-[#EADFD8] shadow-warm p-5 sm:p-6"><div className="flex items-start gap-3 mb-5"><div className="w-11 h-11 rounded-2xl bg-[#EAF1FB] text-[#426A9A] flex items-center justify-center"><Clock3 size={20} /></div><div><h2 className="font-display text-xl font-bold text-ink">Histórico de geração</h2><p className="text-sm text-ink-2 mt-1">Cada job mantém o resultado para auditoria e revisão editorial.</p></div></div>{jobs.length === 0 ? <div className="rounded-2xl bg-[#FCFAF8] p-6 text-sm text-ink-2">Ainda não há jobs de geração.</div> : <div className="space-y-2">{jobs.map((job) => <div key={job.id} className="rounded-2xl border border-[#F0E7E1] bg-[#FCFAF8] p-4"><div className="flex flex-col sm:flex-row sm:items-center gap-2"><div className="flex-1 min-w-0"><p className="font-semibold text-ink truncate">{KIND_LABELS[job.kind] || job.kind} <span className="font-normal text-ink-2">· {job.model}</span></p><p className="text-xs text-ink-2 mt-1">{new Date(job.created_at).toLocaleString('pt-BR')} · {Array.isArray(job.output_json) ? job.output_json.length : 0} item(ns)</p></div><span className={`inline-flex items-center gap-1 self-start rounded-full px-3 py-1 text-xs font-bold ${statusStyle(job.status)}`}>{job.status === 'generated' && <CheckCircle2 size={13} />}{job.status === 'failed' && <AlertCircle size={13} />}{job.status}</span><Button variant="outline" onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)} className="h-9 rounded-full border-[#EADFD8] bg-white">{expandedJob === job.id ? 'Fechar' : 'Ver saída'}</Button></div>{job.error_message && <p className="text-xs text-[#B24C3C] mt-3">{job.error_message}</p>}{expandedJob === job.id && <pre className="mt-4 max-h-72 overflow-auto rounded-2xl bg-[#211D1B] text-[#FCEFE7] p-4 text-xs leading-relaxed">{JSON.stringify(job.output_json, null, 2)}</pre>}</div>)}</div>}</section>
    </div>;
}
