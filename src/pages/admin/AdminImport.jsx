import { useEffect, useState } from 'react';
import api, { formatApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Upload, FileJson, Check, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';

const SAMPLE = `[
  {
    "fase": "primeira_semana",
    "categoria": "sensorial",
    "titulo": "Massagem suave nos pés",
    "objetivo": "Relaxar e estimular percepção tátil.",
    "materiais": ["Óleo vegetal", "Toalha"],
    "passos": [
      "Deite o bebê de costas em ambiente aquecido",
      "Aqueça o óleo nas mãos",
      "Faça movimentos circulares na sola dos pés"
    ],
    "duracao_min": 10,
    "cuidados": "Nunca massageie logo após mamar."
  }
]`;

export default function AdminImport() {
    const [text, setText] = useState('');
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [committing, setCommitting] = useState(false);

    const submitPreview = async (bodyText, contentType) => {
        setLoading(true);
        setPreview(null);
        try {
            const { data } = await api.post('/admin/activities/import/preview', bodyText, {
                headers: { 'Content-Type': contentType },
                transformRequest: (d) => d,
            });
            setPreview(data);
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        } finally {
            setLoading(false);
        }
    };

    const previewFromText = () => {
        if (!text.trim()) {
            toast.error('Cole um JSON ou CSV primeiro');
            return;
        }
        const trimmed = text.trim();
        const isJson = trimmed.startsWith('[') || trimmed.startsWith('{');
        submitPreview(text, isJson ? 'application/json' : 'text/csv');
    };

    const onFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const buf = await file.text();
        setText(buf);
        const ct = file.name.toLowerCase().endsWith('.csv') ? 'text/csv' : 'application/json';
        submitPreview(buf, ct);
    };

    const commit = async () => {
        if (!preview?.to_create?.length) return;
        setCommitting(true);
        try {
            const { data } = await api.post('/admin/activities/import/commit', { activities: preview.to_create });
            toast.success(`${data.created} atividades importadas (${data.skipped} ignoradas)`);
            setPreview(null);
            setText('');
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        } finally {
            setCommitting(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Importar atividades</h1>
                <p className="text-ink-2 mt-1">Envie dezenas de atividades em JSON ou CSV. Duplicatas (mesmo título + fase + categoria) são ignoradas.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-white shadow-warm border border-[#EADFD8]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <FileJson size={18} className="text-coral" />
                            <p className="font-display font-bold text-ink">Cole o conteúdo</p>
                        </div>
                        <div>
                            <label
                                data-testid="import-file-label"
                                className="cursor-pointer inline-flex items-center gap-2 h-10 px-4 rounded-full bg-ink text-white text-sm font-semibold"
                            >
                                <Upload size={14} />
                                Enviar arquivo
                                <input
                                    type="file"
                                    accept=".json,.csv,application/json,text/csv"
                                    onChange={onFile}
                                    className="hidden"
                                    data-testid="import-file-input"
                                />
                            </label>
                        </div>
                    </div>
                    <Textarea
                        data-testid="import-textarea"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={16}
                        placeholder={SAMPLE}
                        className="rounded-2xl bg-[#FDF6F0] border-[#EADFD8] font-mono text-xs"
                    />
                    <div className="mt-3 flex gap-2">
                        <Button
                            data-testid="import-preview-btn"
                            onClick={previewFromText}
                            disabled={loading || !text.trim()}
                            className="rounded-full bg-coral hover:bg-[#D9684C]"
                        >
                            {loading ? 'Analisando…' : 'Pré-visualizar'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setText(SAMPLE)}
                            className="rounded-full border-[#EADFD8]"
                        >
                            Ver exemplo
                        </Button>
                    </div>
                    <div className="mt-4 p-3 rounded-2xl bg-[#FDF6F0]">
                        <p className="text-xs font-semibold text-ink mb-1">Campos aceitos:</p>
                        <p className="text-xs text-ink-2 leading-relaxed">
                            <strong>fase</strong> (slug ou id: primeira_semana, um_mes, seis_meses, tres_anos) • <strong>categoria</strong> (slug ou id) • <strong>titulo</strong> • objetivo • materiais (lista ou "|") • passos (lista ou "|") • duracao_min • cuidados • imagem_url
                        </p>
                    </div>
                </div>

                <div className="p-5 rounded-3xl bg-white shadow-warm border border-[#EADFD8]">
                    <p className="font-display font-bold text-ink mb-3">Pré-visualização</p>
                    {!preview ? (
                        <div className="p-8 text-center text-ink-2">
                            <Upload size={28} className="mx-auto opacity-50" />
                            <p className="mt-2 text-sm">Cole ou envie um arquivo para ver o resultado aqui.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-2">
                                <Stat testId="preview-total" label="Total" value={preview.total} color="#84A59D" />
                                <Stat testId="preview-valid" label="Válidas" value={preview.valid - preview.duplicates} color="#84A59D" />
                                <Stat testId="preview-duplicates" label="Duplicadas" value={preview.duplicates} color="#B48A3A" />
                                <Stat testId="preview-invalid" label="Erros" value={preview.invalid} color="#E87A5D" />
                            </div>

                            {preview.to_create?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold uppercase text-ink-2 mb-2">Serão criadas ({preview.to_create.length})</p>
                                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                                        {preview.to_create.map((v, i) => (
                                            <div key={i} data-testid={`preview-create-${i}`} className="p-2 rounded-xl bg-[#F5F9F5] text-sm text-ink flex items-center gap-2">
                                                <Check size={14} className="text-sage flex-shrink-0" />
                                                <span className="truncate">
                                                    {v.titulo}
                                                    <span className="text-ink-2 text-xs ml-2">
                                                        {preview.stage_titles[v.age_stage_id]} • {preview.cat_names[v.category_id]}
                                                    </span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {preview.duplicate_items?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold uppercase text-ink-2 mb-2">Ignoradas (duplicadas)</p>
                                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                        {preview.duplicate_items.map((v, i) => (
                                            <div key={i} className="p-2 rounded-xl bg-[#FCF6EA] text-sm text-ink-2 flex items-center gap-2">
                                                <AlertTriangle size={14} className="text-[#B48A3A] flex-shrink-0" />
                                                <span className="truncate">{v.titulo}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {preview.errors?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold uppercase text-ink-2 mb-2">Erros</p>
                                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                                        {preview.errors.map((e, i) => (
                                            <div key={i} data-testid={`preview-error-${i}`} className="p-2 rounded-xl bg-[#FDECE8] text-sm text-destructive flex items-center gap-2">
                                                <X size={14} className="flex-shrink-0" />
                                                <span className="truncate">Linha {e.line}: {e.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex gap-2">
                                <Button variant="outline" onClick={() => setPreview(null)} className="rounded-full flex-1 border-[#EADFD8]">
                                    Cancelar
                                </Button>
                                <Button
                                    data-testid="import-commit-btn"
                                    onClick={commit}
                                    disabled={committing || !preview.to_create?.length}
                                    className="rounded-full flex-1 bg-coral hover:bg-[#D9684C]"
                                >
                                    {committing ? 'Importando…' : `Importar ${preview.to_create.length}`}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value, color, testId }) {
    return (
        <div data-testid={testId} className="p-3 rounded-2xl bg-[#FDF6F0] text-center">
            <p className="font-display text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-ink-2">{label}</p>
        </div>
    );
}
