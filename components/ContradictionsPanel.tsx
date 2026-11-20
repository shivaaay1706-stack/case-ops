'use client';

import useCaseOpsStore from '@/lib/store';
import { Contradiction, Claim } from '@/lib/types';

export function ContradictionsPanel() {
  const { getFilteredContradictions, setActiveEvidence, setHighlight } = useCaseOpsStore();
  const contradictions = getFilteredContradictions();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wide">
          {contradictions.length} contradiction{contradictions.length !== 1 ? 's' : ''} detected
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {contradictions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[var(--muted)]">
            <p className="text-center">No contradictions detected.<br /><span className="text-xs">Upload evidence with conflicting accounts to see them here.</span></p>
          </div>
        ) : (
          contradictions.map((contra: Contradiction) => (
            <ContradictionCard key={contra.id} contra={contra} onClick={() => {
              setActiveEvidence(contra.claimA.sourceEvidenceId);
              setHighlight({ rawSnippet: contra.claimA.statement });
            }} />
          ))
        )}
      </div>
    </div>
  );
}

function ContradictionCard({ contra, onClick }: { contra: Contradiction; onClick: () => void }) {
  const severityColors: Record<Contradiction['severity'], string> = {
    critical: 'bg-[var(--danger)]/20 border-[var(--danger)]/30 text-[var(--danger)]',
    moderate: 'bg-[var(--warning)]/20 border-[var(--warning)]/30 text-[var(--warning)]',
    minor: 'bg-[var(--muted)]/20 border-[var(--muted)]/30 text-[var(--muted)]',
  };

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${severityColors[contra.severity]} hover:shadow-lg hover:shadow-[var(--accent)]/10`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${severityColors[contra.severity]}`}>
          {contra.severity.toUpperCase()}
        </span>
        <span className="text-xs text-[var(--muted)]">{contra.topic}</span>
      </div>
      <p className="text-sm mb-3">{contra.explanation}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <ClaimBadge claim={contra.claimA} label="Claim A" />
        <ClaimBadge claim={contra.claimB} label="Claim B" />
      </div>
    </div>
  );
}

function ClaimBadge({ claim, label }: { claim: Claim; label: string }) {
  return (
    <div className="p-2 bg-[var(--bg)] rounded border border-[var(--border)]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
        <span className="text-xs text-[var(--muted)]">{claim.actor}</span>
      </div>
      <p className="text-sm line-clamp-2">{claim.statement}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
        <span>{claim.pageOrTime}</span>
        <span>src: {claim.sourceEvidenceId.slice(0, 8)}...</span>
      </div>
    </div>
  );
}