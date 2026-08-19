import { useCallback, useEffect, useMemo, useState } from 'react';

function isStandalone() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isMobileDevice() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
}

export default function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [installed, setInstalled] = useState(isStandalone);
    const [mobile, setMobile] = useState(isMobileDevice);
    const [dismissed, setDismissed] = useState(() => {
        try { return sessionStorage.getItem('crescer:pwa-dismissed') === '1'; } catch { return false; }
    });

    const ios = useMemo(() => typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(window.navigator.userAgent) && !window.navigator.standalone, []);

    useEffect(() => {
        const media = window.matchMedia?.('(pointer: coarse)');
        const updateMobile = () => setMobile(isMobileDevice());
        const onBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
        };
        const onInstalled = () => {
            setInstalled(true);
            setDeferredPrompt(null);
            setDismissed(true);
        };
        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.addEventListener('appinstalled', onInstalled);
        media?.addEventListener?.('change', updateMobile);
        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.removeEventListener('appinstalled', onInstalled);
            media?.removeEventListener?.('change', updateMobile);
        };
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return { outcome: 'manual' };
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (result?.outcome === 'accepted') setInstalled(true);
        return result;
    }, [deferredPrompt]);

    const dismiss = useCallback(() => {
        setDismissed(true);
        try { sessionStorage.setItem('crescer:pwa-dismissed', '1'); } catch { /* sessão sem storage */ }
    }, []);

    return {
        canInstall: mobile && !installed && !dismissed && Boolean(deferredPrompt || ios),
        hasNativePrompt: Boolean(deferredPrompt),
        isIOS: ios,
        install,
        dismiss,
    };
}
