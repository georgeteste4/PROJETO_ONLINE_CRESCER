import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import { getRuntimeBasePath } from './lib/runtime';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 60_000, refetchOnWindowFocus: false },
    },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </React.StrictMode>
);

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
        const publicPath = getRuntimeBasePath();
        const serviceWorkerUrl = `${publicPath || ''}/service-worker.js`;
        const scope = `${publicPath || ''}/`;
        navigator.serviceWorker.register(serviceWorkerUrl, { scope }).catch(() => {});
    });
}
