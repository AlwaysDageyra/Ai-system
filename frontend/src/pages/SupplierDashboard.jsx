import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import {
  FileText, Send, Clock, CheckCircle2, XCircle,
  AlertCircle, ArrowRight, Building2, Calendar, Zap,
} from 'lucide-react';

const FadeUp = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.42, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

const STATUS = {
  under_review: { label: 'Under Review', icon: Clock,        bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  approved:     { label: 'Approved',     icon: CheckCircle2, bg: '#f0fdf4', color: '#10b981', border: '#bbf7d0' },
  rejected:     { label: 'Rejected',     icon: XCircle,      bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
  submitted:    { label: 'Submitted',    icon: Send,         bg: '#f5f3ff', color: '#7c3aed', border: '#ede9fe' },
};

const Sk = ({ className = '' }) => (
  <div className={`rounded-lg animate-pulse ${className}`} style={{ background: '#f1f5f9' }} />
);

const SupplierDashboard = () => {
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { name: 'Supplier', email: '' };

  const [tenders, setTenders] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiService.getTenders(), apiService.getProposals()])
      .then(([tRes, pRes]) => {
        setTenders(tRes.data || []);
        setProposals(pRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const submittedTenderIds = new Set(proposals.map(p => p.tender_id));
  const openTenders = tenders.filter(t => !submittedTenderIds.has(t.id));
  const recentProposals = [...proposals]
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
    .slice(0, 5);

  const STATS = [
    { label: 'Open Tenders',  value: openTenders.length,                                      icon: FileText,     color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'My Proposals',  value: proposals.length,                                        icon: Send,         color: '#0ea5e9', bg: '#f0f9ff' },
    { label: 'Under Review',  value: proposals.filter(p => p.status === 'under_review').length, icon: Clock,      color: '#d97706', bg: '#fffbeb' },
    { label: 'Approved',      value: proposals.filter(p => p.status === 'approved').length,   icon: CheckCircle2, color: '#10b981', bg: '#f0fdf4' },
  ];

  if (loading) return (
    <div className="space-y-6">
      <div className="space-y-1"><Sk className="h-4 w-24" /><Sk className="h-8 w-56" /><Sk className="h-4 w-64" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl p-5 h-28 animate-pulse" style={{ background: '#fff', border: '1px solid #f1f5f9' }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <FadeUp>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: '#7c3aed' }}>
            Supplier Portal
          </p>
          <h1 className="text-2xl font-extrabold text-[#0f172a]">
            Welcome, {user.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-[#94a3b8] mt-0.5">
            Browse open tenders and track your submitted proposals.
          </p>
        </div>
      </FadeUp>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color, bg }, i) => (
          <FadeUp key={label} delay={i * 0.07}>
            <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-2xl font-extrabold text-[#0f172a]">{value}</p>
              <p className="text-xs font-semibold text-[#64748b] mt-0.5">{label}</p>
            </div>
          </FadeUp>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* Open Tenders */}
        <FadeUp delay={0.18}>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
              <div className="flex items-center gap-2">
                <FileText size={14} style={{ color: '#7c3aed' }} />
                <h2 className="text-sm font-bold text-[#0f172a]">Open Tenders</h2>
                {openTenders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: '#f5f3ff', color: '#7c3aed' }}>{openTenders.length}</span>
                )}
              </div>
              <Link to="/supplier/tenders"
                className="text-xs font-semibold flex items-center gap-1 transition-colors"
                style={{ color: '#7c3aed' }}
                onMouseEnter={e => e.currentTarget.style.color = '#6d28d9'}
                onMouseLeave={e => e.currentTarget.style.color = '#7c3aed'}>
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {openTenders.length === 0 ? (
              <div className="py-16 text-center">
                <FileText size={24} style={{ color: '#e2e8f0' }} className="mx-auto mb-2" />
                <p className="text-sm text-[#94a3b8]">No open tenders available right now.</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
                {openTenders.slice(0, 4).map((t, i) => {
                  const isClosed = t.deadline && new Date() > new Date(t.deadline);
                  const daysLeft = t.deadline ? Math.ceil((new Date(t.deadline) - Date.now()) / 86400000) : null;
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      className="flex items-center justify-between px-5 py-3.5 gap-4 transition-colors"
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">{t.title}</p>
                        {t.deadline && (
                          <span className="flex items-center gap-1 text-[10px] mt-0.5 font-medium"
                            style={{ color: daysLeft !== null && daysLeft <= 7 ? '#ef4444' : '#94a3b8' }}>
                            <Calendar size={9} />
                            {daysLeft !== null && daysLeft > 0 ? `${daysLeft}d left` : 'Deadline passed'}
                          </span>
                        )}
                      </div>
                      {!isClosed ? (
                        <Link to={`/submit/${t.id}`}
                          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl text-white transition-all"
                          style={{ background: '#7c3aed' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                          onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
                          Submit
                        </Link>
                      ) : (
                        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg"
                          style={{ background: '#f1f5f9', color: '#94a3b8' }}>Closed</span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </FadeUp>

        {/* My Proposals */}
        <FadeUp delay={0.24}>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
              <div className="flex items-center gap-2">
                <Send size={14} style={{ color: '#0ea5e9' }} />
                <h2 className="text-sm font-bold text-[#0f172a]">My Proposals</h2>
                {proposals.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: '#f0f9ff', color: '#0ea5e9' }}>{proposals.length}</span>
                )}
              </div>
            </div>

            {recentProposals.length === 0 ? (
              <div className="py-16 text-center">
                <Send size={24} style={{ color: '#e2e8f0' }} className="mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#0f172a]">No proposals yet</p>
                <p className="text-xs text-[#94a3b8] mt-1">Browse open tenders and submit your first proposal.</p>
                <Link to="/supplier/tenders"
                  className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold px-4 py-2 rounded-xl text-white"
                  style={{ background: '#7c3aed' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
                  Browse Tenders <ArrowRight size={11} />
                </Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
                {recentProposals.map((p, i) => {
                  const cfg = STATUS[p.status] || STATUS.submitted;
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.06 }}
                      className="flex items-center justify-between px-5 py-3.5 gap-4 transition-colors"
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">
                          {p.tender_title || `Tender #${p.tender_id}`}
                        </p>
                        <p className="text-[10px] text-[#94a3b8] mt-0.5">
                          {p.submitted_at ? new Date(p.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                      <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border"
                        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                        <Icon size={10} /> {cfg.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </FadeUp>
      </div>

      {/* Profile nudge */}
      {!user.company_name && (
        <FadeUp delay={0.32}>
          <div className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', border: '1px solid #ddd6fe' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                <Building2 size={15} color="#fff" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0f172a]">Complete your company profile</p>
                <p className="text-xs text-[#6d28d9] mt-0.5">A complete profile increases your chances of winning tenders.</p>
              </div>
            </div>
            <Link to="/profile"
              className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl text-white transition-all"
              style={{ background: '#7c3aed' }}
              onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
              Set Up Profile
            </Link>
          </div>
        </FadeUp>
      )}
    </div>
  );
};

export default SupplierDashboard;
