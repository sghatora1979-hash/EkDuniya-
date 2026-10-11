'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supa, isSupaConfigured } from './supabase';

export type Session = { id: string; email: string } | null;

export function useSession() {
  const router = useRouter();
  const [session, setSession] = useState<Session>(undefined as unknown as Session);
  useEffect(() => {
    if (!isSupaConfigured()) { setSession(null); return; }
    supa().auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setSession(u ? { id: u.id, email: u.email || '' } : null);
    });
    const { data: sub } = supa().auth.onAuthStateChange((_e, s) => {
      const u = s?.user;
      setSession(u ? { id: u.id, email: u.email || '' } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  useEffect(() => {
    if (session === null) router.replace('/login');
  }, [session, router]);
  if (session === undefined) return <div className="wrap"><p style={{ padding: 40 }}>Loading…</p></div>;
  if (session === null) return null;
  return <>{children}</>;
}

export async function signOut() {
  if (isSupaConfigured()) await supa().auth.signOut();
}
