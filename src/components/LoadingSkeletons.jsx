import { Skeleton } from './ui/skeleton';

function SkeletonBlock({ className = '' }) {
    return <Skeleton aria-hidden="true" className={`bg-[#EFE6DF] ${className}`} />;
}

export function PageHeaderSkeleton({ admin = false }) {
    return <div className="space-y-3" aria-hidden="true">
        <SkeletonBlock className="h-3 w-24 rounded-full" />
        <SkeletonBlock className={`h-8 ${admin ? 'w-72' : 'w-56'} rounded-xl`} />
        <SkeletonBlock className="h-4 w-full max-w-md rounded-full" />
    </div>;
}

export function ListSkeleton({ count = 5, compact = false }) {
    return <div className={`space-y-3 ${compact ? '' : 'mt-5'}`} aria-hidden="true">
        {Array.from({ length: count }, (_, index) => <div key={index} className="flex items-center gap-3 rounded-3xl border border-[#F0E7E1] bg-white p-4 shadow-warm">
            <SkeletonBlock className="h-11 w-11 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2"><SkeletonBlock className="h-4 w-3/4 rounded-full" /><SkeletonBlock className="h-3 w-1/2 rounded-full" /></div>
            <SkeletonBlock className="h-5 w-5 rounded-full" />
        </div>)}
    </div>;
}

export function CardGridSkeleton({ count = 4 }) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => <div key={index} className="rounded-3xl border border-[#F0E7E1] bg-white p-5 shadow-warm"><SkeletonBlock className="h-11 w-11 rounded-2xl" /><SkeletonBlock className="mt-5 h-5 w-4/5 rounded-full" /><SkeletonBlock className="mt-3 h-4 w-full rounded-full" /><SkeletonBlock className="mt-2 h-4 w-2/3 rounded-full" /></div>)}
    </div>;
}

export function DetailSkeleton() {
    return <div className="space-y-5" aria-hidden="true"><SkeletonBlock className="h-56 w-full rounded-[2rem]" /><div className="rounded-3xl border border-[#F0E7E1] bg-white p-5 shadow-warm sm:p-7"><SkeletonBlock className="h-8 w-4/5 rounded-xl" /><SkeletonBlock className="mt-4 h-4 w-full rounded-full" /><SkeletonBlock className="mt-2 h-4 w-11/12 rounded-full" /><SkeletonBlock className="mt-7 h-5 w-32 rounded-full" /><div className="mt-4 space-y-3"><SkeletonBlock className="h-4 w-full rounded-full" /><SkeletonBlock className="h-4 w-10/12 rounded-full" /><SkeletonBlock className="h-4 w-8/12 rounded-full" /></div></div></div>;
}

export function FormSkeleton({ fields = 4 }) {
    return <div className="rounded-3xl border border-[#F0E7E1] bg-white p-5 shadow-warm sm:p-7" aria-hidden="true"><SkeletonBlock className="h-7 w-2/3 rounded-xl" /><SkeletonBlock className="mt-3 h-4 w-full max-w-lg rounded-full" /><div className="mt-7 space-y-5">{Array.from({ length: fields }, (_, index) => <div key={index} className="space-y-2"><SkeletonBlock className="h-3 w-28 rounded-full" /><SkeletonBlock className="h-12 w-full rounded-2xl" /></div>)}</div><SkeletonBlock className="mt-6 h-12 w-40 rounded-full" /></div>;
}

export function DashboardSkeleton() {
    return <div className="space-y-6" aria-hidden="true"><div className="flex items-center justify-between"><div className="space-y-3"><SkeletonBlock className="h-3 w-20 rounded-full" /><SkeletonBlock className="h-8 w-56 rounded-xl" /></div><SkeletonBlock className="h-11 w-11 rounded-full" /></div><div className="rounded-[2rem] border border-[#F0E7E1] bg-white p-5 shadow-warm"><div className="flex items-center gap-3"><SkeletonBlock className="h-12 w-12 rounded-2xl" /><div className="flex-1 space-y-2"><SkeletonBlock className="h-5 w-40 rounded-full" /><SkeletonBlock className="h-3 w-28 rounded-full" /></div></div><SkeletonBlock className="mt-5 h-16 w-full rounded-2xl" /></div><div className="space-y-3"><SkeletonBlock className="h-5 w-36 rounded-full" /><SkeletonBlock className="h-40 w-full rounded-[2rem]" /><ListSkeleton count={4} compact /></div></div>;
}

export function ProgressSkeleton() {
    return <div className="space-y-5" aria-hidden="true"><div className="grid gap-3 sm:grid-cols-3"><CardGridSkeleton count={3} /></div><div className="rounded-3xl border border-[#F0E7E1] bg-white p-5 shadow-warm"><SkeletonBlock className="h-6 w-48 rounded-xl" /><SkeletonBlock className="mt-5 h-56 w-full rounded-2xl" /></div></div>;
}

export function AdminTableSkeleton({ rows = 6 }) {
    return <div className="overflow-hidden rounded-3xl border border-[#EADFD8] bg-white shadow-warm" aria-hidden="true"><div className="border-b border-[#F0E7E1] p-4"><SkeletonBlock className="h-11 w-full rounded-2xl" /></div><div className="space-y-0">{Array.from({ length: rows }, (_, index) => <div key={index} className="flex items-center gap-4 border-b border-[#F0E7E1] p-4 last:border-b-0"><SkeletonBlock className="h-10 w-10 rounded-xl" /><div className="min-w-0 flex-1 space-y-2"><SkeletonBlock className="h-4 w-2/3 rounded-full" /><SkeletonBlock className="h-3 w-1/3 rounded-full" /></div><SkeletonBlock className="h-8 w-20 rounded-full" /></div>)}</div></div>;
}

export function AdminDashboardSkeleton() {
    return <div className="space-y-6" aria-hidden="true"><PageHeaderSkeleton admin /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="rounded-3xl border border-[#F0E7E1] bg-white p-5 shadow-warm"><SkeletonBlock className="h-10 w-10 rounded-2xl" /><SkeletonBlock className="mt-5 h-8 w-20 rounded-xl" /><SkeletonBlock className="mt-2 h-3 w-24 rounded-full" /></div>)}</div><div className="grid gap-5 lg:grid-cols-2"><SkeletonBlock className="h-72 rounded-3xl" /><SkeletonBlock className="h-72 rounded-3xl" /></div></div>;
}

export function SettingsSkeleton() {
    return <div className="space-y-6" aria-hidden="true"><PageHeaderSkeleton admin />{Array.from({ length: 4 }, (_, index) => <div key={index} className="rounded-3xl border border-[#F0E7E1] bg-white p-5 shadow-warm"><SkeletonBlock className="h-6 w-52 rounded-xl" /><SkeletonBlock className="mt-3 h-4 w-3/4 rounded-full" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><SkeletonBlock className="h-12 rounded-2xl" /><SkeletonBlock className="h-12 rounded-2xl" /></div></div>)}</div>;
}

export function PageLoading({ variant = 'content', admin = false }) {
    const content = variant === 'dashboard' ? <DashboardSkeleton /> : variant === 'progress' ? <ProgressSkeleton /> : variant === 'detail' ? <DetailSkeleton /> : variant === 'form' ? <FormSkeleton /> : variant === 'list' ? <><PageHeaderSkeleton admin={admin} /><ListSkeleton /></> : variant === 'grid' ? <><PageHeaderSkeleton admin={admin} /><CardGridSkeleton /></> : variant === 'table' ? <><PageHeaderSkeleton admin={admin} /><AdminTableSkeleton /></> : variant === 'admin-dashboard' ? <AdminDashboardSkeleton /> : variant === 'settings' ? <SettingsSkeleton /> : <><PageHeaderSkeleton admin={admin} /><CardGridSkeleton count={3} /></>;
    return <div className="min-h-[45vh] w-full animate-fade-up" role="status" aria-live="polite" aria-label="Carregando conteúdo"><span className="sr-only">Carregando conteúdo…</span>{content}</div>;
}
