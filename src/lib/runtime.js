const DEFAULT_PROJECT_PATH = '/PROJETO_ONLINE_CRESCER';

function normalizePath(value) {
    const raw = String(value || '').trim();
    if (!raw || raw === '/') return '';
    return `/${raw.replace(/^\/+|\/+$/g, '')}`;
}

export function getRuntimeBasePath() {
    const configured = normalizePath(process.env.REACT_APP_BASE_PATH);
    if (configured) return configured;
    if (typeof window === 'undefined') return '';

    const pathname = window.location.pathname || '/';
    if (pathname === DEFAULT_PROJECT_PATH || pathname.startsWith(`${DEFAULT_PROJECT_PATH}/`)) {
        return DEFAULT_PROJECT_PATH;
    }
    return '';
}

export function appBaseUrl() {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${getRuntimeBasePath()}`;
}

export function appUrl(path = '') {
    const suffix = String(path || '');
    const normalizedSuffix = suffix ? `/${suffix.replace(/^\/+/, '')}` : '';
    return `${appBaseUrl()}${normalizedSuffix}` || '/';
}

export function assetUrl(path) {
    return appUrl(path);
}
