import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import {
  FileText, Plus, Search, Clock, Trophy, ChevronRight,
  AlertCircle, Send, CheckCircle2, XCircle, X, Layers,
  LayoutGrid, Filter, Users, ShieldCheck,
} from 'lucide-react';

/* ── Skeleton ── */
const Sk = ({ className = '' }) => (
  <div className={`rounded-lg animate-pulse ${className}`} style={{ background: '#f1f5f9' }} />
);
const TendersSkeleton = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="rounded-2xl p-5 flex items-center gap-4" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
        <Sk className="w-11 h-11 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2"><Sk className="h-4 w-64" /><Sk className="h-3 w-40" /></div>
        <Sk className="h-6 w-20 rounded-lg" />
        <Sk className="h-8 w-24 rounded-xl" />
      </div>
    ))}
  </div>
);

/* ── Status badge ── */
const ApprovalBadge = ({ status }) => {
  const map = {
    approved: { label: 'Published',      bg: '#f0fdf4', color: '#10b981', border: '#bbf7d0' },
    pending:  { label: 'Pending Review', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    rejected: { label: 'Rejected',       bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
    draft:    { label: 'Draft',          bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  };
  const cfg = map[status] || map.draft;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {cfg.label}
    </span>
  );
};

/* ── Sector colours ── */
const SECTOR_COLORS = {
  'Food Security & Agriculture':  { bg: '#dcfce7', color: '#15803d' },
  'ICT & Technology':             { bg: '#f3e8ff', color: '#7c3aed' },
  'Education & Training':         { bg: '#dbeafe', color: '#1d4ed8' },
  'Engineering & Infrastructure': { bg: '#fef9c3', color: '#b45309' },
  'Energy & Power':               { bg: '#fff7ed', color: '#ea580c' },
  'Office Supplies & Printing':   { bg: '#f8fafc', color: '#475569' },
  'Consultancy & Research':       { bg: '#eef2ff', color: '#4338ca' },
  'Logistics & Flight Rental':    { bg: '#f0f9ff', color: '#0369a1' },
  'Healthcare & Insurance':       { bg: '#fff1f2', color: '#be123c' },
  'General Procurement':          { bg: '#f8fafc', color: '#64748b' },
};

/* ── Status dot colour ── */
const STATUS_DOT = {
  approved: '#10b981',
  pending:  '#f59e0b',
  rejected: '#ef4444',
  draft:    '#94a3b8',
};

const FILTERS = ['All', 'Published', 'Pending', 'Draft', 'Rejected'];
const FILTER_MAP = { All: null, Published: 'approved', Pending: 'pending', Draft: 'draft', Rejected: 'rejected' };

/* ══════════════════════════════════════════ */
const TendersList = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [submitMsg, setSubmitMsg] = useState({});
  const [submitLoading, setSubmitLoading] = useState({});
  const [approveLoading, setApproveLoading] = useState({});
  const [rejectLoading, setRejectLoading] = useState({});
  const [rejectOpen, setRejectOpen] = useState({});
  const [rejectReason, setRejectReason] = useState({});

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { role: 'supplier' };
  const role = user.role;
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';

  useEffect(() => {
    apiService.getTenders()
      .then(res => setTenders(res.data || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load tenders.'))
      .finally(() => setLoading(false));
  }, []);

  const tenderPath = (id) => {
    if (isSuperAdmin) return `/super-admin/tenders/${id}`;
    if (isAdmin) return `/tenders/${id}`;
    return `/supplier/tenders/${id}`;
  };

  const handleApprove = async (tenderId) => {
    setApproveLoading(l => ({ ...l, [tenderId]: true }));
    try {
      await apiService.approveTender(tenderId);
      setTenders(ts => ts.map(t => t.id === tenderId ? { ...t, approval_status: 'approved' } : t));
    } catch { /* retry via detail page */ }
    finally { setApproveLoading(l => ({ ...l, [tenderId]: false })); }
  };

  const handleReject = async (tenderId) => {
    const reason = rejectReason[tenderId] || '';
    if (!reason.trim()) return;
    setRejectLoading(l => ({ ...l, [tenderId]: true }));
    try {
      await apiService.rejectTender(tenderId, reason);
      setTenders(ts => ts.map(t => t.id === tenderId ? { ...t, approval_status: 'rejected', rejection_reason: reason } : t));
      setRejectOpen(o => ({ ...o, [tenderId]: false }));
    } catch { /* silently fail */ }
    finally { setRejectLoading(l => ({ ...l, [tenderId]: false })); }
  };

  const handleSubmitForApproval = async (tenderId) => {
    setSubmitLoading(l => ({ ...l, [tenderId]: true }));
    try {
      await apiService.submitTenderForApproval(tenderId);
      setTenders(ts => ts.map(t => t.id === tenderId ? { ...t, approval_status: 'pending' } : t));
      setSubmitMsg(m => ({ ...m, [tenderId]: 'Submitted!' }));
    } catch {
      setSubmitMsg(m => ({ ...m, [tenderId]: 'Failed.' }));
    } finally {
      setSubmitLoading(l => ({ ...l, [tenderId]: false }));
    }
  };

  /* ── Derived counts (super admin stats) ── */
  const counts = {
    total: tenders.length,
    approved: tenders.filter(t => t.approval_status === 'approved').length,
    pending:  tenders.filter(t => t.approval_status === 'pending').length,
    draft:    tenders.filter(t => t.approval_status === 'draft').length,
    rejected: tenders.filter(t => t.approval_status === 'rejected').length,
  };

  /* ── Filtering ── */
  const filterStatus = FILTER_MAP[activeFilter];
  const filtered = tenders.filter(t => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filterStatus || t.approval_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><Sk className="h-7 w-48" /><Sk className="h-10 w-36 rounded-xl" /></div>
      <div className="flex gap-3"><Sk className="h-20 flex-1 rounded-2xl" /><Sk className="h-20 flex-1 rounded-2xl" /><Sk className="h-20 flex-1 rounded-2xl" /><Sk className="h-20 flex-1 rounded-2xl" /></div>
      <TendersSkeleton />
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#0f172a]">
            {isSuperAdmin ? 'All Tenders' : isAdmin ? 'My Tenders' : 'Available Tenders'}
          </h1>
          <p className="text-sm text-[#94a3b8] mt-0.5">
            {filtered.length} of {tenders.length} tender{tenders.length !== 1 ? 's' : ''}
            {activeFilter !== 'All' ? ` · ${activeFilter}` : ''}
          </p>
        </div>
        {isAdmin && (
          <Link to="/create-tender"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shrink-0"
            style={{ background: '#7c3aed', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
            onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
            <Plus size={15} /> New Tender
          </Link>
        )}
      </motion.div>

      {/* ── Super Admin stat chips ── */}
      {isSuperAdmin && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',     value: counts.total,    bg: '#f5f3ff', color: '#7c3aed', border: '#ede9fe', icon: LayoutGrid },
            { label: 'Published', value: counts.approved, bg: '#f0fdf4', color: '#10b981', border: '#bbf7d0', icon: CheckCircle2 },
            { label: 'Pending',   value: counts.pending,  bg: '#fffbeb', color: '#d97706', border: '#fde68a', icon: Clock },
            { label: 'Rejected',  value: counts.rejected, bg: '#fef2f2', color: '#ef4444', border: '#fecaca', icon: XCircle },
          ].map(({ label, value, bg, color, border, icon: Icon }) => (
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

      {/* ── Search + filter row ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
          <input type="text" placeholder="Search tenders…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all"
            style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }}
            onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Filter tabs — super admin only */}
        {isSuperAdmin && (
          <div className="flex items-center gap-1 p-1 rounded-xl shrink-0"
            style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
            {FILTERS.map(f => {
              const active = activeFilter === f;
              return (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: active ? '#7c3aed' : 'transparent',
                    color: active ? '#fff' : '#64748b',
                    boxShadow: active ? '0 2px 6px rgba(124,58,237,0.25)' : 'none',
                  }}>
                  {f}
                  {FILTER_MAP[f] && counts[FILTER_MAP[f]] > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black inline-block leading-none"
                      style={{
                        background: active ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                        color: active ? '#fff' : '#64748b',
                      }}>
                      {counts[FILTER_MAP[f]]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl text-sm font-medium"
          style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444' }}>
          <AlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f5f3ff' }}>
            <FileText size={22} style={{ color: '#7c3aed' }} />
          </div>
          <p className="font-semibold text-[#0f172a]">No tenders found</p>
          <p className="text-sm text-[#94a3b8]">
            {search ? 'Try a different search term.' : activeFilter !== 'All' ? `No ${activeFilter.toLowerCase()} tenders.` : isAdmin ? 'Create your first tender to get started.' : 'No tenders available right now.'}
          </p>
          {isAdmin && !search && (
            <Link to="/create-tender" className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#7c3aed' }}>
              <Plus size={14} /> Create Tender
            </Link>
          )}
        </motion.div>
      ) : (

        /* ── Tender cards ── */
        <div className="space-y-2.5">
          {filtered.map((t, i) => {
            const isClosed = t.deadline && new Date() > new Date(t.deadline);
            const approvalStatus = t.approval_status || 'approved';
            const canSubmit = isAdmin && (approvalStatus === 'draft' || approvalStatus === 'rejected');
            const sectorStyle = SECTOR_COLORS[t.sector] || { bg: '#f5f3ff', color: '#7c3aed' };
            const dotColor = STATUS_DOT[approvalStatus] || '#94a3b8';

            return (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(15,23,42,0.05)' }}>

                <div className="flex items-center gap-4 px-5 py-4">

                  {/* Status colour bar + icon */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: isClosed ? '#f1f5f9' : '#f5f3ff' }}>
                      <FileText size={17} style={{ color: isClosed ? '#94a3b8' : '#7c3aed' }} />
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ background: dotColor }} />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-[#0f172a] truncate">{t.title}</p>
                      {t.sector && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                          style={{ background: sectorStyle.bg, color: sectorStyle.color }}>
                          <Layers size={9} /> {t.sector}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: '#94a3b8' }}>
                        <Clock size={10} />
                        {t.deadline
                          ? new Date(t.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'No deadline'}
                      </span>
                      {t.requirements?.length > 0 && (
                        <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>
                          {t.requirements.length} requirements
                        </span>
                      )}
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: isClosed ? '#f1f5f9' : '#f0fdf4', color: isClosed ? '#64748b' : '#10b981' }}>
                        {isClosed ? 'Closed' : '● Open'}
                      </span>
                    </div>
                  </div>

                  {/* Right-side badges + actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">

                    {(isAdmin || isSuperAdmin) && <ApprovalBadge status={approvalStatus} />}

                    {/* Super admin inline approve/reject for pending */}
                    {isSuperAdmin && approvalStatus === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(t.id)}
                          disabled={approveLoading[t.id] || rejectLoading[t.id]}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white transition-all disabled:opacity-60"
                          style={{ background: '#10b981', boxShadow: '0 2px 6px rgba(16,185,129,0.25)' }}
                          onMouseEnter={e => { if (!approveLoading[t.id]) e.currentTarget.style.background = '#059669'; }}
                          onMouseLeave={e => e.currentTarget.style.background = '#10b981'}>
                          {approveLoading[t.id]
                            ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            : <CheckCircle2 size={11} />}
                          Approve
                        </button>
                        <button onClick={() => setRejectOpen(o => ({ ...o, [t.id]: !o[t.id] }))}
                          disabled={approveLoading[t.id] || rejectLoading[t.id]}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-60"
                          style={{ background: rejectOpen[t.id] ? '#ef4444' : '#fef2f2', color: rejectOpen[t.id] ? '#fff' : '#ef4444', border: '1px solid #fecaca' }}
                          onMouseEnter={e => { if (!approveLoading[t.id]) { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; } }}
                          onMouseLeave={e => { if (!rejectOpen[t.id]) { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; } }}>
                          <XCircle size={11} /> {rejectOpen[t.id] ? 'Cancel' : 'Reject'}
                        </button>
                      </>
                    )}

                    {canSubmit && !submitMsg[t.id] && (
                      <button onClick={() => handleSubmitForApproval(t.id)}
                        disabled={submitLoading[t.id]}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white transition-all disabled:opacity-60"
                        style={{ background: '#d97706', boxShadow: '0 2px 6px rgba(217,119,6,0.25)' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#b45309'}
                        onMouseLeave={e => e.currentTarget.style.background = '#d97706'}>
                        <Send size={10} /> {submitLoading[t.id] ? 'Submitting…' : 'Submit for Review'}
                      </button>
                    )}
                    {submitMsg[t.id] && (
                      <span className="text-[10px] font-semibold text-amber-600">{submitMsg[t.id]}</span>
                    )}

                    <Link to={tenderPath(t.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#7c3aed'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.borderColor = '#ede9fe'; }}>
                      View <ChevronRight size={12} />
                    </Link>

                    {isAdmin && (
                      <Link to={`/rankings/${t.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#d97706'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.color = '#d97706'; }}>
                        <Trophy size={12} />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Inline reject form */}
                <AnimatePresence>
                  {isSuperAdmin && rejectOpen[t.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden', borderTop: '1px solid #f1f5f9' }}>
                      <div className="px-5 py-3 flex items-center gap-3" style={{ background: '#fafafa' }}>
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fef2f2' }}>
                          <XCircle size={11} style={{ color: '#ef4444' }} />
                        </div>
                        <input type="text" placeholder="Rejection reason…"
                          value={rejectReason[t.id] || ''}
                          onChange={e => setRejectReason(r => ({ ...r, [t.id]: e.target.value }))}
                          className="flex-1 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                          style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }}
                          onFocus={e => { e.target.style.borderColor = '#ef4444'; e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.08)'; }}
                          onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                        />
                        <button onClick={() => handleReject(t.id)}
                          disabled={rejectLoading[t.id] || !rejectReason[t.id]?.trim()}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white transition-all disabled:opacity-50"
                          style={{ background: '#ef4444' }}
                          onMouseEnter={e => { if (!rejectLoading[t.id]) e.currentTarget.style.background = '#dc2626'; }}
                          onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}>
                          {rejectLoading[t.id]
                            ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            : 'Confirm Reject'}
                        </button>
                        <button onClick={() => setRejectOpen(o => ({ ...o, [t.id]: false }))}
                          className="p-2 rounded-xl transition-colors"
                          style={{ color: '#94a3b8' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#64748b'}
                          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                          <X size={13} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TendersList;
