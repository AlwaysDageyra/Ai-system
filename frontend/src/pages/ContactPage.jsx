import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, FileText, ChevronDown, MessageSquare, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';

const FadeUp = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const FAQS = [
  { q: 'How do I register as a supplier?', a: 'Click "Get Started" in the navbar or visit the Supplier Portal. Fill in your company details, registration number, and upload any required certifications. Approval takes 1–2 business days.' },
  { q: 'Can international companies bid on tenders?', a: 'Most tenders are open to registered Somali businesses only. Some large infrastructure tenders allow international bidding — check the specific tender requirements.' },
  { q: 'How are proposals evaluated?', a: "Our AI system scores each proposal for compliance against the tender's requirements. Procurement officers then review the scores and confirm the final ranking before awarding the contract." },
  { q: 'How long does evaluation take?', a: 'Most tenders are evaluated and awarded within 72 hours of the submission deadline. Complex infrastructure projects may take up to 7 business days.' },
  { q: 'What document formats are accepted?', a: 'We accept PDF and Microsoft Word documents (.pdf, .doc, .docx). Maximum file size is 50MB per submission.' },
];

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: '#f8fafc', border: '1.5px solid #e2e8f0',
  color: '#0f172a', fontSize: 14, outline: 'none',
  transition: 'all .2s', fontFamily: 'inherit',
};

function Field({ as: Tag = 'input', ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <Tag
      {...props}
      style={{
        ...inputStyle,
        ...(focused ? { borderColor: '#7c3aed', boxShadow: '0 0 0 3px rgba(124,58,237,.1)', background: '#fff' } : {}),
        ...(props.style || {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function InputLabel({ children }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
      {children}
    </label>
  );
}

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setSubmitError('');
    try {
      await apiService.submitContact(form);
      setStatus('success');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to send. Please try again.');
      setStatus('idle');
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* ── Hero / Main section ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

            {/* Left — info */}
            <div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700,
                  color: '#7c3aed', background: '#ede9fe', border: '1px solid #ddd6fe',
                  padding: '5px 12px', borderRadius: 999, marginBottom: 20 }}>
                  <MessageSquare size={11} /> Get in Touch
                </div>

                <h1 style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', lineHeight: 1.15,
                  letterSpacing: '-0.03em', marginBottom: 16 }}>
                  Contact the<br />
                  <span style={{ color: '#7c3aed' }}>NPC Team</span>
                </h1>

                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 32, maxWidth: 400 }}>
                  Questions about a tender, submission process, or your application? Our team responds within 1 business day.
                </p>

                {/* Contact methods */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: Mail,   label: 'Email',   val: 'procurement@npc.gov.so', bg: '#ede9fe', ic: '#7c3aed' },
                    { icon: Phone,  label: 'Phone',   val: '+252 61 234 5678',        bg: '#dbeafe', ic: '#2563eb' },
                    { icon: MapPin, label: 'Address', val: 'Villa Somalia Complex, Mogadishu', bg: '#dcfce7', ic: '#059669' },
                  ].map(({ icon: Icon, label, val, bg, ic }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14,
                      background: '#fff', border: '1.5px solid #f1f5f9', borderRadius: 14,
                      padding: '12px 16px', boxShadow: '0 2px 8px rgba(15,23,42,.04)' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={17} style={{ color: ic }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Office hours */}
                <div style={{ marginTop: 20, background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 14, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                      <Clock size={15} style={{ color: '#d97706' }} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Office Hours</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[
                      { day: 'Mon – Thu', hrs: '8:00 AM – 5:00 PM', open: true },
                      { day: 'Friday',    hrs: '8:00 AM – 12:30 PM', open: true },
                      { day: 'Sat – Sun', hrs: 'Closed', open: false },
                    ].map(({ day, hrs, open }) => (
                      <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 0', borderBottom: '1px solid rgba(217,119,6,.12)' }}>
                        <span style={{ fontSize: 12, color: '#92400e' }}>{day}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: open ? '#d97706' : '#a8a29e' }}>{hrs}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right — form */}
            <FadeUp delay={0.08}>
              <div style={{ background: '#fff', border: '1.5px solid #f1f5f9', borderRadius: 20,
                boxShadow: '0 8px 40px rgba(15,23,42,.08)', overflow: 'hidden' }}>

                <div style={{ padding: '20px 28px', background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
                  borderBottom: '1px solid #e0e7ff' }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Send a message</p>
                  <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>We'll get back to you within 1 business day.</p>
                </div>

                <div style={{ padding: '24px 28px' }}>
                  <AnimatePresence mode="wait">
                    {status === 'success' ? (
                      <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', textAlign: 'center' }}>
                        <div style={{ width: 60, height: 60, borderRadius: 16, background: '#dcfce7',
                          border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                          <CheckCircle2 size={26} style={{ color: '#059669' }} />
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Message sent!</p>
                        <p style={{ fontSize: 13, color: '#64748b', maxWidth: 260 }}>Our team will reply within 1 business day.</p>
                        <button onClick={() => { setStatus('idle'); setForm({ name: '', email: '', company: '', subject: '', message: '' }); }}
                          style={{ marginTop: 20, fontSize: 12, fontWeight: 700, padding: '9px 20px', borderRadius: 10,
                            background: '#ede9fe', color: '#7c3aed', border: '1px solid #ddd6fe', cursor: 'pointer',
                            transition: 'all .15s', fontFamily: 'inherit' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.color = '#7c3aed'; }}>
                          Send another →
                        </button>
                      </motion.div>
                    ) : (
                      <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <InputLabel>Full Name *</InputLabel>
                            <Field name="name" required value={form.name} onChange={handleChange} placeholder="Your name" />
                          </div>
                          <div>
                            <InputLabel>Email *</InputLabel>
                            <Field name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@company.so" />
                          </div>
                        </div>
                        <div>
                          <InputLabel>Company / Organization</InputLabel>
                          <Field name="company" value={form.company} onChange={handleChange} placeholder="Your company name" />
                        </div>
                        <div>
                          <InputLabel>Subject *</InputLabel>
                          <Field as="select" name="subject" required value={form.subject} onChange={handleChange}
                            style={{ appearance: 'none', cursor: 'pointer' }}>
                            <option value="">Select a subject…</option>
                            <option>Supplier Registration</option>
                            <option>Tender Enquiry</option>
                            <option>Proposal Submission</option>
                            <option>Evaluation & Results</option>
                            <option>Technical Support</option>
                            <option>Other</option>
                          </Field>
                        </div>
                        <div>
                          <InputLabel>Message *</InputLabel>
                          <Field as="textarea" name="message" required rows={4} value={form.message}
                            onChange={handleChange} placeholder="Describe your enquiry…"
                            style={{ resize: 'vertical', minHeight: 100 }} />
                        </div>
                        {submitError && (
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                            fontSize: 13, fontWeight: 500, padding: '10px 14px', borderRadius: 9 }}>
                            {submitError}
                          </div>
                        )}
                        <button type="submit" disabled={status === 'sending'}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            padding: '13px', borderRadius: 11, border: 'none', cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                            background: 'linear-gradient(135deg, #7c3aed, #2563eb)', color: '#fff',
                            fontSize: 14, fontWeight: 700, opacity: status === 'sending' ? 0.65 : 1,
                            boxShadow: '0 4px 16px rgba(124,58,237,.3)', transition: 'opacity .15s', fontFamily: 'inherit' }}>
                          {status === 'sending'
                            ? <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'spin .7s linear infinite' }} /> Sending…</>
                            : <><Send size={14} /> Send Message</>}
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <FadeUp className="text-center mb-10">
          <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', background: '#ede9fe', color: '#7c3aed',
            border: '1px solid #ddd6fe', padding: '5px 14px', borderRadius: 999, marginBottom: 16 }}>FAQ</span>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Frequently Asked Questions
          </h2>
          <p style={{ fontSize: 14, color: '#64748b' }}>Everything you need to know about the procurement process.</p>
        </FadeUp>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQS.map(({ q, a }, i) => {
            const palette = [
              { accent: '#7c3aed', light: '#ede9fe', border: '#ddd6fe' },
              { accent: '#2563eb', light: '#dbeafe', border: '#bfdbfe' },
              { accent: '#d97706', light: '#fef9c3', border: '#fde68a' },
              { accent: '#059669', light: '#dcfce7', border: '#bbf7d0' },
              { accent: '#7c3aed', light: '#ede9fe', border: '#ddd6fe' },
            ][i];
            const isOpen = openFaq === i;
            return (
              <FadeUp key={i} delay={i * 0.04}>
                <div style={{
                  background: '#fff', borderRadius: 14, overflow: 'hidden',
                  border: `1.5px solid ${isOpen ? palette.border : '#f1f5f9'}`,
                  boxShadow: isOpen ? '0 4px 24px rgba(15,23,42,.07)' : 'none',
                  transition: 'border-color .2s, box-shadow .2s',
                }}>
                  <button onClick={() => setOpenFaq(isOpen ? null : i)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                      padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'inherit' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, transition: 'all .2s',
                      background: isOpen ? palette.accent : palette.light,
                      color: isOpen ? '#fff' : palette.accent }}>
                      {i + 1}
                    </div>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{q}</span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} style={{ color: isOpen ? palette.accent : '#9ca3af' }} />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 20px 18px 62px', borderTop: `1px solid ${palette.border}` }}>
                          <p style={{ fontSize: 13.5, lineHeight: 1.7, color: '#64748b', marginTop: 14 }}>{a}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ContactPage;
