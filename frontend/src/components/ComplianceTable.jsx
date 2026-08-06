import React from 'react';
import { CheckCircle2, XCircle, MinusCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

const VERDICT_CONFIG = {
  verified: { label: 'Verified', icon: CheckCircle2, variant: 'success' },
  partial: { label: 'Partial', icon: MinusCircle, variant: 'warning' },
  missing: { label: 'Missing', icon: XCircle, variant: 'destructive' },
};

function getVerdict(req) {
  const c = req.confidence ?? 0;
  if (c >= 0.50) return VERDICT_CONFIG.verified;
  if (c >= 0.35) return VERDICT_CONFIG.partial;
  return VERDICT_CONFIG.missing;
}

function ConfidenceBar({ value = 0 }) {
  const pct = Math.round((value || 0) * 100);
  const tone = pct >= 80 ? 'bg-success text-success' : pct >= 50 ? 'bg-warning text-warning' : 'bg-destructive text-destructive';
  const [barTone, textTone] = tone.split(' ');
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
        <div className={cn('h-full rounded-full transition-all duration-700', barTone)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('text-[10px] font-bold w-8 text-right shrink-0', textTone)}>{pct}%</span>
    </div>
  );
}

function VerdictBadge({ req }) {
  const cfg = getVerdict(req);
  const label = cfg.label || (req.detected ? 'Detected' : 'Missing');
  const Icon = cfg.icon || (req.detected ? CheckCircle2 : XCircle);
  return (
    <Badge variant={cfg.variant} className="shrink-0">
      <Icon size={10} /> {label}
    </Badge>
  );
}

const ComplianceTable = ({ requirements = [], redFlags = [] }) => {
  if (requirements.length === 0) {
    return (
      <div className="rounded-xl p-10 text-center bg-card border border-border">
        <HelpCircle size={28} className="mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-sm font-semibold text-muted-foreground">AI scoring in progress…</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Results will appear shortly after the document is processed.</p>
      </div>
    );
  }

  const mandatory = requirements.filter(r => r.is_mandatory);
  const scored = requirements.filter(r => !r.is_mandatory);
  const totalEarned = scored.reduce((s, r) => s + (r.points_earned ?? 0), 0);
  const totalPossible = scored.reduce((s, r) => s + (r.points_possible ?? 0), 0);
  const mandatoryPassed = mandatory.filter(r => r.detected).length;

  return (
    <div className="space-y-4">

      {/* Mandatory requirements */}
      {mandatory.length > 0 && (
        <div className="rounded-xl overflow-hidden bg-card border border-destructive/25 shadow-sm">
          <div className="flex items-center justify-between px-5 py-3.5 bg-destructive/10 border-b border-destructive/25">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} className="text-destructive" />
              <span className="text-xs font-bold uppercase tracking-widest text-destructive">Mandatory Requirements</span>
            </div>
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-lg bg-card', mandatoryPassed === mandatory.length ? 'text-success' : 'text-destructive')}>
              {mandatoryPassed}/{mandatory.length} passed
            </span>
          </div>
          <div className="divide-y divide-destructive/10">
            {mandatory.map((req) => {
              const label = req.display_label || req.requirement_name.replace(/_/g, ' ');
              const passed = req.detected;
              return (
                <div key={req.id || req.requirement_name}
                  className={cn('flex items-center justify-between px-5 py-3.5 gap-4', !passed && 'bg-destructive/5')}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {passed
                      ? <CheckCircle2 size={15} className="shrink-0 text-success" />
                      : <XCircle size={15} className="shrink-0 text-destructive" />}
                    <span className="text-sm font-semibold truncate text-foreground">{label}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <ConfidenceBar value={req.confidence} />
                    <VerdictBadge req={req} />
                    <span className="text-[10px] font-bold w-14 text-right text-muted-foreground">Required</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scored requirements */}
      {scored.length > 0 && (
        <div className="rounded-xl overflow-hidden bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-3.5 bg-muted/30 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Scored Requirements</span>
            <span className="text-xs font-bold text-primary">{totalEarned}/{totalPossible} pts total</span>
          </div>
          <div className="divide-y divide-border">
            {scored.map((req) => {
              const label = req.display_label || req.requirement_name.replace(/_/g, ' ');
              const earned = req.points_earned ?? 0;
              const possible = req.points_possible ?? 0;
              const ptTone = earned > 0 ? (earned === possible ? 'text-success' : 'text-warning') : 'text-muted-foreground';
              return (
                <div key={req.id || req.requirement_name}
                  className="flex items-center justify-between px-5 py-3.5 gap-4 transition-colors hover:bg-accent/50">
                  <span className="text-sm font-medium truncate min-w-0 flex-1 text-foreground">{label}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <ConfidenceBar value={req.confidence} />
                    <VerdictBadge req={req} />
                    <span className={cn('text-sm font-bold w-16 text-right', ptTone)}>
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
        <div className="rounded-xl overflow-hidden bg-card border border-destructive/25 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-3.5 bg-destructive/10 border-b border-destructive/25">
            <AlertTriangle size={13} className="text-destructive" />
            <span className="text-xs font-bold uppercase tracking-widest text-destructive">Red Flags Detected</span>
            <span className="ml-auto px-2 py-0.5 rounded-lg text-[10px] font-bold bg-card text-destructive">{redFlags.length}</span>
          </div>
          <div className="divide-y divide-destructive/10">
            {redFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                <XCircle size={14} className="shrink-0 mt-0.5 text-destructive" />
                <span className="text-sm font-medium text-foreground">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceTable;
