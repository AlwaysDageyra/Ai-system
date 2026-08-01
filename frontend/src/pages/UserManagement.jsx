import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import {
  Users, Plus, Trash2, ShieldCheck, User as UserIcon,
  AlertTriangle, CheckCircle2, X, Mail, Lock, ChevronDown,
  Search, Building2,
} from 'lucide-react';

/* ── Toast ── */
const Toast = ({ toasts }) => (
  <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none">
    <AnimatePresence>
      {toasts.map(t => (
        <motion.div key={t.id}
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg pointer-events-auto"
          style={{
            background: '#fff',
            border: t.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
            color: t.type === 'success' ? '#10b981' : '#ef4444',
            boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
          }}>
          {t.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {t.message}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

/* ── Delete confirm modal ── */
const DeleteModal = ({ user, onClose, onConfirm, loading }) => {
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 24px 48px rgba(15,23,42,0.18)' }}>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fef2f2' }}>
            <Trash2 size={16} style={{ color: '#ef4444' }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#0f172a]">Delete User</p>
            <p className="text-sm text-[#64748b] mt-1">
              Remove <span className="font-bold text-[#0f172a]">{user.name}</span> permanently?
            </p>
            <p className="text-xs text-[#94a3b8] mt-0.5">This action cannot be undone.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#94a3b8' }}
            onMouseEnter={e => e.currentTarget.style.color = '#64748b'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
            <X size={14} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: '#ef4444', boxShadow: '0 4px 12px rgba(239,68,68,0.25)' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#dc2626'; }}
            onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Role config ── */
const ROLE_CFG = {
  super_admin: { label: 'Super Admin', color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe', dot: '#7c3aed', Icon: ShieldCheck },
  admin:       { label: 'Admin',       color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', dot: '#0ea5e9', Icon: ShieldCheck },
  supplier:    { label: 'Supplier',    color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', dot: '#10b981', Icon: Building2 },
};

const ROLE_LABELS = {
  super_admin: 'Super Admins',
  admin: 'Admins',
  supplier: 'Suppliers',
};

const inputStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' };
const inputFocus = e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; e.target.style.background = '#fff'; };
const inputBlur  = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; };

/* ── Skeleton ── */
const Sk = ({ className = '' }) => (
  <div className={`rounded-lg animate-pulse ${className}`} style={{ background: '#f1f5f9' }} />
);

const UserManagement = () => {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [formLoading, setFormLoading]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toasts, setToasts]             = useState([]);
  const [search, setSearch]             = useState('');
  const [form, setForm]                 = useState({ name: '', email: '', password: '', role: 'admin' });

  useEffect(() => {
    apiService.getAllUsers()
      .then(res => setUsers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async e => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await apiService.createUser(form);
      setUsers(prev => [...prev, res.data]);
      setForm({ name: '', email: '', password: '', role: 'admin' });
      setShowForm(false);
      addToast('User created successfully.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create user.', 'error');
    } finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await apiService.deleteUser(deleteTarget.id);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      addToast('User deleted.', 'success');
    } catch {
      addToast('Failed to delete user.', 'error');
    } finally { setDeleteLoading(false); }
  };

  /* ── Derived ── */
  const counts = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    supplier: users.filter(u => u.role === 'supplier').length,
    super_admin: users.filter(u => u.role === 'super_admin').length,
  };

  const searchLower = search.toLowerCase();
  const grouped = Object.entries(ROLE_CFG).map(([role, cfg]) => ({
    role, cfg,
    members: users.filter(u =>
      u.role === role &&
      (!search || u.name?.toLowerCase().includes(searchLower) || u.email?.toLowerCase().includes(searchLower))
    ),
  }));

  const totalFiltered = grouped.reduce((s, g) => s + g.members.length, 0);

  return (
    <>
      <Toast toasts={toasts} />
      <DeleteModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleteLoading} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5 max-w-3xl"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-[#0f172a]">User Management</h1>
            <p className="text-sm text-[#94a3b8] mt-0.5">
              {loading ? 'Loading…' : `${counts.total} user${counts.total !== 1 ? 's' : ''} across all roles`}
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl text-white transition-all shrink-0"
            style={{ background: showForm ? '#64748b' : '#7c3aed', boxShadow: showForm ? 'none' : '0 4px 12px rgba(124,58,237,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = showForm ? '#475569' : '#6d28d9'}
            onMouseLeave={e => e.currentTarget.style.background = showForm ? '#64748b' : '#7c3aed'}>
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancel' : 'New User'}
          </button>
        </div>

        {/* ── Stat chips ── */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
            className="grid grid-cols-3 gap-3">
            {[
              { label: 'Admins',    value: counts.admin,    ...ROLE_CFG.admin },
              { label: 'Suppliers', value: counts.supplier, ...ROLE_CFG.supplier },
              { label: 'Total',     value: counts.total,    color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe', Icon: Users },
            ].map(({ label, value, color, bg, border, Icon }) => (
              <div key={label} className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-[#0f172a] leading-none">{value}</p>
                  <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#94a3b8' }}>{label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Create form ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}>
              <form onSubmit={handleCreate}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#fff', border: '1px solid #ede9fe', boxShadow: '0 4px 16px rgba(124,58,237,0.08)' }}>
                {/* Form header */}
                <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #f5f3ff', background: '#faf5ff' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                    <Plus size={12} color="#fff" />
                  </div>
                  <p className="text-sm font-bold text-[#0f172a]">Create New User</p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Full Name *</label>
                      <div className="relative">
                        <UserIcon size={12} className="absolute left-3.5 top-3.5 pointer-events-none" style={{ color: '#94a3b8' }} />
                        <input type="text" required value={form.name} onChange={set('name')} placeholder="Jane Smith"
                          className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                          style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Email *</label>
                      <div className="relative">
                        <Mail size={12} className="absolute left-3.5 top-3.5 pointer-events-none" style={{ color: '#94a3b8' }} />
                        <input type="email" required value={form.email} onChange={set('email')} placeholder="jane@company.com"
                          className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                          style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Password *</label>
                      <div className="relative">
                        <Lock size={12} className="absolute left-3.5 top-3.5 pointer-events-none" style={{ color: '#94a3b8' }} />
                        <input type="password" required value={form.password} onChange={set('password')} placeholder="Min. 8 characters"
                          className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                          style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Role *</label>
                      <div className="relative">
                        <ChevronDown size={12} className="absolute right-3.5 top-3.5 pointer-events-none" style={{ color: '#94a3b8' }} />
                        <select value={form.role} onChange={set('role')}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all appearance-none cursor-pointer"
                          style={inputStyle} onFocus={inputFocus} onBlur={inputBlur}>
                          <option value="admin">Admin (Procurement Officer)</option>
                          <option value="supplier">Supplier</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1" style={{ borderTop: '1px solid #f1f5f9' }}>
                    <button type="submit" disabled={formLoading}
                      className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all disabled:opacity-50"
                      style={{ background: '#7c3aed', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
                      onMouseEnter={e => { if (!formLoading) e.currentTarget.style.background = '#6d28d9'; }}
                      onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
                      {formLoading
                        ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Creating…</>
                        : <><Plus size={14} /> Create User</>}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Search ── */}
        {!loading && users.length > 0 && (
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
            <input type="text" placeholder="Search by name or email…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
              style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }}
              onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => e.currentTarget.style.color = '#64748b'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* ── User list ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 flex items-center gap-4 animate-pulse"
                style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
                <Sk className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2"><Sk className="h-4 w-44" /><Sk className="h-3 w-32" /></div>
                <Sk className="h-6 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        ) : totalFiltered === 0 ? (
          <div className="py-20 text-center rounded-2xl"
            style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
            <Users size={28} className="mx-auto mb-3" style={{ color: '#e2e8f0' }} />
            <p className="text-sm font-semibold text-[#0f172a]">{search ? 'No users match your search' : 'No users yet'}</p>
            <p className="text-xs text-[#94a3b8] mt-1">{search ? 'Try a different name or email.' : 'Create the first user to get started.'}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(({ role, cfg, members }) => {
              if (members.length === 0) return null;
              const { Icon } = cfg;
              return (
                <motion.div key={role} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  {/* Group header */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
                      <Icon size={11} style={{ color: cfg.color }} />
                    </div>
                    <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>
                      {ROLE_LABELS[role]}
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {members.length}
                    </span>
                    <div className="flex-1 h-px" style={{ background: cfg.border }} />
                  </div>

                  {/* User rows */}
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                    <AnimatePresence mode="popLayout">
                      {members.map((u, i) => (
                        <motion.div
                          key={u.id}
                          layout
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, scale: 0.97 }}
                          transition={{ duration: 0.2, delay: i * 0.04 }}
                          className="flex items-center justify-between px-5 py-3.5 gap-4 transition-colors"
                          style={{ borderBottom: i < members.length - 1 ? '1px solid #f8fafc' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar with status dot */}
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-extrabold"
                                style={{ background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}99)` }}>
                                {u.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                                style={{ background: cfg.dot }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0f172a] truncate">{u.name}</p>
                              <p className="text-[11px] font-medium truncate flex items-center gap-1" style={{ color: '#94a3b8' }}>
                                <Mail size={9} /> {u.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg"
                              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                              <Icon size={9} /> {cfg.label}
                            </span>
                            {u.role !== 'super_admin' && (
                              <button
                                onClick={() => setDeleteTarget(u)}
                                className="p-2 rounded-xl transition-all"
                                style={{ background: '#fef2f2', color: '#ef4444' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}>
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </>
  );
};

export default UserManagement;
