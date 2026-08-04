import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import {
  Building2, MapPin, Phone, Globe, Hash, Mail, User,
  Save, CheckCircle2, AlertTriangle, ArrowRight, Clock,
  Eye, Briefcase, Flag, Map, FileText, Layers, Edit2, X,
} from 'lucide-react';

const COMPANY_TYPES = [
  'Sole Proprietorship', 'Partnership', 'Limited Liability Company (LLC)',
  'Corporation', 'Non-Governmental Organization (NGO)', 'Cooperative',
  'Joint Venture', 'Other',
];

const inputStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' };
const focusHandlers = {
  onFocus: e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; e.target.style.background = '#fff'; },
  onBlur:  e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; },
};

const Field = ({ icon: Icon, label, required, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold uppercase tracking-wide flex items-center gap-1" style={{ color: '#64748b' }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    <div className="relative">
      {Icon && <Icon size={13} className="absolute left-3.5 top-3.5 pointer-events-none" style={{ color: '#94a3b8' }} />}
      {React.cloneElement(children, {
        className: `w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all${Icon ? ' pl-10' : ''}`,
        style: { ...inputStyle, ...(children.props.style || {}) },
        ...focusHandlers,
      })}
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-3" style={{ borderBottom: '1px solid #f8fafc' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: '#f5f3ff' }}>
        <Icon size={13} style={{ color: '#7c3aed' }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: '#1e293b' }}>{value}</p>
      </div>
    </div>
  );
};

const REQUIRED = ['company_name', 'registration_number', 'company_type', 'country', 'city', 'address', 'phone', 'contact_person'];

const EMPTY_FORM = {
  name: '', company_name: '', company_type: '', registration_number: '',
  country: '', city: '', address: '', phone: '', contact_person: '',
  business_description: '', main_services: '', industry: '', website: '',
};

const SupplierProfile = () => {
  const [profile, setProfile] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    Promise.all([apiService.getProfile(), apiService.getProposals()])
      .then(([pRes, prRes]) => {
        const p = pRes.data;
        setProfile(p);
        setForm({
          name:                 p.name || '',
          company_name:         p.company_name || '',
          company_type:         p.company_type || '',
          registration_number:  p.registration_number || '',
          country:              p.country || '',
          city:                 p.city || '',
          address:              p.address || '',
          phone:                p.phone || '',
          contact_person:       p.contact_person || '',
          business_description: p.business_description || '',
          main_services:        p.main_services || '',
          industry:             p.industry || '',
          website:              p.website || '',
        });
        // Open edit mode if profile is incomplete
        const profileIncomplete = REQUIRED.some(f => !p[f]?.trim());
        setEditing(profileIncomplete);
        setProposals(prRes.data);
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const completedCount = REQUIRED.filter(f => form[f]?.trim()).length;
  const completionPct  = Math.round((completedCount / REQUIRED.length) * 100);
  const completionColor = completionPct === 100 ? '#10b981' : completionPct >= 60 ? '#f59e0b' : '#ef4444';
  const isComplete = completionPct === 100;

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await apiService.updateProfile(form);
      const saved = res.data;
      setProfile(saved);
      setForm({
        name:                 saved.name || '',
        company_name:         saved.company_name || '',
        company_type:         saved.company_type || '',
        registration_number:  saved.registration_number || '',
        country:              saved.country || '',
        city:                 saved.city || '',
        address:              saved.address || '',
        phone:                saved.phone || '',
        contact_person:       saved.contact_person || '',
        business_description: saved.business_description || '',
        main_services:        saved.main_services || '',
        industry:             saved.industry || '',
        website:              saved.website || '',
      });
      const stored = localStorage.getItem('user');
      if (stored) localStorage.setItem('user', JSON.stringify({ ...JSON.parse(stored), name: saved.name }));
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4 max-w-5xl animate-pulse">
      {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl" style={{ background: '#f1f5f9' }} />)}
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Company Profile</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            {isComplete ? 'Your profile is complete.' : 'Complete your profile to submit proposals.'}
          </p>
        </div>
        {!editing && profile?.company_name && (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl transition-all"
            style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed'; }}>
            <Edit2 size={13} /> Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>{error}</p>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 size={15} style={{ color: '#10b981' }} />
          <p className="text-sm font-semibold" style={{ color: '#15803d' }}>Profile saved successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">

          {/* ── VIEW MODE ── */}
          {!editing && (
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              {/* Profile header */}
              <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg,#0f0a1e,#1a0a3a)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.4)' }}>
                    <Building2 size={24} style={{ color: '#a78bfa' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{profile?.company_name || 'Your Company'}</h2>
                    {profile?.company_type && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg mt-1 inline-block"
                        style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd' }}>
                        {profile.company_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile fields */}
              <div className="px-6 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest pt-4 pb-2" style={{ color: '#7c3aed' }}>Company Information</p>
                <InfoRow icon={Hash}      label="Registration Number" value={profile?.registration_number} />
                <InfoRow icon={Layers}    label="Industry"            value={profile?.industry} />
                <InfoRow icon={Globe}     label="Website"             value={profile?.website} />

                <p className="text-[10px] font-bold uppercase tracking-widest pt-4 pb-2" style={{ color: '#7c3aed' }}>Location</p>
                <InfoRow icon={Flag}      label="Country"             value={profile?.country} />
                <InfoRow icon={Map}       label="City"                value={profile?.city} />
                <InfoRow icon={MapPin}    label="Office Address"      value={profile?.address} />

                <p className="text-[10px] font-bold uppercase tracking-widest pt-4 pb-2" style={{ color: '#7c3aed' }}>Contact</p>
                <InfoRow icon={User}      label="Contact Person"      value={profile?.contact_person} />
                <InfoRow icon={Phone}     label="Phone"               value={profile?.phone} />
                <InfoRow icon={Mail}      label="Email"               value={profile?.email} />

                {(profile?.business_description || profile?.main_services) && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest pt-4 pb-2" style={{ color: '#7c3aed' }}>About</p>
                    {profile?.business_description && (
                      <div className="py-3" style={{ borderBottom: '1px solid #f8fafc' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Business Description</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#1e293b' }}>{profile.business_description}</p>
                      </div>
                    )}
                    {profile?.main_services && (
                      <div className="py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Main Services</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#1e293b' }}>{profile.main_services}</p>
                      </div>
                    )}
                  </>
                )}
                <div className="py-4" />
              </div>

              {!isComplete && (
                <div className="mx-6 mb-5 px-4 py-3 rounded-xl flex items-center gap-3"
                  style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <AlertTriangle size={13} style={{ color: '#d97706' }} />
                  <p className="text-xs font-semibold" style={{ color: '#92400e' }}>
                    Profile incomplete — fill all required fields to submit proposals.
                  </p>
                  <button onClick={() => setEditing(true)}
                    className="ml-auto text-xs font-bold shrink-0"
                    style={{ color: '#d97706' }}>Complete now</button>
                </div>
              )}
            </div>
          )}

          {/* ── EDIT MODE ── */}
          {editing && (
            <>
              {/* Completeness bar */}
              <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Profile Completeness</p>
                  <span className="text-sm font-bold" style={{ color: completionColor }}>{completionPct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${completionPct}%`, background: completionColor }} />
                </div>
              </div>

              <form onSubmit={handleSave} className="rounded-2xl p-6 space-y-6"
                style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>

                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm" style={{ color: '#0f172a' }}>Edit Profile</p>
                  {profile?.company_name && (
                    <button type="button" onClick={() => setEditing(false)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ background: '#f8fafc', color: '#64748b' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Company Information */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#7c3aed' }}>Company Information</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field icon={Building2} label="Company Name" required>
                        <input type="text" value={form.company_name} onChange={set('company_name')} placeholder="Acme Suppliers Ltd." />
                      </Field>
                      <Field icon={Hash} label="Registration Number" required>
                        <input type="text" value={form.registration_number} onChange={set('registration_number')} placeholder="e.g. 2024/001234/07" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field icon={Briefcase} label="Company Type" required>
                        <select value={form.company_type} onChange={set('company_type')}
                          style={{ ...inputStyle, appearance: 'none' }} {...focusHandlers}
                          className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all">
                          <option value="">Select type…</option>
                          {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </Field>
                      <Field icon={Layers} label="Industry">
                        <input type="text" value={form.industry} onChange={set('industry')} placeholder="e.g. Healthcare, ICT" />
                      </Field>
                    </div>
                    <Field icon={Globe} label="Website">
                      <input type="url" value={form.website} onChange={set('website')} placeholder="https://yourcompany.com" />
                    </Field>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9' }} />

                {/* Location */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#7c3aed' }}>Location</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field icon={Flag} label="Country" required>
                        <input type="text" value={form.country} onChange={set('country')} placeholder="Somalia" />
                      </Field>
                      <Field icon={Map} label="City" required>
                        <input type="text" value={form.city} onChange={set('city')} placeholder="Mogadishu" />
                      </Field>
                    </div>
                    <Field icon={MapPin} label="Office Address" required>
                      <textarea rows={2} value={form.address} onChange={set('address')}
                        placeholder="Street, District, City"
                        style={{ ...inputStyle, resize: 'none' }}
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                        {...focusHandlers} />
                    </Field>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9' }} />

                {/* Contact */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#7c3aed' }}>Contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field icon={User} label="Contact Person" required>
                      <input type="text" value={form.contact_person} onChange={set('contact_person')} placeholder="Jane Smith" />
                    </Field>
                    <Field icon={Phone} label="Phone Number" required>
                      <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+252 61 000 0000" />
                    </Field>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wide flex items-center gap-1 mb-1.5" style={{ color: '#64748b' }}>
                        <Mail size={11} /> Email Address
                      </label>
                      <input type="email" value={profile?.email || ''} readOnly
                        className="w-full px-4 py-3 rounded-xl text-sm"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', cursor: 'not-allowed' }} />
                      <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>Email address cannot be changed.</p>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9' }} />

                {/* About */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#7c3aed' }}>About the Company</p>
                  <div className="space-y-4">
                    <Field icon={FileText} label="Business Description">
                      <textarea rows={3} value={form.business_description} onChange={set('business_description')}
                        placeholder="Brief description of what your company does…"
                        style={{ ...inputStyle, resize: 'none' }}
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                        {...focusHandlers} />
                    </Field>
                    <Field icon={Layers} label="Main Services / Products">
                      <textarea rows={3} value={form.main_services} onChange={set('main_services')}
                        placeholder="List your main services or products…"
                        style={{ ...inputStyle, resize: 'none' }}
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                        {...focusHandlers} />
                    </Field>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9' }} className="pt-2 flex items-center gap-3">
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl text-white transition-all disabled:opacity-50"
                    style={{ background: '#7c3aed', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#6d28d9'; }}
                    onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
                    {saving
                      ? <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving…</>
                      : <><Save size={14} /> Save Profile</>
                    }
                  </button>
                  {profile?.company_name && (
                    <button type="button" onClick={() => setEditing(false)}
                      className="text-sm font-semibold px-4 py-3 rounded-xl transition-all"
                      style={{ color: '#64748b' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
                      onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        {/* Right: activity */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5"
            style={{ background: 'linear-gradient(135deg,#0f0a1e,#1a0a3a)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-4" style={{ color: 'rgba(167,139,250,0.4)' }}>My Activity</p>
            <div>
              <p className="text-3xl font-extrabold text-white">{proposals.length}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Total Proposals Submitted</p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { label: 'Review',   count: proposals.filter(p => p.status === 'under_review').length, color: '#fbbf24' },
                { label: 'Approved', count: proposals.filter(p => p.status === 'approved').length,     color: '#34d399' },
                { label: 'Rejected', count: proposals.filter(p => p.status === 'rejected').length,     color: '#f87171' },
              ].map(({ label, count, color }) => (
                <div key={label} className="text-center">
                  <p className="text-xl font-bold" style={{ color }}>{count}</p>
                  <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
              <h3 className="font-bold text-sm" style={{ color: '#0f172a' }}>Recent Submissions</h3>
            </div>
            {proposals.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm" style={{ color: '#94a3b8' }}>No submissions yet.</p>
                <Link to="/supplier/tenders" className="text-xs font-semibold mt-1 block" style={{ color: '#7c3aed' }}>
                  Browse open tenders
                </Link>
              </div>
            ) : proposals.slice(0, 5).map(p => {
              const st = p.status || 'under_review';
              const stMap = {
                approved:     { bg: '#f0fdf4', color: '#10b981', label: 'Approved' },
                rejected:     { bg: '#fef2f2', color: '#ef4444', label: 'Rejected' },
                under_review: { bg: '#fffbeb', color: '#d97706', label: 'Review' },
              };
              const sc = stMap[st] || stMap.under_review;
              return (
                <div key={p.id} className="px-5 py-3.5 flex items-center justify-between gap-3 transition-colors"
                  style={{ borderBottom: '1px solid #f8fafc' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>Tender #{p.tender_id}</p>
                    <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: '#94a3b8' }}>
                      <Clock size={9} /> {new Date(p.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    <Link to={`/supplier/proposal/${p.id}`}
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
            {proposals.length > 0 && (
              <div className="px-5 py-3" style={{ borderTop: '1px solid #f8fafc' }}>
                <Link to="/supplier" className="text-xs font-semibold flex items-center gap-1 transition-colors"
                  style={{ color: '#94a3b8' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                  View all <ArrowRight size={11} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierProfile;
