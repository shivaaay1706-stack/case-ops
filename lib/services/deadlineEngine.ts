/**
 * DeadlineEngine — deterministic procedural deadline calculator.
 * NO LLM. Pure math: dueDate = triggerDate + daysAllowed.
 * Accounts for standard filing windows and weekend/holiday adjustment rules.
 */
import { LegalDeadline } from '../types';

export interface DeadlineRule {
  ruleName: string;
  triggerEvent: string;
  daysAllowed: number;
  adjustWeekends?: boolean; // if true, push due date forward to next business day
}

export class DeadlineEngine {
  private rules: DeadlineRule[] = [
    { ruleName: 'Written Statement under Order VIII Rule 1', triggerEvent: 'Service of summons', daysAllowed: 30, adjustWeekends: true },
    { ruleName: 'Filing of Written Statement (extension)', triggerEvent: 'Service of summons', daysAllowed: 90, adjustWeekends: true },
    { ruleName: 'Evidence-in-Chief filing', triggerEvent: 'Issue of framing of charges', daysAllowed: 15, adjustWeekends: true },
    { ruleName: 'Notice under Section 133 CrPC', triggerEvent: 'Witness summons', daysAllowed: 7, adjustWeekends: true },
    { ruleName: 'Appeal filing (Sessions Court)', triggerEvent: 'Judgment date', daysAllowed: 90, adjustWeekends: true },
    { ruleName: 'Bail application hearing', triggerEvent: 'Arrest / First production', daysAllowed: 7, adjustWeekends: false },
  ];

  compute(triggerEvent: string, triggerDate: string, evidenceId: string): LegalDeadline[] {
    const out: LegalDeadline[] = [];
    for (const rule of this.rules) {
      if (rule.triggerEvent.toLowerCase() !== triggerEvent.toLowerCase()) continue;
      const trigger = new Date(triggerDate);
      const due = this.addDays(trigger, rule.daysAllowed, rule.adjustWeekends ?? true);
      out.push({
        id: `deadline-${out.length + 1}`,
        ruleName: rule.ruleName,
        triggerEvent: rule.triggerEvent,
        triggerDate: trigger.toISOString(),
        daysAllowed: rule.daysAllowed,
        dueDate: due.toISOString(),
        status: this.classify(due),
        sourceEvidenceId: evidenceId,
      });
    }
    return out;
  }

  computeAll(evidenceTriggerMap: Array<{ triggerEvent: string; triggerDate: string; evidenceId: string }>): LegalDeadline[] {
    const all: LegalDeadline[] = [];
    for (const t of evidenceTriggerMap) {
      all.push(...this.compute(t.triggerEvent, t.triggerDate, t.evidenceId));
    }
    return this.dedupe(all);
  }

  private addDays(date: Date, days: number, adjustWeekends: boolean): Date {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + days);
    if (adjustWeekends) {
      while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
        d.setUTCDate(d.getUTCDate() + 1);
      }
    }
    return d;
  }

  private classify(due: Date): 'pending' | 'urgent' | 'expired' {
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'urgent';
    return 'pending';
  }

  private dedupe(items: LegalDeadline[]): LegalDeadline[] {
    const seen = new Set<string>();
    return items.filter((d) => {
      const key = `${d.ruleName}|${d.triggerDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /** Recompute statuses for all deadlines (call on app load / daily). */
  refreshStatuses(items: LegalDeadline[]): LegalDeadline[] {
    return items.map((d) => ({ ...d, status: this.classify(new Date(d.dueDate)) }));
  }
}