export default function AppShell({ children, className = '' }) {
    return (
        <div className="min-h-screen bg-background">
            <div className={`relative max-w-md mx-auto min-h-screen bg-background ${className}`}>
                {children}
            </div>
        </div>
    );
}
