'use client';

import useCaseOpsStore from '@/lib/store';
import { LegalDeadline } from '@/lib/types';

export function DeadlinesPanel() {
  const { getFilteredDeadlines, setActiveEvidence, setHighlight } = useCaseOpsStore();
  const deadlines = getFilteredDeadlines();

  const sorted = [...deadlines].sort((a: LegalDeadline, b: LegalDeadline) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wide">
          {deadlines.length} deadline{deadlines.length !== 1 ? 's' : ''} calculated
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sorted.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[var(--muted)]">
            <p className="text-center">No deadlines calculated.<br /><span className="text-xs">Set trigger events in evidence to compute procedural deadlines.</span></p>
          </div>
        ) : (
          sorted.map((dl) => (
            <DeadlineCard key={dl.id} deadline={dl} onClick={() => {
              setActiveEvidence(dl.sourceEvidenceId);
              setHighlight({ rawSnippet: `${dl.triggerEvent} — ${dl.triggerDate}` });
            }} />
          ))
        )}
      </div>
    </div>
  );
}

function DeadlineCard({ deadline, onClick }: { deadline: LegalDeadline; onClick: () => void }) {
  const dueDate = new Date(deadline.dueDate);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;
  const isUrgent = diffDays <= 3 && diffDays >= 0;

  const statusColors: Record<LegalDeadline['status'], string> = {
    expired: 'bg-[var(--danger)]/20 border-[var(--danger)]/30 text-[var(--danger)]',
    urgent: 'bg-[var(--warning)]/20 border-[var(--warning)]/30 text-[var(--warning)]',
    pending: 'bg-[var(--success)]/20 border-[var(--success)]/30 text-[var(--success)]',
  };

  const formatDate = (date: Date) => date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${statusColors[deadline.status]} hover:shadow-lg hover:shadow-[var(--accent)]/10`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="font-medium text-sm">{deadline.ruleName}</h4>
          <p className="text-xs text-[var(--muted)]">Trigger: {deadline.triggerEvent}</p>
        </div>
        <div className="text-right">
          <div className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[deadline.status]}`}>
            {deadline.status.toUpperCase()}
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">{formatDate(dueDate)}</div>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--muted)]">
          {isOverdue ? `${Math.abs(diffDays)} days overdue` : isUrgent ? `${diffDays} days remaining` : `${diffDays} days until due`}
        </span>
        <span className="text-xs text-[var(--muted)]">
          {deadline.daysAllowed} days from trigger
        </span>
      </div>
      <div className="mt-2 pt-2 border-t border-[var(--border)]/50 flex items-center justify-between text-xs text-[var(--muted)]">
        <span>Source: {deadline.sourceEvidenceId}</span>
        <span>Triggered: {formatDate(new Date(deadline.triggerDate))}</span>
      </div>
    </div>
  );
}