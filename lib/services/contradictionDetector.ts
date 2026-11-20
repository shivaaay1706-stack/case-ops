/**
 * ContradictionDetector — evaluates declarative statements, groups by entity/event,
 * and flags direct discrepancies.
 * Deterministic rule-based: keyword + attribute matching, no LLM.
 */
import { Contradiction, Claim, EvidenceItem, TimelineEvent } from '../types';

export interface ExtractedClaim {
  statement: string;
  actor: string;
  evidenceId: string;
  pageOrTime: string;
  topicHint?: string; // e.g., "vehicle", "time", "location"
  attributes?: Record<string, string>; // normalized key/value pairs like {color: 'silver'}
}

export class ContradictionDetector {
  /**
   * Attribute-based contradiction detection.
   * For each topic (entity/attribute), collect all claims and compare normalized values.
   */
  detect(claims: ExtractedClaim[]): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const reported = new Set<string>();
    const byTopic = new Map<string, ExtractedClaim[]>();

    for (const c of claims) {
      const topic = c.topicHint || this.inferTopic(c.statement);
      if (!byTopic.has(topic)) byTopic.set(topic, []);
      byTopic.get(topic)!.push(c);
    }

    for (const [topic, group] of byTopic.entries()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const a = group[i];
          const b = group[j];
          const conflict = this.compare(a, b);
          if (conflict) {
            const values = [this.normalize(conflict.valueA), this.normalize(conflict.valueB)].sort();
            const signature = `${topic}|${conflict.attribute}|${values.join('|')}`;
            if (reported.has(signature)) continue;
            reported.add(signature);
            contradictions.push({
              id: `contra-${contradictions.length + 1}`,
              topic,
              severity: conflict.severity,
              claimA: {
                statement: a.statement,
                sourceEvidenceId: a.evidenceId,
                pageOrTime: a.pageOrTime,
                actor: a.actor,
              },
              claimB: {
                statement: b.statement,
                sourceEvidenceId: b.evidenceId,
                pageOrTime: b.pageOrTime,
                actor: b.actor,
              },
              explanation: conflict.explanation,
            });
          }
        }
      }
    }
    return contradictions;
  }

  private inferTopic(statement: string): string {
    const lower = statement.toLowerCase();
    if (/\b(car|vehicle|sedan|truck|auto)\b/.test(lower)) return 'Vehicle';
    if (/\b(time|clock|oclock|am|pm)\b/.test(lower)) return 'Time';
    if (/\b(location|place|street|address|scene)\b/.test(lower)) return 'Location';
    if (/\bdirection|east|west|north|south\b/.test(lower)) return 'Direction';
    if (/\bspeed\b/.test(lower)) return 'Speed';
    return 'General';
  }

  private compare(a: ExtractedClaim, b: ExtractedClaim): {
    attribute: string;
    valueA: string;
    valueB: string;
    severity: 'critical' | 'moderate' | 'minor';
    explanation: string;
  } | null {
    if (a.evidenceId === b.evidenceId && a.actor === b.actor) return null;

    // Direct textual contradiction if same topic but different normalized attribute values
    const attrA = a.attributes || this.extractAttributes(a.statement);
    const attrB = b.attributes || this.extractAttributes(b.statement);
    const keys = new Set([...Object.keys(attrA), ...Object.keys(attrB)]);
    for (const key of keys) {
      if (attrA[key] && attrB[key] && this.normalize(attrA[key]) !== this.normalize(attrB[key])) {
        if (key === 'time' && !this.hasSharedTimeContext(a.statement, b.statement)) continue;
        const severity: 'critical' | 'moderate' | 'minor' =
          key === 'color' || key === 'time' ? 'critical' : 'moderate';
        return {
          attribute: key,
          valueA: attrA[key],
          valueB: attrB[key],
          severity,
          explanation: `Discrepancy on "${key}": "${attrA[key]}" (source: ${a.actor}) vs "${attrB[key]}" (source: ${b.actor}).`,
        };
      }
    }
    return null;
  }

  private hasSharedTimeContext(a: string, b: string): boolean {
    const contextWords = ['impact', 'struck', 'collision', 'admission', 'arrived', 'arrival', 'occurred', 'service', 'judgment'];
    const lowerA = a.toLowerCase();
    const lowerB = b.toLowerCase();
    return contextWords.some((word) => lowerA.includes(word) && lowerB.includes(word));
  }

  private extractAttributes(text: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const colorMatch = text.match(/\b(silver|grey|gray|black|white|blue|red|green|yellow)\b/i);
    if (colorMatch) attrs.color = colorMatch[1].toLowerCase();
    const dirMatch = text.match(/\b(east|west|north|south|uphill|downhill)\b/i);
    if (dirMatch) attrs.direction = dirMatch[1].toLowerCase();
    const timeMatch = text.match(/\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\b/i);
    if (timeMatch) attrs.time = timeMatch[1];
    return attrs;
  }

  private normalize(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
}