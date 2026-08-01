import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Eye, EyeOff, Zap, AlertCircle, Shield, BarChart3, FileText, Building2, ShieldAlert } from 'lucide-react';

function Field({ icon: Icon, label, type: baseType, value, onChange, placeholder, required }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPwd = baseType === 'password';
  const type  = isPwd ? (show ? 'text' : 'password') : baseType;
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
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
        <Icon size={14} style={{ color: focused ? '#7c3aed' : '#cbd5e1', flexShrink: 0, transition: 'color .18s' }} />
        <input
          type={type} required={required} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#0f172a', fontSize: 14, padding: '12px 0', fontFamily: 'inherit' }}
        />
        {isPwd && (
          <button type="button" onClick={() => setShow(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#cbd5e1', flexShrink: 0, lineHeight: 0 }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin]   = useState(true);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('supplier');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const roleHome = (r) => {
    if (r === 'super_admin') return '/super-admin';
    if (r === 'supplier')    return '/supplier';
    return '/dashboard';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try { navigate(roleHome(JSON.parse(localStorage.getItem('user') || '{}').role)); }
      catch { navigate('/dashboard'); }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      let user;
      if (isLogin) {
        const res = await apiService.login(email, password);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        user = res.data.user;
      } else {
        const res = await apiService.register(name, email, password, role);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        user = res.data.user;
      }
      if (user.must_change_password) {
        navigate('/change-password', { replace: true });
      } else {
        navigate(roleHome(user.role));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally { setLoading(false); }
  };

  const switchMode = (toLogin) => { setIsLogin(toLogin); setError(''); setName(''); setEmail(''); setPassword(''); setRole('supplier'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── LEFT: clean dark panel ── */}
      <div className="hidden lg:flex" style={{
        width: '42%', minWidth: 340,
        background: '#080d1a',
        flexDirection: 'column', justifyContent: 'space-between',
        padding: '44px 48px',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>TenderHub</p>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>NPC Portal</p>
          </div>
        </Link>

        {/* Middle copy */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
            Procurement Platform
          </p>
          <h2 style={{ color: '#fff', fontSize: 30, fontWeight: 800, lineHeight: 1.2, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Open &amp; fair<br />government<br />procurement
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 1.7, margin: '0 0 36px', maxWidth: 280 }}>
            Every tender is published, AI-evaluated, and awarded transparently.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: Shield,   label: 'Government-grade security' },
              { icon: BarChart3,label: 'AI-powered evaluation'     },
              { icon: FileText, label: 'Public tender register'     },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(124,58,237,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={13} style={{ color: '#a78bfa' }} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom switch */}
        <div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: '0 0 10px' }}>
            {isLogin ? "Don't have an account?" : 'Already registered?'}
          </p>
          <button onClick={() => switchMode(!isLogin)} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 600,
            padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
            transition: 'border-color .15s, color .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'; e.currentTarget.style.color = '#a78bfa'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
          >
            {isLogin ? 'Create account →' : 'Sign in →'}
          </button>
        </div>
      </div>

      {/* ── RIGHT: form ── */}
      <div style={{
        flex: 1, background: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 32px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Back link */}
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 500, color: '#94a3b8', textDecoration: 'none',
            marginBottom: 24, transition: 'color .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            ← Back to home
          </Link>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div key={isLogin ? 'si' : 'reg'}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }} style={{ marginBottom: 28 }}>
              <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {isLogin ? 'Sign in' : 'Create account'}
              </h1>
              <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', lineHeight: 1.55 }}>
                {isLogin
                  ? 'Access the procurement portal.'
                  : 'Start submitting proposals to open tenders.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Card */}
          <div style={{
            background: '#fff', borderRadius: 16,
            border: '1px solid #f1f5f9',
            boxShadow: '0 2px 16px rgba(15,23,42,.06)',
            padding: '28px 28px',
          }}>
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden', marginBottom: 16 }}>
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AnimatePresence>
                {!isLogin && (
                  <motion.div key="name-f"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                    <Field icon={User} label="Full name" type="text" value={name}
                      onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
                  </motion.div>
                )}
              </AnimatePresence>

              <Field icon={Mail} label="Email address" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />
              <Field icon={Lock} label="Password" type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />

              <AnimatePresence>
                {!isLogin && (
                  <motion.div key="role-f"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                        Account Type
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px', borderRadius: 9,
                        border: '1.5px solid #7c3aed', background: '#f5f3ff',
                        color: '#7c3aed', fontSize: 13, fontWeight: 600 }}>
                        <Building2 size={14} /> Supplier
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#a78bfa', fontWeight: 500 }}>
                          Public registration
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit" disabled={loading}
                style={{
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
                onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
              >
                {loading
                  ? <><span style={{
                        width: 14, height: 14, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff',
                        animation: 'spin .7s linear infinite', display: 'inline-block',
                      }} /> Processing…</>
                  : isLogin ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </div>

          {/* Mobile switch */}
          <p className="lg:hidden" style={{ marginTop: 20, textAlign: 'center', fontSize: 13.5, color: '#64748b' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => switchMode(!isLogin)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                color: '#7c3aed', fontWeight: 600, fontSize: 13.5, fontFamily: 'inherit' }}>
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          </p>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11.5, color: '#cbd5e1' }}>
            Federal Government of Somalia · NPC Portal
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #cbd5e1; }
        input { caret-color: #7c3aed; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default Login;
