import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Shield, Zap, TrendingUp, Globe, ArrowRight,
  FileText, Clock, Users, Award, CheckCircle2,
  BarChart2, ChevronRight, Building2, Star,
} from 'lucide-react';

/* ── Animated counter ── */
const Counter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const num = parseInt(target);
    if (isNaN(num)) return;
    const duration = 1800;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * num));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);
  return <span ref={ref}>{count}{suffix}</span>;
};

const FadeUp = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const FEATURES = [
  { icon: Shield, title: 'Transparent Process', desc: 'Every tender and award is published on the public register, ensuring full accountability.' },
  { icon: Zap, title: 'AI-Powered Scoring', desc: 'Our NLP engine reads submissions and ranks suppliers by compliance, fairness, and merit.' },
  { icon: TrendingUp, title: 'Real-Time Rankings', desc: 'Procurement officers see live leaderboards the moment evaluations complete.' },
  { icon: Globe, title: 'Open to All', desc: 'Any registered Somali business — small or large — can submit a competitive bid.' },
];

const STEPS = [
  { n: '01', title: 'Browse Open Tenders', desc: 'Find active contracts on the public register, filtered by sector and deadline.' },
  { n: '02', title: 'Register as a Supplier', desc: 'Create your company profile with registration numbers, certifications, and contacts.' },
  { n: '03', title: 'Upload Your Proposal', desc: 'Submit your PDF or Word document before the tender deadline.' },
  { n: '04', title: 'Receive Your Score', desc: 'Our AI evaluates compliance, then procurement officers confirm the final ranking.' },
];

const STATS = [
  { value: 124, suffix: '+', label: 'Active Tenders', icon: FileText },
  { value: 830, suffix: '+', label: 'Registered Suppliers', icon: Users },
  { value: 97,  suffix: '%', label: 'On-Time Awards', icon: CheckCircle2 },
  { value: 48,  suffix: 'M',  label: 'USD Contracted', icon: Award },
];

const HomePage = () => {
  const token = localStorage.getItem('token');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

      {/* ── HERO ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', overflow: 'hidden' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left — text */}
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }}>

              {/* Label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ height: 1, width: 28, background: '#7c3aed', borderRadius: 99 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  NPC · Federal Government of Somalia
                </span>
              </div>

              {/* Heading — 2 lines, max impact */}
              <h1 style={{ fontSize: 'clamp(40px, 4.5vw, 62px)', fontWeight: 900, lineHeight: 1.05,
                letterSpacing: '-0.04em', color: '#0f172a', marginBottom: 20 }}>
                Bid on government<br />
                contracts —{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>fairly.</span>
              </h1>

              {/* Tagline */}
              <p style={{ fontSize: 16, lineHeight: 1.7, color: '#64748b', marginBottom: 36, maxWidth: 420 }}>
                The NPC publishes every active tender, evaluates proposals with AI,
                and awards contracts transparently — open to every Somali business.
              </p>

              {/* Stat pills row */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
                {[
                  { n: '124+', label: 'Open Tenders',  bg: '#ede9fe', color: '#7c3aed', border: '#ddd6fe' },
                  { n: '830+', label: 'Suppliers',      bg: '#dbeafe', color: '#2563eb', border: '#bfdbfe' },
                  { n: '72h',  label: 'Avg. Award',     bg: '#dcfce7', color: '#059669', border: '#bbf7d0' },
                  { n: '$48M', label: 'Contracted',     bg: '#fef9c3', color: '#d97706', border: '#fde68a' },
                ].map(({ n, label, bg, color, border }) => (
                  <div key={label} style={{ padding: '8px 14px', borderRadius: 12,
                    background: bg, border: `1px solid ${border}`, textAlign: 'center' }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color, margin: 0 }}>{n}</p>
                    <p style={{ fontSize: 10, fontWeight: 600, color, opacity: 0.7, margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link to="/browse"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '14px 28px', background: '#7c3aed', color: '#fff',
                    fontSize: 14, fontWeight: 700, borderRadius: 14, textDecoration: 'none',
                    boxShadow: '0 6px 24px rgba(124,58,237,.35)', transition: 'all .18s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#6d28d9'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.transform = 'none'; }}
                >
                  Browse Open Tenders <ArrowRight size={15} />
                </Link>
                {!token && (
                  <Link to="/login"
                    style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed', textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'opacity .15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    Sign in <ChevronRight size={13} />
                  </Link>
                )}
              </div>

            </motion.div>

            {/* Right — image with floating cards */}
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.16,1,0.3,1] }}
              className="hidden lg:block relative" style={{ height: 460 }}>

              {/* Soft background blob */}
              <div style={{ position: 'absolute', inset: -20, borderRadius: 40,
                background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 60%, #dcfce7 100%)', zIndex: 0 }} />

              {/* Main image */}
              <div style={{ position: 'absolute', inset: 20, borderRadius: 24, overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(15,23,42,.14)', zIndex: 1 }}>
                <img
                  src="https://i.pinimg.com/1200x/68/03/cc/6803cc864af89421247b85c25e475d38.jpg"
                  alt="Professional office"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                  onError={e => { e.target.style.display = 'none'; e.target.parentNode.style.background = 'linear-gradient(135deg,#ede9fe,#dbeafe)'; }}
                />
                {/* Light tint overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom right, rgba(124,58,237,.08), rgba(37,99,235,.04))' }} />
              </div>

              {/* Floating card — top left */}
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{ position: 'absolute', top: 10, left: -16, zIndex: 2,
                  background: '#fff', borderRadius: 14, padding: '10px 14px',
                  boxShadow: '0 8px 32px rgba(15,23,42,.12)', border: '1px solid #f1f5f9',
                  display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#ede9fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={15} style={{ color: '#7c3aed' }} />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>124+</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 600 }}>Open Tenders</p>
                </div>
              </motion.div>

              {/* Floating card — bottom right */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                style={{ position: 'absolute', bottom: 16, right: -16, zIndex: 2,
                  background: '#fff', borderRadius: 14, padding: '10px 14px',
                  boxShadow: '0 8px 32px rgba(15,23,42,.12)', border: '1px solid #f1f5f9',
                  display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: '#dcfce7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={15} style={{ color: '#059669' }} />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>AI-Powered</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 600 }}>Fair Evaluation</p>
                </div>
              </motion.div>

              {/* Floating badge — top right */}
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.65 }}
                style={{ position: 'absolute', top: 28, right: 8, zIndex: 2,
                  background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 99,
                  padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#d97706' }}>
                ★ 4.8 Supplier Rating
              </motion.div>

            </motion.div>

          </div>
        </div>
      </section>


      {/* ── TRUSTED BY ── */}
      {/* <div style={{ background: '#f2f2f2', borderBottom: '1px solid #f3f4f6' }} className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#9ca3af] shrink-0">Trusted by</p>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
              {['Ministry of Finance', 'Ministry of Health', 'Ministry of Education', 'Ministry of Infrastructure', 'Ministry of Defence'].map(name => (
                <span key={name} className="text-sm font-semibold text-[#d1d5db]">{name}</span>
              ))}
            </div>
          </div>
        </div>
      </div> */}

      {/* ── MOBILE STATS ── */}
      <div className="lg:hidden py-10 px-4" style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-3">
          {[
            { value: 124, suffix: '+', label: 'Active Tenders',      icon: FileText,   bg: '#ede9fe', ic: '#7c3aed', border: '#ddd6fe' },
            { value: 830, suffix: '+', label: 'Registered Suppliers', icon: Users,      bg: '#dbeafe', ic: '#2563eb', border: '#bfdbfe' },
            { value: 310, suffix: '+', label: 'Awards',               icon: Award,      bg: '#fef9c3', ic: '#d97706', border: '#fde68a' },
            { value: 48,  suffix: 'M', label: 'USD Contracted',       icon: BarChart2,  bg: '#dcfce7', ic: '#059669', border: '#bbf7d0' },
          ].map(({ value, suffix, label, icon: Icon, bg, ic, border }, i) => (
            <FadeUp key={label} delay={i * 0.08}>
              <div className="rounded-2xl p-5" style={{ background: bg, border: `1px solid ${border}` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-white">
                  <Icon size={16} style={{ color: ic }} />
                </div>
                <p className="text-2xl font-extrabold text-[#0f172a]">
                  <Counter target={value} suffix={suffix} />
                </p>
                <p className="text-xs font-medium text-[#6b7280] mt-0.5">{label}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="py-20 px-4" style={{ background: '#fff' }}>
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4 px-3 py-1 rounded-full"
              style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
              Why TenderHub
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a]" style={{ letterSpacing: '-0.02em' }}>
              Built for transparency &amp; speed
            </h2>
            <p className="mt-3 text-base text-[#6b7280] max-w-xl mx-auto">
              Modern AI-assisted procurement that eliminates bias and awards contracts on merit.
            </p>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <FadeUp key={title} delay={i * 0.08}>
                <div
                  className="rounded-2xl p-6 h-full transition-all duration-300 group cursor-default"
                  style={{ background: '#f8fafc', border: '1px solid #f3f4f6' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,58,237,.10)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#ede9fe'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#f3f4f6'; }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
                    style={{ background: '#f5f3ff' }}>
                    <Icon size={20} style={{ color: '#7c3aed' }} />
                  </div>
                  <h3 className="font-bold mb-2 text-[#0f172a]">{title}</h3>
                  <p className="text-sm leading-relaxed text-[#6b7280]">{desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW TO APPLY ── */}
      <section className="py-20 px-4" style={{ background: '#f2f4f7' }}>
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4 px-3 py-1 rounded-full"
              style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a]" style={{ letterSpacing: '-0.02em' }}>
              Apply in 4 easy steps
            </h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ n, title, desc }, i) => (
              <FadeUp key={n} delay={i * 0.1}>
                <div className="relative rounded-2xl p-6 h-full bg-white"
                  style={{ border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(15,10,30,.04)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-sm font-extrabold text-white"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', boxShadow: '0 4px 16px rgba(124,58,237,.3)' }}>
                    {n}
                  </div>
                  <h3 className="font-bold mb-2 text-[#0f172a]">{title}</h3>
                  <p className="text-sm leading-relaxed text-[#6b7280]">{desc}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-10 right-[-18px] z-10">
                      <ChevronRight size={16} style={{ color: '#d1d5db' }} />
                    </div>
                  )}
                </div>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={0.4} className="mt-10 text-center">
            <Link to={token ? '/dashboard' : '/login'}
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: '#0f172a', boxShadow: '0 6px 20px rgba(15,10,30,.25)' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
              onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
            >
              {token ? 'Go to Supplier Portal' : 'Start Bidding Today'} <ArrowRight size={15} />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ── ABOUT / STATS ── */}
      <section className="py-20 px-4" style={{ background: '#fff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <FadeUp>
              <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4 px-3 py-1 rounded-full"
                style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                Our Mission
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-5 text-[#0f172a]" style={{ letterSpacing: '-0.02em' }}>
                Empowering Somalia's private sector through fair competition
              </h2>
              <p className="text-base leading-relaxed mb-8 text-[#6b7280]">
                The NPC was established to modernise public procurement across all federal ministries.
                By replacing manual evaluation with AI-assisted scoring, we eliminate bias, reduce
                processing time, and award contracts to the most qualified suppliers.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Building2, label: 'Federal Ministry Oversight' },
                  { icon: Zap, label: 'AI-Assisted Evaluation' },
                  { icon: FileText, label: 'Public Register Access' },
                  { icon: CheckCircle2, label: '72-hour Award Decision' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: '#f8fafc', border: '1px solid #f3f4f6' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: '#f5f3ff' }}>
                      <Icon size={14} style={{ color: '#7c3aed' }} />
                    </div>
                    <span className="text-xs font-semibold text-[#374151]">{label}</span>
                  </div>
                ))}
              </div>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: FileText,  n: '124+', label: 'Open Tenders',     sub: 'Across all ministries',   bg: '#f5f3ff', ic: '#7c3aed' },
                  { icon: Users,     n: '830+', label: 'Suppliers',         sub: 'Registered & verified',  bg: '#eff6ff', ic: '#2563eb' },
                  { icon: Award,     n: '310+', label: 'Awards',            sub: 'Since 2022',             bg: '#fefce8', ic: '#d97706' },
                  { icon: BarChart2, n: '4.8★', label: 'Supplier Rating',   sub: 'Avg satisfaction',       bg: '#f0fdf4', ic: '#059669' },
                ].map(({ icon: Icon, n, label, sub, bg, ic }) => (
                  <div key={label}
                    className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1"
                    style={{ background: bg, border: '1px solid transparent' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(15,10,30,.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white">
                      <Icon size={18} style={{ color: ic }} />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-[#0f172a]">{n}</p>
                      <p className="text-xs font-bold text-[#0f172a]">{label}</p>
                      <p className="text-xs text-[#9ca3af] mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── RECENT TENDERS ── */}
      <section className="py-20 px-4" style={{ background: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto">
          <FadeUp className="flex items-end justify-between mb-10">
            <div>
              <span className="inline-block text-xs font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full"
                style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                Latest Opportunities
              </span>
              <h2 className="text-3xl font-extrabold text-[#0f172a]" style={{ letterSpacing: '-0.02em' }}>Open right now</h2>
            </div>
            <Link to="/browse" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#7c3aed] hover:text-[#6d28d9] transition-colors">
              View all <ArrowRight size={13} />
            </Link>
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { sector: 'Infrastructure', title: 'Mogadishu Road Rehabilitation Phase III', deadline: 'Jul 15, 2026', value: '$2.4M', ref: 'NPC-2026-INF-041', color: '#f59e0b', bg: '#fefce8' },
              { sector: 'Healthcare',     title: 'Medical Equipment Supply — Regional Hospitals', deadline: 'Jul 22, 2026', value: '$890K', ref: 'NPC-2026-MED-017', color: '#10b981', bg: '#f0fdf4' },
              { sector: 'Education',      title: 'School Construction & Renovation — Banadir', deadline: 'Aug 3, 2026', value: '$1.1M', ref: 'NPC-2026-EDU-009', color: '#3b82f6', bg: '#eff6ff' },
            ].map(({ sector, title, deadline, value, ref: refCode, color, bg }, i) => (
              <FadeUp key={refCode} delay={i * 0.1}>
                <div
                  className="rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1.5 group"
                  style={{ border: '1px solid #f3f4f6', boxShadow: '0 2px 12px rgba(15,10,30,.04)' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 16px 48px rgba(15,10,30,.10)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,10,30,.04)'}
                >
                  <div className="px-5 py-4" style={{ borderBottom: '1px solid #f9fafb' }}>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: bg, color }}>
                      {sector}
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    <h3 className="font-bold text-sm mb-3 leading-snug text-[#0f172a]">{title}</h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-[#9ca3af]"><Clock size={11} /> {deadline}</span>
                      <span className="font-bold text-[#7c3aed]">{value}</span>
                    </div>
                    <p className="text-[10px] mt-2 text-[#d1d5db]">{refCode}</p>
                  </div>
                  <div className="px-5 pb-5">
                    <Link to="/browse"
                      className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 text-xs font-bold text-[#0f172a] transition-all duration-200"
                      style={{ background: '#f8fafc', border: '1px solid #f3f4f6' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#0f172a'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.borderColor = '#f3f4f6'; }}
                    >
                      View Tender <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <FadeUp>
            <span className="inline-block text-xs font-bold tracking-widest uppercase mb-5 px-3 py-1.5 rounded-full"
              style={{ background: '#fff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
              Join the Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-5 text-[#0f172a]" style={{ letterSpacing: '-0.02em' }}>
              Ready to grow your business<br className="hidden sm:block" /> with government contracts?
            </h2>
            <p className="text-base mb-8 text-[#475569]">
              Register once. Submit to any open tender. Compete fairly on merit.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to={token ? '/dashboard' : '/login'}
                className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: '#7c3aed', boxShadow: '0 8px 24px rgba(124,58,237,.3)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
              >
                {token ? 'Open Dashboard' : 'Create Free Account'} <ArrowRight size={15} />
              </Link>
              <Link to="/contact"
                className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: '#fff', color: '#0f172a', border: '1px solid #ddd6fe' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#0f172a'; }}
              >
                Contact Us <ChevronRight size={15} />
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#fff', borderTop: '1px solid #f1f5f9' }} className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(124,58,237,.25)',
                }}>
                  <Zap size={16} color="#fff" fill="#fff" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#0f172a]">TenderHub</p>
                  <p className="text-[10px] text-[#94a3b8]">NPC Portal</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-[#94a3b8]" style={{ maxWidth: 220 }}>
                Federal Government of Somalia · Transparent, efficient, and fair public procurement.
              </p>
              {/* Color accent chips */}
              <div className="flex gap-2 mt-4">
                {['#ede9fe','#dbeafe','#dcfce7','#fef9c3'].map(c => (
                  <div key={c} style={{ width: 18, height: 18, borderRadius: 5, background: c, border: '1px solid rgba(0,0,0,.06)' }} />
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-[#cbd5e1]">Quick Links</p>
              {[['/', 'Home'], ['/browse', 'Browse Tenders'], ['/contact', 'Contact Us']].map(([to, label]) => (
                <Link key={to} to={to}
                  className="block text-sm mb-3 font-medium transition-colors text-[#64748b]"
                  onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >{label}</Link>
              ))}
            </div>

            {/* Supplier portal */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-[#cbd5e1]">Supplier Portal</p>
              {[['/login', 'Sign In'], ['/login', 'Create Account'], ['/browse', 'Open Tenders']].map(([to, label]) => (
                <Link key={label} to={to}
                  className="block text-sm mb-3 font-medium transition-colors text-[#64748b]"
                  onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                >{label}</Link>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9' }} className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-[#cbd5e1]">© 2026 National Procurement Commission — Federal Government of Somalia</p>
            <p className="text-xs text-[#cbd5e1]">All procurement data is public record.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;