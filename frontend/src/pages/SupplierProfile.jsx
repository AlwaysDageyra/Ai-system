import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { motion } from 'framer-motion';
import {
  Building2, MapPin, Phone, Globe, Hash, Mail, User,
  Save, CheckCircle2, AlertTriangle, ArrowRight, Clock, Eye,
} from 'lucide-react';

const inputBase = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#0f172a',
};

const Field = ({ icon: Icon, label, children, required }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold uppercase tracking-wide flex items-center gap-1" style={{ color: '#64748b' }}>
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon size={13} className="absolute left-3.5 top-3.5 pointer-events-none" style={{ color: '#94a3b8' }} />}
      {React.cloneElement(children, {
        className: `w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all${Icon ? ' pl-10' : ''}`,
        style: { ...inputBase, ...(children.props.style || {}) },
        onFocus: e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; e.target.style.background = '#fff'; },
        onBlur: e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; },
      })}
    </div>
  </div>
);

const Sk = ({ className = '' }) => (
  <div className={`rounded-lg animate-pulse ${className}`} style={{ background: '#f1f5f9' }} />
);

const SupplierProfile = () => {
  const [profile, setProfile] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', company_name: '', address: '', phone: '', registration_number: '', website: '',
  });

  useEffect(() => {
    Promise.all([
      apiService.getProfile(),
      apiService.getProposals(),
      apiService.getTenders(),
    ]).then(([pRes, prRes, tRes]) => {
      const p = pRes.data;
      setProfile(p);
      setForm({
        name: p.name || '',
        company_name: p.company_name || '',
        address: p.address || '',
        phone: p.phone || '',
        registration_number: p.registration_number || '',
        website: p.website || '',
      });
      setProposals(prRes.data);
      setTenders(tRes.data);
    }).catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await apiService.updateProfile(form);
      const saved = res.data;
      setProfile(saved);
      // Sync form with what the server actually stored
      setForm({
        name: saved.name || '',
        company_name: saved.company_name || '',
        address: saved.address || '',
        phone: saved.phone || '',
        registration_number: saved.registration_number || '',
        website: saved.website || '',
      });
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ ...u, name: saved.name }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const completionFields = ['company_name', 'address', 'phone', 'registration_number', 'website'];
  const completedCount = completionFields.filter(f => form[f]?.trim()).length;
  const completionPct = Math.round((completedCount / completionFields.length) * 100);
  const completionColor = completionPct === 100 ? '#10b981' : completionPct >= 60 ? '#f59e0b' : '#7c3aed';

  if (loading) return (
    <div className="space-y-6 max-w-4xl animate-pulse">
      <div className="space-y-2"><Sk className="h-7 w-44" /><Sk className="h-3 w-60" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl p-5 h-16" style={{ background: '#fff', border: '1px solid #f1f5f9' }} />
          <div className="rounded-2xl p-6 h-64" style={{ background: '#fff', border: '1px solid #f1f5f9' }} />
        </div>
        <div className="rounded-2xl h-48" style={{ background: '#fff', border: '1px solid #f1f5f9' }} />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 max-w-4xl"
    >
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Supplier Profile</h1>
        <p className="text-sm text-[#94a3b8] mt-1">Manage your company details and view your submissions.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-600">{error}</p>
        </div>
      )}
      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 size={15} className="text-green-500 shrink-0" />
          <p className="text-sm font-semibold text-green-700">Profile saved successfully!</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — form */}
        <div className="lg:col-span-2 space-y-4">

          {/* Completeness bar */}
          <div className="rounded-2xl p-5"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">Profile Completeness</p>
              <span className="text-sm font-bold" style={{ color: completionColor }}>{completionPct}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-full rounded-full"
                style={{ background: completionColor }}
              />
            </div>
            {completionPct < 100 && (
              <p className="text-xs text-[#94a3b8] mt-2">
                Complete all company details to strengthen your proposals.
              </p>
            )}
          </div>

          {/* Edit form */}
          <form onSubmit={handleSave}
            className="rounded-2xl p-6 space-y-4"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <h2 className="font-bold text-[#0f172a] text-sm">Company Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon={User} label="Contact Person Name" required>
                <input type="text" required value={form.name} onChange={set('name')} placeholder="Jane Smith" />
              </Field>
              <Field icon={Building2} label="Company Name">
                <input type="text" value={form.company_name} onChange={set('company_name')} placeholder="Acme Suppliers Ltd." />
              </Field>
            </div>

            <Field icon={Hash} label="Registration Number">
              <input type="text" value={form.registration_number} onChange={set('registration_number')} placeholder="e.g. 2024/001234/07" />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon={Phone} label="Phone Number">
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+252 61 000 0000" />
              </Field>
              <Field icon={Globe} label="Website">
                <input type="text" value={form.website} onChange={set('website')} placeholder="https://yourcompany.com" />
              </Field>
            </div>

            <Field icon={MapPin} label="Business Address">
              <textarea rows={3} value={form.address} onChange={set('address')} placeholder="Street, City, Country"
                style={{ ...inputBase, resize: 'none' }} />
            </Field>

            <div className="pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 text-sm font-bold px-5 py-3 rounded-xl text-white transition-all active:scale-[0.99] disabled:opacity-50"
                style={{ background: '#7c3aed', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#6d28d9'; }}
                onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
                {saving ? (
                  <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
                ) : (
                  <><Save size={14} /> Save Profile</>
                )}
              </button>
            </div>
          </form>

          {/* Email readonly */}
          <div className="rounded-2xl p-5"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: '#64748b' }}>
                <Mail size={11} /> Email Address
              </label>
              <input
                type="email" value={profile?.email || ''} readOnly
                className="w-full px-4 py-3 rounded-xl text-sm cursor-not-allowed"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8' }}
              />
              <p className="text-xs text-[#94a3b8]">Email address cannot be changed.</p>
            </div>
          </div>
        </div>

        {/* Right — submissions */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg,#0f0a1e,#1a0a3a)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-4" style={{ color: 'rgba(167,139,250,0.4)' }}>
              My Activity
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-extrabold text-white">{proposals.length}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Total Proposals Submitted</p>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'Review',   count: proposals.filter(p => p.status === 'under_review').length, color: '#fbbf24' },
                  { label: 'Approved', count: proposals.filter(p => p.status === 'approved').length,     color: '#34d399' },
                  { label: 'Rejected', count: proposals.filter(p => p.status === 'rejected').length,     color: '#f87171' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="text-center">
                    <p className="text-xl font-bold" style={{ color }}>{count}</p>
                    <p className="text-[9px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent submissions */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
              <h3 className="font-bold text-[#0f172a] text-sm">My Submissions</h3>
            </div>
            <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
              {proposals.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-[#94a3b8]">No submissions yet.</p>
                  <Link to="/supplier/tenders"
                    className="text-xs font-semibold mt-1 block transition-colors"
                    style={{ color: '#7c3aed' }}>Browse open tenders</Link>
                </div>
              ) : proposals.slice(0, 5).map((p) => {
                const matchedTender = tenders.find(t => t.id === p.tender_id);
                const st = p.status || 'under_review';
                const stMap = {
                  approved:     { bg: '#f0fdf4', color: '#10b981', label: 'Approved' },
                  rejected:     { bg: '#fef2f2', color: '#ef4444', label: 'Rejected' },
                  under_review: { bg: '#fffbeb', color: '#d97706', label: 'Review' },
                };
                const sc = stMap[st] || stMap.under_review;
                return (
                  <div key={p.id} className="px-5 py-3.5 flex items-center justify-between gap-3 transition-colors"
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0f172a] truncate">
                        {matchedTender ? matchedTender.title : `Tender #${p.tender_id}`}
                      </p>
                      <p className="text-[10px] text-[#94a3b8] flex items-center gap-1 mt-0.5">
                        <Clock size={9} /> {new Date(p.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                      <Link to={`/proposal/${p.id}`}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ background: '#f5f3ff', color: '#7c3aed' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed'; }}>
                        <Eye size={11} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            {proposals.length > 0 && (
              <div className="px-5 py-3" style={{ borderTop: '1px solid #f8fafc' }}>
                <Link to="/supplier"
                  className="text-xs font-semibold flex items-center gap-1 transition-colors"
                  style={{ color: '#94a3b8' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                  View all on dashboard <ArrowRight size={11} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SupplierProfile;
