import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import {
  ShieldCheck, FileText, Clock, CheckCircle2, XCircle,
  Users, Building2, ArrowRight, Layers, Zap,
} from 'lucide-react';

const FadeUp = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.42, delay, ease: 'easeOut' }}
  >{children}</motion.div>
);

const Sk = ({ className = '' }) => (
  <div className={`rounded-lg animate-pulse ${className}`} style={{ background: '#f1f5f9' }} />
);

let animFrame;
const AnimatedNum = ({ value = 0, duration = 800 }) => {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(ease * value));
      if (p < 1) animFrame = requestAnimationFrame(step);
    };
    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [value, duration]);
  return <>{display}</>;
};

const PIPELINE_STAGES = [
  { key: 'draft',    label: 'Draft',    icon: FileText,    color: '#64748b', bg: '#f8fafc' },
  { key: 'pending',  label: 'Pending',  icon: Clock,       color: '#d97706', bg: '#fffbeb' },
  { key: 'approved', label: 'Approved', icon: CheckCircle2,color: '#10b981', bg: '#f0fdf4' },
  { key: 'rejected', label: 'Rejected', icon: XCircle,     color: '#ef4444', bg: '#fef2f2' },
];

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [queue, setQueue]  = useState([]);
  const [loading, setLoading] = useState(true);

  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : { name: 'Admin' };

  useEffect(() => {
    Promise.all([apiService.getSuperAdminStats(), apiService.getApprovalQueue()])
      .then(([sRes, qRes]) => {
        setStats(sRes.data);
        setQueue(qRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-1"><Sk className="h-3 w-28" /><Sk className="h-8 w-56" /><Sk className="h-4 w-64" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl h-28" style={{ background: '#fff', border: '1px solid #f1f5f9' }} />)}
      </div>
    </div>
  );

  const STAT_CARDS = [
    { label: 'Total Tenders',    value: stats?.total_tenders    ?? 0, icon: FileText,    color: '#7c3aed', bg: '#f5f3ff' },
    { label: 'Pending Approval', value: stats?.pending_tenders  ?? 0, icon: Clock,       color: '#d97706', bg: '#fffbeb' },
    { label: 'Total Admins',     value: stats?.total_admins     ?? 0, icon: ShieldCheck, color: '#0ea5e9', bg: '#f0f9ff' },
    { label: 'Total Suppliers',  value: stats?.total_suppliers  ?? 0, icon: Users,       color: '#10b981', bg: '#f0fdf4' },
  ];

  const pipeline = stats?.pipeline || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeUp>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: '#7c3aed' }}>
              Super Admin
            </p>
            <h1 className="text-2xl font-extrabold text-[#0f172a]">
              Platform Overview
            </h1>
            <p className="text-sm text-[#94a3b8] mt-0.5">
              Welcome back, {user.name?.split(' ')[0]}. Here's the full system snapshot.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to="/super-admin/queue"
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl text-white transition-all"
              style={{ background: '#7c3aed', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
              <CheckCircle2 size={13} /> Approval Queue
              {queue.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>{queue.length}</span>
              )}
            </Link>
            <Link to="/super-admin/users"
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
              style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed'; }}>
              <Users size={13} /> Manage Users
            </Link>
          </div>
        </div>
      </FadeUp>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }, i) => (
          <FadeUp key={label} delay={i * 0.07}>
            <div className="rounded-2xl p-5 h-full"
              style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-3xl font-extrabold text-[#0f172a]">
                <AnimatedNum value={value} />
              </p>
              <p className="text-xs font-semibold text-[#64748b] mt-0.5">{label}</p>
            </div>
          </FadeUp>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Tender Pipeline */}
        <FadeUp delay={0.18} >
          <div className="rounded-2xl overflow-hidden lg:col-span-1"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                <Layers size={11} color="#fff" />
              </div>
              <h2 className="text-sm font-bold text-[#0f172a]">Tender Pipeline</h2>
            </div>
            <div className="p-5 space-y-3">
              {PIPELINE_STAGES.map(({ key, label, icon: Icon, color, bg }) => {
                const count = pipeline[key] ?? 0;
                const total = Object.values(pipeline).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                          <Icon size={11} style={{ color }} />
                        </div>
                        <span className="text-xs font-semibold text-[#0f172a]">{label}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color }}>{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeUp>

        {/* Approval Queue preview */}
        <FadeUp delay={0.22} >
          <div className="rounded-2xl overflow-hidden lg:col-span-2"
            style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f8fafc', background: '#fafafa' }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#fffbeb' }}>
                  <Clock size={11} style={{ color: '#d97706' }} />
                </div>
                <h2 className="text-sm font-bold text-[#0f172a]">Pending Approval</h2>
                {queue.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: '#fffbeb', color: '#d97706' }}>{queue.length}</span>
                )}
              </div>
              <Link to="/super-admin/queue"
                className="text-xs font-semibold flex items-center gap-1 transition-colors"
                style={{ color: '#7c3aed' }}
                onMouseEnter={e => e.currentTarget.style.color = '#6d28d9'}
                onMouseLeave={e => e.currentTarget.style.color = '#7c3aed'}>
                Manage all <ArrowRight size={11} />
              </Link>
            </div>

            {queue.length === 0 ? (
              <div className="py-14 text-center">
                <CheckCircle2 size={28} className="mx-auto mb-3 text-green-400" />
                <p className="text-sm font-semibold text-[#0f172a]">All caught up!</p>
                <p className="text-xs text-[#94a3b8] mt-1">No tenders pending approval.</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
                {queue.slice(0, 5).map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    className="flex items-center justify-between px-5 py-3.5 gap-4 transition-colors"
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: '#f5f3ff' }}>
                        <FileText size={13} style={{ color: '#7c3aed' }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">{item.title}</p>
                        <p className="text-[10px] text-[#94a3b8]">
                          {item.company_name || 'Unknown Company'} · {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Link to="/super-admin/queue"
                      className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                      style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#d97706'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.color = '#d97706'; }}>
                      Review
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </FadeUp>
      </div>

      {/* Quick actions footer */}
      <FadeUp delay={0.32}>
        <div className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg,#0f0a1e,#1a0a3a)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
              <Zap size={12} color="#fff" fill="#fff" />
            </div>
            <p className="text-sm font-bold text-white">Quick Actions</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Approval Queue',  to: '/super-admin/queue',  Icon: CheckCircle2 },
              { label: 'All Tenders',     to: '/super-admin/tenders',Icon: FileText },
              { label: 'User Management', to: '/super-admin/users',  Icon: Users },
              { label: 'Add New Admin',   to: '/super-admin/users',  Icon: ShieldCheck },
            ].map(({ label, to, Icon }) => (
              <Link key={label} to={to}
                className="flex items-center gap-2 p-3 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                <Icon size={13} /> {label}
              </Link>
            ))}
          </div>
        </div>
      </FadeUp>
    </div>
  );
};

export default SuperAdminDashboard;
