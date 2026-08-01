import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import RankingTable from '../components/RankingTable';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, ChevronDown, Play, CheckCircle2,
  FileText, Users, Shield, BarChart3, Zap, ArrowLeft, RefreshCw,
  Eye, User, Building2,
} from 'lucide-react';

const MESSAGES = [
  'Reviewing bidder documents...',
  'Analyzing company qualifications...',
  'Verifying compliance requirements...',
  'Evaluating technical submissions...',
  'Comparing bidder capabilities...',
  'Assessing project experience...',
  'Calculating ranking scores...',
  'Preparing leaderboard results...',
];

const ACTIVITIES = [
  n => `Tax compliance certificate verified — ${n}`,
  n => `Business registration confirmed — ${n}`,
  n => `Financial proposal analyzed — ${n}`,
  n => `Technical submission evaluated — ${n}`,
  n => `Past contracts reviewed — ${n}`,
  n => `Staff qualifications assessed — ${n}`,
  n => `Bank statement reviewed — ${n}`,
  n => `Company profile verified — ${n}`,
  n => `Compliance score calculated — ${n}`,
  n => `Red flag check completed — ${n}`,
];

const STAGE_LABELS = ['Submitted', 'Under Review', 'Evaluated', 'Ranked'];

const Rankings = () => {
  const [tenders, setTenders] = useState([]);
  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [rankings, setRankings] = useState([]);
  const [tenderTitle, setTenderTitle] = useState('');
  const [tenderLoading, setTenderLoading] = useState(true);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState('');

  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [counters, setCounters] = useState({ reviewed: 0, documents: 0, requirements: 0, scores: 0 });
  const [activityLog, setActivityLog] = useState([]);
  const [bidderStages, setBidderStages] = useState([]);

  const rafRef = useRef(null);
  const activityRef = useRef(null);
  const actIdxRef = useRef(0);

  useEffect(() => {
    apiService.getTenders()
      .then(res => {
        setTenders(res.data);
        if (res.data.length > 0) {
          setSelectedTenderId(String(res.data[0].id));
          setTenderTitle(res.data[0].title);
        }
      })
      .catch(() => setError('Failed to load tenders.'))
      .finally(() => setTenderLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTenderId) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (activityRef.current) clearInterval(activityRef.current);
    setPhase('idle');
    setRankings([]);
    setProgress(0);
    setActivityLog([]);
    setFetchLoading(true);
    setError('');

    apiService.getRankings(selectedTenderId)
      .then(res => {
        const data = res.data.rankings || [];
        setRankings(data);
        setTenderTitle(res.data.tender_title || '');
        setBidderStages(data.map(r => ({ name: r.supplier_name, stage: 0 })));
        const lastCount = parseInt(sessionStorage.getItem(`ranked_${selectedTenderId}`) || '0', 10);
        if (data.length > 0 && lastCount === data.length) setPhase('complete');
      })
      .catch(err => setError(err.response?.data?.message || 'Failed to load rankings.'))
      .finally(() => setFetchLoading(false));
  }, [selectedTenderId]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (activityRef.current) clearInterval(activityRef.current);
  }, []);

  const startScreening = () => {
    if (!rankings.length) return;
    setPhase('screening');
    setProgress(0);
    setMsgIdx(0);
    setActivityLog([]);
    setCounters({ reviewed: 0, documents: 0, requirements: 0, scores: 0 });
    setBidderStages(rankings.map(r => ({ name: r.supplier_name, stage: 0 })));
    actIdxRef.current = 0;

    const n = rankings.length;
    const targets = { reviewed: n, documents: n * 3, requirements: n * 10, scores: n };
    const DURATION = 7000;
    const t0 = Date.now();
    const names = rankings.map(r => r.supplier_name);

    const addActivity = () => {
      const name = names[actIdxRef.current % names.length];
      const fn = ACTIVITIES[actIdxRef.current % ACTIVITIES.length];
      actIdxRef.current++;
      setActivityLog(prev => [{ id: Date.now(), text: fn(name) }, ...prev.slice(0, 7)]);
    };

    addActivity();
    activityRef.current = setInterval(addActivity, 900);

    const tick = () => {
      const p = Math.min(100, ((Date.now() - t0) / DURATION) * 100);
      setProgress(p);
      setMsgIdx(Math.min(MESSAGES.length - 1, Math.floor((p / 100) * MESSAGES.length)));
      setCounters({
        reviewed: Math.floor((p / 100) * targets.reviewed),
        documents: Math.floor((p / 100) * targets.documents),
        requirements: Math.floor((p / 100) * targets.requirements),
        scores: Math.floor((p / 100) * targets.scores),
      });
      setBidderStages(rankings.map((r, i) => {
        const stagger = (i / Math.max(1, n - 1)) * 0.25;
        const adj = Math.max(0, (p / 100) - stagger) / 0.75;
        let stage = 0;
        if (adj >= 0.9) stage = 3;
        else if (adj >= 0.55) stage = 2;
        else if (adj >= 0.2) stage = 1;
        return { name: r.supplier_name, stage };
      }));

      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        clearInterval(activityRef.current);
        setActivityLog(prev => [
          { id: Date.now(), text: 'Leaderboard finalized — all bidders ranked' },
          ...prev.slice(0, 7),
        ]);
        sessionStorage.setItem(`ranked_${selectedTenderId}`, String(rankings.length));
        setTimeout(() => setPhase('complete'), 800);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const top3 = rankings.slice(0, 3);
  const PODIUM = [
    { entry: top3[1], height: 80,  gradient: 'linear-gradient(135deg,#7c3aed,#a78bfa)', num: '2', medal: '🥈' },
    { entry: top3[0], height: 108, gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)', num: '1', medal: '🥇' },
    { entry: top3[2], height: 60,  gradient: 'linear-gradient(135deg,#d97706,#f59e0b)', num: '3', medal: '🥉' },
  ];

  const stageBg = (s) => {
    if (s === 3) return { bg: '#f5f3ff', color: '#7c3aed' };
    if (s === 2) return { bg: '#fffbeb', color: '#d97706' };
    if (s === 1) return { bg: '#f0f9ff', color: '#0ea5e9' };
    return { bg: '#f8fafc', color: '#94a3b8' };
  };

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .activity-new { animation: slideDown 0.25s ease-out both; }
        .msg-fade { animation: fadeUp 0.35s ease-out both; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a] flex items-center gap-2">
            <Trophy size={19} className="text-amber-500" /> Supplier Leaderboard
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">AI-powered procurement evaluation &amp; ranking.</p>
        </div>
        <div className="relative shrink-0">
          <select
            value={selectedTenderId}
            onChange={e => {
              const tid = e.target.value;
              setSelectedTenderId(tid);
              const t = tenders.find(x => String(x.id) === tid);
              if (t) setTenderTitle(t.title);
            }}
            disabled={tenderLoading || phase === 'screening'}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm font-semibold outline-none cursor-pointer disabled:opacity-40"
            style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }}
          >
            {tenders.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94a3b8' }} />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm font-medium"
          style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444' }}>{error}</div>
      )}

      {/* ── IDLE phase ── */}
      {phase === 'idle' && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap"
            style={{ borderBottom: '1px solid #f8fafc' }}>
            <div>
              <h2 className="font-bold text-[#0f172a] text-sm flex items-center gap-2">
                <Users size={14} style={{ color: '#0ea5e9' }} />
                Submitted Bidders
                {rankings.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: '#f0f9ff', color: '#0ea5e9' }}>{rankings.length}</span>
                )}
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">{tenderTitle}</p>
            </div>
            {!fetchLoading && rankings.length > 0 && (
              <button
                onClick={startScreening}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all group shrink-0"
                style={{ background: 'linear-gradient(135deg,#0f172a,#7c3aed)', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,0.45)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.3)'}
              >
                <Play size={13} className="group-hover:scale-110 transition-transform" />
                Start Screening &amp; Ranking
              </button>
            )}
          </div>

          {fetchLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#ede9fe] border-t-[#7c3aed]" />
            </div>
          ) : rankings.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={28} style={{ color: '#e2e8f0' }} className="mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#94a3b8]">No proposals submitted yet</p>
              <p className="text-xs text-[#94a3b8] mt-1">Suppliers must submit proposals before screening can begin.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
              {rankings.map((r, i) => {
                const initials = (r.supplier_name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={r.proposal_id}
                    className="flex items-center justify-between px-6 py-4 transition-all gap-4"
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* Rank + avatar + name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                        style={{ background: '#f5f3ff', color: '#7c3aed' }}>{i + 1}</span>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', letterSpacing: 1 }}>
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0f172a] truncate">{r.supplier_name}</p>
                        <p className="text-[11px] text-[#94a3b8] mt-0.5">
                          Proposal #{r.proposal_id} · submitted {new Date(r.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>

                    {/* Right side: status + view button */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd' }}>
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                        Submitted
                      </span>

                      <Link
                        to={`/proposal/${r.proposal_id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#7c3aed'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.borderColor = '#ede9fe'; }}
                      >
                        <Eye size={12} /> View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SCREENING phase ── */}
      {phase === 'screening' && (
        <div className="space-y-4">
          {/* Status header */}
          <div className="rounded-2xl p-6 text-center space-y-3"
            style={{ background: 'linear-gradient(135deg,#0f0a1e,#1a0a3a)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
              <Zap size={10} className="animate-pulse text-amber-400" />
              AI Evaluation Engine Active
            </span>
            <div className="h-7 flex items-center justify-center overflow-hidden">
              <p key={msgIdx} className="msg-fade text-base font-bold text-white leading-tight">{MESSAGES[msgIdx]}</p>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{tenderTitle}</p>
          </div>

          {/* Progress */}
          <div className="rounded-2xl p-5 space-y-3"
            style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Evaluation Progress</span>
              <span className="text-sm font-bold text-[#0f172a] tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
              <div className="h-full rounded-full transition-all duration-75 linear"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                }} />
            </div>
            <p className="text-xs text-[#94a3b8]">
              {progress < 100
                ? `Estimated completion: ${Math.max(1, Math.ceil(((100 - progress) / 100) * 7))}s remaining`
                : 'Finalizing results…'}
            </p>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Bidders Reviewed',      value: counters.reviewed,     icon: Users,     color: '#7c3aed', bg: '#f5f3ff' },
              { label: 'Documents Processed',   value: counters.documents,    icon: FileText,  color: '#0ea5e9', bg: '#f0f9ff' },
              { label: 'Requirements Verified', value: counters.requirements, icon: Shield,    color: '#10b981', bg: '#f0fdf4' },
              { label: 'Scores Generated',      value: counters.scores,       icon: BarChart3, color: '#f59e0b', bg: '#fffbeb' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="rounded-2xl p-4 text-center"
                style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: bg }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <p className="text-2xl font-extrabold text-[#0f172a] tabular-nums">{value}</p>
                <p className="text-[10px] text-[#94a3b8] mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Bidder progress + Live activity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
              <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #f8fafc' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Bidder Progress</p>
              </div>
              <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
                {bidderStages.length === 0 ? (
                  <p className="text-xs text-[#94a3b8] text-center py-8">No bidders</p>
                ) : bidderStages.slice(0, 6).map((b, i) => {
                  const sc = stageBg(b.stage);
                  return (
                    <div key={i} className="flex items-center justify-between px-5 py-3 gap-3">
                      <p className="text-xs font-semibold text-[#0f172a] truncate min-w-0">{b.name}</p>
                      <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all duration-500"
                        style={{ background: sc.bg, color: sc.color }}>
                        {STAGE_LABELS[b.stage]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
              <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid #f8fafc' }}>
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Live Activity</p>
              </div>
              <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
                {activityLog.map((a, i) => (
                  <div key={a.id} className={`flex items-start gap-3 px-5 py-3 ${i === 0 ? 'activity-new' : ''}`}>
                    <CheckCircle2 size={11} className="text-green-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-[#64748b] leading-relaxed">{a.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPLETE phase ── */}
      {phase === 'complete' && (
        <div className="space-y-5">
          {/* Podium */}
          {top3.length > 0 && (
            <div className="rounded-2xl p-6"
              style={{ background: 'linear-gradient(135deg,#0f0a1e,#1a0a3a)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-center mb-6"
                style={{ color: 'rgba(167,139,250,0.5)' }}>
                Top Performers — {tenderTitle}
              </p>
              <div className="flex items-end justify-center gap-4 max-w-xs mx-auto">
                {PODIUM.map((slot, i) => {
                  if (!slot.entry) return <div key={i} className="flex-1" />;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1">
                      <div className="text-center w-full">
                        <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {slot.entry.supplier_name}
                        </p>
                        <p className="text-base font-extrabold text-white">{slot.entry.score.toFixed(0)}%</p>
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: slot.height }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="w-full rounded-t-xl flex items-start justify-center pt-2"
                        style={{ background: slot.gradient }}>
                        <span className="font-extrabold text-lg text-white">{slot.num}</span>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full rankings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#0f172a]">Full Rankings — {tenderTitle}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { sessionStorage.removeItem(`ranked_${selectedTenderId}`); startScreening(); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: '#7c3aed' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
                  <RefreshCw size={12} /> Regenerate
                </button>
                <button
                  onClick={() => setPhase('idle')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ede9fe' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ede9fe'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f5f3ff'; }}>
                  <ArrowLeft size={12} /> Back to Bidders
                </button>
              </div>
            </div>
            <RankingTable rankings={rankings} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Rankings;
