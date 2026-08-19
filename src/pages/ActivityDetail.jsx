import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { formatApiError } from '../lib/api';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { ArrowLeft, Heart, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const CAT_COLORS = {
    cat_sensorial: '#F2CC8F',
    cat_motor: '#E87A5D',
    cat_cognitivo: '#84A59D',
    cat_linguagem: '#A89BCC',
    cat_social: '#F2949C',
};
const CAT_NAMES = {
    cat_sensorial: 'Sensorial',
    cat_motor: 'Motor',
    cat_cognitivo: 'Cognitivo',
    cat_linguagem: 'Linguagem',
    cat_social: 'Social',
};

export default function ActivityDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [activity, setActivity] = useState(null);
    const [favorited, setFavorited] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [heartAnim, setHeartAnim] = useState(false);
    const [checkAnim, setCheckAnim] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/activities/${id}`).then((r) => setActivity(r.data)).catch((e) => setError(formatApiError(e.response?.data?.detail)));
        api.get('/favorites').then((r) => {
            setFavorited(!!r.data.find((f) => f.activity_id === id));
        }).catch(() => {});
    }, [id]);

    const onFavorite = async () => {
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 500);
        try {
            const { data } = await api.post('/favorites/toggle', { activity_id: id });
            setFavorited(data.favorited);
            toast.success(data.favorited ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    const onComplete = async () => {
        try {
            await api.post('/completions', { activity_id: id });
            setCompleted(true);
            setCheckAnim(true);
            toast.success('Atividade concluída! Parabéns 💛');
            setTimeout(() => nav('/progresso'), 900);
        } catch (e) {
            toast.error(formatApiError(e.response?.data?.detail));
        }
    };

    if (error) {
        return (
            <AppShell>
                <div className="p-6 text-center">
                    <p className="text-ink-2">{error}</p>
                    <Button onClick={() => nav(-1)} className="mt-4 rounded-full">Voltar</Button>
                </div>
            </AppShell>
        );
    }
    if (!activity) return <AppShell><div className="p-6 text-ink-2">Carregando…</div></AppShell>;

    const color = CAT_COLORS[activity.category_id];

    return (
        <AppShell>
            <div className="pb-32">
                <div className="relative h-56 overflow-hidden rounded-b-[2rem]" style={{ background: `${color}55` }}>
                    {activity.imagem_url && (
                        <img src={activity.imagem_url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                        data-testid="detail-back-btn"
                        onClick={() => nav(-1)}
                        className="absolute top-6 left-6 w-11 h-11 rounded-full bg-white/85 backdrop-blur-md shadow-warm flex items-center justify-center text-ink"
                        aria-label="Voltar"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <button
                        data-testid="detail-favorite-btn"
                        onClick={onFavorite}
                        className={`absolute top-6 right-6 w-11 h-11 rounded-full bg-white/85 backdrop-blur-md shadow-warm flex items-center justify-center ${heartAnim ? 'animate-heart-pop' : ''}`}
                        aria-label={favorited ? 'Desfavoritar' : 'Favoritar'}
                    >
                        <Heart
                            size={20}
                            className={favorited ? 'text-blush' : 'text-ink-2'}
                            fill={favorited ? '#F2949C' : 'none'}
                        />
                    </button>
                </div>

                <div className="px-6 pt-6">
                    <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: `${color}33`, color: color }}
                    >
                        {CAT_NAMES[activity.category_id]}
                    </span>
                    <h1 className="font-display text-3xl font-bold text-ink mt-3 leading-tight">{activity.titulo}</h1>
                    <div className="flex items-center gap-4 mt-3 text-sm text-ink-2">
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {activity.duracao_min} min</span>
                    </div>

                    <Section title="Objetivo">
                        <p className="text-ink-2 leading-relaxed">{activity.objetivo}</p>
                    </Section>

                    {activity.materiais && activity.materiais.length > 0 && (
                        <Section title="Materiais">
                            <ul className="space-y-2">
                                {activity.materiais.map((m, i) => (
                                    <li key={i} className="flex items-start gap-2 text-ink">
                                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-coral flex-shrink-0" />
                                        <span>{m}</span>
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    <Section title="Passo a passo">
                        <ol className="space-y-3">
                            {activity.passos.map((p, i) => (
                                <li key={i} className="p-4 rounded-2xl bg-[#FDF6F0] flex gap-3">
                                    <span
                                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-white text-sm"
                                        style={{ background: color }}
                                    >
                                        {i + 1}
                                    </span>
                                    <span className="text-ink leading-relaxed pt-1">{p}</span>
                                </li>
                            ))}
                        </ol>
                    </Section>

                    <div className="mt-6 p-4 rounded-2xl bg-[#FCF6EA] border border-[#F2CC8F]/40 flex gap-3">
                        <AlertCircle size={18} className="text-[#B48A3A] flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-ink-2">
                            <p className="font-semibold text-ink">Cuidados</p>
                            <p className="mt-1">{activity.cuidados}</p>
                            <p className="mt-2 text-xs">{activity.disclaimer}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-[#EADFD8] px-6 py-4 z-30"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
            >
                <Button
                    data-testid="detail-complete-btn"
                    disabled={completed}
                    onClick={onComplete}
                    className="w-full h-14 rounded-full bg-coral hover:bg-[#D9684C] text-white text-base font-bold shadow-warm disabled:opacity-70"
                >
                    {completed ? (
                        <span className="flex items-center gap-2">
                            <CheckCircle2 size={20} className={checkAnim ? 'animate-check-pop' : ''} />
                            Concluída!
                        </span>
                    ) : (
                        'Marcar como concluída'
                    )}
                </Button>
            </div>
        </AppShell>
    );
}

function Section({ title, children }) {
    return (
        <div className="mt-6">
            <h2 className="font-display text-lg font-bold text-ink mb-3">{title}</h2>
            {children}
        </div>
    );
}
