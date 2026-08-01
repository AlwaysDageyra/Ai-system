import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import {
  FileText, Clock, ArrowLeft, CheckCircle2, AlertCircle,
  Building2, Calendar, DollarSign, ExternalLink, Zap,
} from 'lucide-react';

const FadeUp = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.48, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const SECTOR_COLORS = {
  'Food Security & Agriculture':  { color: '#15803d', bg: '#dcfce7' },
  'ICT & Technology':             { color: '#7c3aed', bg: '#f3e8ff' },
  'Education & Training':         { color: '#1d4ed8', bg: '#dbeafe' },
  'Engineering & Infrastructure': { color: '#b45309', bg: '#fef9c3' },
  'Energy & Power':               { color: '#ea580c', bg: '#fff7ed' },
  'Office Supplies & Printing':   { color: '#475569', bg: '#f8fafc' },
  'Consultancy & Research':       { color: '#4338ca', bg: '#eef2ff' },
  'Logistics & Flight Rental':    { color: '#0369a1', bg: '#f0f9ff' },
  'Healthcare & Insurance':       { color: '#be123c', bg: '#fff1f2' },
  'General Procurement':          { color: '#64748b', bg: '#f8fafc' },
};

const PublicTenderDetail = () => {
  const { tenderId: id } = useParams();
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    apiService.getPublicTender(id)
      .then(res => setTender(res.data?.tender || res.data))
      .catch(() => setError('Could not load this tender.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#ede9fe] border-t-[#7c3aed] animate-spin" />
          <p className="text-sm text-[#9ca3af]">Loading tender…</p>
        </div>
      </div>
    );
  }

  if (error || !tender) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh' }} className="flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#f5f3ff' }}>
            <AlertCircle size={22} style={{ color: '#7c3aed' }} />
          </div>
          <p className="font-semibold mb-2 text-[#0f172a]">{error || 'Tender not found'}</p>
          <Link to="/browse" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7c3aed] hover:text-[#6d28d9] transition-colors">
            <ArrowLeft size={14} /> Back to tenders
          </Link>
        </div>
      </div>
    );
  }

  const isOpen = !tender.deadline || new Date(tender.deadline) > Date.now();
  const deadline = tender.deadline ? new Date(tender.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline - Date.now()) / 86400000) : null;
  const requirements = Array.isArray(tender.requirements)
    ? tender.requirements
    : typeof tender.requirements === 'string'
      ? tender.requirements.split('\n').filter(Boolean)
      : [];

  const sectorKey = tender.sector || tender.category || 'General';
  const sc = SECTOR_COLORS[sectorKey] || { color: '#6b7280', bg: '#f9fafb' };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0a3a 100%)' }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-60px] right-[-60px] w-[400px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent 65%)', filter: 'blur(60px)' }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #a78bfa 1px, transparent 0)', backgroundSize: '30px 30px' }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-18">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link to="/browse"
              className="inline-flex items-center gap-1.5 text-xs font-semibold mb-6 transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              <ArrowLeft size={13} /> All Tenders
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {tender.sector && (
                <span className="text-xs font-bold px-3 py-1 rounded-lg"
                  style={{ background: sc.bg, color: sc.color }}>
                  {tender.sector}
                </span>
              )}
              <span className="text-xs font-bold px-3 py-1 rounded-lg"
                style={{
                  background: isOpen ? 'rgba(16,185,129,.15)' : 'rgba(255,255,255,.06)',
                  color: isOpen ? '#34d399' : 'rgba(255,255,255,0.3)',
                }}>
                {isOpen ? '● Open' : 'Closed'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 max-w-3xl text-white" style={{ letterSpacing: '-0.02em' }}>
              {tender.title}
            </h1>
            {tender.reference_number && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Ref: {tender.reference_number}</p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Description */}
            {tender.description && (
              <FadeUp>
                <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(15,10,30,.04)' }}>
                  <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #f9fafb', background: '#fafafa' }}>
                    <FileText size={14} style={{ color: '#9ca3af' }} />
                    <h2 className="text-sm font-bold text-[#0f172a]">About this Tender</h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-sm leading-relaxed text-[#6b7280]">{tender.description}</p>
                  </div>
                </div>
              </FadeUp>
            )}

            {/* Requirements */}
            {requirements.length > 0 && (
              <FadeUp delay={0.05}>
                <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(15,10,30,.04)' }}>
                  <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #f9fafb', background: '#fafafa' }}>
                    <CheckCircle2 size={14} style={{ color: '#9ca3af' }} />
                    <h2 className="text-sm font-bold text-[#0f172a]">Requirements</h2>
                    <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                      {requirements.length}
                    </span>
                  </div>
                  <div className="px-6 py-5 space-y-3">
                    {requirements.map((req, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: '#f5f3ff' }}>
                          <CheckCircle2 size={11} style={{ color: '#7c3aed' }} />
                        </div>
                        <p className="text-sm leading-snug text-[#374151]">
                          {typeof req === 'string' ? req : req.display_label || req.requirement_name}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </FadeUp>
            )}

            {/* Instructions */}
            {tender.instructions && (
              <FadeUp delay={0.1}>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #fde68a', background: '#fffbeb' }}>
                  <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #fde68a' }}>
                    <AlertCircle size={14} className="text-amber-600" />
                    <h2 className="text-sm font-bold text-amber-700">Submission Instructions</h2>
                  </div>
                  <div className="px-6 py-5">
                    <p className="text-sm leading-relaxed text-amber-800">{tender.instructions}</p>
                  </div>
                </div>
              </FadeUp>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Summary card */}
            <FadeUp>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0a1e, #1a0a3a)' }}>
                <div className="px-6 py-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-4" style={{ color: 'rgba(167,139,250,.5)' }}>
                    Tender Summary
                  </p>
                  <div className="space-y-4">
                    {[
                      { icon: Building2,   label: 'Issuer',     val: tender.issuer || 'National Procurement Commission' },
                      { icon: FileText,    label: 'Reference',  val: tender.reference_number || '—' },
                      { icon: DollarSign,  label: 'Budget',     val: tender.budget || 'Undisclosed' },
                      { icon: Calendar,    label: 'Published',  val: tender.created_at ? new Date(tender.created_at).toLocaleDateString() : '—' },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(167,139,250,.12)' }}>
                          <Icon size={13} style={{ color: '#a78bfa' }} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(167,139,250,.4)' }}>{label}</p>
                          <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Deadline card */}
            {deadline && (
              <FadeUp delay={0.06}>
                <div className="rounded-2xl px-6 py-5 bg-white" style={{ border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(15,10,30,.04)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={13} style={{ color: '#9ca3af' }} />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Submission Deadline</p>
                  </div>
                  <p className="text-lg font-extrabold text-[#0f172a] mb-1">
                    {deadline.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  {daysLeft !== null && (
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{
                        background: daysLeft <= 0 ? '#fef2f2' : daysLeft <= 7 ? '#fefce8' : '#f5f3ff',
                        color:      daysLeft <= 0 ? '#ef4444' : daysLeft <= 7 ? '#d97706' : '#7c3aed',
                      }}>
                      {daysLeft > 0 ? `${daysLeft} days remaining` : daysLeft === 0 ? 'Due today' : 'Deadline passed'}
                    </span>
                  )}
                </div>
              </FadeUp>
            )}

            {/* CTA */}
            <FadeUp delay={0.1}>
              <div className="rounded-2xl px-6 py-5 space-y-3 bg-white" style={{ border: '1px solid #f3f4f6' }}>
                {isOpen ? (
                  <>
                    <Link
                      to={token ? '/supplier/tenders' : '/login'}
                      className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-200"
                      style={{ background: '#7c3aed', boxShadow: '0 4px 16px rgba(124,58,237,.3)' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                      onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
                    >
                      {token ? 'Submit Proposal' : 'Login to Submit'} <ExternalLink size={14} />
                    </Link>
                    {!token && (
                      <p className="text-xs text-center text-[#9ca3af]">
                        Don't have an account?{' '}
                        <Link to="/login" className="font-semibold text-[#7c3aed] hover:text-[#6d28d9]">Register free</Link>
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 justify-center py-2">
                    <AlertCircle size={14} style={{ color: '#d1d5db' }} />
                    <p className="text-xs text-[#9ca3af]">This tender is no longer accepting submissions.</p>
                  </div>
                )}
              </div>
            </FadeUp>

            {/* Powered by AI */}
            <FadeUp delay={0.14}>
              <div className="rounded-2xl px-5 py-4 flex items-center gap-3"
                style={{ background: '#f5f3ff', border: '1px solid #ede9fe' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                  <Zap size={14} color="#fff" fill="#fff" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0f172a]">AI-Evaluated Scoring</p>
                  <p className="text-[10px] text-[#9ca3af] mt-0.5">Proposals are scored automatically for compliance and merit.</p>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicTenderDetail;
