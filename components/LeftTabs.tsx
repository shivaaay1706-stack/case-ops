'use client';

import useCaseOpsStore from '@/lib/store';
import { CaseDocket } from '@/lib/types';
import { AlertTriangle, CalendarDays, Clock3, Inbox } from 'lucide-react';

const tabs = [
  { id: 'ingestion', label: 'Ingestion', icon: Inbox, count: (d: CaseDocket | null) => d?.evidence.length || 0 },
  { id: 'time-map', label: 'Time Map', icon: Clock3, count: (d: CaseDocket | null) => d?.timeline.length || 0 },
  { id: 'contradictions', label: 'Contradictions', icon: AlertTriangle, count: (d: CaseDocket | null) => d?.contradictions.length || 0 },
  { id: 'deadlines', label: 'Deadlines', icon: CalendarDays, count: (d: CaseDocket | null) => d?.deadlines.length || 0 },
] as const;

export function LeftTabs() {
  const { activeTab, setActiveTab, docket } = useCaseOpsStore();

  return (
    <div className="border-b border-[rgba(56,189,248,0.14)] p-2">
      <div className="grid grid-cols-4 gap-1" role="tablist" aria-label="Investigation views">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded px-1.5 py-1.5 text-[11px] font-medium transition-colors ${
                active
                  ? 'border border-cyan-400/30 bg-cyan-500/10 text-cyan-300'
                  : 'text-slate-400 hover:bg-[#131926] hover:text-slate-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xl:inline truncate">{tab.label}</span>
              <span className={`mono-telemetry rounded px-1 py-0.5 text-[9px] ${active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-[#131926] text-slate-500'}`}>
                {tab.count(docket)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
