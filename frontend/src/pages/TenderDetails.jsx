import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Trophy, Clock, CheckCircle2, Users, ArrowLeft, ChevronRight,
  Download, XCircle, AlertCircle, Pencil, Trash2, Save, X, Send, AlertTriangle,
  ShieldCheck, Building2, Star, Hash, Calendar, Layers, BarChart2,
  Mail, Phone, Briefcase, RefreshCw,
} from 'lucide-react';

const SECTORS = [
  'Food Security & Agriculture',
  'ICT & Technology',
  'Education & Training',
  'Engineering & Infrastructure',
  'Energy & Power',
  'Office Supplies & Printing',
  'Consultancy & Research',
  'Logistics & Flight Rental',
  'Healthcare & Insurance',
  'General Procurement',
];

const SECTOR_COLORS = {
  'Food Security & Agriculture':  { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  'ICT & Technology':             { bg: '#f3e8ff', color: '#7c3aed', border: '#e9d5ff' },
  'Education & Training':         { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  'Engineering & Infrastructure': { bg: '#fef9c3', color: '#b45309', border: '#fde68a' },
  'Energy & Power':               { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  'Office Supplies & Printing':   { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  'Consultancy & Research':       { bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
  'Logistics & Flight Rental':    { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  'Healthcare & Insurance':       { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  'General Procurement':          { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
};

const REQ_ICONS = {
  bank_statement:       { icon: Building2, color: '#0ea5e9', bg: '#f0f9ff' },
  financial_compliance: { icon: CheckCircle2, color: '#10b981', bg: '#f0fdf4' },
  tax_compliance:       { icon: CheckCircle2, color: '#10b981', bg: '#f0fdf4' },
  technical_proposal:   { icon: BarChart2,    color: '#7c3aed', bg: '#f5f3ff' },
  company_profile:      { icon: Building2,    color: '#f59e0b', bg: '#fffbeb' },
  experience:           { icon: Star,         color: '#f59e0b', bg: '#fffbeb' },
  certificates:         { icon: Trophy,       color: '#d97706', bg: '#fef9c3' },
};

const getReqIcon = (name) => {
  const key = (name || '').toLowerCase().replace(/\s+/g, '_');
  return REQ_ICONS[key] || { icon: FileText, color: '#64748b', bg: '#f8fafc' };
};

const Sk = ({ className = '' }) => (
  <div className={`rounded-lg animate-pulse ${className}`} style={{ background: '#f1f5f9' }} />
);

const TenderDetailSkeleton = () => (
  <div className="space-y-5 max-w-5xl animate-pulse">
    <Sk className="h-3 w-28" />
    <div className="rounded-2xl p-8 space-y-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
      <div className="flex gap-2"><Sk className="h-6 w-20 rounded-full" /><Sk className="h-6 w-20 rounded-full" /></div>
      <Sk className="h-8 w-80" />
      <Sk className="h-4 w-96" />
      <div className="flex gap-4 pt-2"><Sk className="h-4 w-32" /><Sk className="h-4 w-28" /></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 rounded-2xl p-6 space-y-3" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
        <Sk className="h-5 w-40 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => <Sk key={i} className="h-16 rounded-xl" />)}
        </div>
      </div>
      <div className="rounded-2xl p-6 space-y-3" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
        <Sk className="h-5 w-32 mb-2" />
        {[...Array(3)].map((_, i) => <Sk key={i} className="h-12 rounded-xl" />)}
      </div>
    </div>
  </div>
);

const TenderDetails = () => {
  const { tenderId } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [myProposal, setMyProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', deadline: '', sector: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [approvalMsg, setApprovalMsg] = useState('');

  const [reqOpen, setReqOpen] = useState(true);
  const [rescoreLoading, setRescoreLoading] = useState(false);
  const [rescoreMsg, setRescoreMsg]         = useState('');

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { role: 'supplier' };
  const role = user.role;
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';
  const isClosed = tender?.deadline && new Date() > new Date(tender.deadline);
  const approvalStatus = tender?.approval_status || 'approved';
  const canSubmitForApproval = isAdmin && (approvalStatus === 'draft' || approvalStatus === 'rejected');

  const handleApprove = async () => {
    setApproveLoading(true); setApprovalMsg('');
    try {
      await apiService.approveTender(tenderId);
      setTender(t => ({ ...t, approval_status: 'approved' }));
      setApprovalMsg('approved');
    } catch (err) {
      setApprovalMsg('error:' + (err?.response?.data?.message || 'Failed to approve.'));
    } finally { setApproveLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setRejectLoading(true); setApprovalMsg('');
    try {
      await apiService.rejectTender(tenderId, rejectReason);
      setTender(t => ({ ...t, approval_status: 'rejected', rejection_reason: rejectReason }));
      setApprovalMsg('rejected');
      setShowRejectForm(false);
    } catch (err) {
      setApprovalMsg('error:' + (err?.response?.data?.message || 'Failed to reject.'));
    } finally { setRejectLoading(false); }
  };

  const handleRescore = async () => {
    setRescoreLoading(true); setRescoreMsg('');
    try {
      const res = await apiService.rescoreProposals(tenderId);
      setRescoreMsg(res.data.message || 'Re-scoring started.');
    } catch (err) {
      setRescoreMsg(err?.response?.data?.message || 'Failed to start re-scoring.');
    } finally { setRescoreLoading(false); }
  };

  const handleSubmitForApproval = async () => {
    setSubmitLoading(true); setSubmitMsg('');
    try {
      await apiService.submitTenderForApproval(tenderId);
      setTender(t => ({ ...t, approval_status: 'pending' }));
      setSubmitMsg('Submitted! The Super Admin will review it shortly.');
    } catch (err) {
      setSubmitMsg(err?.response?.data?.message || 'Failed to submit.');
    } finally { setSubmitLoading(false); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenderRes = await apiService.getTender(tenderId);
        setTender(tenderRes.data);
        if (isAdmin || isSuperAdmin) {
          const rankRes = await apiService.getRankings(tenderId);
          setRankings(rankRes.data.rankings || []);
        }
        if (!isAdmin && !isSuperAdmin) {
          const pRes = await apiService.getProposals();
          const found = pRes.data.find(p => p.tender_id === parseInt(tenderId));
          setHasSubmitted(!!found);
          setMyProposal(found || null);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tender details.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [tenderId]);

  const startEdit = () => {
    setEditForm({
      title: tender.title,
      description: tender.description || '',
      deadline: tender.deadline ? tender.deadline.slice(0, 10) : '',
      sector: tender.sector || '',
    });
    setEditError('');
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) { setEditError('Title is required.'); return; }
    setEditLoading(true); setEditError('');
    try {
      const res = await apiService.updateTender(tenderId, {
        title: editForm.title.trim(),
        description: editForm.description,
        deadline: editForm.deadline || null,
        sector: editForm.sector || null,
      });
      setTender(res.data);
      setEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save changes.');
    } finally { setEditLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiService.deleteTender(tenderId);
      navigate('/tenders');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete tender.');
      setConfirmDelete(false);
      setDeleteLoading(false);
    }
  };

  if (loading) return <TenderDetailSkeleton />;

  if (error) return (
    <div className="flex items-center gap-3 p-5 rounded-2xl text-sm font-medium"
      style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444' }}>
      <AlertCircle size={16} className="shrink-0" /> {error}
    </div>
  );

  const sectorStyle = SECTOR_COLORS[tender?.sector] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
  const requirements = tender?.requirements || [];
  const mandatoryReqs = requirements.filter(r => typeof r === 'object' ? r.is_mandatory : false);
  const scoredReqs = requirements.filter(r => typeof r === 'object' ? !r.is_mandatory : true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 max-w-5xl"
    >
      {/* ── Back nav ── */}
      <Link
        to={isSuperAdmin ? '/super-admin/tenders' : isAdmin ? '/tenders' : '/supplier/tenders'}
        className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
        style={{ color: '#94a3b8' }}
        onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
        <ArrowLeft size={12} /> Back to Tenders
      </Link>

      {/* ── Hero card ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #e8e3ff', boxShadow: '0 4px 24px rgba(124,58,237,0.08)' }}>

        {/* Top accent strip */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#7c3aed,#a78bfa,#38bdf8)' }} />

        <div className="px-7 pt-6 pb-5">
          {/* Top row: badges left, actions right */}
          <div className="flex items-start justify-between gap-4 mb-4">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {tender?.sector && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
                  style={{ background: sectorStyle.bg, color: sectorStyle.color, border: `1px solid ${sectorStyle.border}` }}>
                  <Layers size={10} /> {tender.sector}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
                style={{
                  background: isClosed ? '#fef2f2' : '#f0fdf4',
                  color: isClosed ? '#ef4444' : '#10b981',
                  border: `1px solid ${isClosed ? '#fecaca' : '#bbf7d0'}`,
                }}>
                {isClosed ? <XCircle size={10} /> : <CheckCircle2 size={10} />}
                {isClosed ? 'Closed' : 'Active'}
              </span>
              {(isAdmin || isSuperAdmin) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold"
                  style={{
                    background: approvalStatus === 'approved' ? '#f0fdf4' : approvalStatus === 'pending' ? '#fffbeb' : approvalStatus === 'rejected' ? '#fef2f2' : '#f8fafc',
                    color: approvalStatus === 'approved' ? '#10b981' : approvalStatus === 'pending' ? '#d97706' : approvalStatus === 'rejected' ? '#ef4444' : '#94a3b8',
                    border: `1px solid ${approvalStatus === 'approved' ? '#bbf7d0' : approvalStatus === 'pending' ? '#fde68a' : approvalStatus === 'rejected' ? '#fecaca' : '#e2e8f0'}`,
                  }}>
                  {approvalStatus === 'approved' ? '● Published' : approvalStatus === 'pending' ? '● Pending Review' : approvalStatus === 'rejected' ? '● Rejected' : '● Draft'}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && !editing && (
                <>
                  <button onClick={startEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed'; }}>
                    <Pencil size={11} /> Edit
                  </button>
                  <button onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}>
                    <Trash2 size={11} /> Delete
                  </button>
                </>
              )}
              {tender?.pdf_path && (
                <a href={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/${tender.pdf_path}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed'; }}>
                  <Download size={11} /> Download PDF
                </a>
              )}
            </div>
          </div>

          {/* Title + description + CTA */}
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-[#0f172a] leading-snug tracking-tight">
                {tender?.title}
              </h1>
              <p className="text-sm text-[#64748b] leading-relaxed mt-1.5" style={{ maxWidth: 560 }}>
                {tender?.description || 'No description provided.'}
              </p>
            </div>

            {/* Supplier CTA or stats */}
            <div className="shrink-0">
              {!isAdmin && !isSuperAdmin && (
                hasSubmitted ? (
                  <div className="flex flex-col items-end gap-2">
                    <div className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl"
                      style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                      <AlertCircle size={14} /> Already Submitted
                    </div>
                    {myProposal && (
                      <Link
                        to={`/supplier/proposal/${myProposal.id}`}
                        className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl text-white transition-all"
                        style={{ background: '#7c3aed' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                        onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
                        <FileText size={12} /> View / Edit Proposal
                      </Link>
                    )}
                  </div>
                ) : isClosed ? (
                  <div className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl"
                    style={{ background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
                    <XCircle size={14} /> Submissions Closed
                  </div>
                ) : (
                  <Link to={`/submit/${tenderId}`}
                    className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all"
                    style={{ background: '#7c3aed', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                    onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
                    <FileText size={14} /> Submit Proposal
                  </Link>
                )
              )}
              {(isAdmin || isSuperAdmin) && rankings.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="text-center px-4 py-2.5 rounded-xl"
                    style={{ background: '#f5f3ff', border: '1px solid #ede9fe' }}>
                    <p className="text-xl font-black text-[#7c3aed] leading-none">{rankings.length}</p>
                    <p className="text-[9px] font-bold text-[#a78bfa] mt-1 uppercase tracking-wider">Proposals</p>
                  </div>
                  <div className="text-center px-4 py-2.5 rounded-xl"
                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <p className="text-xl font-black text-[#10b981] leading-none">
                      {Math.max(...rankings.map(r => r.score)).toFixed(0)}%
                    </p>
                    <p className="text-[9px] font-bold text-[#34d399] mt-1 uppercase tracking-wider">Top Score</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider + meta row */}
          <div className="flex items-center gap-5 flex-wrap mt-5 pt-4"
            style={{ borderTop: '1px solid #f1f5f9' }}>
            {tender?.deadline && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#64748b]">
                <Calendar size={12} style={{ color: '#7c3aed' }} />
                Deadline: <span className="font-semibold text-[#0f172a]">
                  {new Date(tender.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#64748b]">
              <Clock size={12} style={{ color: '#7c3aed' }} />
              Created: <span className="font-semibold text-[#0f172a]">
                {new Date(tender?.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-[#64748b]">
              <Hash size={12} style={{ color: '#7c3aed' }} />
              <span className="font-semibold text-[#0f172a]">{requirements.length}</span> requirements
            </span>
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {confirmDelete && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 p-4 rounded-2xl"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm font-semibold text-red-700">
              Delete <span className="font-extrabold">"{tender?.title}"</span>? All proposals will also be removed. This cannot be undone.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b' }}>Cancel</button>
            <button onClick={handleDelete} disabled={deleteLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-60"
              style={{ background: '#ef4444' }}>
              {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
            </button>
          </div>
        </motion.div>
      )}

      {approvalStatus === 'rejected' && tender?.rejection_reason && (
        <div className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">Tender Rejected</p>
            <p className="text-sm text-red-600 mt-0.5">{tender.rejection_reason}</p>
            {canSubmitForApproval && <p className="text-xs text-red-400 mt-1">Fix the issues above, then resubmit for approval.</p>}
          </div>
        </div>
      )}

      {canSubmitForApproval && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl"
          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <div>
            <p className="text-sm font-bold text-amber-700">
              {approvalStatus === 'draft' ? 'This tender is a draft.' : 'This tender was rejected and needs revision.'}
            </p>
            <p className="text-xs text-amber-500 mt-0.5">Submit it for Super Admin review to publish it publicly.</p>
          </div>
          {submitMsg ? (
            <p className="text-xs font-semibold text-amber-700 shrink-0">{submitMsg}</p>
          ) : (
            <button onClick={handleSubmitForApproval} disabled={submitLoading}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: '#d97706' }}>
              <Send size={13} /> {submitLoading ? 'Submitting…' : 'Submit for Approval'}
            </button>
          )}
        </div>
      )}

      {approvalStatus === 'pending' && isAdmin && (
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <Clock size={15} className="text-amber-500 shrink-0" />
          <p className="text-sm font-semibold text-amber-700">Awaiting Super Admin approval before this tender is published.</p>
        </div>
      )}

      {/* ── Edit form ── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid #ede9fe', boxShadow: '0 4px 20px rgba(124,58,237,0.08)' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
              <div className="flex items-center gap-2">
                <Pencil size={14} color="#a78bfa" />
                <span className="text-sm font-bold text-white">Edit Tender</span>
              </div>
              <button onClick={() => setEditing(false)}
                className="p-1.5 rounded-lg transition-all"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
                <X size={14} />
              </button>
            </div>
            <div className="p-6 space-y-5" style={{ background: '#fff' }}>
              {editError && (
                <p className="text-xs font-semibold px-3 py-2 rounded-xl"
                  style={{ background: '#fef2f2', color: '#ef4444' }}>{editError}</p>
              )}

              {/* Sector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Sector</label>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map(s => {
                    const active = editForm.sector === s;
                    return (
                      <button key={s} type="button"
                        onClick={() => setEditForm(fm => ({ ...fm, sector: s }))}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: active ? '#7c3aed' : '#f8fafc',
                          color: active ? '#fff' : '#64748b',
                          border: active ? '1px solid #7c3aed' : '1px solid #e2e8f0',
                          boxShadow: active ? '0 2px 6px rgba(124,58,237,0.25)' : 'none',
                        }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Title</label>
                <input type="text" value={editForm.title}
                  onChange={e => setEditForm(fm => ({ ...fm, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                  onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Description</label>
                <textarea rows={3} value={editForm.description}
                  onChange={e => setEditForm(fm => ({ ...fm, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                  onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Deadline (optional)</label>
                <input type="date" value={editForm.deadline}
                  onChange={e => setEditForm(fm => ({ ...fm, deadline: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                  onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button onClick={saveEdit} disabled={editLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                  style={{ background: '#7c3aed', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
                  <Save size={13} /> {editLoading ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                  <X size={13} /> Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Requirements panel — 2/3 width */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          <div className="px-6 py-4 flex items-center justify-between gap-2"
            style={{ borderBottom: reqOpen ? '1px solid #f8fafc' : 'none' }}>
            <button
              onClick={() => setReqOpen(o => !o)}
              className="flex items-center gap-2 flex-1 text-left transition-colors"
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <h2 className="font-bold text-[#0f172a] text-sm flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#f5f3ff' }}>
                  <CheckCircle2 size={13} style={{ color: '#7c3aed' }} />
                </div>
                Extracted Requirements
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg ml-1"
                  style={{ background: '#f5f3ff', color: '#7c3aed' }}>{requirements.length}</span>
              </h2>
              <ChevronRight size={15} style={{
                color: '#94a3b8',
                transform: reqOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                flexShrink: 0,
              }} />
            </button>
            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                {rescoreMsg && (
                  <span className="text-[10px] font-semibold" style={{ color: rescoreMsg.includes('Failed') ? '#ef4444' : '#10b981' }}>
                    {rescoreMsg}
                  </span>
                )}
                <button
                  onClick={handleRescore}
                  disabled={rescoreLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all disabled:opacity-50"
                  style={{ background: '#f0fdf4', color: '#10b981', border: '1px solid #bbf7d0' }}
                  onMouseEnter={e => { if (!rescoreLoading) { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff'; }}}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#10b981'; }}>
                  {rescoreLoading
                    ? <><span className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-current" /> Scoring…</>
                    : <><RefreshCw size={10} /> Re-score Proposals</>}
                </button>
              </div>
            )}
          </div>

          <AnimatePresence initial={false}>
          {reqOpen && (
          <motion.div
            key="req-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}>

          {requirements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileText size={28} style={{ color: '#e2e8f0' }} />
              {tender?.pdf_path ? (
                <>
                  <p className="text-sm text-[#94a3b8] font-medium">Extracting requirements…</p>
                  <p className="text-xs text-[#cbd5e1]">The AI is processing the uploaded document. Refresh in a moment.</p>
                </>
              ) : (
                <p className="text-sm text-[#94a3b8] font-medium">No requirements yet — upload a PDF when creating the tender</p>
              )}
            </div>
          ) : (
            <div className="p-5 flex flex-col gap-2">
              {requirements.map((req, idx) => {
                const label = typeof req === 'object' ? req.display_label : req.replace(/_/g, ' ');
                const pts = typeof req === 'object' ? req.points : null;
                const mandatory = typeof req === 'object' ? req.is_mandatory : false;
                return (
                  <div key={idx} className="flex gap-3 p-4 rounded-xl"
                    style={{
                      background: mandatory ? '#fef2f2' : '#fafafa',
                      border: `1px solid ${mandatory ? '#fecaca' : '#f1f5f9'}`,
                      borderLeft: `3px solid ${mandatory ? '#ef4444' : '#7c3aed'}`,
                    }}>
                    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                      style={{ background: mandatory ? '#fee2e2' : '#ede9fe', color: mandatory ? '#ef4444' : '#7c3aed' }}>
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-[#1e293b] leading-relaxed" style={{ fontWeight: 500 }}>{label}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {mandatory && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#fee2e2', color: '#ef4444' }}>Mandatory</span>
                        )}
                        {pts != null && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#ede9fe', color: '#7c3aed' }}>{pts} pts</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Submitted Suppliers — Admin only */}
          {isAdmin && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f8fafc' }}>
                <h2 className="font-bold text-[#0f172a] text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#f0f9ff' }}>
                    <Users size={12} style={{ color: '#0ea5e9' }} />
                  </div>
                  Submissions
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                    style={{ background: '#f0f9ff', color: '#0ea5e9' }}>{rankings.length}</span>
                </h2>
                <Link to={`/rankings/${tenderId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                  style={{ color: '#7c3aed' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#6d28d9'}
                  onMouseLeave={e => e.currentTarget.style.color = '#7c3aed'}>
                  <Trophy size={11} /> Leaderboard <ChevronRight size={11} />
                </Link>
              </div>

              {rankings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Users size={22} style={{ color: '#e2e8f0' }} />
                  <p className="text-xs text-[#94a3b8] font-medium text-center">No proposals yet</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
                  {rankings.slice(0, 5).map((row) => {
                    const score = row.score;
                    const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
                    const scoreBg = score >= 80 ? '#f0fdf4' : score >= 50 ? '#fffbeb' : '#fef2f2';
                    return (
                      <div key={row.proposal_id} className="flex items-center gap-3 px-5 py-3 transition-all"
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span className="text-xs font-black w-5 text-center shrink-0"
                          style={{ color: row.rank <= 3 ? '#7c3aed' : '#cbd5e1' }}>
                          {row.rank <= 3 ? ['🥇','🥈','🥉'][row.rank - 1] : `#${row.rank}`}
                        </span>
                        <span className="text-sm font-semibold text-[#0f172a] flex-1 truncate">{row.supplier_name}</span>
                        <span className="font-bold text-xs px-2.5 py-1 rounded-lg shrink-0"
                          style={{ background: scoreBg, color: scoreColor }}>
                          {row.score.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                  {rankings.length > 5 && (
                    <div className="px-5 py-3">
                      <Link to={`/rankings/${tenderId}`}
                        className="text-xs font-semibold transition-colors"
                        style={{ color: '#94a3b8' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                        +{rankings.length - 5} more → Full Leaderboard
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick info card */}
          <div className="rounded-2xl p-5 space-y-3"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Details</p>
            <div className="space-y-2.5">
              {tender?.sector && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748b] font-medium">Sector</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: sectorStyle.bg, color: sectorStyle.color }}>
                    {tender.sector}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b] font-medium">Status</span>
                <span className="text-xs font-bold" style={{ color: isClosed ? '#ef4444' : '#10b981' }}>
                  {isClosed ? 'Closed' : 'Active'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b] font-medium">Requirements</span>
                <span className="text-xs font-bold text-[#0f172a]">{requirements.length} documents</span>
              </div>
              {tender?.deadline && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#64748b] font-medium">Deadline</span>
                  <span className="text-xs font-bold text-[#0f172a]">
                    {new Date(tender.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b] font-medium">Created</span>
                <span className="text-xs font-bold text-[#0f172a]">
                  {new Date(tender?.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Procurement Officer card — super admin only */}
          {isSuperAdmin && tender?.created_by && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #f8fafc' }}>
                <h2 className="font-bold text-[#0f172a] text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#f0f9ff' }}>
                    <Briefcase size={12} style={{ color: '#0ea5e9' }} />
                  </div>
                  Procurement Officer
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-extrabold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #0ea5e999)' }}>
                    {tender.created_by.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0f172a] truncate">{tender.created_by.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{ background: '#f0f9ff', color: '#0ea5e9' }}>Admin</span>
                  </div>
                </div>

                {/* Contact details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f8fafc' }}>
                      <Mail size={11} style={{ color: '#94a3b8' }} />
                    </div>
                    <p className="text-xs text-[#64748b] truncate">{tender.created_by.email}</p>
                  </div>
                  {tender.created_by.phone && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f8fafc' }}>
                        <Phone size={11} style={{ color: '#94a3b8' }} />
                      </div>
                      <p className="text-xs text-[#64748b]">{tender.created_by.phone}</p>
                    </div>
                  )}
                  {tender.created_by.company_name && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f8fafc' }}>
                        <Building2 size={11} style={{ color: '#94a3b8' }} />
                      </div>
                      <p className="text-xs text-[#64748b] truncate">{tender.created_by.company_name}</p>
                    </div>
                  )}
                  {tender.created_by.registration_number && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f8fafc' }}>
                        <Hash size={11} style={{ color: '#94a3b8' }} />
                      </div>
                      <p className="text-xs text-[#64748b]">Reg: {tender.created_by.registration_number}</p>
                    </div>
                  )}
                </div>

                {/* Fallback if no profile filled */}
                {!tender.created_by.phone && !tender.created_by.company_name && !tender.created_by.registration_number && (
                  <p className="text-[11px] text-[#94a3b8] italic">No company profile added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Super Admin control panel */}
          {isSuperAdmin && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f8fafc' }}>
                <h2 className="font-bold text-[#0f172a] text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#f5f3ff' }}>
                    <ShieldCheck size={13} style={{ color: '#7c3aed' }} />
                  </div>
                  Tender Control
                </h2>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold"
                  style={{
                    background: approvalStatus === 'approved' ? '#f0fdf4' : approvalStatus === 'pending' ? '#fffbeb' : approvalStatus === 'rejected' ? '#fef2f2' : '#f8fafc',
                    color: approvalStatus === 'approved' ? '#10b981' : approvalStatus === 'pending' ? '#f59e0b' : approvalStatus === 'rejected' ? '#ef4444' : '#94a3b8',
                    border: `1px solid ${approvalStatus === 'approved' ? '#bbf7d0' : approvalStatus === 'pending' ? '#fde68a' : approvalStatus === 'rejected' ? '#fecaca' : '#e2e8f0'}`,
                  }}>
                  {approvalStatus === 'approved' ? '● Published' : approvalStatus === 'pending' ? '● Pending' : approvalStatus === 'rejected' ? '● Rejected' : '● Draft'}
                </span>
              </div>
              <div className="px-5 py-4 space-y-3">
                {approvalMsg === 'approved' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                    <p className="text-xs font-semibold text-green-700">Approved and published.</p>
                  </div>
                )}
                {approvalMsg === 'rejected' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <XCircle size={13} className="text-red-500 shrink-0" />
                    <p className="text-xs font-semibold text-red-700">Tender rejected.</p>
                  </div>
                )}
                {approvalMsg.startsWith('error:') && (
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <AlertTriangle size={13} className="text-red-500 shrink-0" />
                    <p className="text-xs font-semibold text-red-600">{approvalMsg.replace('error:', '')}</p>
                  </div>
                )}
                {!approvalMsg && (
                  <>
                    <p className="text-xs text-[#64748b] leading-relaxed">
                      {approvalStatus === 'pending' ? 'Awaiting your review. Approve to publish or reject with a reason.'
                        : approvalStatus === 'approved' ? 'Live and visible to suppliers. Reject to take it offline.'
                        : approvalStatus === 'rejected' ? 'Rejected. Approve if issues have been resolved.'
                        : 'Draft — waiting for admin to submit for review.'}
                    </p>
                    <div className="flex flex-col gap-2">
                      {(approvalStatus === 'pending' || approvalStatus === 'rejected') && (
                        <button onClick={handleApprove} disabled={approveLoading || rejectLoading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                          style={{ background: '#10b981', boxShadow: '0 2px 8px rgba(16,185,129,0.25)' }}>
                          {approveLoading ? <><span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> Approving…</> : <><CheckCircle2 size={13} /> Approve & Publish</>}
                        </button>
                      )}
                      {(approvalStatus === 'pending' || approvalStatus === 'approved') && (
                        <button onClick={() => setShowRejectForm(v => !v)} disabled={approveLoading || rejectLoading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                          style={{ background: showRejectForm ? '#ef4444' : '#fef2f2', color: showRejectForm ? '#fff' : '#ef4444', border: '1px solid #fecaca' }}>
                          <XCircle size={13} />
                          {approvalStatus === 'approved' ? (showRejectForm ? 'Cancel' : 'Unpublish / Reject') : (showRejectForm ? 'Cancel' : 'Reject')}
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {showRejectForm && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                          <div className="space-y-2 pt-1">
                            <label className="text-[10px] font-bold uppercase tracking-wide text-[#64748b]">
                              {approvalStatus === 'approved' ? 'Reason for Unpublishing *' : 'Rejection Reason *'}
                            </label>
                            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                              placeholder="Explain why so the admin can revise…"
                              className="w-full px-3 py-2.5 rounded-xl text-xs outline-none resize-none transition-all"
                              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                              onFocus={e => { e.target.style.borderColor = '#ef4444'; e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.08)'; }}
                              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                            <button onClick={handleReject} disabled={rejectLoading || !rejectReason.trim()}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                              style={{ background: '#ef4444' }}>
                              {rejectLoading ? <><span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> Processing…</> : <><XCircle size={13} /> Confirm</>}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TenderDetails;
