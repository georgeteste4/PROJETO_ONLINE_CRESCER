import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

const LAST_PROMPT_KEY = 'crescer:pwa-last-prompt-at';
const DEFAULT_INTERVAL_DAYS = 1;

function isStandalone() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isMobileDevice() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
}

function readLastPromptAt() {
    try {
        const value = Number(localStorage.getItem(LAST_PROMPT_KEY));
        return Number.isFinite(value) ? value : 0;
    } catch {
        return 0;
    }
}

function writeLastPromptAt() {
    const value = Date.now();
    try { localStorage.setItem(LAST_PROMPT_KEY, String(value)); } catch { /* storage indisponível */ }
    return value;
}

function normalizeInterval(value) {
    const days = Number(value);
    if (!Number.isFinite(days)) return DEFAULT_INTERVAL_DAYS;
    return Math.min(365, Math.max(1, Math.round(days)));
}

export default function usePwaInstall({ enabled = true } = {}) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [installed, setInstalled] = useState(isStandalone);
    const [mobile, setMobile] = useState(isMobileDevice);
    const [lastPromptAt, setLastPromptAt] = useState(readLastPromptAt);
    const [intervalDays, setIntervalDays] = useState(DEFAULT_INTERVAL_DAYS);
    const [now, setNow] = useState(Date.now());

    const ios = useMemo(() => {
        if (typeof window === 'undefined') return false;
        return /iPhone|iPad|iPod/i.test(window.navigator.userAgent) && !installed;
    }, [installed]);

    useEffect(() => {
        const media = window.matchMedia?.('(pointer: coarse)');
        const updateMobile = () => setMobile(isMobileDevice());
        const updateInstalled = () => setInstalled(isStandalone());
        const onBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
        };
        const onInstalled = () => {
            setInstalled(true);
            setDeferredPrompt(null);
            setLastPromptAt(writeLastPromptAt());
        };
        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.addEventListener('appinstalled', onInstalled);
        window.addEventListener('pageshow', updateInstalled);
        media?.addEventListener?.('change', updateMobile);
        const timer = window.setInterval(() => setNow(Date.now()), 60_000);
        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.removeEventListener('appinstalled', onInstalled);
            window.removeEventListener('pageshow', updateInstalled);
            media?.removeEventListener?.('change', updateMobile);
            window.clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        if (!enabled) return undefined;
        let cancelled = false;
        api.get('/pwa/install-config').then(({ data }) => {
            if (!cancelled) setIntervalDays(normalizeInterval(data?.interval_days));
        }).catch(() => {
            if (!cancelled) setIntervalDays(DEFAULT_INTERVAL_DAYS);
        });
        return () => { cancelled = true; };
    }, [enabled]);

    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
    const reminderDue = !lastPromptAt || now - lastPromptAt >= intervalMs;
    const canInstall = enabled && mobile && !installed && reminderDue && Boolean(deferredPrompt || ios);

    const install = useCallback(async () => {
        if (!deferredPrompt) return { outcome: 'manual' };
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setLastPromptAt(writeLastPromptAt());
        if (result?.outcome === 'accepted') setInstalled(true);
        return result;
    }, [deferredPrompt]);

    const dismiss = useCallback(() => {
        setLastPromptAt(writeLastPromptAt());
    }, []);

    return {
        canInstall,
        hasNativePrompt: Boolean(deferredPrompt),
        isIOS: ios,
        install,
        dismiss,
        intervalDays,
    };
}
