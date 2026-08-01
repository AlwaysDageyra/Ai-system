import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import ComplianceTable from '../components/ComplianceTable';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, Clock, CheckCircle2, XCircle, AlertCircle,
  Zap, Download, Building2, ShieldCheck, TrendingUp, Flag,
  ThumbsUp, ThumbsDown, AlertTriangle, User, Loader2,
  Phone, Globe, Hash, MapPin, Mail, BadgeCheck, BadgeAlert,
} from 'lucide-react';

const STATUS_CONFIG = {
  under_review: { label: 'Under Review', icon: AlertCircle,  bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  approved:     { label: 'Approved',     icon: CheckCircle2, bg: '#f0fdf4', color: '#10b981', border: '#bbf7d0' },
  rejected:     { label: 'Rejected',     icon: XCircle,      bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
};

const Sk = ({ className = '' }) => (
  <div className={`rounded-lg animate-pulse ${className}`} style={{ background: '#f1f5f9' }} />
);

/* ── Score arc gauge ── */
const ScoreGauge = ({ score }) => {
  const r = 58; const cx = 80; const cy = 76;
  const circ = Math.PI * r;
  const offset = circ * (1 - Math.min(score, 100) / 100);
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 50 ? 'Fair' : 'Poor';
  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="100" viewBox="0 0 160 100">
        <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke="rgba(124,58,237,0.1)" strokeWidth="14" strokeLinecap="round" />
        <motion.path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`}
          fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }} />
        <text x={cx} y={cy-10} textAnchor="middle" fontSize="26" fontWeight="800" fill={color}
          style={{ fontFamily: 'inherit' }}>{Math.round(score)}%</text>
        <text x={cx} y={cy+8} textAnchor="middle" fontSize="10" fill="#94a3b8"
          style={{ fontFamily: 'inherit' }}>{label}</text>
      </svg>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: '#94a3b8' }}>
        Compliance Score
      </p>
    </div>
  );
};

/* ── AI recommendation ── */
const getRecommendation = (score, mandatoryFailed, redFlagCount) => {
  if (mandatoryFailed > 0)
    return { verdict: 'REJECT', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: ThumbsDown,
      text: `${mandatoryFailed} mandatory requirement${mandatoryFailed > 1 ? 's' : ''} not met. This proposal does not satisfy the minimum compliance threshold and should be disqualified.` };
  if (score >= 80 && redFlagCount === 0)
    return { verdict: 'RECOMMEND AWARD', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', icon: ThumbsUp,
      text: `Score of ${Math.round(score)}% with no red flags. This proposal meets all requirements and is a strong candidate for award.` };
  if (score >= 50)
    return { verdict: 'REVIEW REQUIRED', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: AlertTriangle,
      text: `Score of ${Math.round(score)}% with ${redFlagCount} red flag${redFlagCount !== 1 ? 's' : ''}. Meets most criteria but warrants manual review before a decision is made.` };
  return { verdict: 'REJECT', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: ThumbsDown,
    text: `Score of ${Math.round(score)}% is below the minimum threshold. Significant documentation gaps and ${redFlagCount} red flag${redFlagCount !== 1 ? 's' : ''} detected.` };
};

/* ── Supplier profile card (admin view only) ── */
const SupplierCard = ({ profile }) => {
  const fields = [
    { key: 'company_name',       label: 'Company',     icon: Building2 },
    { key: 'registration_number',label: 'Reg. No.',    icon: Hash      },
    { key: 'phone',              label: 'Phone',       icon: Phone     },
    { key: 'website',            label: 'Website',     icon: Globe     },
    { key: 'email',              label: 'Email',       icon: Mail      },
    { key: 'address',            label: 'Address',     icon: MapPin    },
  ];
  const profileFields = ['company_name','registration_number','phone','website','address'];
  const filled = profileFields.filter(k => profile[k]?.trim?.()).length;
  const pct    = Math.round(filled / profileFields.length * 100);
  const pctColor = pct === 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#7c3aed';
  const initials = (profile.name || 'S').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const hasProfile = filled > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(124,58,237,0.15)', boxShadow: '0 4px 20px rgba(124,58,237,0.07)' }}
    >
      {/* Dark header */}
      <div className="flex items-center gap-4 px-5 py-4"
        style={{ background: 'linear-gradient(135deg,#0f0a1e,#1a0a3a)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        {/* Avatar */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-base"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', letterSpacing: 1 }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{profile.name}</p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(167,139,250,0.6)' }}>{profile.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasProfile
            ? <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                <BadgeCheck size={10} /> Profile Complete
              </span>
            : <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                <BadgeAlert size={10} /> No Company Profile
              </span>
          }
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
            Supplier
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4" style={{ background: '#fff' }}>
        {!hasProfile ? (
          <div className="flex items-center gap-3 py-3 px-4 rounded-xl"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <BadgeAlert size={15} style={{ color: '#d97706' }} className="shrink-0" />
            <p className="text-sm text-[#92400e]">
              This supplier has not filled in their company profile yet. Only their username and email are available.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fields.filter(f => f.key !== 'address' && profile[f.key]).map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: '#f5f3ff' }}>
                    <Icon size={12} style={{ color: '#7c3aed' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8]">{label}</p>
                    <p className="text-sm font-semibold text-[#0f172a] truncate mt-0.5">
                      {key === 'website'
                        ? <a href={profile[key]} target="_blank" rel="noreferrer"
                            className="hover:underline" style={{ color: '#7c3aed' }}>{profile[key]}</a>
                        : profile[key]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {profile.address && (
              <div className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: '#f5f3ff' }}>
                  <MapPin size={12} style={{ color: '#7c3aed' }} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8]">Address</p>
                  <p className="text-sm font-semibold text-[#0f172a] mt-0.5 whitespace-pre-line">{profile.address}</p>
                </div>
              </div>
            )}
            {/* Profile completeness bar */}
            <div className="pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Profile Completeness</p>
                <span className="text-xs font-extrabold" style={{ color: pctColor }}>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ background: pctColor }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ProposalDetails = () => {
  const { proposalId } = useParams();
  const [proposal, setProposal]             = useState(null);
  const [tender, setTender]                 = useState(null);
  const [supplierName, setSupplierName]     = useState('');
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [statusLoading, setStatusLoading]   = useState(false);
  const pollRef = useRef(null);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { role: 'supplier' };
  const isAdmin = user.role === 'admin';

  const loadProposal = async (id) => {
    const res = await apiService.getProposal(id);
    return res.data;
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const p = await loadProposal(proposalId);
        if (cancelled) return;
        setProposal(p);

        const [tRes, rRes, spRes] = await Promise.all([
          apiService.getTender(p.tender_id),
          apiService.getRankings(p.tender_id).catch(() => ({ data: { rankings: [] } })),
          apiService.getSupplierProfile(p.supplier_id).catch(() => null),
        ]);
        if (cancelled) return;
        setTender(tRes.data);
        const match = (rRes.data.rankings || []).find(r => r.proposal_id === p.id);
        if (match) setSupplierName(match.supplier_name);
        if (spRes?.data) setSupplierProfile(spRes.data);

        // If AI hasn't scored yet, poll until it does
        if (p.requirements?.length === 0) {
          pollRef.current = setInterval(async () => {
            try {
              const fresh = await loadProposal(proposalId);
              if (cancelled) return;
              if (fresh.requirements?.length > 0 || fresh.score > 0) {
                setProposal(fresh);
                clearInterval(pollRef.current);
              }
            } catch {}
          }, 3000);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load proposal.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [proposalId]);

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    try {
      const res = await apiService.updateProposalStatus(proposal.id, newStatus);
      setProposal(res.data);
    } catch {
      setError('Failed to update status.');
    } finally { setStatusLoading(false); }
  };

  /* ── Loading skeleton ── */
  if (loading) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl space-y-5"
    >
      <div className="flex items-center gap-3">
        <Sk className="w-10 h-10 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1"><Sk className="h-6 w-56" /><Sk className="h-3 w-36" /></div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Sk key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Sk className="h-48 rounded-2xl" />
        <Sk className="h-48 rounded-2xl" />
      </div>
      <Sk className="h-20 rounded-2xl" />
      <Sk className="h-64 rounded-2xl" />
    </motion.div>
  );

  if (error) return (
    <div className="flex items-center gap-3 p-5 rounded-2xl text-sm font-medium"
      style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444' }}>
      <AlertCircle size={16} className="shrink-0" /> {error}
    </div>
  );

  const isProcessing  = (proposal?.requirements?.length ?? 0) === 0;
  const score         = proposal?.score || 0;
  const scoreColor    = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const status        = proposal?.status || 'under_review';
  const statusCfg     = STATUS_CONFIG[status] || STATUS_CONFIG.under_review;
  const StatusIcon    = statusCfg.icon;
  const reqs          = proposal?.requirements || [];
  const mandatory     = reqs.filter(r => r.is_mandatory);
  const scoredReqs    = reqs.filter(r => !r.is_mandatory);
  const mandatoryPassed  = mandatory.filter(r => r.detected && r.llm_verdict !== 'NO').length;
  const mandatoryFailed  = mandatory.length - mandatoryPassed;
  const totalEarned      = scoredReqs.reduce((s, r) => s + (r.points_earned   ?? 0), 0);
  const totalPossible    = scoredReqs.reduce((s, r) => s + (r.points_possible ?? 0), 0);
  const redFlagCount     = (proposal?.red_flags || []).length;
  const rec              = !isProcessing ? getRecommendation(score, mandatoryFailed, redFlagCount) : null;
  const pdfUrl           = proposal?.pdf_path
    ? `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/${proposal.pdf_path}`
    : null;

  const METRICS = [
    { label: 'Compliance Score', value: isProcessing ? '—' : `${Math.round(score)}%`, color: isProcessing ? '#94a3b8' : scoreColor, bg: isProcessing ? '#f8fafc' : score >= 80 ? '#f0fdf4' : score >= 50 ? '#fffbeb' : '#fef2f2', icon: TrendingUp },
    { label: 'Mandatory',        value: isProcessing ? '—' : `${mandatoryPassed}/${mandatory.length}`, color: isProcessing ? '#94a3b8' : mandatoryFailed > 0 ? '#ef4444' : '#10b981', bg: isProcessing ? '#f8fafc' : mandatoryFailed > 0 ? '#fef2f2' : '#f0fdf4', icon: ShieldCheck },
    { label: 'Points Scored',    value: isProcessing ? '—' : `${totalEarned}/${totalPossible}`, color: isProcessing ? '#94a3b8' : '#7c3aed', bg: isProcessing ? '#f8fafc' : '#f5f3ff', icon: Zap },
    { label: 'Red Flags',        value: isProcessing ? '—' : redFlagCount, color: isProcessing ? '#94a3b8' : redFlagCount > 0 ? '#ef4444' : '#10b981', bg: isProcessing ? '#f8fafc' : redFlagCount > 0 ? '#fef2f2' : '#f0fdf4', icon: Flag },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="content"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-4xl space-y-5"
      >
        {/* Header */}
        <div>
          <Link to={isAdmin ? '/dashboard' : '/supplier'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold mb-3 transition-colors"
            style={{ color: '#94a3b8' }}
            onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
            <ArrowLeft size={12} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
              <FileText size={18} color="#fff" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0f172a]">
                {isAdmin ? 'Proposal Audit Report' : 'My Proposal'}
              </h1>
              <p className="text-sm text-[#94a3b8] mt-0.5">
                Proposal #{proposal?.id}
                {tender?.title && <> · <span className="font-semibold text-[#64748b]">{tender.title}</span></>}
              </p>
            </div>
          </div>
        </div>

        {/* ── Action bar — always visible right under the title ── */}
        <div className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>

          {/* Current status badge */}
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">Current Status</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold"
              style={{ background: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}>
              <StatusIcon size={12} /> {statusCfg.label}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status change buttons — admin only */}
            {isAdmin && Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const isActive = status === key;
              return (
                <button key={key}
                  onClick={() => handleStatusChange(key)}
                  disabled={statusLoading || isActive}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-60"
                  style={isActive
                    ? { background: cfg.bg, color: cfg.color, borderColor: cfg.border, cursor: 'default' }
                    : { background: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }}
                  onMouseEnter={e => { if (!isActive && !statusLoading) { e.currentTarget.style.background = cfg.bg; e.currentTarget.style.color = cfg.color; e.currentTarget.style.borderColor = cfg.border; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}>
                  {statusLoading && status !== key
                    ? <span className="animate-spin rounded-full h-3 w-3 border-b-2" style={{ borderColor: cfg.color }} />
                    : <Icon size={12} />}
                  {cfg.label}
                </button>
              );
            })}

            {/* PDF download */}
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed'; }}>
                <Download size={11} /> Document
              </a>
            )}
          </div>
        </div>

        {/* Supplier profile card — admin only */}
        {isAdmin && supplierProfile && (
          <SupplierCard profile={supplierProfile} />
        )}

        {/* AI Processing banner — shown until scoring completes */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', border: '1px solid #ddd6fe' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                <Loader2 size={16} color="#fff" className="animate-spin" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0f172a]">AI Scoring In Progress</p>
                <p className="text-xs text-[#6d28d9] mt-0.5">
                  The document is being analysed for compliance. Results will appear automatically — no need to refresh.
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.div key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, delay, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#7c3aed' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary metric cards */}
        {isAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {METRICS.map(({ label, value, color, bg, icon: Icon }, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-4"
                style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: bg }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <p className="text-xl font-extrabold" style={{ color }}>
                  {isProcessing && value === '—'
                    ? <span className="inline-block w-8 h-5 rounded animate-pulse" style={{ background: '#f1f5f9' }} />
                    : value}
                </p>
                <p className="text-[10px] font-semibold text-[#94a3b8] mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info: submission details + score gauge */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Submission details */}
          <div className="rounded-2xl p-5 space-y-4"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Submission Details</p>
            <div className="space-y-3">
              {tender?.title && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#f5f3ff' }}>
                    <FileText size={12} style={{ color: '#7c3aed' }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#94a3b8] font-semibold">Tender</p>
                    <p className="text-sm font-bold text-[#0f172a]">{tender.title}</p>
                  </div>
                </div>
              )}
              {supplierName && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#f0fdf4' }}>
                    <User size={12} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#94a3b8] font-semibold">Supplier</p>
                    <p className="text-sm font-bold text-[#0f172a]">{supplierName}</p>
                  </div>
                </div>
              )}
              {tender?.company_name && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#fffbeb' }}>
                    <Building2 size={12} style={{ color: '#d97706' }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#94a3b8] font-semibold">Organisation</p>
                    <p className="text-sm font-bold text-[#0f172a]">{tender.company_name}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#f8fafc' }}>
                  <Clock size={12} style={{ color: '#64748b' }} />
                </div>
                <div>
                  <p className="text-[10px] text-[#94a3b8] font-semibold">Submitted</p>
                  <p className="text-sm font-bold text-[#0f172a]">
                    {proposal?.submitted_at
                      ? new Date(proposal.submitted_at).toLocaleString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl transition-all mt-1"
                  style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed'; }}>
                  <Download size={13} /> Download Proposal Document
                </a>
              )}
            </div>
          </div>

          {/* Score gauge or supplier waiting */}
          {isAdmin ? (
            <div className="rounded-2xl p-5 flex flex-col items-center justify-center"
              style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              {isProcessing ? (
                <div className="text-center space-y-3 py-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ background: '#f5f3ff' }}>
                    <Loader2 size={28} className="animate-spin" style={{ color: '#7c3aed' }} />
                  </div>
                  <p className="text-sm font-bold text-[#0f172a]">Awaiting AI Score</p>
                  <p className="text-xs text-[#94a3b8]">The compliance engine is processing the document.</p>
                </div>
              ) : (
                <>
                  <ScoreGauge score={score} />
                  <div className="grid grid-cols-3 gap-3 w-full mt-4 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                    {[
                      { label: 'Mandatory', val: `${mandatoryPassed}/${mandatory.length}`, color: mandatoryFailed > 0 ? '#ef4444' : '#10b981' },
                      { label: 'Points',    val: `${totalEarned}/${totalPossible}`,         color: '#7c3aed' },
                      { label: 'Flags',     val: redFlagCount,                              color: redFlagCount > 0 ? '#ef4444' : '#10b981' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="text-center">
                        <p className="text-lg font-extrabold" style={{ color }}>{val}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8] mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-2xl p-6 flex flex-col items-center justify-center text-center"
              style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', border: '1px solid #ddd6fe' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                <AlertCircle size={22} color="#fff" />
              </div>
              <p className="font-bold text-[#0f172a]">Under Review</p>
              <p className="text-sm text-[#64748b] mt-1 leading-relaxed">
                Your proposal is being evaluated. You'll be notified once a decision has been made.
              </p>
            </div>
          )}
        </div>

        {/* AI Recommendation — only when scored */}
        {isAdmin && !isProcessing && rec && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${rec.border}`, boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}
          >
            <div className="flex items-center gap-3 px-5 py-3.5"
              style={{ background: rec.bg, borderBottom: `1px solid ${rec.border}` }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: rec.color }}>
                <rec.icon size={13} color="#fff" />
              </div>
              <p className="text-xs font-extrabold uppercase tracking-widest flex-1" style={{ color: rec.color }}>
                AI Recommendation
              </p>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide text-white"
                style={{ background: rec.color }}>{rec.verdict}</span>
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <div className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                  <Zap size={10} color="#fff" fill="#fff" />
                </div>
                <span className="text-[10px] font-bold text-[#94a3b8]">Powered by AI</span>
              </div>
            </div>
            <div className="px-5 py-4" style={{ background: '#fff' }}>
              <p className="text-sm text-[#64748b] leading-relaxed">{rec.text}</p>
            </div>
          </motion.div>
        )}


        {/* Compliance breakdown */}
        {isAdmin && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                <Zap size={12} color="#fff" fill="#fff" />
              </div>
              <h2 className="text-sm font-bold text-[#0f172a]">Document Compliance Breakdown</h2>
              {!isProcessing && (
                <span className="text-xs font-semibold text-[#94a3b8]">
                  · {reqs.length} requirement{reqs.length !== 1 ? 's' : ''} assessed
                </span>
              )}
            </div>
            <ComplianceTable
              requirements={reqs}
              redFlags={proposal?.red_flags || []}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ProposalDetails;
