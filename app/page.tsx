'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import useCaseOpsStore from '@/lib/store';

const AppShell = dynamic(() => import('@/components/AppShell').then((m) => m.AppShell), { ssr: false });

export default function Page() {
  const initDemo = useCaseOpsStore((s) => s.initDemo);

  useEffect(() => {
    initDemo();
  }, [initDemo]);

  return (
    <div className="h-screen w-screen p-2">
      <div className="h-full w-full overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#0E0C12]">
        <AppShell />
      </div>
    </div>
  );
}
