import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import {
  ClipboardCheck, CheckCircle2, XCircle, FileText,
  ChevronDown, ChevronUp, Clock, Building2, AlertTriangle, X,
  MapPin, Phone, User, Hash, Calendar, Briefcase, Mail,
} from 'lucide-react';

const Toast = ({ toasts }) => (
  <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none">
    <AnimatePresence>
      {toasts.map(t => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg pointer-events-auto"
          style={{
            background: t.type === 'success' ? '#fff' : '#fff',
            border: t.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
            color: t.type === 'success' ? '#10b981' : '#ef4444',
            boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
          }}
        >
          {t.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {t.message}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

const RejectModal = ({ isOpen, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 24px 48px rgba(15,23,42,0.18)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#fef2f2' }}>
              <XCircle size={15} style={{ color: '#ef4444' }} />
            </div>
            <p className="font-bold text-[#0f172a]">Reject Tender</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={14} style={{ color: '#94a3b8' }} />
          </button>
        </div>
        <p className="text-xs text-[#64748b] mb-3">Provide a reason for the rejection so the admin can improve their tender.</p>
        <textarea
          rows={4} value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Enter rejection reason…"
          className="w-full px-3.5 py-3 rounded-xl text-sm outline-none resize-none transition-all"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
          onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
          onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
            Cancel
          </button>
          <button onClick={() => { onConfirm(reason); setReason(''); }}
            disabled={loading || !reason.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: '#ef4444' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#dc2626'; }}
            onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}>
            {loading ? 'Rejecting…' : 'Reject Tender'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const IssuerRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 min-w-0">
    <Icon size={11} style={{ color: '#7c3aed', marginTop: 2, flexShrink: 0 }} />
    <div className="min-w-0">
      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>{label}</p>
      <p className="text-xs font-semibold text-[#0f172a] truncate">{value}</p>
    </div>
  </div>
);

const ApprovalQueue = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [rejectModal, setRejectModal] = useState({ open: false, id: null });
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    apiService.getApprovalQueue()
      .then(res => setQueue(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleApprove = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'approve' }));
    try {
      await apiService.approveTender(id);
      setQueue(prev => prev.filter(item => item.id !== id));
      addToast('Tender approved successfully.', 'success');
    } catch {
      addToast('Failed to approve tender.', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (reason) => {
    const { id } = rejectModal;
    setRejectModal({ open: false, id: null });
    setActionLoading(prev => ({ ...prev, [id]: 'reject' }));
    try {
      await apiService.rejectTender(id, reason);
      setQueue(prev => prev.filter(item => item.id !== id));
      addToast('Tender rejected.', 'error');
    } catch {
      addToast('Failed to reject tender.', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  return (
    <>
      <Toast toasts={toasts} />
      <RejectModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, id: null })}
        onConfirm={handleReject}
        loading={!!actionLoading[rejectModal.id]}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5 max-w-3xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: '#7c3aed' }}>
              Super Admin
            </p>
            <h1 className="text-2xl font-extrabold text-[#0f172a]">Approval Queue</h1>
            <p className="text-sm text-[#94a3b8] mt-0.5">
              Review and action tenders submitted by admins.
            </p>
          </div>
          {queue.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <Clock size={13} style={{ color: '#d97706' }} />
              <span className="text-sm font-bold text-amber-700">{queue.length} pending</span>
            </div>
          )}
        </div>

        {/* Queue */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 h-24"
                style={{ background: '#fff', border: '1px solid #f1f5f9' }} />
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="py-24 text-center rounded-2xl"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <CheckCircle2 size={36} className="mx-auto mb-4 text-green-400" />
            <p className="text-lg font-bold text-[#0f172a]">Queue is clear!</p>
            <p className="text-sm text-[#94a3b8] mt-1">All tenders have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {queue.map((item) => {
                const isExpanded = !!expanded[item.id];
                const al = actionLoading[item.id];
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between px-5 py-4 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: '#f5f3ff' }}>
                          <FileText size={15} style={{ color: '#7c3aed' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#0f172a] truncate">{item.title}</p>
                          <p className="text-[10px] text-[#94a3b8] flex items-center gap-1 mt-0.5">
                            <Building2 size={9} /> {item.company_name || 'Unknown Company'} · {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={!!al}
                          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl text-white transition-all disabled:opacity-50"
                          style={{ background: '#10b981' }}
                          onMouseEnter={e => { if (!al) e.currentTarget.style.background = '#059669'; }}
                          onMouseLeave={e => e.currentTarget.style.background = '#10b981'}>
                          {al === 'approve' ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> : <CheckCircle2 size={12} />}
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ open: true, id: item.id })}
                          disabled={!!al}
                          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all disabled:opacity-50"
                          style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}
                          onMouseEnter={e => { if (!al) { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; } }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}>
                          {al === 'reject' ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-400" /> : <XCircle size={12} />}
                          Reject
                        </button>
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="p-2 rounded-xl transition-all"
                          style={{ background: '#f8fafc', color: '#94a3b8' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#94a3b8'; }}>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden', borderTop: '1px solid #f8fafc' }}
                        >
                          <div className="px-5 py-4 space-y-4" style={{ background: '#fafafa' }}>

                            {/* Issuer Organisation Card */}
                            {item.created_by && (
                              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #ede9fe' }}>
                                <div className="px-4 py-3 flex items-center gap-2"
                                  style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                                  <Building2 size={13} color="#fff" />
                                  <p className="text-xs font-bold text-white tracking-wide">Issuer Organisation</p>
                                  {item.created_by.company_type && (
                                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                                      style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                                      {item.created_by.company_type}
                                    </span>
                                  )}
                                </div>
                                <div className="p-4" style={{ background: '#fff' }}>
                                  <p className="text-base font-extrabold text-[#0f172a] mb-3">
                                    {item.created_by.company_name || item.created_by.name}
                                  </p>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                                    {item.created_by.contact_person && (
                                      <IssuerRow icon={User} label="Contact Person" value={item.created_by.contact_person} />
                                    )}
                                    {item.created_by.email && (
                                      <IssuerRow icon={Mail} label="Email" value={item.created_by.email} />
                                    )}
                                    {item.created_by.phone && (
                                      <IssuerRow icon={Phone} label="Phone" value={item.created_by.phone} />
                                    )}
                                    {item.created_by.registration_number && (
                                      <IssuerRow icon={Hash} label="Reg. Number" value={item.created_by.registration_number} />
                                    )}
                                    {(item.created_by.city || item.created_by.country) && (
                                      <IssuerRow icon={MapPin} label="Location"
                                        value={[item.created_by.city, item.created_by.country].filter(Boolean).join(', ')} />
                                    )}
                                    {item.created_by.year_established && (
                                      <IssuerRow icon={Calendar} label="Est." value={item.created_by.year_established} />
                                    )}
                                    {item.created_by.industry && (
                                      <IssuerRow icon={Briefcase} label="Industry" value={item.created_by.industry} />
                                    )}
                                  </div>
                                  {item.created_by.address && (
                                    <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid #f1f5f9' }}>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-0.5">Address</p>
                                      <p className="text-xs text-[#64748b]">{item.created_by.address}</p>
                                    </div>
                                  )}
                                  {item.created_by.business_description && (
                                    <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid #f1f5f9' }}>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-0.5">About</p>
                                      <p className="text-xs text-[#64748b] leading-relaxed">{item.created_by.business_description}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Tender details */}
                            {item.description && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1.5">Description</p>
                                <p className="text-sm text-[#64748b] leading-relaxed">{item.description}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                              {item.budget && (
                                <div className="rounded-xl p-3" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8] mb-0.5">Budget</p>
                                  <p className="text-sm font-bold text-[#0f172a]">${Number(item.budget).toLocaleString()}</p>
                                </div>
                              )}
                              {item.deadline && (
                                <div className="rounded-xl p-3" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8] mb-0.5">Deadline</p>
                                  <p className="text-sm font-bold text-[#0f172a]">{new Date(item.deadline).toLocaleDateString()}</p>
                                </div>
                              )}
                            </div>
                            {item.requirements?.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2">Requirements</p>
                                <div className="flex flex-wrap gap-2">
                                  {item.requirements.map((req, i) => {
                                    const label = typeof req === 'object' ? req.display_label : req.replace(/_/g, ' ');
                                    return (
                                      <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                                        style={{ background: '#f5f3ff', color: '#7c3aed' }}>{label}</span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default ApprovalQueue;
