import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

/* Clear any expired JWT so unauthenticated users never see "Dashboard" */
const clearIfExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
clearIfExpired();
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PublicNavbar from './components/PublicNavbar';
import { Toaster } from './components/ui/sonner';
import { SidebarProvider, SidebarInset } from './components/ui/sidebar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTender from './pages/CreateTender';
import TendersList from './pages/TendersList';
import TenderDetails from './pages/TenderDetails';
import SupplierSubmission from './pages/SupplierSubmission';
import Rankings from './pages/Rankings';
import ProposalDetails from './pages/ProposalDetails';
import HomePage from './pages/HomePage';
import ContactPage from './pages/ContactPage';
import PublicTenders from './pages/PublicTenders';
import PublicTenderDetail from './pages/PublicTenderDetail';
import SupplierProfile from './pages/SupplierProfile';
import AdminProfile from './pages/AdminProfile';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ApprovalQueue from './pages/ApprovalQueue';
import UserManagement from './pages/UserManagement';
import SupplierDashboard from './pages/SupplierDashboard';
import ChangePassword from './pages/ChangePassword';
import Messages from './pages/Messages';

/* ─── helpers ─────────────────────────────────────────────── */
const getRole = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u).role : null;
  } catch {
    return null;
  }
};

/* ─── Public layout ───────────────────────────────────────── */
const PublicLayout = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <PublicNavbar />
    <Outlet />
  </div>
);

/* ─── Authenticated app layout (shared sidebar + navbar) ──── */
const AppLayout = () => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;

  return (
    <SidebarProvider className="h-screen overflow-hidden bg-background">
      <Sidebar />
      <SidebarInset>
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

/* ─── Role guards ─────────────────────────────────────────── */
const RequireRole = ({ roles, redirect = '/' }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  const role = getRole();
  if (!roles.includes(role)) return <Navigate to={redirect} replace />;
  return <Outlet />;
};

const CatchAll = () => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  const role = getRole();
  if (role === 'super_admin') return <Navigate to="/super-admin" replace />;
  if (role === 'supplier') return <Navigate to="/supplier" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* ── Public pages ── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/browse" element={<PublicTenders />} />
          <Route path="/browse/:tenderId" element={<PublicTenderDetail />} />
        </Route>

        {/* ── Super Admin ── */}
        <Route element={<RequireRole roles={['super_admin']} redirect="/" />}>
          <Route element={<AppLayout />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/queue" element={<ApprovalQueue />} />
            <Route path="/super-admin/users" element={<UserManagement />} />
            <Route path="/super-admin/messages" element={<Messages />} />
            <Route path="/super-admin/tenders" element={<TendersList />} />
            <Route path="/super-admin/tenders/:tenderId" element={<TenderDetails />} />
          </Route>
        </Route>

        {/* ── Admin (Company Procurement Officer) ── */}
        <Route element={<RequireRole roles={['admin']} redirect="/" />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tenders" element={<TendersList />} />
            <Route path="/tenders/:tenderId" element={<TenderDetails />} />
            <Route path="/create-tender" element={<CreateTender />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/rankings/:tenderId" element={<Rankings />} />
            <Route path="/proposal/:proposalId" element={<ProposalDetails />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
          </Route>
        </Route>

        {/* ── Supplier ── */}
        <Route element={<RequireRole roles={['supplier']} redirect="/" />}>
          <Route element={<AppLayout />}>
            <Route path="/supplier" element={<SupplierDashboard />} />
            <Route path="/supplier/tenders" element={<TendersList />} />
            <Route path="/supplier/tenders/:tenderId" element={<TenderDetails />} />
            <Route path="/submit/:tenderId" element={<SupplierSubmission />} />
            <Route path="/supplier/proposal/:proposalId" element={<ProposalDetails />} />
            <Route path="/profile" element={<SupplierProfile />} />
          </Route>
        </Route>

        <Route path="*" element={<CatchAll />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
