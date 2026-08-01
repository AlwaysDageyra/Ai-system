import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import UploadCard from '../components/UploadCard';
import { motion } from 'framer-motion';
import { FilePlus, CheckCircle2, AlertTriangle, ArrowLeft, Calendar, Zap, Layers } from 'lucide-react';

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

const CreateTender = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState('');
  const [deadline, setDeadline] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('sector', sector);
      if (deadline) formData.append('deadline', deadline);
      if (file) formData.append('file', file);
      const res = await apiService.createTender(formData);
      setSuccess(`Tender "${res.data.title}" saved as draft with ${res.data.requirements.length} requirements. Go to My Tenders to submit it for approval.`);
      setTitle(''); setDescription(''); setSector(''); setDeadline(''); setFile(null);
      setTimeout(() => navigate('/tenders'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tender.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl space-y-5"
    >
      {/* Header */}
      <div>
        <Link to="/tenders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold mb-3 transition-colors"
          style={{ color: '#94a3b8' }}
          onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
          <ArrowLeft size={13} /> Back to Tenders
        </Link>
        <h1 className="text-2xl font-bold text-[#0f172a]">Create New Tender</h1>
        <p className="text-sm text-[#94a3b8] mt-1">
          Fill in the details and upload a PDF. Requirements will be extracted automatically.
        </p>
      </div>

      {/* Draft workflow info */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
        style={{ background: '#f5f3ff', border: '1px solid #ede9fe' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
          <Zap size={12} color="#fff" fill="#fff" />
        </div>
        <div>
          <span className="text-xs font-bold text-[#7c3aed]">Draft Workflow</span>
          <p className="text-xs text-[#6d28d9] mt-0.5 leading-relaxed">
            Tender is saved as a draft → you submit it for approval → Super Admin reviews and publishes it.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-green-700">{success}</p>
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-600">{error}</p>
        </motion.div>
      )}

      {/* Form */}
      <div className="rounded-2xl p-6"
        style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#0f172a]">
              Tender Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text" required value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Solar Farm Installation Project 2026"
              className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
              onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#0f172a] flex items-center gap-1.5">
              <Layers size={14} style={{ color: '#94a3b8' }} />
              Sector <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map(s => {
                const active = sector === s;
                return (
                  <button
                    key={s} type="button"
                    onClick={() => setSector(s)}
                    className="px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: active ? '#7c3aed' : '#f8fafc',
                      color: active ? '#fff' : '#64748b',
                      border: active ? '1px solid #7c3aed' : '1px solid #e2e8f0',
                      boxShadow: active ? '0 2px 8px rgba(124,58,237,0.25)' : 'none',
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {!sector && <p className="text-xs text-[#94a3b8]">Select the sector this tender belongs to.</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#0f172a]">Description</label>
            <textarea
              rows={4} value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the scope, objectives, and any important notes..."
              className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all resize-none"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
              onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#0f172a] flex items-center gap-1.5">
              <Calendar size={14} style={{ color: '#94a3b8' }} /> Submission Deadline
            </label>
            <input
              type="date" value={deadline}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDeadline(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
              onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
            />
            <p className="text-xs text-[#94a3b8]">Optional. Suppliers cannot submit after this date.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[#0f172a]">Tender Specification PDF</label>
            <UploadCard onFileSelect={setFile} file={file} />
            <p className="text-xs text-[#94a3b8] mt-1.5">
              If no PDF is uploaded, default requirements (Company Profile, Tax Compliance, Bank Statement) will be used.
            </p>
          </div>

          <div className="pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
            <button
              type="submit" disabled={loading || !sector}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              style={{ background: loading ? '#7c3aed' : 'linear-gradient(135deg, #0f172a, #7c3aed)', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,0.45)'; }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,0.3)'}
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saving Draft...
                </>
              ) : (
                <>
                  <FilePlus size={16} /> Save as Draft
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CreateTender;
