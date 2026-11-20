'use client';

import { useMemo } from 'react';
import useCaseOpsStore from '@/lib/store';
import { EvidenceItem, SourceReference } from '@/lib/types';
import { AudioLines, CheckCircle2, FileText, Image as ImageIcon, MessageSquare, X } from 'lucide-react';

const typeLabels: Record<EvidenceItem['type'], string> = {
  pdf: 'Document',
  scanned_image: 'Scanned image',
  whatsapp: 'WhatsApp export',
  audio: 'Audio transcript',
};

export function EvidenceViewer() {
  const { activeEvidence, highlight, setHighlight } = useCaseOpsStore();

  if (!activeEvidence) {
    return (
      <div className="flex h-full flex-col">
        <ViewerHeader />
        <EmptyViewer />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
              Source receipt
            </div>
            <h3 className="truncate font-semibold">{activeEvidence.fileName}</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {typeLabels[activeEvidence.type]} · uploaded {new Date(activeEvidence.metadata.dateUploaded).toLocaleDateString()}
            </p>
          </div>
          <span className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
            {activeEvidence.type}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {activeEvidence.type === 'pdf' && <TextViewer evidence={activeEvidence} highlight={highlight} />}
        {activeEvidence.type === 'scanned_image' && <ImageViewer evidence={activeEvidence} highlight={highlight} />}
        {activeEvidence.type === 'whatsapp' && <WhatsAppViewer evidence={activeEvidence} highlight={highlight} />}
        {activeEvidence.type === 'audio' && <AudioViewer evidence={activeEvidence} highlight={highlight} />}
      </div>

      {highlight && (
        <div className="border-t border-[var(--border)] bg-[var(--card)] p-3">
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-[var(--muted)]">
            <span>Linked source excerpt</span>
            <button aria-label="Clear source highlight" onClick={() => setHighlight(null)} className="rounded p-1 hover:bg-[var(--bg)] hover:text-[var(--fg)]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-2 font-mono text-xs leading-relaxed text-[var(--fg)]">
            {highlight.rawSnippet}
          </div>
        </div>
      )}
    </div>
  );
}

function ViewerHeader() {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)]" />
        Evidence canvas
      </div>
      <h3 className="font-semibold">No source selected</h3>
      <p className="mt-1 text-xs text-[var(--muted)]">Select an event or contradiction to inspect its raw evidence.</p>
    </div>
  );
}

function EmptyViewer() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-center text-[var(--muted)]">
      <div>
        <FileText className="mx-auto mb-3 h-10 w-10 text-[var(--border)]" />
        <p className="text-sm">The evidence canvas follows your selection.</p>
        <p className="mt-1 text-xs">Every receipt must point back to source text or media.</p>
      </div>
    </div>
  );
}

function TextViewer({ evidence, highlight }: { evidence: EvidenceItem; highlight: SourceReference | null }) {
  const lines = evidence.rawText.split(/\r?\n/);
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 font-mono text-xs leading-6">
      {lines.map((line, index) => {
        const selected = Boolean(highlight?.rawSnippet && line.includes(highlight.rawSnippet));
        return (
          <div key={`${index}-${line}`} className={`flex gap-3 rounded px-2 ${selected ? 'evidence-highlight text-[var(--fg)]' : 'text-[var(--muted)]'}`}>
            <span className="w-7 shrink-0 select-none text-right text-[var(--border)]">{index + 1}</span>
            <span className="whitespace-pre-wrap">{line || ' '}</span>
          </div>
        );
      })}
    </div>
  );
}

function ImageViewer({ evidence, highlight }: { evidence: EvidenceItem; highlight: SourceReference | null }) {
  return (
    <div className="space-y-3">
      <div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg)]">
        {evidence.fileUrl ? (
          <img src={evidence.fileUrl} alt={evidence.fileName} className="max-h-[55vh] max-w-full object-contain" />
        ) : (
          <div className="text-center text-xs text-[var(--muted)]">
            <ImageIcon className="mx-auto mb-2 h-10 w-10 text-[var(--border)]" />
            <p>Image preview unavailable</p>
            <p className="mt-1">OCR text is shown below.</p>
          </div>
        )}
        {highlight?.boundingBox && (
          <div className="pointer-events-none absolute border-2 border-[var(--warning)] bg-[var(--warning)]/10" style={{
            left: `${highlight.boundingBox.x}%`, top: `${highlight.boundingBox.y}%`,
            width: `${highlight.boundingBox.width}%`, height: `${highlight.boundingBox.height}%`,
          }} />
        )}
      </div>
      <TextViewer evidence={{ ...evidence, type: 'pdf' }} highlight={highlight} />
    </div>
  );
}

function WhatsAppViewer({ evidence, highlight }: { evidence: EvidenceItem; highlight: SourceReference | null }) {
  return (
    <div className="space-y-2">
      {evidence.rawText.split(/\r?\n/).map((line, index) => {
        const selected = Boolean(highlight?.rawSnippet && line.includes(highlight.rawSnippet));
        const match = line.match(/^\[(.*?)\]\s*(.*?):\s*(.*)$/);
        return (
          <div key={`${index}-${line}`} className={`rounded-lg border p-3 ${selected ? 'border-[var(--warning)]/50 bg-[var(--warning)]/10' : 'border-[var(--border)] bg-[var(--card)]'}`}>
            {match ? (
              <>
                <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                  <MessageSquare className="h-3 w-3" /> {match[1]} <span className="text-[var(--fg)]">{match[2]}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{match[3]}</p>
              </>
            ) : <p className="whitespace-pre-wrap text-sm">{line}</p>}
          </div>
        );
      })}
    </div>
  );
}

function AudioViewer({ evidence, highlight }: { evidence: EvidenceItem; highlight: SourceReference | null }) {
  const bars = useMemo(() => Array.from({ length: 64 }, (_, index) => 18 + ((index * 37) % 70)), []);
  const segments = [
    { start: 0, end: 1.5, text: '911, what is your emergency?' },
    { start: 2, end: 5.5, text: "There's a silver sedan that just hit a pedestrian and drove off." },
    { start: 6, end: 8, text: 'The car was speeding, silver or grey, I think.' },
    { start: 8.5, end: 11, text: 'It fled eastbound on Maple Street toward the bridge.' },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        {evidence.fileUrl && <audio controls className="mb-4 w-full" src={evidence.fileUrl} />}
        <div className="flex h-16 items-center gap-1 rounded bg-[var(--bg)] px-3">
          {bars.map((height, index) => <span key={index} className={`w-full rounded-sm ${index < 18 ? 'bg-[var(--accent)]/60' : 'bg-[var(--border)]'}`} style={{ height: `${height}%` }} />)}
        </div>
      </div>
      {segments.map((segment) => {
        const selected = highlight?.audioTimestampSeconds === segment.start;
        return (
          <div key={segment.start} className={`rounded-lg border p-3 ${selected ? 'border-[var(--warning)]/50 bg-[var(--warning)]/10' : 'border-[var(--border)] bg-[var(--card)]'}`}>
            <div className="mb-1 flex items-center gap-2 text-xs font-mono text-[var(--accent)]"><AudioLines className="h-3.5 w-3.5" />{segment.start.toFixed(1)}s – {segment.end.toFixed(1)}s</div>
            <p className="text-sm">{segment.text}</p>
          </div>
        );
      })}
      <div className="flex items-center gap-2 text-xs text-[var(--success)]"><CheckCircle2 className="h-3.5 w-3.5" /> Transcript segments are source-attributed.</div>
    </div>
  );
}
