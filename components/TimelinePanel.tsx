'use client';

import useCaseOpsStore from '@/lib/store';
import { TimelineEvent } from '@/lib/types';

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDate(date: Date): string {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export function TimelinePanel() {
  const { getFilteredTimeline, activeTimelineId, setActiveTimeline, filterActor, setFilterActor, filterDateRange, setFilterDateRange, onlyContradictions, setOnlyContradictions } = useCaseOpsStore();
  const timeline = getFilteredTimeline();
  const actors = [...new Set(timeline.map((e: TimelineEvent) => e.actor))].filter(Boolean);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0D111A]">
      <div className="p-3 border-b border-[rgba(56,189,248,0.14)] space-y-2">
        <div className="flex gap-2">
          <select value={filterActor || ''} onChange={(e) => setFilterActor(e.target.value || null)} className="flex-1 px-2 py-1.5 bg-[#131926] border border-[rgba(56,189,248,0.14)] rounded text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500">
            <option value="">All Actors</option>
            {actors.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={() => setOnlyContradictions(!onlyContradictions)} className={`px-2 py-1.5 rounded text-xs font-medium transition-colors ${onlyContradictions ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-[#131926] text-slate-400 border border-[rgba(56,189,248,0.14)] hover:text-slate-200'}`}>Contradictions</button>
        </div>
        <div className="flex gap-2">
          <input type="date" value={filterDateRange?.from ? filterDateRange.from.split('T')[0] : ''} onChange={(e) => setFilterDateRange({ ...filterDateRange, from: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="flex-1 px-2 py-1.5 bg-[#131926] border border-[rgba(56,189,248,0.14)] rounded text-xs text-slate-200" />
          <input type="date" value={filterDateRange?.to ? filterDateRange.to.split('T')[0] : ''} onChange={(e) => setFilterDateRange({ ...filterDateRange, to: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="flex-1 px-2 py-1.5 bg-[#131926] border border-[rgba(56,189,248,0.14)] rounded text-xs text-slate-200" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {timeline.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-sm">No timeline events match current filters.</div>
        ) : timeline.map((event) => {
          const date = new Date(event.timestamp);
          const isActive = activeTimelineId === event.id;
          return (
            <div key={event.id} className={`p-2.5 rounded border cursor-pointer transition ${isActive ? 'bg-cyan-500/5 border-cyan-400/50' : 'bg-[#131926] border-[rgba(56,189,248,0.12)] hover:border-cyan-500/30'}`} onClick={() => setActiveTimeline(event.id)}>
              <div className="mono-telemetry text-[10px] text-slate-400 mb-1">{formatTime(date)} · {formatDate(date)}</div>
              <h4 className="text-sm font-medium text-slate-100 mb-0.5">{event.title}</h4>
              <p className="text-xs text-slate-400 line-clamp-2">{event.description}</p>
              <div className="mt-1.5 mono-telemetry text-[10px] text-slate-500">{event.actor}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
