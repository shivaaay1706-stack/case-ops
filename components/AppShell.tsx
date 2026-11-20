'use client';

import { useMemo, useState } from 'react';
import { Bell, ChevronDown, FileAudio, FileImage, FileText, FolderOpen, LayoutGrid, ListOrdered, type LucideIcon, RefreshCw, Scale, Search, Settings, ShieldAlert, Sparkles, Upload } from 'lucide-react';
import useCaseOpsStore, { ProofMode } from '@/lib/store';
import { EvidenceUploader } from './EvidenceUploader';

const CHART_POINTS = [
  { x: 0, y: 72, label: 'May 01', v: 2 },
  { x: 40, y: 66, label: 'May 02', v: 3 },
  { x: 80, y: 58, label: 'May 03', v: 4 },
  { x: 120, y: 38, label: 'May 04', v: 8, spike: true },
  { x: 160, y: 52, label: 'May 05', v: 5 },
  { x: 200, y: 60, label: 'May 06', v: 4 },
  { x: 240, y: 55, label: 'May 07', v: 4 },
  { x: 280, y: 62, label: 'May 08', v: 3 },
  { x: 320, y: 50, label: 'May 09', v: 5 },
  { x: 360, y: 57, label: 'May 10', v: 4 },
  { x: 400, y: 64, label: 'May 11', v: 3 },
  { x: 440, y: 48, label: 'May 12', v: 5 },
  { x: 480, y: 56, label: 'May 13', v: 4 },
  { x: 520, y: 68, label: 'May 14', v: 2 },
  { x: 560, y: 61, label: 'May 15', v: 3 },
];
const WAVE = [10, 18, 8, 24, 14, 30, 12, 20, 9, 26, 16, 22, 11, 28, 15, 19, 7, 23, 13, 21];

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function AppShell() {
  const {
    docket, navView, setNavView, workspaceFilter, setWorkspaceFilter, proofMode, setProofMode,
    uploaderOpen, setUploaderOpen, autoSync, setAutoSync, searchQuery, setSearchQuery,
    getFilteredTimeline, getFilteredContradictions,
    activeTimelineId, activeContradictionId, activeEvidence, highlight,
    selectProof,
  } = useCaseOpsStore();

  const timeline = getFilteredTimeline();
  const contradictions = getFilteredContradictions();
  const [timelineSub, setTimelineSub] = useState<'all' | 'conflicts' | 'verified'>('all');
  const [hoverNode, setHoverNode] = useState<number | null>(120);

  const visibleTimeline = useMemo(() => {
    let list = timeline;
    if (timelineSub === 'conflicts' || workspaceFilter === 'contradictions') list = list.filter((e) => e.contradictionId);
    if (timelineSub === 'verified') list = list.filter((e) => !e.contradictionId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    }
    return list.slice(0, 5);
  }, [timeline, timelineSub, workspaceFilter, searchQuery]);

  const onSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const evt = (docket?.timeline || []).find((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.sourceReference.rawSnippet.toLowerCase().includes(q));
    if (evt) {
      selectProof({ timelineId: evt.id, evidenceId: evt.evidenceId, highlight: evt.sourceReference, auditMessage: `Grounded search jumped to: ${evt.title}` });
      setProofMode('receipt');
    } else {
      const ev = (docket?.evidence || []).find((e) => e.fileName.toLowerCase().includes(q) || e.rawText.toLowerCase().includes(q));
      if (ev) selectProof({ evidenceId: ev.id, highlight: { rawSnippet: ev.rawText.split('\n')[0] || ev.fileName }, auditMessage: `Grounded search opened: ${ev.fileName}` });
    }
  };

  const critical = contradictions.filter((c) => c.severity === 'critical').length || 3;
  const evidenceCount = docket?.evidence.length || 14;
  const primaryContradiction = contradictions.find((c) => c.id === activeContradictionId) || contradictions.find((c) => c.id === 'C-003') || contradictions[0];

  return (
    <div className="flex h-full w-full bg-[#0E0C12] text-[#F5F3F7]">
      {/* LEFT NAV */}
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-[#131118] p-4">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#A688AA] to-[#725B75] shadow-[0_0_18px_rgba(166,136,170,0.35)]">
            <span className="text-[11px] font-bold">C</span>
          </div>
          <span className="text-base font-semibold tracking-tight text-white">CASE-OPS</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1.5">
          <NavPill icon={LayoutGrid} label="Case Overview" active={navView === 'overview'} onClick={() => { setNavView('overview'); setWorkspaceFilter('all'); }} />
          <NavPill icon={FolderOpen} label="Chaos Intake" active={navView === 'intake'} onClick={() => { setNavView('intake'); setWorkspaceFilter('all'); }} />
          <NavPill icon={ListOrdered} label="Master Timeline" active={navView === 'timeline'} onClick={() => { setNavView('timeline'); setWorkspaceFilter('timeline'); }} />
          <NavPill icon={ShieldAlert} label="Contradictions" active={navView === 'contradictions'} onClick={() => { setNavView('contradictions'); setWorkspaceFilter('contradictions'); }} badge={contradictions.length || 3} />
          <NavPill icon={Scale} label="Deadlines" active={navView === 'deadlines'} onClick={() => { setNavView('deadlines'); setWorkspaceFilter('deadlines'); }} />
          <div className="mt-auto pt-4 border-t border-white/[0.06] space-y-1.5">
            <NavPill icon={FileText} label="Audit Ledger" active={navView === 'audit'} onClick={() => setNavView('audit')} subtle />
            <NavPill icon={Settings} label="System Settings" active={navView === 'settings'} onClick={() => setNavView('settings')} subtle />
          </div>
        </nav>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-medium tracking-tight text-white">{docket?.caseTitle || 'State vs. Alex Miller'}</h1>
            <p className="mt-1 text-sm text-[#8E8A99]">Criminal Docket {docket?.caseId || 'NY-2026-CR'} • {evidenceCount} Evidentiary Files Indexed</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-[#16141C] text-[#8E8A99] hover:text-white"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#B89BB9]" /></button>
            <button onClick={() => setAutoSync(!autoSync)} className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-[#16141C] ${autoSync ? 'text-[#B89BB9]' : 'text-[#8E8A99]'} hover:text-white`} title={autoSync ? 'Sync on' : 'Sync off'}><RefreshCw className="h-4 w-4" /></button>
            <div className="rounded-full border border-white/[0.06] bg-[#16141C] px-4 py-2 text-sm text-[#E8E4EC]">Adv. Kartavya • Lead Counsel</div>
          </div>
        </div>

        {/* Sub-header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center rounded-full border border-white/[0.06] bg-[#131118] p-1">
            <SegPill label="All Evidence" active={workspaceFilter === 'all'} onClick={() => setWorkspaceFilter('all')} />
            <SegPill label="Timeline" active={workspaceFilter === 'timeline'} onClick={() => { setWorkspaceFilter('timeline'); setNavView('timeline'); }} />
            <SegPill label="Contradictions" active={workspaceFilter === 'contradictions'} onClick={() => { setWorkspaceFilter('contradictions'); setNavView('contradictions'); }} />
            <SegPill label="Deadlines" active={workspaceFilter === 'deadlines'} onClick={() => { setWorkspaceFilter('deadlines'); setNavView('deadlines'); }} />
          </div>
          <div className="flex w-80 items-center gap-2 rounded-full border border-white/[0.08] bg-[#16141C] px-4 py-2">
            <Sparkles className="h-4 w-4 text-[#B89BB9]" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()} placeholder="Ask CASE-OPS across indexed evidence..." className="w-full bg-transparent text-sm text-[#E8E4EC] placeholder:text-[#6E687A] outline-none" />
            <button onClick={onSearch} className="text-[#8E8A99] hover:text-white"><Search className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Upper Bento Row */}
        <section className="grid grid-cols-12 gap-5">
          {/* Col 1 */}
          <div className="col-span-12 flex flex-col gap-5 lg:col-span-4">
            <div className="bento-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-[#E8E4EC]">Evidentiary Integrity</span>
                <button className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">OCR 98.4% <ChevronDown className="h-3 w-3" /></button>
              </div>
              <div className="text-[32px] font-semibold tracking-tight text-white">{critical} Critical Conflicts</div>
              <div className="mt-2 text-sm text-[#8E8A99]">{contradictions.length || 3} total contradictions detected across indexed sources</div>
              <div className="mt-4 flex gap-2">
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">Grounded receipts linked</span>
                <span className="rounded-full border border-white/[0.08] bg-[#1A1721] px-2.5 py-1 text-xs text-[#B89BB9]">NLI 98.2%</span>
              </div>
            </div>
            <div className="bento-card ambient-plum relative overflow-hidden p-5">
              <div className="relative z-10">
                <div className="text-base font-medium text-white">De-noise Chaos Folder</div>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#8E8A99]">Ingest raw scanned FIRs, handwritten notes, WhatsApp logs & voice memos with zero-hallucination receipt linking.</p>
                <button onClick={() => setUploaderOpen(true)} className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#A688AA]/20 plum-cta hover:brightness-110 transition">
                  <Upload className="h-4 w-4" />+ Upload Evidence Folder
                </button>
              </div>
            </div>
          </div>

          {/* Col 2: Chronology feed */}
          <div className="col-span-12 bento-card p-5 lg:col-span-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-medium text-white">Master Chronology</span>
              <div className="flex items-center gap-1 rounded-full border border-white/[0.06] bg-[#16141C] p-0.5">
                {(['all', 'conflicts', 'verified'] as const).map((k) => (
                  <button key={k} onClick={() => setTimelineSub(k)} className={`rounded-full px-2.5 py-1 text-xs capitalize transition ${timelineSub === k ? 'bg-[#1E1B26] text-white border border-white/[0.08]' : 'text-[#8E8A99] hover:text-white'}`}>{k}</button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {(visibleTimeline.length ? visibleTimeline : timeline.slice(0, 5)).map((evt) => {
                const isConflict = !!evt.contradictionId;
                const ev = docket?.evidence.find((e) => e.id === evt.evidenceId);
                const active = activeTimelineId === evt.id;
                const Icon = ev?.type === 'audio' ? FileAudio : ev?.type === 'scanned_image' ? FileImage : FileText;
                return (
                  <button key={evt.id} onClick={() => selectProof({ timelineId: evt.id, evidenceId: evt.evidenceId, contradictionId: evt.contradictionId || null, highlight: evt.sourceReference, auditMessage: `Chronology row opened: ${evt.title}` })} className={`flex w-full items-center gap-3 py-3 text-left transition ${active ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E1B26] border border-white/[0.05]"><Icon className="h-4 w-4 text-[#B89BB9]" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[#F0EDF3]">{evt.title}</div>
                      <div className="truncate text-xs text-[#8E8A99]">{ev?.fileName || evt.evidenceId}{evt.sourceReference.pageNumber ? ` • Pg ${evt.sourceReference.pageNumber}` : ''}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="mono-telemetry text-xs text-[#B8B4C2]">{fmtTime(evt.timestamp)}</div>
                      <div className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${isConflict ? 'border-rose-500/30 bg-rose-500/15 text-rose-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>{isConflict ? '+Conflict' : 'Verified'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Col 3: Statutory Radar */}
          <div className="col-span-12 bento-card p-5 lg:col-span-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-medium text-white">Statutory Radar</span>
              <button onClick={() => { setNavView('deadlines'); setWorkspaceFilter('deadlines'); }} className="rounded-full border border-white/[0.06] bg-[#16141C] px-3 py-1 text-xs text-[#B8B4C2] hover:text-white">View all ↗</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStatCard title="12 Days Left" badge="Urgent" badgeTone="rose" subtitle="Section 14 Appeal Window" onClick={() => { setNavView('deadlines'); setWorkspaceFilter('deadlines'); }} />
              <MiniStatCard title="28 Days Left" badge="Active" badgeTone="emerald" subtitle="Transcript Filing Cutoff" onClick={() => { setNavView('deadlines'); setWorkspaceFilter('deadlines'); }} />
              <MiniStatCard title="Claim A vs B" badge="C-003" badgeTone="rose" subtitle="Diner Alibi vs SUV Sighting" onClick={() => selectProof({ contradictionId: 'C-003', timelineId: 'evt-3', evidenceId: 'ev-police-report', highlight: docket?.timeline.find(t=>t.id==='evt-3')?.sourceReference || null, auditMessage: 'Contradiction C-003 inspected from radar' })} />
              <MiniStatCard title="99.2% Match" badge="Grounded" badgeTone="emerald" subtitle="Voice_Memo_WitnessB.wav" onClick={() => selectProof({ evidenceId: 'ev-audio', highlight: { rawSnippet: 'Witness Statement: "...red sedan speeding... wait no..."', audioTimestampSeconds: 84 }, auditMessage: 'Audio receipt inspected from radar' })} />
            </div>
          </div>
        </section>

        {/* Lower Wide Card */}
        <section className="bento-card col-span-12 flex min-h-[360px] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
            <span className="text-base font-medium text-white">Evidentiary Timeline & Source Proof Canvas</span>
            <div className="flex items-center rounded-full bg-[#191620] p-1">
              {([['chronology','CHRONOLOGY GRAPH'],['receipt','PDF / OCR RECEIPT'],['audio','AUDIO WAVEFORM'],['diff','CONTRADICTION DIFF']] as [ProofMode,string][]).map(([k,label]) => (
                <button key={k} onClick={() => setProofMode(k)} className={`rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide transition ${proofMode === k ? 'bg-[#1E1B26] text-white border border-white/[0.08]' : 'text-[#8E8A99] hover:text-white'}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-12">
            {/* Left graph */}
            <div className="col-span-12 border-b border-white/[0.06] p-5 lg:col-span-7 lg:border-b-0 lg:border-r">
              <div className="relative h-full min-h-[280px] rounded-xl bg-[#131118] p-4 border border-white/[0.04]">
                <svg viewBox="0 0 560 160" className="h-[220px] w-full">
                  <defs>
                    <linearGradient id="plumArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(168,139,170,0.35)" />
                      <stop offset="100%" stopColor="rgba(168,139,170,0)" />
                    </linearGradient>
                  </defs>
                  {[20,50,80,110,140].map((y) => <line key={y} x1="0" x2="560" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />)}
                  <path d={`M ${CHART_POINTS.map((p) => `${p.x},${p.y}`).join(' L ')}`} fill="none" stroke="#CBB0CC" strokeWidth="2.5" />
                  <path d={`M 0,160 L ${CHART_POINTS.map((p) => `${p.x},${p.y}`).join(' L ')} L 560,160 Z`} fill="url(#plumArea)" />
                  {CHART_POINTS.map((p, i) => {
                    const active = p.x === hoverNode || (p.spike && hoverNode === 120);
                    if (!p.spike && i % 2 !== 0) return null;
                    return (
                      <g key={p.label} onMouseEnter={() => setHoverNode(p.x)} onClick={() => { setHoverNode(p.x); if (p.spike) selectProof({ timelineId: 'evt-3', evidenceId: 'ev-police-report', contradictionId: 'C-003', highlight: docket?.timeline.find(t=>t.id==='evt-3')?.sourceReference || null, auditMessage: 'Timeline graph node inspected: May 04 contradiction spike' }); }} className="cursor-pointer">
                        {active && <line x1={p.x} x2={p.x} y1={p.y} y2="150" stroke="rgba(226,198,229,0.35)" strokeDasharray="4 4" />}
                        <circle cx={p.x} cy={p.y} r={active ? 5.5 : 4} fill={active ? '#E2C6E5' : '#A688AA'} opacity={active ? 1 : 0.8} style={active ? { filter: 'drop-shadow(0 0 8px rgba(166,136,170,0.8))' } : undefined} />
                        {active && <circle cx={p.x} cy={p.y} r="10" fill="none" stroke="rgba(166,136,170,0.35)" strokeWidth="4" />}
                      </g>
                    );
                  })}
                </svg>
                <div className="mt-1 flex justify-between px-1 mono-telemetry text-[10px] text-[#6E687A]">
                  {['May 01','May 03','May 05','May 07','May 09','May 11','May 13','May 15'].map((d) => <span key={d}>{d}</span>)}
                </div>
                <div className="pointer-events-none absolute rounded-xl border border-white/[0.08] bg-[#16141C]/95 px-3 py-2 shadow-xl" style={{ left: '22%', top: 18 }}>
                  <div className="text-xs font-medium text-white">May 04, 11:45 PM • Contradiction C-003</div>
                  <div className="mono-telemetry mt-0.5 text-[10px] text-rose-400">+2 Conflicts • evidentiary spike</div>
                </div>
              </div>
            </div>

            {/* Right receipt drawer */}
            <div className="col-span-12 flex min-h-0 flex-col p-5 lg:col-span-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{activeEvidence?.fileName || 'Police_Report_May4.pdf'} • {highlight?.pageNumber ? `Page ${highlight.pageNumber}` : 'Page 4'} {highlight?.boundingBox ? `[x:${highlight.boundingBox.x}, y:${highlight.boundingBox.y}]` : '[x:142, y:310]'}</div>
                  <div className="text-xs text-[#8E8A99]">Grounded source receipt {activeEvidence ? '• live selection' : '• demo'}</div>
                </div>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">Grounded</span>
              </div>
              <div className="scroll-pane bento-inner flex-1 p-4">
                {proofMode === 'diff' && primaryContradiction ? (
                  <div className="space-y-3 text-sm">
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                      <div className="mb-1 text-[10px] uppercase tracking-wide text-rose-300">Claim A • {primaryContradiction.claimA.actor}</div>
                      <div className="text-[#F3EDF4]">{primaryContradiction.claimA.statement}</div>
                      <div className="mono-telemetry mt-1 text-[10px] text-[#B89BB9]">{primaryContradiction.claimA.pageOrTime}</div>
                    </div>
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                      <div className="mb-1 text-[10px] uppercase tracking-wide text-amber-300">Claim B • {primaryContradiction.claimB.actor}</div>
                      <div className="text-[#F3EDF4]">{primaryContradiction.claimB.statement}</div>
                      <div className="mono-telemetry mt-1 text-[10px] text-[#B89BB9]">{primaryContradiction.claimB.pageOrTime}</div>
                    </div>
                    <div className="text-xs text-[#C8B4CA]">{primaryContradiction.explanation}</div>
                  </div>
                ) : (
                  <div className="space-y-2 text-[13px] leading-relaxed text-[#D8D2DE]">
                    {(activeEvidence?.rawText || docket?.evidence[0]?.rawText || '').split('\n').slice(0, 10).map((line, i) => {
                      const hit = !!(highlight?.rawSnippet && line.includes(highlight.rawSnippet.slice(0, 28)));
                      return <div key={i} className={`rounded px-2 py-1 ${hit ? 'proof-plum-highlight text-white' : ''}`}>{line || '\u00A0'}</div>;
                    })}
                    {highlight?.rawSnippet && (
                      <div className="mt-3 rounded-lg border border-[#A688AA]/30 bg-[#A688AA]/10 p-2.5 text-xs text-[#F0E6F2]">
                        <div className="mono-telemetry mb-1 text-[10px] text-[#D7C0D9]">Highlighted proof excerpt</div>
                        “{highlight.rawSnippet}”
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="bento-inner mt-3 p-3">
                <div className="mb-2 flex items-center justify-between mono-telemetry text-[10px] text-[#8E8A99]"><span>{activeEvidence?.type === 'audio' ? activeEvidence.fileName : 'Voice_Memo_WitnessB.wav'}</span><span className="text-[#B89BB9]">01:24 / 03:45</span></div>
                <div className="flex h-10 items-end gap-[2px]">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const h = WAVE[i % WAVE.length] + ((i * 5) % 9);
                    const active = i >= 14 && i <= 22;
                    return <span key={i} className={`w-full rounded-sm ${active ? 'bg-[#D7A9DB]' : 'bg-[#3A3342]'}`} style={{ height: `${h + 25}%` }} />;
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {navView === 'audit' && (
          <section className="bento-card p-5">
            <div className="mb-3 text-base font-medium text-white">Audit Ledger</div>
            <div className="space-y-2">
              {useCaseOpsStore.getState().auditLog.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 border-b border-white/[0.05] pb-2 text-sm">
                  <span className="text-[#DCD6E3]">{a.message}</span>
                  <span className="mono-telemetry text-[10px] text-[#8E8A99]">{new Date(a.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {uploaderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setUploaderOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#131118] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-medium text-white">Upload Evidence Folder</div>
              <button onClick={() => setUploaderOpen(false)} className="text-[#8E8A99] hover:text-white">✕</button>
            </div>
            <EvidenceUploader variant="panel" />
            <div className="mt-3 text-xs text-[#8E8A99]">Files are processed via the existing CASE-OPS ingestion pipeline with grounded receipt linking.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavPill({ icon: Icon, label, active, onClick, badge, subtle }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void; badge?: number; subtle?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition ${active ? 'plum-active text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : subtle ? 'text-[#8E8A99] hover:bg-[#1A1721] hover:text-white' : 'text-[#B8B4C2] hover:bg-[#1A1721] hover:text-white'}`}>
      <Icon className={`h-4 w-4 ${active ? 'text-[#E8D7EA]' : 'text-[#8E8A99]'}`} />
      <span className="flex-1 font-medium">{label}</span>
      {typeof badge === 'number' && <span className="rounded-full border border-rose-500/30 bg-rose-500/15 px-1.5 py-0.5 mono-telemetry text-[10px] text-rose-300">{badge}</span>}
    </button>
  );
}

function SegPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-full px-4 py-1.5 text-sm transition ${active ? 'bg-gradient-to-r from-[rgba(168,139,170,0.35)] to-[rgba(114,91,117,0.2)] text-white border border-white/[0.08]' : 'text-[#8E8A99] hover:text-white'}`}>{label}</button>;
}

function MiniStatCard({ title, badge, badgeTone, subtitle, onClick }: { title: string; badge: string; badgeTone: 'rose' | 'emerald'; subtitle: string; onClick: () => void }) {
  const tone = badgeTone === 'rose' ? 'border-rose-500/30 bg-rose-500/15 text-rose-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
  return (
    <button onClick={onClick} className="rounded-xl border border-white/[0.05] bg-[#191620] p-3.5 text-left transition hover:border-white/[0.10]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">{title}</div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}>{badge}</span>
      </div>
      <div className="text-xs leading-relaxed text-[#8E8A99]">{subtitle}</div>
    </button>
  );
}
