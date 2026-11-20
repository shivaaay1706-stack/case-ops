/**
 * CASE-OPS: The Evidentiary Ingestion, De-Noising & Chronology Engine
 * Strongly typed schemas for all entities.
 * Enforces zero-inference source attribution: every claim carries a raw source reference.
 */

export type EvidenceType = 'pdf' | 'scanned_image' | 'whatsapp' | 'audio';

export interface SourceReference {
  pageNumber?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  audioTimestampSeconds?: number;
  rawSnippet: string; // mandatory — the literal text/timestamp from source
}

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  fileName: string;
  fileUrl: string;
  rawText: string;
  metadata: {
    dateUploaded: string;
    author?: string;
    originalDate?: string;
    ocrConfidence?: number;
  };
}

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO date/time or normalized string
  title: string;
  description: string;
  actor: string;
  evidenceId: string;
  sourceReference: SourceReference;
  entityTags?: string[];
  location?: string;
  contradictionId?: string;
}

export interface Claim {
  statement: string;
  sourceEvidenceId: string;
  pageOrTime: string;
  actor: string;
}

export interface Contradiction {
  id: string;
  topic: string;
  severity: 'critical' | 'moderate' | 'minor';
  claimA: Claim;
  claimB: Claim;
  explanation: string;
}

export interface LegalDeadline {
  id: string;
  ruleName: string;
  triggerEvent: string;
  triggerDate: string;
  daysAllowed: number;
  dueDate: string;
  status: 'pending' | 'urgent' | 'expired';
  sourceEvidenceId: string;
}

export interface CaseDocket {
  caseId: string;
  caseTitle: string;
  status: 'active' | 'closed';
  evidence: EvidenceItem[];
  timeline: TimelineEvent[];
  contradictions: Contradiction[];
  deadlines: LegalDeadline[];
}

// --- War Room OS additions ---

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  category: 'PARSE' | 'MATCH' | 'NLI' | 'BOUNDING' | 'USER' | 'OCR';
  message: string;
  detail?: string;
}

export interface RoutePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'origin' | 'destination' | 'transit' | 'witness';
}

export interface AudioSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

// Zod-equivalent runtime validators (lightweight, no external dep)
export const parseEvidence = (obj: unknown): EvidenceItem => {
  const o = obj as Record<string, unknown>;
  if (!o?.id || !o?.type || !o?.fileName) throw new Error('Invalid EvidenceItem');
  return obj as EvidenceItem;
};

export const parseTimelineEvent = (obj: unknown): TimelineEvent => {
  const o = obj as Record<string, unknown>;
  const src = o?.sourceReference as Record<string, unknown> | undefined;
  if (!o?.id || !o?.timestamp || !o?.evidenceId || !src?.rawSnippet) {
    throw new Error('Invalid TimelineEvent - missing source attribution');
  }
  return obj as TimelineEvent;
};

export const parseContradiction = (obj: unknown): Contradiction => {
  const o = obj as Record<string, unknown>;
  const a = o?.claimA as Record<string, unknown> | undefined;
  const b = o?.claimB as Record<string, unknown> | undefined;
  if (!a?.statement || !b?.statement) throw new Error('Invalid Contradiction');
  return obj as Contradiction;
};

export const parseDeadline = (obj: unknown): LegalDeadline => {
  const o = obj as Record<string, unknown>;
  if (!o?.triggerDate || o?.daysAllowed == null) throw new Error('Invalid LegalDeadline');
  return obj as LegalDeadline;
};