import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { FileText, Clock, Search, ArrowRight, AlertCircle, Loader2, Briefcase, Zap } from 'lucide-react';

const SECTORS = [
  'All',
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
  'Food Security & Agriculture':  { color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', dot: '#15803d' },
  'ICT & Technology':             { color: '#7c3aed', bg: '#f3e8ff', border: '#e9d5ff', dot: '#7c3aed' },
  'Education & Training':         { color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', dot: '#1d4ed8' },
  'Engineering & Infrastructure': { color: '#b45309', bg: '#fef9c3', border: '#fde68a', dot: '#b45309' },
  'Energy & Power':               { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', dot: '#ea580c' },
  'Office Supplies & Printing':   { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', dot: '#475569' },
  'Consultancy & Research':       { color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe', dot: '#4338ca' },
  'Logistics & Flight Rental':    { color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', dot: '#0369a1' },
  'Healthcare & Insurance':       { color: '#be123c', bg: '#fff1f2', border: '#fecdd3', dot: '#be123c' },
  'General Procurement':          { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', dot: '#64748b' },
};

const SECTOR_FILTER_COLORS = {
  'All':                          { active: '#7c3aed' },
  'Food Security & Agriculture':  { active: '#15803d' },
  'ICT & Technology':             { active: '#7c3aed' },
  'Education & Training':         { active: '#1d4ed8' },
  'Engineering & Infrastructure': { active: '#b45309' },
  'Energy & Power':               { active: '#ea580c' },
  'Office Supplies & Printing':   { active: '#475569' },
  'Consultancy & Research':       { active: '#4338ca' },
  'Logistics & Flight Rental':    { active: '#0369a1' },
  'Healthcare & Insurance':       { active: '#be123c' },
  'General Procurement':          { active: '#64748b' },
};

const daysLeft = (deadline) => {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - Date.now()) / 86400000);
};

const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden bg-white animate-pulse" style={{ border: '1px solid #f3f4f6' }}>
    <div className="h-1.5 w-full" style={{ background: '#f3f4f6' }} />
    <div className="px-5 py-5 space-y-3">
      <div className="h-4 w-24 rounded-lg bg-gray-100" />
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-4 w-3/4 rounded bg-gray-100" />
      <div className="flex justify-between mt-4">
        <div className="h-3 w-20 rounded bg-gray-100" />
        <div className="h-3 w-16 rounded bg-gray-100" />
      </div>
    </div>
    <div className="px-5 pb-5">
      <div className="h-9 w-full rounded-xl bg-gray-100" />
    </div>
  </div>
);

const PublicTenders = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');

  useEffect(() => {
    apiService.getPublicTenders()
      .then(res => {
        const list = res.data;
        setTenders(Array.isArray(list) ? list : list?.tenders || []);
      })
      .catch(() => setError('Unable to load tenders. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenders.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    const matchSector = sector === 'All' || t.sector === sector || t.category === sector;
    return matchSearch && matchSector;
  });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 55%, #dcfce7 100%)', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(124,58,237,.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: '20%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(37,99,235,.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '10%', left: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(5,150,105,.07)', pointerEvents: 'none' }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20" style={{ position: 'relative' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(37,99,235,.1)', border: '1px solid rgba(37,99,235,.2)', color: '#2563eb' }}>
              <Briefcase size={11} /> Public Register
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-[#0f172a]" style={{ letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Open Tenders<br />
              <span style={{ color: '#7c3aed' }}>& Opportunities</span>
            </h1>
            <p className="text-base sm:text-lg max-w-md text-[#475569] mb-8" style={{ lineHeight: 1.65 }}>
              All active procurement opportunities published by the National Procurement Commission — transparent, fair, and open to all.
            </p>

            {/* Search bar */}
            <div className="max-w-lg">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#7c3aed' }} />
                <input
                  type="text"
                  placeholder="Search by title, description, or sector…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none transition-all duration-200"
                  style={{ background: '#fff', border: '2px solid rgba(124,58,237,.15)', color: '#0f172a', boxShadow: '0 4px 20px rgba(15,23,42,.08)' }}
                  onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 4px 20px rgba(124,58,237,.15)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(124,58,237,.15)'; e.target.style.boxShadow = '0 4px 20px rgba(15,23,42,.08)'; }}
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-8">
              {[
                { n: `${tenders.length || '—'}`, label: 'Active tenders', bg: '#fff', color: '#2563eb', border: '#bfdbfe' },
                { n: '7',   label: 'Sectors covered',  bg: '#fff', color: '#7c3aed', border: '#ddd6fe' },
                { n: '72h', label: 'Avg. evaluation',  bg: '#fff', color: '#059669', border: '#bbf7d0' },
              ].map(({ n, label, bg, color, border }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: bg, border: `1px solid ${border}`, boxShadow: '0 2px 8px rgba(15,23,42,.06)' }}>
                  <span className="text-base font-extrabold" style={{ color }}>{n}</span>
                  <span className="text-xs font-medium text-[#64748b]">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Sector filters ── */}
      <div className="sticky top-16 z-30 px-4 py-3"
        style={{ background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9' }}>
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {SECTORS.map(s => {
            const active = sector === s;
            const ac = SECTOR_FILTER_COLORS[s]?.active || '#7c3aed';
            const sc = SECTOR_COLORS[s] || SECTOR_COLORS.General;
            return (
              <button
                key={s}
                onClick={() => setSector(s)}
                className="shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
                style={{
                  background: active ? ac : '#fff',
                  color:      active ? '#fff' : '#64748b',
                  border:     active ? `1px solid ${ac}` : '1px solid #e5e7eb',
                  boxShadow:  active ? `0 4px 14px ${ac}40` : 'none',
                }}
              >{s}</button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-2xl px-5 py-4 max-w-md mx-auto mt-10"
            style={{ background: '#fff', border: '1px solid #fee2e2', boxShadow: '0 4px 20px rgba(220,38,38,.06)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#fee2e2' }}>
              <AlertCircle size={16} className="text-red-400" />
            </div>
            <p className="text-sm text-[#64748b]">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-28">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#ede9fe' }}>
              <FileText size={24} style={{ color: '#7c3aed' }} />
            </div>
            <p className="font-bold text-[#0f172a]">No tenders found</p>
            <p className="text-sm mt-1 text-[#9ca3af]">
              {search || sector !== 'All' ? 'Try adjusting your search or sector filter.' : 'No tenders are currently published.'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-semibold text-[#9ca3af]">
                Showing <span className="font-bold text-[#0f172a]">{filtered.length}</span> tender{filtered.length !== 1 ? 's' : ''}
                {sector !== 'All' && <> in <span className="font-bold" style={{ color: SECTOR_FILTER_COLORS[sector]?.active }}>{sector}</span></>}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((t, i) => {
                const days = daysLeft(t.deadline);
                const isUrgent = days !== null && days <= 7;
                const isOpen = !t.deadline || new Date(t.deadline) > Date.now();
                const sectorKey = t.sector || t.category || 'General';
                const sc = SECTOR_COLORS[sectorKey] || { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', dot: '#64748b' };

                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: (i % 6) * 0.05 }}
                    className="rounded-2xl overflow-hidden bg-white flex flex-col transition-all duration-300"
                    style={{ border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(15,23,42,.04)' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(15,23,42,.10)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = sc.border; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,.04)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                  >
                    {/* Colored top bar */}
                    <div style={{ height: 4, background: sc.color, flexShrink: 0 }} />

                    <div className="px-5 pt-4 pb-1 flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {sectorKey}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: isOpen ? '#dcfce7' : '#f1f5f9', color: isOpen ? '#059669' : '#9ca3af', border: `1px solid ${isOpen ? '#bbf7d0' : '#e5e7eb'}` }}>
                        {isOpen ? '● Open' : 'Closed'}
                      </span>
                    </div>

                    <div className="px-5 py-3 flex-1">
                      <h3 className="font-bold text-sm leading-snug mb-2 text-[#0f172a]">{t.title}</h3>
                      {t.description && (
                        <p className="text-xs leading-relaxed text-[#94a3b8] line-clamp-2">{t.description}</p>
                      )}
                    </div>

                    <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid #f8fafc' }}>
                      <span className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: isUrgent ? '#dc2626' : '#94a3b8' }}>
                        <Clock size={11} />
                        {days === null ? 'No deadline'
                          : isUrgent ? `${days}d left — urgent`
                          : t.deadline ? new Date(t.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                          : '—'}
                      </span>
                      {t.budget && <span className="text-xs font-extrabold" style={{ color: sc.color }}>{t.budget}</span>}
                    </div>

                    <div className="px-5 pb-5">
                      <Link to={`/browse/${t.id}`}
                        className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 text-xs font-bold transition-all duration-200"
                        style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                        onMouseEnter={e => { e.currentTarget.style.background = sc.color; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = sc.color; }}
                        onMouseLeave={e => { e.currentTarget.style.background = sc.bg; e.currentTarget.style.color = sc.color; e.currentTarget.style.borderColor = sc.border; }}
                      >
                        View Details <ArrowRight size={12} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicTenders;
