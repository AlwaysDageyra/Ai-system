import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PublicNavbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const token = localStorage.getItem('token');
  const location = useLocation();

  const dashboardPath = () => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.role === 'super_admin') return '/super-admin';
      if (u.role === 'supplier') return '/supplier';
      return '/dashboard';
    } catch { return '/dashboard'; }
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/browse', label: 'Tenders' },
    { to: '/contact', label: 'Contact' },
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #f3f4f6',
        boxShadow: scrolled ? '0 4px 24px rgba(15,10,30,.06)' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div
              className="group-hover:scale-110 transition-transform duration-200 flex items-center justify-center"
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
                boxShadow: '0 4px 14px rgba(124,58,237,.3)',
              }}
            >
              <Zap size={16} color="#fff" fill="#fff" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-[#0f172a] tracking-tight">NPC Procurement</p>
              <p className="text-[10px] text-[#9ca3af] font-medium">Federal Government of Somalia</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ color: isActive(to) ? '#7c3aed' : '#6b7280' }}
                onMouseEnter={e => { if (!isActive(to)) { e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = '#f9fafb'; } }}
                onMouseLeave={e => { if (!isActive(to)) { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; } }}
              >
                {label}
                {isActive(to) && (
                  <motion.div
                    layoutId="nav-pill-pub"
                    className="absolute inset-0 rounded-xl -z-10"
                    style={{ background: '#f5f3ff' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            {token ? (
              <Link
                to={dashboardPath()}
                className="inline-flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                style={{ background: '#7c3aed', boxShadow: '0 4px 14px rgba(124,58,237,.3)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
              >
                <LayoutDashboard size={14} /> Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ color: '#6b7280' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
                >Sign In</Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                  style={{ background: '#0f172a' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
                >Get Started →</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-xl transition-all"
            style={{ color: '#6b7280' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={open ? 'x' : 'menu'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ borderTop: '1px solid #f3f4f6', background: '#fff', overflow: 'hidden' }}
            className="md:hidden px-4 py-3 space-y-1"
          >
            {navLinks.map(({ to, label }, i) => (
              <motion.div
                key={to}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={to}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: isActive(to) ? '#f5f3ff' : 'transparent',
                    color: isActive(to) ? '#7c3aed' : '#6b7280',
                  }}
                >{label}</Link>
              </motion.div>
            ))}
            <div style={{ paddingTop: 8, borderTop: '1px solid #f3f4f6' }} className="flex flex-col gap-2">
              {token ? (
                <Link
                  to={dashboardPath()}
                  className="flex items-center justify-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
                  style={{ background: '#7c3aed' }}
                >
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login"
                    className="block text-center px-4 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ border: '1px solid #e5e7eb', color: '#6b7280' }}
                  >Sign In</Link>
                  <Link to="/login"
                    className="block text-center text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
                    style={{ background: '#0f172a' }}
                  >Get Started →</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default PublicNavbar;
