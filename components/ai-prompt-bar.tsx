'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JevBetResponseSchema, type JevBetResponse } from '@/lib/jev/schemas';

const EXAMPLE_PROMPT = 'Combinada de bajo riesgo para los partidos de Champions de hoy';

export function AiPromptBar({
  onResult,
}: {
  onResult: (result: JevBetResponse | null, loading: boolean) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    onResult(null, true);

    try {
      const res = await fetch('/api/jev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? 'Error procesando la solicitud');
      }

      const parsed = JevBetResponseSchema.parse(json.data);
      onResult(parsed, false);
    } catch {
      setError('No se pudo interpretar tu solicitud. Intenta de nuevo.');
      onResult(null, false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="text-primary absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={EXAMPLE_PROMPT}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading || !prompt.trim()}>
          {isLoading ? 'Pensando...' : 'Preguntar a Jev'}
        </Button>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </form>
  );
}
