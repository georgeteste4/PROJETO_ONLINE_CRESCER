import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button } from './ui/button';
import usePwaInstall from '../hooks/usePwaInstall';

export default function PwaInstallPrompt() {
    const { canInstall, hasNativePrompt, isIOS, install, dismiss } = usePwaInstall();
    const [open, setOpen] = useState(false);
    const [showIosHelp, setShowIosHelp] = useState(false);

    useEffect(() => {
        if (canInstall) setOpen(true);
    }, [canInstall]);

    if (!canInstall || !open) return null;

    const close = () => {
        setOpen(false);
        dismiss();
    };

    const onInstall = async () => {
        if (hasNativePrompt) {
            const result = await install();
            if (result?.outcome === 'accepted') setOpen(false);
        } else {
            setShowIosHelp(true);
        }
    };

    return <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-3xl border border-[#EADFD8] bg-white p-4 shadow-[0_18px_55px_rgba(72,52,44,0.2)] animate-fade-up" role="dialog" aria-label="Instalar Crescer+"><div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FDECE8] text-coral"><Download size={22} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="font-display text-base font-extrabold text-ink">Leve o Crescer+ com você</p><p className="mt-1 text-sm leading-relaxed text-ink-2">Instale como app para abrir mais rápido e ter uma experiência confortável no celular.</p></div><button type="button" onClick={close} aria-label="Fechar aviso de instalação" className="rounded-full p-2 text-ink-2 hover:bg-[#FDF6F0] hover:text-ink"><X size={17} /></button></div><div className="mt-3 flex gap-2"><Button onClick={onInstall} className="h-11 rounded-full bg-coral px-4 text-sm font-bold hover:bg-[#D9684C]"><Download size={16} className="mr-2" />Instalar app</Button><Button variant="outline" onClick={close} className="h-11 rounded-full border-[#EADFD8] bg-white px-4 text-sm">Agora não</Button></div></div></div>{showIosHelp && isIOS && <div className="mt-4 rounded-2xl bg-[#FCFAF8] p-3 text-sm leading-relaxed text-ink-2"><p className="font-bold text-ink">No iPhone ou iPad</p><p className="mt-1">Toque em <Share size={15} className="inline text-coral" /> <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.</p></div>}</div>;
}
