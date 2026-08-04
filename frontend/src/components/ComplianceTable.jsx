import React from 'react';
import { CheckCircle2, XCircle, MinusCircle, AlertTriangle, HelpCircle } from 'lucide-react';

const VERDICT_CONFIG = {
  verified: { label: 'Verified', icon: CheckCircle2, color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
  partial:  { label: 'Partial',  icon: MinusCircle,  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  missing:  { label: 'Missing',  icon: XCircle,      color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
};

function getVerdict(req) {
  const c = req.confidence ?? 0;
  if (c >= 0.50) return VERDICT_CONFIG.verified;
  if (c >= 0.35) return VERDICT_CONFIG.partial;
  return VERDICT_CONFIG.missing;
}

function ConfidenceBar({ value = 0 }) {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold w-8 text-right shrink-0" style={{ color }}>{pct}%</span>
    </div>
  );
}

function VerdictBadge({ req }) {
  const cfg = getVerdict(req);
  const label = cfg.label || (req.detected ? 'Detected' : 'Missing');
  const Icon = cfg.icon || (req.detected ? CheckCircle2 : XCircle);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold shrink-0"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      <Icon size={10} /> {label}
    </span>
  );
}

const ComplianceTable = ({ requirements = [], redFlags = [] }) => {
  if (requirements.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center"
        style={{ background: '#fff', border: '1px solid #f1f5f9' }}>
        <HelpCircle size={28} className="mx-auto mb-2" style={{ color: '#e2e8f0' }} />
        <p className="text-sm font-semibold text-[#94a3b8]">AI scoring in progress…</p>
        <p className="text-xs text-[#cbd5e1] mt-1">Results will appear shortly after the document is processed.</p>
      </div>
    );
  }

  const mandatory = requirements.filter(r => r.is_mandatory);
  const scored    = requirements.filter(r => !r.is_mandatory);
  const totalEarned   = scored.reduce((s, r) => s + (r.points_earned   ?? 0), 0);
  const totalPossible = scored.reduce((s, r) => s + (r.points_possible ?? 0), 0);
  const mandatoryPassed = mandatory.filter(r => r.detected).length;

  return (
    <div className="space-y-4">

      {/* Mandatory requirements */}
      {mandatory.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid #fecaca', boxShadow: '0 2px 8px rgba(239,68,68,0.06)' }}>
          <div className="flex items-center justify-between px-5 py-3.5"
            style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} style={{ color: '#ef4444' }} />
              <span className="text-xs font-bold uppercase tracking-widest text-red-600">Mandatory Requirements</span>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
              style={{ background: '#fff', color: mandatoryPassed === mandatory.length ? '#10b981' : '#ef4444' }}>
              {mandatoryPassed}/{mandatory.length} passed
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: '#fef2f2' }}>
            {mandatory.map((req) => {
              const label = req.display_label || req.requirement_name.replace(/_/g, ' ');
              const passed = req.detected;
              return (
                <div key={req.id || req.requirement_name}
                  className="flex items-center justify-between px-5 py-3.5 gap-4"
                  style={{ background: passed ? 'transparent' : 'rgba(254,242,242,0.4)' }}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {passed
                      ? <CheckCircle2 size={15} className="shrink-0" style={{ color: '#10b981' }} />
                      : <XCircle size={15} className="shrink-0" style={{ color: '#ef4444' }} />}
                    <span className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>{label}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <ConfidenceBar value={req.confidence} />
                    <VerdictBadge req={req} />
                    <span className="text-[10px] font-bold w-14 text-right" style={{ color: '#94a3b8' }}>Required</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scored requirements */}
      {scored.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          <div className="flex items-center justify-between px-5 py-3.5"
            style={{ background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
            <span className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">Scored Requirements</span>
            <span className="text-xs font-bold" style={{ color: '#7c3aed' }}>{totalEarned}/{totalPossible} pts total</span>
          </div>
          <div className="divide-y" style={{ borderColor: '#f8fafc' }}>
            {scored.map((req) => {
              const label = req.display_label || req.requirement_name.replace(/_/g, ' ');
              const earned = req.points_earned ?? 0;
              const possible = req.points_possible ?? 0;
              const ptColor = earned > 0 ? (earned === possible ? '#10b981' : '#f59e0b') : '#94a3b8';
              return (
                <div key={req.id || req.requirement_name}
                  className="flex items-center justify-between px-5 py-3.5 gap-4 transition-colors"
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span className="text-sm font-medium truncate min-w-0 flex-1" style={{ color: '#0f172a' }}>{label}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <ConfidenceBar value={req.confidence} />
                    <VerdictBadge req={req} />
                    <span className="text-sm font-bold w-16 text-right" style={{ color: ptColor }}>
                      {earned}/{possible} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Red flags */}
      {redFlags && redFlags.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid #fecaca', boxShadow: '0 2px 8px rgba(239,68,68,0.06)' }}>
          <div className="flex items-center gap-2 px-5 py-3.5"
            style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
            <AlertTriangle size={13} style={{ color: '#ef4444' }} />
            <span className="text-xs font-bold uppercase tracking-widest text-red-600">Red Flags Detected</span>
            <span className="ml-auto px-2 py-0.5 rounded-lg text-[10px] font-bold"
              style={{ background: '#fff', color: '#ef4444' }}>{redFlags.length}</span>
          </div>
          <div className="divide-y" style={{ borderColor: '#fef2f2' }}>
            {redFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                <XCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                <span className="text-sm font-medium" style={{ color: '#0f172a' }}>{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceTable;
