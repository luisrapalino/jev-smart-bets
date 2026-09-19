'use client';

import { useState } from 'react';

import { AiPromptBar } from '@/components/ai-prompt-bar';
import { AiSuggestionsFeed } from '@/components/ai-suggestions-feed';
import { MatchFeed } from '@/components/match-feed';
import { BetslipDrawer } from '@/components/betslip-drawer';
import type { JevBetResponse } from '@/lib/jev/schemas';

export default function DashboardPage() {
  const [jevResult, setJevResult] = useState<JevBetResponse | null>(null);
  const [jevLoading, setJevLoading] = useState(false);

  function handleJevResult(result: JevBetResponse | null, loading: boolean) {
    setJevLoading(loading);
    if (!loading) setJevResult(result);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 pb-24">
      <AiPromptBar onResult={handleJevResult} />

      {(jevLoading || jevResult) && (
        <AiSuggestionsFeed result={jevResult} isLoading={jevLoading} />
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold">Partidos en vivo y proximos</h2>
        <MatchFeed />
      </div>

      <BetslipDrawer />
    </div>
  );
}
