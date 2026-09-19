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
  const [jevLatency, setJevLatency] = useState<number | undefined>(undefined);

  function handleJevResult(
    result: JevBetResponse | null,
    loading: boolean,
    latencyMs?: number
  ) {
    setJevLoading(loading);
    if (!loading) {
      setJevResult(result);
      setJevLatency(latencyMs);
    }
  }

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <div className="flex flex-col gap-3 px-4 py-4">
        <AiPromptBar onResult={handleJevResult} />
        {(jevLoading || jevResult) && (
          <AiSuggestionsFeed
            result={jevResult}
            isLoading={jevLoading}
            latencyMs={jevLatency}
          />
        )}
      </div>

      <MatchFeed />
      <BetslipDrawer />
    </div>
  );
}
