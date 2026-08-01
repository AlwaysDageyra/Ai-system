import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import {
  Mail, Building2, Clock, CheckCheck, Inbox,
  ChevronDown, ChevronUp, AlertCircle, KeyRound,
  RefreshCw, Send, Copy, Check, UserPlus, ShieldCheck,
} from 'lucide-react';

const SUBJECT_COLORS = {
  'Supplier Registration': { color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe' },
  'Tender Enquiry':        { color: '#2563eb', bg: '#eff6ff', border: '#dbeafe' },
  'Proposal Submission':   { color: '#059669', bg: '#f0fdf4', border: '#dcfce7' },
  'Evaluation & Results':  { color: '#d97706', bg: '#fffbeb', border: '#fef3c7' },
  'Technical Support':     { color: '#dc2626', bg: '#fef2f2', border: '#fee2e2' },
  'Other':                 { color: '#64748b', bg: '#f8fafc', border: '#f1f5f9' },
};
const DEFAULT_COLOR = { color: '#7c3aed', bg: '#f5f3ff', border: '#ede9fe' };

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

const generatePassword = () => {
  const upper  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower  = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$!';
  const all = upper + lower + digits + special;
  let pwd = upper[Math.floor(Math.random() * upper.length)]
           + lower[Math.floor(Math.random() * lower.length)]
           + digits[Math.floor(Math.random() * digits.length)]
           + special[Math.floor(Math.random() * special.length)];
  for (let i = 4; i < 10; i++) pwd += all[Math.floor(Math.random() * all.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
};

const buildMailto = (msg, password) => {
  const loginUrl = `${window.location.origin}/login`;
  const subject = `NPC TenderHub — Your Portal Access Credentials`;
  const body = `Dear ${msg.name},

Thank you for reaching out to the National Procurement Commission (NPC).

We have reviewed your request and are pleased to grant you access to the NPC TenderHub Portal as a Procurement Officer.

Your login credentials are below:

  Portal:            ${loginUrl}
  Email:             ${msg.email}
  Temporary Password: ${password}

IMPORTANT: For security reasons you will be asked to set a new password the first time you log in. Please do this immediately.

Once logged in you will be able to:
  • Create and publish tenders
  • Review supplier proposals
  • Access AI-powered evaluation results

If you have any questions do not hesitate to reply to this email.

Best regards,
NPC Administration
National Procurement Commission
Federal Government of Somalia`;

  return `mailto:${msg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

/* ── Credentials panel ─────────────────────────────────────── */
const CredentialsPanel = ({ msg }) => {
  const [password, setPassword]     = useState(() => generatePassword());
  const [copied, setCopied]         = useState(false);
  const [pwdFocused, setPwdFocused] = useState(false);
  // 'idle' | 'creating' | 'created' | 'exists' | 'error'
  const [accountState, setAccountState] = useState('idle');
  const [accountError, setAccountError] = useState('');

  const canSendEmail = accountState === 'created' || accountState === 'exists';

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    if (accountState === 'created') return; // account already created — don't change password
    setPassword(generatePassword());
    setAccountState('idle');
    setAccountError('');
  };

  const handleCreateAccount = async () => {
    if (!password.trim()) return;
    setAccountState('creating');
    setAccountError('');
    try {
      await apiService.createUser({
        name: msg.name,
        email: msg.email,
        password: password.trim(),
        role: 'admin',
      });
      setAccountState('created');
    } catch (err) {
      const msg2 = err.response?.data?.message || '';
      if (msg2.toLowerCase().includes('already')) {
        setAccountState('exists');
        setAccountError('An account with this email already exists.');
      } else {
        setAccountState('error');
        setAccountError(msg2 || 'Failed to create account. Try again.');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
      style={{ marginTop: 12, background: 'linear-gradient(135deg,#f5f3ff,#eff6ff)',
        border: '1.5px solid #ddd6fe', borderRadius: 12, padding: '16px 18px' }}
    >
      <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: '#7c3aed', marginBottom: 12 }}>
        Grant Portal Access
      </p>

      {/* Recipient */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
        fontSize: 12, color: '#475569' }}>
        <Mail size={12} style={{ color: '#7c3aed', flexShrink: 0 }} />
        <span>To: <strong style={{ color: '#0f172a' }}>{msg.name}</strong> &lt;{msg.email}&gt;</span>
      </div>

      {/* ── STEP 1: Create account ── */}
      <div style={{ marginBottom: 14, padding: '14px 16px', borderRadius: 10,
        background: canSendEmail ? '#f0fdf4' : 'rgba(255,255,255,0.65)',
        border: `1.5px solid ${canSendEmail ? '#bbf7d0' : '#e0e7ff'}`,
        transition: 'all .25s' }}>

        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: canSendEmail ? '#059669' : '#7c3aed', marginBottom: 10 }}>
          {canSendEmail ? '✓ Step 1 — Account created' : 'Step 1 — Create Account'}
        </p>

        {/* Password row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: pwdFocused ? '#fff' : 'rgba(255,255,255,0.8)',
            border: `1.5px solid ${pwdFocused ? '#7c3aed' : '#ddd6fe'}`,
            borderRadius: 9, padding: '0 12px',
            boxShadow: pwdFocused ? '0 0 0 3px rgba(124,58,237,.08)' : 'none',
            transition: 'all .18s', opacity: accountState === 'created' ? 0.7 : 1,
          }}>
            <KeyRound size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />
            <input
              value={password}
              readOnly={accountState === 'created'}
              onChange={e => { setPassword(e.target.value); setAccountState('idle'); }}
              onFocus={() => setPwdFocused(true)}
              onBlur={() => setPwdFocused(false)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 13, fontWeight: 700, color: '#0f172a', padding: '10px 0',
                fontFamily: 'monospace', letterSpacing: '0.05em',
                cursor: accountState === 'created' ? 'default' : 'text' }}
            />
          </div>
          <button onClick={handleRegenerate} title="Generate new password"
            disabled={accountState === 'created' || accountState === 'creating'}
            style={{ padding: '0 11px', borderRadius: 9, border: '1.5px solid #ddd6fe',
              background: 'rgba(255,255,255,0.7)', cursor: accountState === 'created' ? 'not-allowed' : 'pointer',
              color: '#7c3aed', display: 'flex', alignItems: 'center', opacity: accountState === 'created' ? 0.4 : 1,
              transition: 'all .15s' }}
            onMouseEnter={e => { if (accountState !== 'created') { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; e.currentTarget.style.color = '#7c3aed'; }}
          ><RefreshCw size={13} /></button>
          <button onClick={handleCopy} title="Copy password"
            style={{ padding: '0 11px', borderRadius: 9,
              border: `1.5px solid ${copied ? '#bbf7d0' : '#ddd6fe'}`,
              background: copied ? '#dcfce7' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer', color: copied ? '#059669' : '#7c3aed',
              display: 'flex', alignItems: 'center', transition: 'all .15s' }}
          >{copied ? <Check size={13} /> : <Copy size={13} />}</button>
        </div>

        {/* Error */}
        {(accountState === 'error') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
            color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
            <AlertCircle size={12} /> {accountError}
          </div>
        )}

        {/* Already exists warning */}
        {accountState === 'exists' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
            color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
            <AlertCircle size={12} /> {accountError} You can still send the email with this password if you reset it manually.
          </div>
        )}

        {/* Create button */}
        {!canSendEmail && (
          <button onClick={handleCreateAccount}
            disabled={!password.trim() || accountState === 'creating'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              width: '100%', padding: '10px', borderRadius: 9, border: 'none',
              cursor: !password.trim() || accountState === 'creating' ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 700, transition: 'opacity .15s',
              background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff',
              opacity: !password.trim() || accountState === 'creating' ? 0.6 : 1,
              boxShadow: '0 4px 12px rgba(124,58,237,.25)' }}
            onMouseEnter={e => { if (password.trim() && accountState !== 'creating') e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={e => e.currentTarget.style.opacity = (!password.trim() || accountState === 'creating') ? '0.6' : '1'}
          >
            {accountState === 'creating'
              ? <><span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)',
                  borderTopColor: '#fff', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Creating…</>
              : <><UserPlus size={13} /> Create Procurement Officer Account</>}
          </button>
        )}

        {/* Created success */}
        {accountState === 'created' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
            background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 9,
            fontSize: 12, fontWeight: 700, color: '#059669' }}>
            <ShieldCheck size={14} /> Account created — {msg.email} can now log in.
          </div>
        )}
      </div>

      {/* ── STEP 2: Send email ── */}
      <div style={{ padding: '14px 16px', borderRadius: 10,
        background: canSendEmail ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)',
        border: `1.5px solid ${canSendEmail ? '#e0e7ff' : '#ede9fe'}`,
        opacity: canSendEmail ? 1 : 0.5, transition: 'all .25s' }}>

        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: '#7c3aed', marginBottom: 10 }}>
          Step 2 — Send Credentials by Email
        </p>

        {/* Preview */}
        <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid #e0e7ff',
          borderRadius: 9, padding: '10px 14px', marginBottom: 12,
          fontSize: 11.5, color: '#475569', lineHeight: 1.75, fontFamily: 'monospace' }}>
          Email: <strong style={{ color: '#0f172a' }}>{msg.email}</strong><br />
          Temp Password: <strong style={{ color: '#7c3aed' }}>{password || '—'}</strong><br />
          First login → forced password change
        </div>

        <a
          href={canSendEmail ? buildMailto(msg, password.trim()) : undefined}
          onClick={e => { if (!canSendEmail) e.preventDefault(); }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '11px 0', borderRadius: 10, textDecoration: 'none',
            background: canSendEmail ? 'linear-gradient(135deg,#059669,#0d9488)' : '#e2e8f0',
            color: canSendEmail ? '#fff' : '#94a3b8',
            fontSize: 13, fontWeight: 700,
            boxShadow: canSendEmail ? '0 4px 14px rgba(5,150,105,.25)' : 'none',
            transition: 'opacity .15s', cursor: canSendEmail ? 'pointer' : 'not-allowed' }}
          onMouseEnter={e => { if (canSendEmail) e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Send size={13} />
          {canSendEmail ? 'Open in Email Client' : 'Create account first ↑'}
        </a>
      </div>
    </motion.div>
  );
};

/* ── Message card ──────────────────────────────────────────── */
const MessageCard = ({ msg, onRead }) => {
  const [open, setOpen]             = useState(false);
  const [showCreds, setShowCreds]   = useState(false);
  const sc = SUBJECT_COLORS[msg.subject] || DEFAULT_COLOR;

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) setShowCreds(false);
    if (!msg.is_read && !open) onRead(msg.id);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#fff',
        border: `1.5px solid ${open ? sc.border : msg.is_read ? '#f1f5f9' : '#ddd6fe'}`,
        borderRadius: 14, overflow: 'hidden',
        boxShadow: open ? '0 4px 24px rgba(15,23,42,.07)' : '0 1px 4px rgba(15,23,42,.04)',
        transition: 'border-color .2s, box-shadow .2s',
      }}>

      {/* Header row */}
      <button onClick={handleOpen} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px', background: 'none', border: 'none',
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: msg.is_read ? 'transparent' : '#7c3aed',
          border: msg.is_read ? '1px solid #e2e8f0' : 'none' }} />

        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: sc.bg, border: `1px solid ${sc.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: sc.color }}>
          {msg.name.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: msg.is_read ? 600 : 700, color: '#0f172a' }}>
              {msg.name}
            </span>
            {msg.company && (
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>· {msg.company}</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: msg.is_read ? '#94a3b8' : '#475569',
            fontWeight: msg.is_read ? 400 : 500, margin: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {msg.message.slice(0, 90)}{msg.message.length > 90 ? '…' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
            {msg.subject}
          </span>
          <span style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={9} /> {timeAgo(msg.created_at)}
          </span>
        </div>

        {open ? <ChevronUp size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
               : <ChevronDown size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />}
      </button>

      {/* Expanded body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 18px 18px 18px', borderTop: `1px solid ${sc.border}` }}>

              {/* Meta row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '14px 0 12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
                  <Mail size={12} style={{ color: sc.color }} /> {msg.email}
                </span>
                {msg.company && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
                    <Building2 size={12} style={{ color: sc.color }} /> {msg.company}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
                  <Clock size={12} style={{ color: sc.color }} />
                  {new Date(msg.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>

              {/* Full message */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px',
                fontSize: 13.5, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {msg.message}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 9,
                    background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                    textDecoration: 'none', transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = sc.color; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = sc.bg; e.currentTarget.style.color = sc.color; }}>
                  <Mail size={12} /> Reply
                </a>

                <button
                  onClick={() => setShowCreds(v => !v)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 9,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                    background: showCreds ? '#7c3aed' : '#f5f3ff',
                    color: showCreds ? '#fff' : '#7c3aed',
                    border: `1px solid ${showCreds ? '#7c3aed' : '#ede9fe'}`,
                    boxShadow: showCreds ? '0 4px 12px rgba(124,58,237,.25)' : 'none' }}
                  onMouseEnter={e => { if (!showCreds) { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}}
                  onMouseLeave={e => { if (!showCreds) { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed'; }}}
                >
                  <KeyRound size={12} /> {showCreds ? 'Hide Credentials' : 'Send Credentials'}
                </button>
              </div>

              {/* Credentials panel */}
              <AnimatePresence>
                {showCreds && <CredentialsPanel key="creds" msg={msg} sc={sc} />}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Main page ─────────────────────────────────────────────── */
const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('all');

  useEffect(() => {
    apiService.getMessages()
      .then(res => { setMessages(res.data.messages || []); setUnread(res.data.unread || 0); })
      .catch(() => setError('Could not load messages.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRead = async (id) => {
    try {
      await apiService.markMessageRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
      setUnread(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllMessagesRead();
      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const visible = filter === 'unread' ? messages.filter(m => !m.is_read) : messages;

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.14em', color: '#7c3aed', marginBottom: 4 }}>Super Admin</p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Contact Messages
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>
              Enquiries submitted via the public contact form.
            </p>
          </div>
          {unread > 0 && (
            <button onClick={handleMarkAllRead}
              style={{ display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 700, padding: '9px 16px', borderRadius: 10,
                background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed'; }}>
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { val: 'all',    label: `All (${messages.length})` },
          { val: 'unread', label: `Unread (${unread})` },
        ].map(({ val, label }) => {
          const active = filter === val;
          return (
            <button key={val} onClick={() => setFilter(val)}
              style={{ fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 10,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                background: active ? '#7c3aed' : '#fff',
                color: active ? '#fff' : '#64748b',
                border: `1.5px solid ${active ? '#7c3aed' : '#e2e8f0'}`,
                boxShadow: active ? '0 4px 12px rgba(124,58,237,.25)' : 'none' }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 72, borderRadius: 14, background: '#fff',
              border: '1.5px solid #f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px',
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
          color: '#dc2626', fontSize: 13 }}>
          <AlertCircle size={15} /> {error}
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f5f3ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Inbox size={22} style={{ color: '#7c3aed' }} />
          </div>
          <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            {filter === 'unread' ? 'No unread messages' : 'No messages yet'}
          </p>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>
            {filter === 'unread' ? 'All caught up!' : 'Messages from the contact form will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(msg => (
            <MessageCard key={msg.id} msg={msg} onRead={handleRead} />
          ))}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
};

export default Messages;
