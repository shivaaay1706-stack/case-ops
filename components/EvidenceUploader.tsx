'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import useCaseOpsStore from '@/lib/store';
import { ChronologyExtractor } from '@/lib/services/chronologyExtractor';
import { ContradictionDetector } from '@/lib/services/contradictionDetector';
import { DeadlineEngine } from '@/lib/services/deadlineEngine';
import { EvidenceItem, TimelineEvent, CaseDocket } from '@/lib/types';

interface BackendEvidence {
  id: string;
  type: EvidenceItem['type'];
  fileName: string;
  rawText: string;
  metadata: EvidenceItem['metadata'];
  processingStatus: 'queued' | 'processing' | 'completed' | 'failed';
  processingError: string | null;
}

export function EvidenceUploader({ variant = 'button' }: { variant?: 'button' | 'panel' }) {
  const { setDocket, docket, setUploaderOpen, appendFlow } = useCaseOpsStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsProcessing(true);
    setProgress('Uploading evidence...');
    appendFlow({ level: 'info', category: 'PARSE', message: `[PARSE] Ingesting ${acceptedFiles.length} file(s)...` });

    try {
      const apiKey = process.env.NEXT_PUBLIC_CASE_OPS_API_KEY;
      if (!apiKey) throw new Error('NEXT_PUBLIC_CASE_OPS_API_KEY is not configured.');
      const caseId = docket?.caseId || `CASE-${Date.now()}`;

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        setProgress(`Uploading ${file.name} (${i + 1}/${acceptedFiles.length})...`);
        const formData = new FormData();
        formData.append('caseId', caseId);
        formData.append('file', file);
        const response = await fetch('/api/evidence', {
          method: 'POST',
          headers: { 'x-api-key': apiKey },
          body: formData,
        });
        const result = await response.json() as { error?: string; processingStatus?: string };
        if (!response.ok || result.processingStatus !== 'completed') {
          throw new Error(result.error || `Evidence processing failed for ${file.name}.`);
        }
      }

      setProgress('Loading source-linked records...');
      const listResponse = await fetch(`/api/evidence?caseId=${encodeURIComponent(caseId)}`, {
        headers: { 'x-api-key': apiKey },
      });
      if (!listResponse.ok) throw new Error('Evidence was uploaded but could not be reloaded.');
      const { items } = await listResponse.json() as { items: BackendEvidence[] };
      const backendEvidence: EvidenceItem[] = items
        .filter((item) => item.processingStatus === 'completed')
        .map((item) => ({
          id: item.id,
          type: item.type,
          fileName: item.fileName,
          fileUrl: `/api/evidence/${item.id}/content`,
          rawText: item.rawText,
          metadata: {
            ...item.metadata,
            dateUploaded: item.metadata.dateUploaded || new Date().toISOString(),
          },
        }));
      const uniqueBackendEvidence = Array.from(
        new Map(backendEvidence.map((item) => [`${item.fileName}|${item.rawText}`, item])).values(),
      );

      setProgress('Updating chronology...');
      const chronology = new ChronologyExtractor();
      const detector = new ContradictionDetector();
      const deadlineEngine = new DeadlineEngine();

      const existingEvidence = docket?.evidence || [];
      const existingIds = new Set(existingEvidence.map((item) => item.id));
      const allEvidence = [...existingEvidence, ...uniqueBackendEvidence.filter((item) => !existingIds.has(item.id))];

      const newEvidence = uniqueBackendEvidence.filter((item) => !existingIds.has(item.id));
      const newTimelineEvents = buildTimeline(newEvidence, chronology).map((event, index) => ({
        ...event,
        id: `evt-upload-${Date.now()}-${index}`,
      }));
      const timelineEvents = [...(docket?.timeline || []), ...newTimelineEvents]
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const claims = extractClaims(allEvidence);
      const contradictions = detector.detect(claims);
      const deadlines = deadlineEngine.computeAll(
        allEvidence.flatMap(e => [
          { triggerEvent: 'Service of summons', triggerDate: e.metadata.originalDate || new Date().toISOString(), evidenceId: e.id },
          { triggerEvent: 'Judgment date', triggerDate: new Date().toISOString(), evidenceId: e.id },
        ])
      );

      const newDocket: CaseDocket = {
        caseId,
        caseTitle: docket?.caseTitle || 'Untitled Case',
        status: 'active',
        evidence: allEvidence,
        timeline: timelineEvents,
        contradictions,
        deadlines,
      };

      setDocket(newDocket);
      appendFlow({ level: 'success', category: 'MATCH', message: `[MATCH] Ingestion merged (${newEvidence.length} new evidence items)` });
      setProgress('Complete!');
      setUploaderOpen(false);
    } catch (err) {
      console.error('Processing error:', err);
      setProgress(err instanceof Error ? err.message : 'Error processing files');
      appendFlow({ level: 'error', category: 'PARSE', message: `[PARSE] Ingestion failed` });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(''), 2500);
    }
  }, [docket, setDocket, setUploaderOpen, appendFlow]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff'],
      'text/plain': ['.txt'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'],
    },
    disabled: isProcessing,
  });

  if (variant === 'panel') {
    return (
      <div
        {...getRootProps()}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
          isProcessing ? 'border-white/10 text-[#6E687A] bg-[#16141C]' : isDragActive ? 'border-[#A688AA] bg-[#A688AA]/10 text-[#E8D7EA]' : 'border-white/[0.10] hover:border-[#A688AA]/50 bg-[#16141C] text-[#CFC8D8]'
        }`}
      >
        <input {...getInputProps()} />
        <div className="mono-telemetry text-xs mb-1 tracking-wide">{isProcessing ? 'PROCESSING' : 'DROP EVIDENCE FOLDER / FILES'}</div>
        <div className="text-[12px] text-[#8E8A99]">PDF, scanned images, WhatsApp .txt, audio memos</div>
        {progress && <div className="mt-3 text-[11px] text-[#D7C0D9] mono-telemetry">{progress}</div>}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        {...getRootProps()}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
          isProcessing
            ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
            : isDragActive
            ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
            : 'bg-[#131926] border-[rgba(56,189,248,0.14)] text-slate-200 hover:border-cyan-400/50'
        }`}
        disabled={isProcessing}
      >
        <input {...getInputProps()} />
        <span>{isProcessing ? 'Processing...' : 'Add Evidence'}</span>
      </button>
      {progress && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-[#131926] border border-[rgba(56,189,248,0.14)] rounded-lg text-xs text-slate-400 whitespace-nowrap shadow-lg">
          {progress}
        </div>
      )}
    </div>
  );
}

function buildTimeline(evidence: EvidenceItem[], chronology: ChronologyExtractor): TimelineEvent[] {
  const events: Omit<TimelineEvent, 'id'>[] = [];
  for (const ev of evidence) {
    const mentions = chronology.extract(ev.rawText, { baseDate: ev.metadata.originalDate });
    for (const mention of mentions) {
      if (mention.resolved) {
        events.push({
          timestamp: mention.resolved,
          title: `Event from ${ev.fileName}`,
          description: mention.text,
          actor: 'Unknown',
          evidenceId: ev.id,
          sourceReference: {
            pageNumber: mention.kind === 'date' ? 1 : undefined,
            rawSnippet: mention.text,
          },
        });
      }
    }
  }
  return chronology.buildTimeline(events);
}

function extractClaims(evidence: EvidenceItem[]) {
  return evidence.flatMap(ev =>
    ev.rawText.split('\n').map((line, i) => ({
      statement: line,
      actor: line.match(/^\[.*?\]\s*([^:]+):/)?.[1]?.trim() || ev.metadata.author || 'Unknown',
      evidenceId: ev.id,
      pageOrTime: `line ${i + 1}`,
    }))
  );
}
