import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Eye, EyeOff, AlertCircle, Building2, Loader2 } from 'lucide-react';
import { LogoMark } from '../components/Logo';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

function Field({ icon: Icon, id, label, type: baseType, value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false);
  const isPwd = baseType === 'password';
  const type = isPwd ? (show ? 'text' : 'password') : baseType;
  return (
    <div className="grid gap-1.5">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          id={id} type={type} required={required} value={value} onChange={onChange} placeholder={placeholder}
          className="pl-9"
        />
        {isPwd && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('supplier');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleHome = (r) => {
    if (r === 'super_admin') return '/super-admin';
    if (r === 'supplier') return '/supplier';
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

  const switchMode = (toLogin) => { setIsLogin(toLogin); setError(''); setName(''); setEmail(''); setPassword(''); };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">

        <Link to="/" className="flex items-center gap-2 self-center font-medium no-underline">
          <LogoMark size={28} />
          <span className="text-foreground">TenderRank</span>
        </Link>

        <Card className="shadow-lg">
          <CardHeader>
            <AnimatePresence mode="wait">
              <motion.div key={isLogin ? 'si' : 'reg'}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}>
                <CardTitle className="text-xl">{isLogin ? 'Login to your account' : 'Create your account'}</CardTitle>
                <CardDescription>
                  {isLogin ? 'Enter your email below to access the procurement portal' : 'Register as a supplier to start submitting proposals'}
                </CardDescription>
              </motion.div>
            </AnimatePresence>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium px-3.5 py-2.5 rounded-lg">
                    <AlertCircle size={14} className="shrink-0" /> {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-5">
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div key="name-f"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <Field icon={User} id="name" label="Full name" type="text" value={name}
                        onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Field icon={Mail} id="email" label="Email address" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required />

                <div className="grid gap-1.5">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    {isLogin && (
                      <Link to="#" className="ml-auto text-xs text-muted-foreground hover:text-primary no-underline transition-colors">
                        Forgot your password?
                      </Link>
                    )}
                  </div>
                  <Field icon={Lock} id="password" label="" type="password" value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>

                <AnimatePresence>
                  {!isLogin && (
                    <motion.div key="role-f"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-primary bg-primary/10 text-primary text-[13px] font-semibold">
                        <Building2 size={14} /> Supplier account
                        <span className="ml-auto text-[11px] text-primary/70 font-medium">Public registration</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                    : isLogin ? 'Login' : 'Create account'}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button type="button" onClick={() => switchMode(!isLogin)} className="bg-transparent border-none cursor-pointer p-0 underline underline-offset-4 text-foreground font-medium">
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Federal Government of Somalia · TenderRank Procurement Portal
        </p>
      </div>
    </div>
  );
};

export default Login;
