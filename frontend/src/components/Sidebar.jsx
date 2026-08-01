import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, ListCollapse, Trophy, LogOut,
  ShieldCheck, User as UserIcon, Building2, Home,
  ClipboardCheck, Users, BarChart2, Zap, MessageSquare,
} from 'lucide-react';
import { apiService } from '../services/api';

const Sidebar = () => {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  const rawUser = userJson ? JSON.parse(userJson) : null;
  const user = { name: 'Guest', role: 'supplier', email: '', ...rawUser };
  const role = user.role;
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (role !== 'super_admin') return;
    apiService.getMessages()
      .then(res => setUnreadMessages(res.data.unread || 0))
      .catch(() => {});
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-[#7c3aed]/15 text-white border-l-2 border-[#7c3aed] pl-[10px]'
        : 'text-[#64748b] hover:bg-white/[0.05] hover:text-[#a78bfa]'
    }`;

  const SectionLabel = ({ children }) => (
    <p className="px-3 pt-1 pb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#334155]">
      {children}
    </p>
  );

  const initials = user.name
    .split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase() || 'U';

  const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Procurement Officer' : 'Supplier';

  return (
    <aside style={{ background: '#162447', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      className="w-56 h-screen flex flex-col shrink-0">

      {/* Logo */}
      <div className="px-4 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', boxShadow: '0 4px 12px rgba(124,58,237,0.4)' }}>
            <Zap size={15} color="#fff" fill="#fff" />
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-sm font-bold text-white tracking-tight">TenderHub</p>
            <p className="text-[10px] font-medium" style={{ color: '#334155' }}>NPC Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">

        {/* ── Super Admin nav ── */}
        {role === 'super_admin' && (
          <>
            <div className="space-y-0.5">
              <SectionLabel>Platform</SectionLabel>
              <NavLink to="/super-admin" end className={linkClass}>
                <LayoutDashboard size={15} /><span>Overview</span>
              </NavLink>
              <NavLink to="/super-admin/queue" className={linkClass}>
                <ClipboardCheck size={15} /><span>Approval Queue</span>
              </NavLink>
              <NavLink to="/super-admin/tenders" className={linkClass}>
                <ListCollapse size={15} /><span>All Tenders</span>
              </NavLink>
            </div>
            <div className="space-y-0.5">
              <SectionLabel>Administration</SectionLabel>
              <NavLink to="/super-admin/users" className={linkClass}>
                <Users size={15} /><span>User Management</span>
              </NavLink>
              <NavLink to="/super-admin/messages" className={linkClass}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <MessageSquare size={15} />
                  {unreadMessages > 0 && (
                    <span style={{
                      position: 'absolute', top: -6, right: -8,
                      minWidth: 14, height: 14, borderRadius: 99, padding: '0 3px',
                      background: '#7c3aed', color: '#fff',
                      fontSize: 8, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{unreadMessages}</span>
                  )}
                </div>
                <span>Messages</span>
              </NavLink>
            </div>
          </>
        )}

        {/* ── Admin nav ── */}
        {role === 'admin' && (
          <>
            <div className="space-y-0.5">
              <SectionLabel>Main</SectionLabel>
              <NavLink to="/dashboard" end className={linkClass}>
                <LayoutDashboard size={15} /><span>Overview</span>
              </NavLink>
              <NavLink to="/tenders" className={linkClass}>
                <ListCollapse size={15} /><span>My Tenders</span>
              </NavLink>
              <NavLink to="/create-tender" className={linkClass}>
                <FilePlus size={15} /><span>Create Tender</span>
              </NavLink>
            </div>
            <div className="space-y-0.5">
              <SectionLabel>Evaluation</SectionLabel>
              <NavLink to="/rankings" className={linkClass}>
                <Trophy size={15} /><span>Rankings</span>
              </NavLink>
              <NavLink to="/rankings" className={linkClass}>
                <BarChart2 size={15} /><span>Analytics</span>
              </NavLink>
            </div>
          </>
        )}

        {/* ── Supplier nav ── */}
        {role === 'supplier' && (
          <div className="space-y-0.5">
            <SectionLabel>Main</SectionLabel>
            <NavLink to="/supplier" end className={linkClass}>
              <LayoutDashboard size={15} /><span>Overview</span>
            </NavLink>
            <NavLink to="/supplier/tenders" className={linkClass}>
              <ListCollapse size={15} /><span>Open Tenders</span>
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              <Building2 size={15} /><span>My Profile</span>
            </NavLink>
          </div>
        )}

        {/* Public site link */}
        <div className="space-y-0.5">
          <SectionLabel>Site</SectionLabel>
          <NavLink to="/" end className={linkClass}>
            <Home size={15} /><span>Public Home</span>
          </NavLink>
        </div>
      </nav>

      {/* User + logout */}
      <div className="px-2 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white font-bold text-xs"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">{user.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {role === 'super_admin'
                ? <ShieldCheck size={9} className="text-amber-400 shrink-0" />
                : role === 'admin'
                  ? <ShieldCheck size={9} className="text-violet-400 shrink-0" />
                  : <UserIcon size={9} className="text-[#a78bfa] shrink-0" />
              }
              <p className="text-[9px] font-medium" style={{ color: '#475569' }}>{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg transition-all shrink-0"
            style={{ color: '#475569' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
