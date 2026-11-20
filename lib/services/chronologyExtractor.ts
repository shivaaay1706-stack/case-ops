/**
 * ChronologyExtractor â€” extracts temporal entities from raw text, resolves
 * relative dates, and orders events sequentially.
 * Deterministic: no LLM, no hallucinated dates.
 */
import { TimelineEvent, EvidenceItem, SourceReference } from '../types';

export interface ExtractedMention {
  text: string;
  start: number;
  end: number;
  kind: 'time' | 'date' | 'relative';
  resolved?: string; // ISO date/time
}

export interface ChronologyOptions {
  baseDate?: string; // ISO date used to resolve relative dates like "yesterday"
  actor?: string;
}

export class ChronologyExtractor {
  private datePatterns: RegExp[] = [
    /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/g,
    /\b(\d{4}-\d{2}-\d{2})\b/g,
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/gi,
  ];

  private timePatterns: RegExp[] = [
    /\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\b/g,
    /\b(\d{1,2}:\d{2})\b/g,
  ];

  private relativePatterns: RegExp[] = [
    /\byesterday\b/gi,
    /\btoday\b/gi,
    /\btomorrow\b/gi,
    /\blast\s+night\b/gi,
    /\bthis\s+morning\b/gi,
    /\bthis\sevening\b/gi,
  ];

  extract(text: string, opts: ChronologyOptions = {}): ExtractedMention[] {
    const mentions: ExtractedMention[] = [];
    const base = opts.baseDate ? new Date(opts.baseDate) : new Date();

    for (const re of this.datePatterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const candidate = m[1] || m[0];
        const resolved = this.resolveDate(candidate);
        if (resolved) {
          mentions.push({ text: m[1], start: m.index, end: m.index + m[0].length, kind: 'date', resolved });
        }
      }
    }

    for (const re of this.timePatterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        mentions.push({ text: m[1], start: m.index, end: m.index + m[0].length, kind: 'time' });
      }
    }

    for (const re of this.relativePatterns) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const candidate = m[1] || m[0];
        const resolved = this.resolveRelative(candidate, base);
        if (resolved) {
          mentions.push({ text: m[0], start: m.index, end: m.index + m[0].length, kind: 'relative', resolved });
        }
      }
    }

    return mentions.sort((a, b) => (a.resolved && b.resolved ? a.resolved.localeCompare(b.resolved) : 0));
  }

  private resolveDate(s: string): string | null {
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const isoDate = new Date(`${s}T00:00:00.000Z`);
      return isNaN(isoDate.getTime()) ? null : isoDate.toISOString();
    }

    if (/^[A-Za-z]/.test(s)) {
      const writtenDate = new Date(s);
      return isNaN(writtenDate.getTime()) ? null : writtenDate.toISOString();
    }

    const parts = s.split(/[-/]/);
    if (parts.length !== 3) return null;
    const [a, b, c] = parts;
    let year: number;
    if (c.length === 2) year = parseInt(c, 10) + 2000;
    else if (c.length === 4) year = parseInt(c, 10);
    else return null;
    // assume DD/MM/YY
    const day = parseInt(a, 10);
    const month = parseInt(b, 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const dt = new Date(Date.UTC(year, month - 1, day));
    return isNaN(dt.getTime()) ? null : dt.toISOString();
  }

  private resolveRelative(s: string, base: Date): string | null {
    if (!s) return null;
    const d = new Date(base);
    const lower = s.toLowerCase().trim();
    if (lower === 'yesterday') d.setUTCDate(d.getUTCDate() - 1);
    else if (lower === 'tomorrow') d.setUTCDate(d.getUTCDate() + 1);
    else if (lower === 'today') { /* same */ }
    else if (lower === 'last night') d.setUTCDate(d.getUTCDate() - 1);
    else if (lower === 'this morning') d.setUTCHours(8, 0, 0, 0);
    else if (lower === 'this evening') d.setUTCHours(20, 0, 0, 0);
    else return null;
    return d.toISOString();
  }

  /**
   * Build timeline events from a list of (snippet, timestamp, actor, evidenceId, sourceRef).
   * The caller supplies the extracted temporal anchor; this orders them chronologically.
   */
  buildTimeline(events: Omit<TimelineEvent, 'id'>[]): TimelineEvent[] {
    return events
      .map((e, i) => ({ ...e, id: `evt-${i + 1}` }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
}
