import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { formatApiError } from '../lib/api';
import { supabase } from '../lib/supabase';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Baby, Camera, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ChildRegistration() {
    const nav = useNavigate();
    const { refreshChild } = useAuth();
    const [nome, setNome] = useState('');
    const [dob, setDob] = useState('');
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    const onPhotoChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Escolha uma imagem JPG, PNG ou WebP.'); return; }
        if (file.size > 5 * 1024 * 1024) { setError('A foto precisa ter no máximo 5 MB.'); return; }
        if (preview) URL.revokeObjectURL(preview);
        setPhoto(file);
        setPreview(URL.createObjectURL(file));
        setError('');
    };

    const removePhoto = () => { if (preview) URL.revokeObjectURL(preview); setPhoto(null); setPreview(''); };

    const uploadPhoto = async () => {
        if (!photo) return null;
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) throw new Error('Sua sessão expirou. Entre novamente.');
        const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${authData.user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('child-photos').upload(path, photo, { upsert: false, contentType: photo.type, cacheControl: '3600' });
        if (uploadError) throw uploadError;
        const { data: signedData, error: signedError } = await supabase.storage.from('child-photos').createSignedUrl(path, 60 * 60 * 24 * 365);
        if (signedError) throw signedError;
        return signedData?.signedUrl || null;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const foto_url = await uploadPhoto();
            await api.post('/children', { nome, dob, foto_url });
            await refreshChild();
            toast.success(`Que alegria conhecer ${nome}!`);
            nav('/');
        } catch (err) {
            setError(formatApiError(err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppShell>
            <div className="px-6 pt-10 pb-10 min-h-screen flex flex-col">
                <div className="relative mx-auto"><div className="w-24 h-24 rounded-3xl bg-[#FDECE8] flex items-center justify-center shadow-warm overflow-hidden">{preview ? <img src={preview} alt="Pré-visualização da foto da criança" className="w-full h-full object-cover" /> : <Baby size={44} className="text-coral" strokeWidth={1.8} />}</div>{preview && <button type="button" aria-label="Remover foto" onClick={removePhoto} className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center"><X size={15} /></button>}</div>
                <label htmlFor="child-photo" className="mx-auto mt-3 inline-flex items-center gap-2 text-sm font-bold text-coral cursor-pointer"><Camera size={16} /> {preview ? 'Trocar foto' : 'Adicionar foto (opcional)'}</label><input id="child-photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={onPhotoChange} className="sr-only" />

                <h1 className="mt-6 font-display text-3xl font-bold text-ink text-center">Conte sobre sua criança</h1><p className="mt-2 text-ink-2 text-center">Vamos personalizar as sugestões pela idade dela.</p>
                <form onSubmit={onSubmit} className="mt-8 space-y-5"><div><Label htmlFor="nome" className="text-ink font-medium">Nome</Label><Input id="nome" required data-testid="child-name-input" value={nome} onChange={(e) => setNome(e.target.value)} className="mt-2 h-14 rounded-2xl bg-white border-[#EADFD8] text-base" placeholder="Ex: Alice" /></div><div><Label htmlFor="dob" className="text-ink font-medium">Data de nascimento</Label><Input id="dob" type="date" required max={new Date().toISOString().slice(0, 10)} data-testid="child-dob-input" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-2 h-14 rounded-2xl bg-white border-[#EADFD8] text-base" /></div>{error && <div data-testid="child-error" className="text-sm text-destructive bg-[#FDECE8] rounded-xl px-4 py-3 flex items-start gap-2"><ImagePlus size={16} className="mt-0.5 flex-shrink-0" />{error}</div>}<div className="space-y-3 pt-2"><Button type="submit" disabled={loading} data-testid="child-submit-btn" className="w-full h-14 rounded-full bg-coral hover:bg-[#D9684C] text-white text-base font-bold shadow-warm">{loading ? 'Salvando…' : 'Continuar'}</Button><Button type="button" variant="ghost" data-testid="child-cancel-btn" className="w-full h-12 rounded-full text-ink-2 hover:text-ink font-medium" onClick={() => nav('/')}>Cancelar</Button></div></form>
            </div>
        </AppShell>
    );
}
