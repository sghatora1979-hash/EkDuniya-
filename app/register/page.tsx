'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supa, isSupaConfigured } from '../../lib/supabase';
import { useLang, Shell } from '../../components/ui';

export default function Register() {
  const { t } = useLang();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setErr(''); setMsg(''); setBusy(true);
    try {
      if (!isSupaConfigured()) throw new Error('Database not connected yet — connect Supabase keys first.');
      if (!email.includes('@')) throw new Error('Enter a valid email.');
      const { error } = await supa().auth.signInWithOtp({
        email: email.trim(),
        options: { data: { full_name: name.trim(), phone: phone.trim() } },
      });
      if (error) throw error;
      setStep('otp');
      setMsg(t('codeSent'));
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : 'Failed to send code.';
      // "Failed to fetch" = the app could not reach Supabase at all.
      // Give the exact fix instead of a cryptic error.
      if (/failed to fetch|networkerror|load failed/i.test(m)) {
        setErr('Could not reach the database. In Vercel → Settings → Environment Variables, check that NEXT_PUBLIC_SUPABASE_URL is your full project URL (https://xyz.supabase.co) and NEXT_PUBLIC_SUPABASE_ANON_KEY is set, then Redeploy. (Keys must be saved before the build.)');
      } else {
        setErr(m);
      }
    }
    finally { setBusy(false); }
  }

  async function testConnection() {
    setErr(''); setMsg(''); setBusy(true);
    try {
      if (!isSupaConfigured()) throw new Error('Keys missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables, then Redeploy.');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      // Lightweight reachability check — no auth needed.
      const r = await fetch(`${url}/auth/v1/health`, { method: 'GET' });
      if (!r.ok) throw new Error(`Database answered with status ${r.status} — the URL may be wrong or the project paused/deleted.`);
      setMsg('Database reachable ✓ — the connection is fine. If signup still fails, check that Email auth is enabled in Supabase → Authentication → Providers.');
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : 'Connection test failed.';
      if (/failed to fetch|networkerror|load failed/i.test(m)) {
        setErr('Cannot reach the database URL at all. Double-check NEXT_PUBLIC_SUPABASE_URL in Vercel (must start with https:// and end with .supabase.co), save, and Redeploy.');
      } else setErr(m);
    } finally { setBusy(false); }
  }

  async function verify() {
    setErr(''); setBusy(true);
    try {
      const { error } = await supa().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
      if (error) throw error;
      router.push('/home');
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Invalid code.'); }
    finally { setBusy(false); }
  }

  return (
    <Shell title={t('createAccount')} sub="Email + phone OTP. One account for feed, family, briefcase & business.">
      <div className="card" style={{ maxWidth: 480 }}>
        {step === 'form' ? (
          <>
            <input className="input" placeholder={t('fullName')} value={name} onChange={e => setName(e.target.value)} />
            <input className="input" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input" placeholder={`${t('phone')} (e.g. +91 98765 43210)`} value={phone} onChange={e => setPhone(e.target.value)} />
            <div className="note">We send a one-time code to your email. Your phone number is stored with your account — never shown publicly.</div>
            <button className="btn violet" disabled={busy} onClick={sendCode}>{busy ? '…' : t('sendCode')}</button>{' '}
            <button className="btn ghost" disabled={busy} onClick={testConnection} title="Check whether the app can reach the database">Test connection</button>
          </>
        ) : (
          <>
            <p>Enter the 6-digit code sent to <b>{email}</b>:</p>
            <input className="input" placeholder="123456" value={code} onChange={e => setCode(e.target.value)} maxLength={6} />
            <button className="btn violet" disabled={busy} onClick={verify}>{busy ? '…' : t('verify')}</button>{' '}
            <button className="btn ghost" onClick={() => setStep('form')}>Back</button>
          </>
        )}
        {msg && <p className="ok">{msg}</p>}
        {err && <p className="err">{err}</p>}
      </div>
    </Shell>
  );
}
