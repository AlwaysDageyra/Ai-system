import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import UploadCard from '../components/UploadCard';
import { motion } from 'framer-motion';
import { SendHorizonal, ArrowLeft, CheckCircle2, AlertTriangle, AlertCircle, Clock, Zap } from 'lucide-react';

const Sk = ({ className = '' }) => (
  <div className={`rounded-lg animate-pulse ${className}`} style={{ background: '#f1f5f9' }} />
);

const SupplierSubmission = () => {
  const { tenderId } = useParams();
  const [tender, setTender] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiService.getTender(tenderId),
      apiService.getProposals(),
    ]).then(([tRes, pRes]) => {
      setTender(tRes.data);
      const existing = pRes.data.find(p => p.tender_id === parseInt(tenderId));
      if (existing) { setAlreadySubmitted(true); setResult(existing); }
    }).catch(() => setError('Failed to load tender info.'))
      .finally(() => setFetchLoading(false));
  }, [tenderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a document to upload.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const formData = new FormData();
      formData.append('tender_id', tenderId);
      formData.append('file', file);
      const res = await apiService.submitProposal(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return (
    <div className="max-w-2xl space-y-5 animate-pulse">
      <div className="space-y-2"><Sk className="h-3 w-24" /><Sk className="h-7 w-44" /><Sk className="h-4 w-64" /></div>
      <div className="rounded-2xl p-8 h-48" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
        <Sk className="h-full w-full rounded-xl" />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl space-y-5"
    >
      {/* Header */}
      <div>
        <Link to={`/tenders/${tenderId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-3 transition-colors"
          style={{ color: '#94a3b8' }}
          onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
          <ArrowLeft size={13} /> Back to Tender
        </Link>
        <h1 className="text-2xl font-bold text-[#0f172a]">Submit Proposal</h1>
        {tender && (
          <p className="text-sm text-[#94a3b8] mt-1">
            For: <span className="font-semibold text-[#0f172a]">{tender.title}</span>
          </p>
        )}
      </div>

      {/* Required docs */}
      {tender && tender.requirements?.length > 0 && !result && (
        <div className="rounded-xl p-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <h3 className="text-xs font-bold text-amber-700 mb-2.5 uppercase tracking-wide">
            Required Documents in Your PDF:
          </h3>
          <div className="flex flex-wrap gap-2">
            {tender.requirements.map((req, i) => {
              const label = typeof req === 'object' ? req.display_label : req.replace(/_/g, ' ');
              const mandatory = typeof req === 'object' ? req.is_mandatory : false;
              return (
                <span key={i} className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    background: mandatory ? '#fef2f2' : '#fff7ed',
                    color:      mandatory ? '#ef4444' : '#d97706',
                    border:     mandatory ? '1px solid #fecaca' : '1px solid #fed7aa',
                  }}>
                  {mandatory ? '⚠ ' : ''}{label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-600">{error}</p>
        </div>
      )}

      {/* Result / success state */}
      {result ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-8 space-y-5"
          style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #bbf7d0' }}>
              <CheckCircle2 size={26} className="text-green-500" />
            </div>
            <div>
              <p className="font-bold text-[#0f172a] text-lg">
                {alreadySubmitted ? 'Already Submitted' : 'Proposal Submitted!'}
              </p>
              <p className="text-sm text-[#64748b] mt-0.5">
                {alreadySubmitted
                  ? 'You have already submitted a proposal for this tender.'
                  : 'Your document has been received and is being processed by our AI.'}
              </p>
            </div>
          </div>

          {/* AI scoring notice */}
          {!alreadySubmitted && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: '#f5f3ff', border: '1px solid #ede9fe' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                <Zap size={12} color="#fff" fill="#fff" />
              </div>
              <p className="text-xs font-semibold text-[#6d28d9]">
                Our AI is scoring your proposal for compliance and merit.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
              <AlertCircle size={13} /> Under Review
            </div>
            <span className="text-xs text-[#94a3b8] flex items-center gap-1">
              <Clock size={11} /> The admin will notify you of the result
            </span>
          </div>

          <Link
            to="/supplier"
            className="block w-full py-3 rounded-xl text-sm font-bold text-white text-center transition-all"
            style={{ background: 'linear-gradient(135deg,#0f172a,#7c3aed)' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Back to Dashboard
          </Link>
        </motion.div>
      ) : (
        <div className="rounded-2xl p-6"
          style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#0f172a]">
                Proposal Document <span className="text-red-500">*</span>
              </label>
              <UploadCard onFileSelect={setFile} file={file} />
              <p className="text-xs text-[#94a3b8] mt-1">
                Upload a single PDF containing all required documents merged together.
              </p>
            </div>
            <div className="pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
              <button
                type="submit" disabled={loading || !file}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                style={{ background: loading ? '#7c3aed' : 'linear-gradient(135deg,#0f172a,#7c3aed)', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}
                onMouseEnter={e => { if (!loading && file) e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,0.45)'; }}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,0.3)'}
              >
                {loading ? (
                  <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Submitting...</>
                ) : (
                  <><SendHorizonal size={16} /> Submit Proposal</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
};

export default SupplierSubmission;
