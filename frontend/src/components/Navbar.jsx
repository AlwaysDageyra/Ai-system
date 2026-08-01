import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Bell, X, LogOut, ChevronDown, ShieldCheck, User as UserIcon, Zap } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CommandPalette = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const userJson = localStorage.getItem('user');
  const role = userJson ? (JSON.parse(userJson)?.role ?? 'supplier') : 'supplier';
  const isAdmin = role === 'admin';

  const allItems = [
    { label: 'Overview', desc: 'Dashboard', path: '/dashboard', shortcut: 'G O', adminOnly: false },
    { label: 'Open Tenders', desc: 'Tenders list', path: '/tenders', shortcut: 'G T', adminOnly: false },
    { label: 'Create Tender', desc: 'Admin only', path: '/create-tender', shortcut: '', adminOnly: true },
    { label: 'Leaderboard', desc: 'Rankings', path: '/rankings', shortcut: 'G R', adminOnly: true },
    { label: 'My Profile', desc: 'Supplier profile', path: '/profile', shortcut: '', adminOnly: false },
    { label: 'Public Home', desc: 'NPC public portal', path: '/', shortcut: '', adminOnly: false },
    { label: 'Contact', desc: 'NPC contact page', path: '/contact', shortcut: '', adminOnly: false },
    { label: 'Browse Tenders', desc: 'Public tender list', path: '/browse', shortcut: '', adminOnly: false },
  ];

  const items = allItems.filter(i => !i.adminOnly || isAdmin);
  const filtered = query
    ? items.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.desc.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const go = (path) => { navigate(path); onClose(); };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: '#0f172a', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Search size={15} style={{ color: '#7c3aed' }} className="shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search pages, actions..."
                className="flex-1 text-sm font-medium outline-none bg-transparent"
                style={{ color: '#f1f5f9', caretColor: '#7c3aed' }}
              />
              <button onClick={onClose} className="p-1 rounded-lg transition-all"
                style={{ color: '#475569' }}
                onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                <X size={14} />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: '#475569' }}>No results found</p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className="w-full flex items-center justify-between px-4 py-2.5 transition-all text-left group"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{item.desc}</p>
                    </div>
                    {item.shortcut && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0"
                        style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="px-4 py-2 flex items-center gap-3 text-[10px]"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#334155' }}>
              <span>↵ navigate</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ROLE_LABEL = {
  super_admin: 'Super Admin',
  admin: 'Procurement Officer',
  supplier: 'Supplier',
};

const roleHome = (role) => {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'supplier') return '/supplier';
  return '/dashboard';
};

const Navbar = () => {
  const navigate = useNavigate();
  const userJson = localStorage.getItem('user');
  const rawUser = userJson ? JSON.parse(userJson) : null;
  const user = { name: 'Guest', role: 'supplier', email: '', ...rawUser };
  const [cmdOpen, setCmdOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuRef = useRef(null);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user.name.split(' ')[0];
  const initials = user.name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  const openCmd = useCallback(() => setCmdOpen(true), []);
  const closeCmd = useCallback(() => setCmdOpen(false), []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(prev => !prev); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false); setConfirmLogout(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={closeCmd} />
      <header className="bg-white px-6 py-3.5 flex items-center justify-between shrink-0 gap-4"
        style={{ borderBottom: '1px solid #f1f5f9' }}>
        <Link
          to={roleHome(user.role)}
          className="min-w-0 text-left transition-opacity hover:opacity-75"
          style={{ textDecoration: 'none' }}
        >
          <p className="text-base font-bold text-[#0f172a] whitespace-nowrap leading-tight">
            {greeting()}, {displayName}
          </p>
          <p className="text-xs text-[#94a3b8] whitespace-nowrap mt-0.5">
            {ROLE_LABEL[user.role] || 'Portal'} ·{' '}
            <span className="font-semibold" style={{ color: '#7c3aed' }}>Dashboard</span>
          </p>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openCmd}
            className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all w-44 group"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#7c3aed'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <Search size={13} className="shrink-0" />
            <span className="flex-1 text-left text-xs">Search...</span>
            <kbd className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0"
              style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#94a3b8' }}>⌘K</kbd>
          </button>

          <button className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all shrink-0"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#7c3aed'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}>
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ring-2 ring-white"
              style={{ background: '#7c3aed' }} />
          </button>

          {/* Avatar dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl transition-all"
              style={{ border: '1px solid transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
                {initials}
              </div>
              <ChevronDown size={13} style={{ color: '#94a3b8' }} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-2 w-52 rounded-2xl z-50 overflow-hidden"
                  style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 12px 40px rgba(15,23,42,0.12)' }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <p className="text-sm font-bold text-[#0f172a] truncate">{user.name}</p>
                    <p className="text-xs text-[#94a3b8] truncate mt-0.5">{user.email}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                      style={{
                        background: user.role === 'super_admin' ? '#fef3c7' : user.role === 'admin' ? '#f5f3ff' : '#ede9fe',
                        color:      user.role === 'super_admin' ? '#d97706' : user.role === 'admin' ? '#7c3aed' : '#6d28d9',
                      }}>
                      {ROLE_LABEL[user.role]}
                    </span>
                  </div>

                  {!confirmLogout ? (
                    <button
                      onClick={() => setConfirmLogout(true)}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-500 transition-colors"
                      onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  ) : (
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-xs font-semibold text-[#0f172a]">Are you sure?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleLogout}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                        >
                          Yes, Sign Out
                        </button>
                        <button
                          onClick={() => setConfirmLogout(false)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          style={{ background: '#f8fafc', color: '#64748b' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
