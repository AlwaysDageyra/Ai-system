import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import {
  FileText, Users, CheckCircle2, Clock, Plus, Trophy,
  TrendingUp, AlertCircle, ChevronRight, Zap, BarChart3,
  XCircle, ArrowUpRight,
} from 'lucide-react';

/* ── Animated counter ── */
const AnimatedNum = ({ value, suffix = '', prefix = '' }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value && value !== 0) return;
    const target = Number(value);
    const duration = 1100;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
};

/* ── Semi-circular gauge ── */
const SemiGauge = ({ value = 0, max = 100 }) => {
  const [animated, setAnimated] = useState(0);
  const radius = 64, stroke = 10, cx = 80, cy = 78;
  const startAngle = 200, endAngle = -20;
  const range = startAngle - endAngle;

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1300;
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setAnimated(eased * value);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 500);
    return () => clearTimeout(timeout);
  }, [value]);

  const toRad = deg => (deg * Math.PI) / 180;
  const pct = animated / max;

  const arcPath = (from, to, r) => {
    const s = { x: cx + r * Math.cos(toRad(from)), y: cy - r * Math.sin(toRad(from)) };
    const e = { x: cx + r * Math.cos(toRad(to)), y: cy - r * Math.sin(toRad(to)) };
    const large = Math.abs(from - to) > 180 ? 1 : 0;
    const sweep = from > to ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} ${sweep} ${e.x} ${e.y}`;
  };

  const fillEnd = startAngle - pct * range;
  const gaugeColor = animated >= 80 ? '#10b981' : animated >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={160} height={90} viewBox="0 0 160 90">
      <path d={arcPath(startAngle, endAngle, radius)} fill="none" stroke="rgba(124,58,237,0.12)" strokeWidth={stroke} strokeLinecap="round" />
      <path d={arcPath(startAngle, fillEnd, radius)} fill="none" stroke={gaugeColor} strokeWidth={stroke} strokeLinecap="round"
        style={{ transition: 'all 0.05s linear' }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="800" fill="#0f172a">
        {animated.toFixed(0)}
      </text>
      <text x={cx + 22} y={cy - 6} textAnchor="start" fontSize="9" fontWeight="700" fill={gaugeColor}>%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fontWeight="500" fill="#94a3b8">Avg Score</text>
    </svg>
  );
};

/* ── Skeleton ── */
const Sk = ({ className = '' }) => (
  <div className={`rounded-lg animate-pulse ${className}`} style={{ background: '#f1f5f9' }} />
);

const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: '#fff', border: '1px solid #f1f5f9', height: 100 }}><Sk className="h-4 w-20" /><Sk className="h-8 w-16" /></div>)}
    </div>
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl p-6 space-y-3" style={{ background: '#fff', border: '1px solid #f1f5f9', height: 280 }}>
          {[...Array(4)].map((_, i) => <Sk key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #f1f5f9', height: 200 }} />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    under_review: { label: 'Under Review', bg: '#fef3c7', color: '#d97706' },
    approved:     { label: 'Approved',     bg: '#f0fdf4', color: '#10b981' },
    rejected:     { label: 'Rejected',     bg: '#fef2f2', color: '#ef4444' },
  };
  const cfg = map[status] || map.under_review;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { role: 'supplier', name: 'User' };
  const role = user.role;
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tendersRes, proposalsRes] = await Promise.all([
          apiService.getTenders(),
          apiService.getProposals(),
        ]);
        setTenders(tendersRes.data || []);
        setProposals(proposalsRes.data || []);

        if (isAdmin || isSuperAdmin) {
          try {
            const statsRes = await apiService.getAdminStats();
            setAdminStats(statsRes.data);
          } catch { /* stats optional */ }
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [isAdmin, isSuperAdmin]);

  if (loading) return <DashboardSkeleton />;

  const totalTenders = tenders.length;
  const activeTenders = tenders.filter(t => {
    if (!t.deadline) return true;
    return new Date(t.deadline) > new Date();
  }).length;
  const uniqueSuppliers = [...new Set(proposals.map(p => p.supplier_id || p.supplier_name))].length;
  const totalProposals = proposals.length;
  const pendingProposals = proposals.filter(p => p.status === 'under_review').length;
  const approvedProposals = proposals.filter(p => p.status === 'approved').length;
  const rejectedProposals = proposals.filter(p => p.status === 'rejected').length;

  const scores = proposals.filter(p => p.score != null).map(p => Number(p.score));
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const topScore = scores.length ? Math.max(...scores) : 0;

  const STATS = [
    {
      label: 'Total Tenders',
      value: totalTenders,
      icon: FileText,
      color: '#7c3aed',
      bg: '#f5f3ff',
      sub: `${activeTenders} active`,
    },
    {
      label: 'Total Proposals',
      value: totalProposals,
      icon: BarChart3,
      color: '#0ea5e9',
      bg: '#f0f9ff',
      sub: `${pendingProposals} pending`,
    },
    {
      label: 'Unique Suppliers',
      value: uniqueSuppliers,
      icon: Users,
      color: '#10b981',
      bg: '#f0fdf4',
      sub: isAdmin ? 'registered bidders' : 'on platform',
    },
    {
      label: 'Avg Score',
      value: avgScore.toFixed(1),
      icon: TrendingUp,
      color: topScore >= 80 ? '#10b981' : '#f59e0b',
      bg: topScore >= 80 ? '#f0fdf4' : '#fffbeb',
      sub: `Top: ${topScore.toFixed(0)}%`,
      noCounter: true,
    },
  ];

  const recentTenders = [...tenders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const recentProposals = [...proposals].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)).slice(0, 6);

  return (
    <div className="space-y-6">

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="rounded-2xl p-5"
              style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: s.bg }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
                <ArrowUpRight size={13} style={{ color: '#cbd5e1' }} />
              </div>
              <p className="text-2xl font-extrabold text-[#0f172a] leading-none">
                {s.noCounter ? s.value : <AnimatedNum value={s.value} />}
              </p>
              <p className="text-xs font-semibold text-[#64748b] mt-1">{s.label}</p>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">{s.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Left — tenders + proposals */}
        <div className="lg:col-span-2 space-y-5">

          {/* Active Tenders */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}
          >
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid #f8fafc' }}>
              <div className="flex items-center gap-2">
                <FileText size={15} style={{ color: '#7c3aed' }} />
                <h2 className="text-sm font-bold text-[#0f172a]">Active Tenders</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: '#f5f3ff', color: '#7c3aed' }}>{activeTenders}</span>
              </div>
              {isAdmin && (
                <Link to="/create-tender"
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all text-white"
                  style={{ background: '#7c3aed' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
                  <Plus size={12} /> New Tender
                </Link>
              )}
            </div>

            {recentTenders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <FileText size={28} style={{ color: '#e2e8f0' }} />
                <p className="text-sm text-[#94a3b8] font-medium">No tenders yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
                {recentTenders.map((t, i) => {
                  const isClosed = t.deadline && new Date() > new Date(t.deadline);
                  const approvalStatus = t.approval_status || 'approved';
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.25 + i * 0.05 }}
                      className="flex items-center justify-between px-5 py-3.5 transition-all cursor-pointer"
                      style={{ gap: 12 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate(isSuperAdmin ? `/super-admin/tenders/${t.id}` : `/tenders/${t.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: isClosed ? '#f1f5f9' : '#f5f3ff' }}>
                          <FileText size={13} style={{ color: isClosed ? '#94a3b8' : '#7c3aed' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0f172a] truncate">{t.title}</p>
                          <p className="text-[10px] text-[#94a3b8] mt-0.5 flex items-center gap-1">
                            <Clock size={9} />
                            {t.deadline ? new Date(t.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                          style={{
                            background: isClosed ? '#f1f5f9' : '#f0fdf4',
                            color: isClosed ? '#94a3b8' : '#10b981',
                          }}>
                          {isClosed ? 'Closed' : 'Open'}
                        </span>
                        {(isAdmin || isSuperAdmin) && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                            style={{
                              background: approvalStatus === 'approved' ? '#f0fdf4' : approvalStatus === 'pending' ? '#fffbeb' : approvalStatus === 'rejected' ? '#fef2f2' : '#f8fafc',
                              color: approvalStatus === 'approved' ? '#10b981' : approvalStatus === 'pending' ? '#d97706' : approvalStatus === 'rejected' ? '#ef4444' : '#94a3b8',
                            }}>
                            {approvalStatus === 'approved' ? 'Published' : approvalStatus === 'pending' ? 'Pending' : approvalStatus === 'rejected' ? 'Rejected' : 'Draft'}
                          </span>
                        )}
                        <ChevronRight size={13} style={{ color: '#cbd5e1' }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {tenders.length > 5 && (
              <div className="px-5 py-3" style={{ borderTop: '1px solid #f8fafc' }}>
                <Link to="/tenders" className="text-xs font-semibold transition-colors"
                  style={{ color: '#7c3aed' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#6d28d9'}
                  onMouseLeave={e => e.currentTarget.style.color = '#7c3aed'}>
                  View all {tenders.length} tenders →
                </Link>
              </div>
            )}
          </motion.div>

          {/* Recent Proposals */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f8fafc' }}>
              <div className="flex items-center gap-2">
                <BarChart3 size={15} style={{ color: '#0ea5e9' }} />
                <h2 className="text-sm font-bold text-[#0f172a]">Recent Proposals</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: '#f0f9ff', color: '#0ea5e9' }}>{totalProposals}</span>
              </div>
              {isAdmin && (
                <Link to="/rankings" className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                  style={{ color: '#7c3aed' }}>
                  <Trophy size={12} /> Leaderboard
                </Link>
              )}
            </div>

            {recentProposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <BarChart3 size={24} style={{ color: '#e2e8f0' }} />
                <p className="text-sm text-[#94a3b8] font-medium">No proposals yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                      <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Supplier</th>
                      <th className="text-left px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Tender</th>
                      <th className="text-left px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Status</th>
                      {isAdmin && <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Score</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {recentProposals.map((p, i) => {
                      const score = p.score ?? null;
                      const scoreColor = score == null ? '#94a3b8' : score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                      return (
                        <tr key={p.id}
                          className="transition-all cursor-pointer"
                          style={{ borderBottom: '1px solid #f8fafc' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          onClick={() => navigate(`/proposals/${p.id}`)}>
                          <td className="px-5 py-3 font-semibold text-[#0f172a]">
                            {p.supplier_name || `Supplier #${p.supplier_id}`}
                          </td>
                          <td className="px-3 py-3 text-[#64748b]">#{p.tender_id}</td>
                          <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                          {isAdmin && (
                            <td className="px-5 py-3 text-right font-bold" style={{ color: scoreColor }}>
                              {score != null ? `${score.toFixed(0)}%` : '—'}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Score gauge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="rounded-2xl p-5"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
                <Zap size={12} color="#fff" fill="#fff" />
              </div>
              <h3 className="text-sm font-bold text-[#0f172a]">AI Compliance Score</h3>
            </div>
            <div className="flex justify-center">
              <SemiGauge value={avgScore} max={100} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: 'Approved', val: approvedProposals, color: '#10b981', bg: '#f0fdf4' },
                { label: 'Pending',  val: pendingProposals,  color: '#f59e0b', bg: '#fffbeb' },
                { label: 'Rejected', val: rejectedProposals, color: '#ef4444', bg: '#fef2f2' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: s.bg }}>
                  <p className="text-base font-extrabold" style={{ color: s.color }}>{s.val}</p>
                  <p className="text-[9px] font-semibold mt-0.5" style={{ color: s.color }}>{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="rounded-2xl p-5"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}
          >
            <h3 className="text-sm font-bold text-[#0f172a] mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                isAdmin && { label: 'Create Tender', desc: 'Add new procurement', to: '/create-tender', icon: Plus, color: '#7c3aed', bg: '#f5f3ff' },
                { label: 'View Tenders', desc: 'Browse all tenders', to: '/tenders', icon: FileText, color: '#0ea5e9', bg: '#f0f9ff' },
                isAdmin && { label: 'Rankings', desc: 'AI leaderboard', to: '/rankings', icon: Trophy, color: '#f59e0b', bg: '#fffbeb' },
              ].filter(Boolean).map(action => {
                const Icon = action.icon;
                return (
                  <Link key={action.to} to={action.to}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{ border: '1px solid #f1f5f9' }}
                    onMouseEnter={e => { e.currentTarget.style.background = action.bg; e.currentTarget.style.borderColor = 'transparent'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: action.bg }}>
                      <Icon size={14} style={{ color: action.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#0f172a]">{action.label}</p>
                      <p className="text-[10px] text-[#94a3b8]">{action.desc}</p>
                    </div>
                    <ChevronRight size={13} style={{ color: '#cbd5e1' }} />
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Proposal breakdown */}
          {proposals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="rounded-2xl p-5"
              style={{ background: 'linear-gradient(135deg, #0f0a1e, #1a0a3a)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap size={13} style={{ color: '#a78bfa' }} />
                <h3 className="text-sm font-bold text-white">Proposal Overview</h3>
              </div>
              {[
                { label: 'Total Received', val: totalProposals, pct: 100 },
                { label: 'Approved',       val: approvedProposals, pct: totalProposals ? (approvedProposals / totalProposals) * 100 : 0 },
                { label: 'Under Review',   val: pendingProposals, pct: totalProposals ? (pendingProposals / totalProposals) * 100 : 0 },
                { label: 'Rejected',       val: rejectedProposals, pct: totalProposals ? (rejectedProposals / totalProposals) * 100 : 0 },
              ].map((row, i) => (
                <div key={row.label} className="mb-3 last:mb-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>{row.label}</span>
                    <span className="text-[11px] font-bold text-white">{row.val}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${row.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: i === 0 ? '#7c3aed' : i === 1 ? '#10b981' : i === 2 ? '#f59e0b' : '#ef4444' }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
