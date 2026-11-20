/**
 * CASE-OPS state management with Zustand.
 * Matte-Obsidian & Plum Bento UI state + demo seed + click-to-proof linking.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EvidenceItem,
  TimelineEvent,
  Contradiction,
  LegalDeadline,
  CaseDocket,
  SourceReference,
  AuditLogEntry,
  RoutePoint,
  AudioSegment,
} from './types';

export type NavView = 'overview' | 'intake' | 'timeline' | 'contradictions' | 'deadlines' | 'audit' | 'settings';
export type WorkspaceFilter = 'all' | 'timeline' | 'contradictions' | 'deadlines';
export type ProofMode = 'chronology' | 'receipt' | 'audio' | 'diff';
// compatibility alias
export type WarRoomTab = 'ingestion' | 'time-map' | 'contradictions' | 'deadlines';

interface CaseOpsState {
  docket: CaseDocket | null;
  setDocket: (docket: CaseDocket) => void;
  clearDocket: () => void;

  navView: NavView;
  setNavView: (v: NavView) => void;
  workspaceFilter: WorkspaceFilter;
  setWorkspaceFilter: (v: WorkspaceFilter) => void;
  proofMode: ProofMode;
  setProofMode: (v: ProofMode) => void;

  activeTab: WarRoomTab;
  setActiveTab: (tab: WarRoomTab) => void;

  activeEvidenceId: string | null;
  selectedEvidenceId: string | null;
  setActiveEvidence: (id: string | null) => void;
  activeEvidence: EvidenceItem | null;

  activeTimelineId: string | null;
  setActiveTimeline: (id: string | null) => void;
  activeTimeline: TimelineEvent | null;

  activeContradictionId: string | null;
  setActiveContradiction: (id: string | null) => void;

  highlight: SourceReference | null;
  activeBoundingBox: { x: number; y: number; width: number; height: number } | null;
  activeAudioTimestamp: number | null;
  setHighlight: (ref: SourceReference | null) => void;

  filterActor: string | null;
  setFilterActor: (actor: string | null) => void;
  filterDateRange: { from?: string; to?: string } | null;
  setFilterDateRange: (range: { from?: string; to?: string } | null) => void;
  onlyContradictions: boolean;
  setOnlyContradictions: (v: boolean) => void;

  auditLog: AuditLogEntry[];
  flowLog: AuditLogEntry[];
  routePoints: RoutePoint[];
  audioSegmentsByEvidence: Record<string, AudioSegment[]>;
  appendAudit: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  appendFlow: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;

  autoSync: boolean;
  setAutoSync: (v: boolean) => void;
  uploaderOpen: boolean;
  setUploaderOpen: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  selectProof: (opts: {
    evidenceId?: string | null;
    timelineId?: string | null;
    contradictionId?: string | null;
    highlight?: SourceReference | null;
    audioTimestamp?: number | null;
    auditMessage?: string;
  }) => void;

  initDemo: () => void;
  getFilteredTimeline: () => TimelineEvent[];
  getFilteredContradictions: () => Contradiction[];
  getFilteredDeadlines: () => LegalDeadline[];
}

const nowIso = () => new Date().toISOString();
let seq = 0;
const nextId = (p: string) => `${p}-${++seq}-${Math.random().toString(36).slice(2, 6)}`;

const demoAudioSegments: AudioSegment[] = [
  { id: 1, start: 0, end: 20, text: 'Interview begins. Witness states initial observations.', speaker: 'Interviewer' },
  { id: 2, start: 20, end: 52, text: 'I was near Maple Avenue when I heard tires screech.', speaker: 'Witness B' },
  { id: 3, start: 52, end: 84, text: 'Witness Statement: "...red sedan speeding... wait no..."', speaker: 'Witness B' },
  { id: 4, start: 84, end: 110, text: 'It might have been silver. It happened very fast.', speaker: 'Witness B' },
  { id: 5, start: 110, end: 145, text: 'Time of sighting estimated around 10:57 AM.', speaker: 'Witness B' },
];

const buildDemoDocket = (): { docket: CaseDocket; routePoints: RoutePoint[]; audioSegmentsByEvidence: Record<string, AudioSegment[]>; auditLog: AuditLogEntry[]; flowLog: AuditLogEntry[] } => {
  const evidence: EvidenceItem[] = [
    {
      id: 'ev-police-report',
      type: 'pdf',
      fileName: 'Police_Report_May4.pdf',
      fileUrl: '',
      rawText: [
        'INCIDENT REPORT - STATE vs. ALEX MILLER',
        'Docket: NY-2026-CR  |  Date: May 04, 2026',
        '23:45 PM - Patrol unit dispatched to industrial warehouse district.',
        'Witness reports observing a dark SUV departing warehouse bay at 23:45 PM.',
        'Statement logged (p.4): "Subject Alex Miller observed entering a diner on 8th Ave at 23:30 PM."',
        'Cross-reference note: Vehicle sighting conflicts with diner alibi window.',
        'OCR confidence 98.4%. Coordinates [x:142, y:310] tagged for receipt verification.',
      ].join('\n'),
      metadata: { dateUploaded: '2026-05-04T12:00:00Z', author: 'Officer Hale', originalDate: '2026-05-04T23:45:00Z', ocrConfidence: 98.4 },
    },
    {
      id: 'ev-whatsapp',
      type: 'whatsapp',
      fileName: 'chat_export_miller.txt',
      fileUrl: '',
      rawText: [
        '[04/05/2026, 10:10 PM] Alex Miller: Leaving now, heading to meet you.',
        '[04/05/2026, 11:20 PM] Alex Miller: Still nearby, traffic is bad.',
        '[04/05/2026, 11:40 PM] Contact: Are you at the warehouse?',
      ].join('\n'),
      metadata: { dateUploaded: '2026-05-05T09:00:00Z', originalDate: '2026-05-04T22:10:00Z' },
    },
    {
      id: 'ev-audio',
      type: 'audio',
      fileName: 'Voice_Memo_WitnessB.wav',
      fileUrl: '',
      rawText: demoAudioSegments.map((s) => `[${s.start.toFixed(1)}s] ${s.text}`).join('\n'),
      metadata: { dateUploaded: '2026-05-04T13:00:00Z', author: 'Witness B', originalDate: '2026-05-04T23:50:00Z' },
    },
    {
      id: 'ev-fir',
      type: 'scanned_image',
      fileName: 'FIR_Scan_01.jpg',
      fileUrl: '',
      rawText: 'FIR scan extract: Complaint registered May 04. Alleged SUV sighting near warehouse perimeter.',
      metadata: { dateUploaded: '2026-05-04T14:00:00Z', ocrConfidence: 98.4 },
    },
  ];

  const contradictions: Contradiction[] = [
    {
      id: 'C-003',
      topic: 'Diner Alibi vs SUV Sighting',
      severity: 'critical',
      claimA: { statement: 'Subject Alex Miller observed entering a diner on 8th Ave at 23:30 PM.', sourceEvidenceId: 'ev-police-report', pageOrTime: 'Police_Report_May4.pdf p.4', actor: 'Officer Hale' },
      claimB: { statement: 'Witness reports observing a dark SUV departing warehouse bay at 23:45 PM.', sourceEvidenceId: 'ev-police-report', pageOrTime: 'Police_Report_May4.pdf p.4', actor: 'Witness' },
      explanation: 'Conflict: diner alibi at 23:30 PM cannot co-exist with warehouse SUV sighting at 23:45 PM without implausible transit.',
    },
    { id: 'C-001', topic: 'Vehicle color', severity: 'moderate', claimA: { statement: 'Silver sedan reported.', sourceEvidenceId: 'ev-police-report', pageOrTime: 'p.2', actor: 'Officer Hale' }, claimB: { statement: '"...red sedan speeding... wait no..."', sourceEvidenceId: 'ev-audio', pageOrTime: '01:24', actor: 'Witness B' }, explanation: 'Color attribution inconsistent across sources.' },
    { id: 'C-002', topic: 'Departure timing', severity: 'minor', claimA: { statement: 'Leaving now (22:10).', sourceEvidenceId: 'ev-whatsapp', pageOrTime: 'msg 1', actor: 'Alex Miller' }, claimB: { statement: 'Observed departing warehouse 23:45 PM.', sourceEvidenceId: 'ev-police-report', pageOrTime: 'p.4', actor: 'Witness' }, explanation: 'Minor offset in reported departure timeline.' },
  ];

  const timeline: TimelineEvent[] = [
    { id: 'evt-1', timestamp: '2026-05-04T22:10:00Z', title: 'Departure Message Sent', description: 'Alex Miller states leaving to meet contact.', actor: 'Alex Miller', evidenceId: 'ev-whatsapp', entityTags: ['Alex Miller'], sourceReference: { rawSnippet: '[04/05/2026, 10:10 PM] Alex Miller: Leaving now, heading to meet you.' } },
    { id: 'evt-2', timestamp: '2026-05-04T23:30:00Z', title: 'Diner Alibi Claim', description: 'Report notes subject entering diner on 8th Ave.', actor: 'Officer Hale', evidenceId: 'ev-police-report', entityTags: ['Alex Miller'], sourceReference: { pageNumber: 4, boundingBox: { x: 142, y: 310, width: 420, height: 28 }, rawSnippet: 'Statement logged (p.4): "Subject Alex Miller observed entering a diner on 8th Ave at 23:30 PM."' } },
    { id: 'evt-3', timestamp: '2026-05-04T23:45:00Z', title: 'Warehouse SUV Sighting', description: 'Witness reports dark SUV departing warehouse bay.', actor: 'Witness', evidenceId: 'ev-police-report', entityTags: ['SUV', 'Warehouse'], contradictionId: 'C-003', sourceReference: { pageNumber: 4, boundingBox: { x: 142, y: 310, width: 420, height: 28 }, rawSnippet: 'Witness reports observing a dark SUV departing warehouse bay at 23:45 PM.' } },
    { id: 'evt-4', timestamp: '2026-05-04T23:50:00Z', title: 'Witness Audio Memo Logged', description: 'Witness B audio note captured with partial vehicle description.', actor: 'Witness B', evidenceId: 'ev-audio', entityTags: ['Witness B'], sourceReference: { audioTimestampSeconds: 84, rawSnippet: 'Witness Statement: "...red sedan speeding... wait no..."' } },
    { id: 'evt-5', timestamp: '2026-05-05T09:00:00Z', title: 'FIR Scan Indexed', description: 'Scanned FIR ingested and OCR verified.', actor: 'System', evidenceId: 'ev-fir', entityTags: ['OCR'], sourceReference: { rawSnippet: 'FIR scan extract: Complaint registered May 04. Alleged SUV sighting near warehouse perimeter.' } },
  ];

  const deadlines: LegalDeadline[] = [
    { id: 'dl-appeal', ruleName: 'Section 14 Appeal Window', triggerEvent: 'Judgment date', triggerDate: '2026-11-01T00:00:00Z', daysAllowed: 30, dueDate: '2026-11-25T00:00:00Z', status: 'urgent', sourceEvidenceId: 'ev-police-report' },
    { id: 'dl-transcript', ruleName: 'Transcript Filing Cutoff', triggerEvent: 'Hearing date', triggerDate: '2026-11-01T00:00:00Z', daysAllowed: 45, dueDate: '2026-12-11T00:00:00Z', status: 'pending', sourceEvidenceId: 'ev-fir' },
  ];

  const routePoints: RoutePoint[] = [
    { id: 'p-a', name: 'Diner (8th Ave)', lat: 40.7128, lng: -74.006, type: 'origin' },
    { id: 'p-b', name: 'Warehouse', lat: 40.721, lng: -73.995, type: 'destination' },
  ];

  const ts = (h: number, m: number, s: number) => `2026-05-04T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}Z`;
  const auditLog: AuditLogEntry[] = [
    { id: 'a1', timestamp: ts(18, 26, 41), level: 'success', category: 'BOUNDING', message: 'Bounding Box x:142 y:310 mapped' },
    { id: 'a2', timestamp: ts(18, 26, 38), level: 'success', category: 'NLI', message: 'NLI Contradiction Logic Evaluated (98.2%)' },
    { id: 'a3', timestamp: ts(18, 26, 35), level: 'info', category: 'MATCH', message: 'Events Linked to Police_Report_May4.pdf' },
  ];
  const flowLog: AuditLogEntry[] = [
    { id: 'f1', timestamp: ts(18, 26, 30), level: 'success', category: 'PARSE', message: '[PARSE] ID_03 extraction complete (98%)' },
    { id: 'f2', timestamp: ts(18, 26, 33), level: 'info', category: 'MATCH', message: '[MATCH] Mapping Node #C-003' },
    { id: 'f3', timestamp: ts(18, 26, 36), level: 'info', category: 'NLI', message: '[NLI] Cross-referencing alibi timestamps...' },
  ];

  return { docket: { caseId: 'NY-2026-CR', caseTitle: 'State vs. Alex Miller', status: 'active', evidence, timeline, contradictions, deadlines }, routePoints, audioSegmentsByEvidence: { 'ev-audio': demoAudioSegments }, auditLog, flowLog };
};

const useCaseOpsStore = create<CaseOpsState>()(
  persist(
    (set, get) => ({
      docket: null,
      setDocket: (docket) => {
        const { activeEvidenceId, activeTimelineId } = get();
        const activeTimeline = docket.timeline.find((event) => event.id === activeTimelineId) || null;
        const activeEvidence = docket.evidence.find((evidence) => evidence.id === activeEvidenceId) || null;
        set({
          docket,
          activeTimeline,
          activeEvidence: activeTimeline ? docket.evidence.find((evidence) => evidence.id === activeTimeline.evidenceId) || activeEvidence : activeEvidence,
          highlight: activeTimeline?.sourceReference || null,
          activeBoundingBox: activeTimeline?.sourceReference?.boundingBox || null,
          activeAudioTimestamp: activeTimeline?.sourceReference?.audioTimestampSeconds ?? null,
          selectedEvidenceId: (activeTimeline?.evidenceId || activeEvidenceId) ?? null,
        });
      },
      clearDocket: () => {
        const demo = buildDemoDocket();
        set({
          docket: demo.docket, activeEvidenceId: null, selectedEvidenceId: null, activeEvidence: null, activeTimelineId: null, activeTimeline: null,
          activeContradictionId: null, highlight: null, activeBoundingBox: null, activeAudioTimestamp: null,
          auditLog: demo.auditLog, flowLog: demo.flowLog, routePoints: demo.routePoints, audioSegmentsByEvidence: demo.audioSegmentsByEvidence,
          navView: 'overview', workspaceFilter: 'all', proofMode: 'chronology',
        });
      },

      navView: 'overview',
      setNavView: (v) => set({ navView: v }),
      workspaceFilter: 'all',
      setWorkspaceFilter: (v) => set({ workspaceFilter: v }),
      proofMode: 'chronology',
      setProofMode: (v) => set({ proofMode: v }),

      activeTab: 'time-map',
      setActiveTab: (tab) => set({ activeTab: tab, navView: tab === 'ingestion' ? 'intake' : tab === 'time-map' ? 'timeline' : tab, workspaceFilter: tab === 'time-map' ? 'timeline' : tab === 'ingestion' ? 'all' : tab }),

      activeEvidenceId: null,
      selectedEvidenceId: null,
      setActiveEvidence: (id) => {
        const evidence = get().docket?.evidence.find((e) => e.id === id) || null;
        set({ activeEvidenceId: id, selectedEvidenceId: id, activeEvidence: evidence });
      },
      activeEvidence: null,

      activeTimelineId: null,
      setActiveTimeline: (id) => {
        const event = get().docket?.timeline.find((e) => e.id === id) || null;
        set({
          activeTimelineId: id,
          activeTimeline: event,
          activeEvidenceId: event?.evidenceId || null,
          selectedEvidenceId: event?.evidenceId || null,
          activeEvidence: event ? get().docket?.evidence.find((e) => e.id === event.evidenceId) || null : null,
          highlight: event?.sourceReference || null,
          activeBoundingBox: event?.sourceReference?.boundingBox || null,
          activeAudioTimestamp: event?.sourceReference?.audioTimestampSeconds ?? null,
        });
      },
      activeTimeline: null,

      activeContradictionId: null,
      setActiveContradiction: (id) => set({ activeContradictionId: id }),

      highlight: null,
      activeBoundingBox: null,
      activeAudioTimestamp: null,
      setHighlight: (ref) => set({ highlight: ref, activeBoundingBox: ref?.boundingBox || null, activeAudioTimestamp: ref?.audioTimestampSeconds ?? get().activeAudioTimestamp }),

      filterActor: null,
      setFilterActor: (actor) => set({ filterActor: actor }),
      filterDateRange: null,
      setFilterDateRange: (range) => set({ filterDateRange: range }),
      onlyContradictions: false,
      setOnlyContradictions: (v) => set({ onlyContradictions: v }),

      auditLog: [],
      flowLog: [],
      routePoints: [],
      audioSegmentsByEvidence: {},
      appendAudit: (entry) => set((s) => ({ auditLog: [{ id: nextId('audit'), timestamp: nowIso(), ...entry }, ...s.auditLog].slice(0, 50) })),
      appendFlow: (entry) => set((s) => ({ flowLog: [{ id: nextId('flow'), timestamp: nowIso(), ...entry }, ...s.flowLog].slice(0, 50) })),

      autoSync: true,
      setAutoSync: (v) => set({ autoSync: v }),
      uploaderOpen: false,
      setUploaderOpen: (v) => set({ uploaderOpen: v }),
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),

      selectProof: ({ evidenceId, timelineId, contradictionId, highlight, audioTimestamp, auditMessage }) => {
        const state = get();
        const docket = state.docket;
        const event = timelineId ? docket?.timeline.find((e) => e.id === timelineId) : null;
        const resolvedEvidenceId = evidenceId ?? event?.evidenceId ?? state.activeEvidenceId;
        const evidence = resolvedEvidenceId ? docket?.evidence.find((e) => e.id === resolvedEvidenceId) || null : null;
        const ref = highlight ?? event?.sourceReference ?? null;
        const audioTs = audioTimestamp ?? ref?.audioTimestampSeconds ?? state.activeAudioTimestamp;
        const audit: AuditLogEntry = {
          id: nextId('audit'),
          timestamp: nowIso(),
          level: 'success',
          category: 'USER',
          message: auditMessage || `Evidence inspected: ${evidence?.fileName || resolvedEvidenceId || 'unknown'}`,
          detail: ref?.boundingBox ? `bbox x:${ref.boundingBox.x} y:${ref.boundingBox.y}` : ref?.pageNumber ? `p.${ref.pageNumber}` : undefined,
        };
        set({
          activeTimelineId: timelineId ?? state.activeTimelineId,
          activeTimeline: event ?? state.activeTimeline,
          activeContradictionId: contradictionId ?? state.activeContradictionId,
          activeEvidenceId: resolvedEvidenceId ?? null,
          selectedEvidenceId: resolvedEvidenceId ?? null,
          activeEvidence: evidence ?? state.activeEvidence,
          highlight: ref,
          activeBoundingBox: ref?.boundingBox || null,
          activeAudioTimestamp: audioTs ?? null,
          auditLog: [audit, ...state.auditLog].slice(0, 50),
          proofMode: ref?.audioTimestampSeconds != null || audioTs != null ? 'audio' : contradictionId ? 'diff' : 'receipt',
        });
      },

      initDemo: () => {
        const current = get().docket;
        if (current && current.evidence.length > 0) return;
        const demo = buildDemoDocket();
        set({ docket: demo.docket, routePoints: demo.routePoints, audioSegmentsByEvidence: demo.audioSegmentsByEvidence, auditLog: demo.auditLog, flowLog: demo.flowLog, navView: 'overview', workspaceFilter: 'all', proofMode: 'chronology', activeTab: 'time-map' });
      },

      getFilteredTimeline: () => {
        const { docket, filterActor, filterDateRange, onlyContradictions, workspaceFilter } = get();
        if (!docket) return [];
        let timeline = docket.timeline.filter((e) => {
          if (filterActor && e.actor !== filterActor) return false;
          if (filterDateRange) {
            const t = new Date(e.timestamp).getTime();
            if (filterDateRange.from && t < new Date(filterDateRange.from).getTime()) return false;
            if (filterDateRange.to && t > new Date(filterDateRange.to).getTime() + 86399999) return false;
          }
          return true;
        });
        if (onlyContradictions || workspaceFilter === 'contradictions') {
          const contraEvidenceIds = new Set(docket.contradictions.flatMap(c => [c.claimA.sourceEvidenceId, c.claimB.sourceEvidenceId]));
          timeline = timeline.filter(e => contraEvidenceIds.has(e.evidenceId) || e.contradictionId);
        }
        return timeline;
      },

      getFilteredContradictions: () => get().docket?.contradictions || [],
      getFilteredDeadlines: () => get().docket?.deadlines || [],
    }),
    {
      name: 'case-ops-store-v4',
      partialize: (state) => ({
        docket: state.docket,
        activeEvidenceId: state.activeEvidenceId,
        activeTimelineId: state.activeTimelineId,
        navView: state.navView,
        workspaceFilter: state.workspaceFilter,
        proofMode: state.proofMode,
        auditLog: state.auditLog,
        flowLog: state.flowLog,
        routePoints: state.routePoints,
        audioSegmentsByEvidence: state.audioSegmentsByEvidence,
        autoSync: state.autoSync,
      }),
      onRehydrateStorage: () => (state) => {
        state?.initDemo();
      },
    }
  )
);

export default useCaseOpsStore;
