'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

async function fetchMe(): Promise<{ email: string } | null> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) return null;
  const json = await res.json();
  return json.user;
}

export function AuthWidget() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({ queryKey: ['auth-me'], queryFn: fetchMe });
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestLink = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo enviar el link');
      return json as { devLink?: string };
    },
    onSuccess: (json) => {
      setError(null);
      // Sin proveedor de email configurado, el link se muestra aca en
      // vez de mandarse (modo demo, ver send-magic-link-email.ts).
      setSent(json.devLink ?? 'Revisa tu correo: te mandamos un link para entrar.');
    },
    onError: (err: Error) => setError(err.message),
  });

  const logout = useMutation({
    mutationFn: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth-me'] }),
  });

  if (isLoading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-chalk-dim hidden truncate sm:inline">{user.email}</span>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          title="Cerrar sesion"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="size-3.5" strokeWidth={1.5} />
        </Button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="max-w-[220px] truncate text-right text-[11px]">
        {sent.startsWith('http') ? (
          <a href={sent} className="text-bulb underline">
            Entrar (modo demo)
          </a>
        ) : (
          <span className="text-price-up">{sent}</span>
        )}
      </div>
    );
  }

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (email) requestLink.mutate();
      }}
    >
      <Input
        type="email"
        required
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-7 w-32 text-xs sm:w-40"
      />
      <Button
        type="submit"
        size="icon"
        variant="outline"
        className="size-7 shrink-0"
        title="Entrar con magic link"
        disabled={requestLink.isPending}
      >
        <Mail className="size-3.5" strokeWidth={1.5} />
      </Button>
      {error && <span className="text-destructive text-[11px]">{error}</span>}
    </form>
  );
}
