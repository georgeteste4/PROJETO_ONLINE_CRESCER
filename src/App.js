import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import ProtectedRoute from './components/ProtectedRoute';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import ChildRegistration from './pages/ChildRegistration';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import ActivityDetail from './pages/ActivityDetail';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminActivities from './pages/admin/AdminActivities';
import AdminAgeStages from './pages/admin/AdminAgeStages';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPinned from './pages/admin/AdminPinned';
import AdminInvites from './pages/admin/AdminInvites';
import AdminImport from './pages/admin/AdminImport';
import AcceptInvite from './pages/AcceptInvite';

const ADMIN_ROLES = ['super_admin', 'editor', 'moderador'];
const CONTENT_ROLES = ['super_admin', 'editor'];
const USER_MGMT_ROLES = ['super_admin', 'moderador'];

function PublicOnly({ children }) {
    const { user } = useAuth();
    if (user === null) return null;
    if (user) {
        const isAdmin = ['super_admin', 'editor', 'moderador'].includes(user.role);
        return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
    }
    return children;
}

function OnboardingGate() {
    const { user } = useAuth();
    if (user === null) return null;
    if (user) {
        const isAdmin = ['super_admin', 'editor', 'moderador'].includes(user.role);
        return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
    }
    return <Onboarding />;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/boas-vindas" element={<OnboardingGate />} />
                    <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
                    <Route path="/cadastro" element={<PublicOnly><Register /></PublicOnly>} />
                    <Route path="/convite/:token" element={<AcceptInvite />} />
                    <Route path="/cadastro-crianca" element={<ProtectedRoute><ChildRegistration /></ProtectedRoute>} />
                    <Route path="/" element={<ProtectedRoute requireChild><Dashboard /></ProtectedRoute>} />
                    <Route path="/atividades" element={<ProtectedRoute requireChild><Library /></ProtectedRoute>} />
                    <Route path="/atividade/:id" element={<ProtectedRoute requireChild><ActivityDetail /></ProtectedRoute>} />
                    <Route path="/progresso" element={<ProtectedRoute requireChild><Progress /></ProtectedRoute>} />
                    <Route path="/perfil" element={<ProtectedRoute requireChild><Profile /></ProtectedRoute>} />

                    {/* Admin */}
                    <Route
                        path="/admin"
                        element={<ProtectedRoute requireRole={ADMIN_ROLES}><AdminLayout /></ProtectedRoute>}
                    >
                        <Route index element={<AdminDashboard />} />
                        <Route path="usuarios" element={<ProtectedRoute requireRole={USER_MGMT_ROLES}><AdminUsers /></ProtectedRoute>} />
                        <Route path="convites" element={<ProtectedRoute requireRole={['super_admin']}><AdminInvites /></ProtectedRoute>} />
                        <Route path="atividades" element={<ProtectedRoute requireRole={CONTENT_ROLES}><AdminActivities /></ProtectedRoute>} />
                        <Route path="importar" element={<ProtectedRoute requireRole={CONTENT_ROLES}><AdminImport /></ProtectedRoute>} />
                        <Route path="fases" element={<ProtectedRoute requireRole={CONTENT_ROLES}><AdminAgeStages /></ProtectedRoute>} />
                        <Route path="categorias" element={<ProtectedRoute requireRole={CONTENT_ROLES}><AdminCategories /></ProtectedRoute>} />
                        <Route path="sugestoes" element={<ProtectedRoute requireRole={CONTENT_ROLES}><AdminPinned /></ProtectedRoute>} />
                    </Route>

                    <Route path="*" element={<Navigate to="/boas-vindas" replace />} />
                </Routes>
                <Toaster position="top-center" richColors />
            </BrowserRouter>
        </AuthProvider>
    );
}
