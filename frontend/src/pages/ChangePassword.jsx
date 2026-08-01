import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

function PwdField({ label, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: focused ? '#fff' : '#f8fafc',
        border: `1.5px solid ${focused ? '#7c3aed' : '#e2e8f0'}`,
        borderRadius: 10, padding: '0 14px',
        boxShadow: focused ? '0 0 0 3px rgba(124,58,237,.08)' : 'none',
        transition: 'all .18s',
      }}>
        <Lock size={14} style={{ color: focused ? '#7c3aed' : '#cbd5e1', flexShrink: 0, transition: 'color .18s' }} />
        <input
          type={show ? 'text' : 'password'}
          required value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#0f172a', fontSize: 14, padding: '12px 0', fontFamily: 'inherit' }}
        />
        <button type="button" onClick={() => setShow(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: '#cbd5e1', flexShrink: 0, lineHeight: 0 }}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login', { replace: true }); return; }
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.must_change_password) {
        const home = user.role === 'super_admin' ? '/super-admin'
          : user.role === 'supplier' ? '/supplier' : '/dashboard';
        navigate(home, { replace: true });
      }
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPwd.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (newPwd !== confirmPwd) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await apiService.changePassword(currentPwd, newPwd);
      const updatedUser = res.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setDone(true);
      setTimeout(() => {
        const home = updatedUser.role === 'super_admin' ? '/super-admin'
          : updatedUser.role === 'supplier' ? '/supplier' : '/dashboard';
        navigate(home, { replace: true });
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc',
      alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 420 }}>

        {/* Icon badge */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(124,58,237,.25)',
          }}>
            <ShieldCheck size={24} color="#fff" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Set your password
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', lineHeight: 1.55, maxWidth: 300, marginInline: 'auto' }}>
            Your account requires a password change before you can continue.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #f1f5f9',
          boxShadow: '0 4px 24px rgba(15,23,42,.07)',
          padding: '28px 28px',
        }}>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#dcfce7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <CheckCircle2 size={22} style={{ color: '#16a34a' }} />
                </div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#0f172a', fontSize: 15 }}>
                  Password updated!
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  Redirecting to your dashboard…
                </p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 2 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: '#fef2f2', border: '1px solid #fecaca',
                        color: '#dc2626', fontSize: 13, fontWeight: 500,
                        padding: '10px 14px', borderRadius: 9,
                      }}>
                        <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <PwdField label="Current (temporary) password" value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)} placeholder="Your temporary password" />
                <PwdField label="New password" value={newPwd}
                  onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 characters" />
                <PwdField label="Confirm new password" value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)} placeholder="Repeat new password" />

                <button type="submit" disabled={loading} style={{
                  marginTop: 4, width: '100%', padding: '13px',
                  borderRadius: 10, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: '#7c3aed', color: '#fff',
                  fontSize: 14, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: loading ? 0.65 : 1,
                  boxShadow: '0 4px 12px rgba(124,58,237,.25)',
                  transition: 'opacity .15s, background .15s',
                }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#6d28d9'; }}
                  onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
                  {loading
                    ? <><span style={{ width: 14, height: 14, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff',
                          animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Saving…</>
                    : 'Set new password →'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p style={{ marginTop: 18, textAlign: 'center', fontSize: 11.5, color: '#cbd5e1' }}>
          Federal Government of Somalia · NPC Portal
        </p>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #cbd5e1; }
        input { caret-color: #7c3aed; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default ChangePassword;
