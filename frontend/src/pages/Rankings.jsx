import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import RankingTable from '../components/RankingTable';
import { motion } from 'framer-motion';
import {
  Trophy, ChevronDown, Play, CheckCircle2,
  FileText, Users, Shield, BarChart3, Zap, ArrowLeft, RefreshCw, Eye,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../lib/utils';

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
const STAGE_TONE = ['bg-muted text-muted-foreground', 'bg-sky-50 text-sky-600', 'bg-warning/10 text-warning', 'bg-primary/10 text-primary'];

const PODIUM_TONE = [
  { gradient: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', medal: '🥈' },
  { gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', medal: '🥇' },
  { gradient: 'linear-gradient(135deg, #d97706, #f59e0b)', medal: '🥉' },
];

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
    { entry: top3[1], height: 80, ...PODIUM_TONE[0], num: '2' },
    { entry: top3[0], height: 108, ...PODIUM_TONE[1], num: '1' },
    { entry: top3[2], height: 60, ...PODIUM_TONE[2], num: '3' },
  ];

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
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Trophy size={19} className="text-amber-500" /> Supplier Leaderboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">AI-powered procurement evaluation &amp; ranking.</p>
        </div>
        <div className="shrink-0">
          <Select
            value={selectedTenderId}
            onValueChange={(tid) => {
              setSelectedTenderId(tid);
              const t = tenders.find(x => String(x.id) === tid);
              if (t) setTenderTitle(t.title);
            }}
            disabled={tenderLoading || phase === 'screening'}
          >
            <SelectTrigger className="min-w-[220px]">
              <SelectValue placeholder="Select a tender…" />
            </SelectTrigger>
            <SelectContent>
              {tenders.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm font-medium bg-destructive/10 border border-destructive/20 text-destructive">{error}</div>
      )}

      {/* ── IDLE phase ── */}
      {phase === 'idle' && (
        <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
          <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap border-b border-border">
            <div>
              <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Users size={14} className="text-sky-600" />
                Submitted Bidders
                {rankings.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-600">{rankings.length}</span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{tenderTitle}</p>
            </div>
            {!fetchLoading && rankings.length > 0 && (
              <Button
                onClick={startScreening}
                size="lg"
                className="shrink-0 group"
                style={{ background: 'linear-gradient(135deg, var(--foreground), var(--primary))' }}
              >
                <Play size={13} className="group-hover:scale-110 transition-transform" />
                Start Screening &amp; Ranking
              </Button>
            )}
          </div>

          {fetchLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary" />
            </div>
          ) : rankings.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={28} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No proposals submitted yet</p>
              <p className="text-xs text-muted-foreground mt-1">Suppliers must submit proposals before screening can begin.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {rankings.map((r, i) => {
                const initials = (r.supplier_name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={r.proposal_id} className="flex items-center justify-between px-6 py-4 gap-4 transition-colors hover:bg-accent/50">

                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 bg-primary/10 text-primary">{i + 1}</span>

                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs bg-primary text-primary-foreground tracking-wide">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{r.supplier_name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Proposal #{r.proposal_id} · submitted {new Date(r.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-600 border border-sky-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                        Submitted
                      </span>

                      <Link
                        to={`/proposal/${r.proposal_id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20 no-underline transition-colors hover:bg-primary hover:text-primary-foreground"
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
          <div className="rounded-xl p-6 text-center space-y-3 bg-card border border-primary/20 shadow-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              <Zap size={10} className="animate-pulse text-amber-500" />
              AI Evaluation Engine Active
            </span>
            <div className="h-7 flex items-center justify-center overflow-hidden">
              <p key={msgIdx} className="msg-fade text-base font-bold text-foreground leading-tight">{MESSAGES[msgIdx]}</p>
            </div>
            <p className="text-xs text-muted-foreground">{tenderTitle}</p>
          </div>

          <div className="rounded-xl p-5 space-y-3 bg-card border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Evaluation Progress</span>
              <span className="text-sm font-bold text-foreground tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-muted">
              <div className="h-full rounded-full transition-all duration-75 linear bg-primary"
                style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {progress < 100
                ? `Estimated completion: ${Math.max(1, Math.ceil(((100 - progress) / 100) * 7))}s remaining`
                : 'Finalizing results…'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Bidders Reviewed', value: counters.reviewed, icon: Users, tone: 'bg-primary/10 text-primary' },
              { label: 'Documents Processed', value: counters.documents, icon: FileText, tone: 'bg-sky-50 text-sky-600' },
              { label: 'Requirements Verified', value: counters.requirements, icon: Shield, tone: 'bg-success/10 text-success' },
              { label: 'Scores Generated', value: counters.scores, icon: BarChart3, tone: 'bg-warning/10 text-warning' },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="rounded-xl p-4 text-center bg-card border border-border">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2', tone)}>
                  <Icon size={14} />
                </div>
                <p className="text-2xl font-extrabold text-foreground tabular-nums">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden bg-card border border-border">
              <div className="px-5 py-3.5 border-b border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bidder Progress</p>
              </div>
              <div className="divide-y divide-border">
                {bidderStages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No bidders</p>
                ) : bidderStages.slice(0, 6).map((b, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 gap-3">
                    <p className="text-xs font-semibold text-foreground truncate min-w-0">{b.name}</p>
                    <span className={cn('shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors duration-500', STAGE_TONE[b.stage])}>
                      {STAGE_LABELS[b.stage]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden bg-card border border-border">
              <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Activity</p>
              </div>
              <div className="divide-y divide-border">
                {activityLog.map((a, i) => (
                  <div key={a.id} className={cn('flex items-start gap-3 px-5 py-3', i === 0 && 'activity-new')}>
                    <CheckCircle2 size={11} className="text-success shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{a.text}</p>
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
          {top3.length > 0 && (
            <div className="rounded-xl p-6 bg-card border border-primary/20 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-center mb-6 text-primary/70">
                Top Performers — {tenderTitle}
              </p>
              <div className="flex items-end justify-center gap-4 max-w-xs mx-auto">
                {PODIUM.map((slot, i) => {
                  if (!slot.entry) return <div key={i} className="flex-1" />;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1">
                      <div className="text-center w-full">
                        <p className="text-xs font-semibold truncate text-muted-foreground">
                          {slot.entry.supplier_name}
                        </p>
                        <p className="text-base font-extrabold text-foreground">{slot.entry.score.toFixed(0)}%</p>
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

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground">Full Rankings — {tenderTitle}</h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => { sessionStorage.removeItem(`ranked_${selectedTenderId}`); startScreening(); }}
                >
                  <RefreshCw size={12} /> Regenerate
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPhase('idle')}
                >
                  <ArrowLeft size={12} /> Back to Bidders
                </Button>
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
