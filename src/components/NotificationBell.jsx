import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function NotificationBell({ className = '' }) {
    const nav = useNavigate();
    const [count, setCount] = useState(0);
    const previousCount = useRef(null);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get('/notifications/unread-count');
            const nextCount = Number(data?.count) || 0;
            if (previousCount.current !== null && nextCount > previousCount.current && document.hidden && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Novo aviso no Crescer+', { body: 'Você recebeu uma nova notificação dentro do Crescer+.', icon: `${process.env.PUBLIC_URL || ''}/icon-192.png` });
            }
            previousCount.current = nextCount;
            setCount(nextCount);
        } catch {
            // O contador é uma melhoria de UX; a central continua acessível mesmo se ele falhar.
        }
    }, []);

    useEffect(() => {
        load();
        const onFocus = () => load();
        window.addEventListener('focus', onFocus);
        const interval = window.setInterval(load, 60000);
        return () => {
            window.removeEventListener('focus', onFocus);
            window.clearInterval(interval);
        };
    }, [load]);

    return <button type="button" onClick={() => nav('/notificacoes')} aria-label={count ? `${count} notificações não lidas` : 'Notificações'} className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink shadow-warm border border-[#EADFD8] transition hover:bg-[#FDF6F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-coral ${className}`}><Bell size={19} />{count > 0 && <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-coral px-1.5 py-0.5 text-center text-[10px] font-extrabold leading-4 text-white" aria-hidden="true">{count > 99 ? '99+' : count}</span>}</button>;
}
