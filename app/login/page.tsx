'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supa, isSupaConfigured } from '../../lib/supabase';
import { useLang, Shell } from '../../components/ui';

export default function Login() {
  const { t } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setErr(''); setMsg(''); setBusy(true);
    try {
      if (!isSupaConfigured()) throw new Error('Database not connected yet.');
      const { error } = await supa().auth.signInWithOtp({ email: email.trim() });
      if (error) throw error;
      setStep('otp'); setMsg(t('codeSent'));
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Failed.'); }
    finally { setBusy(false); }
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
    <Shell title={t('login')} sub="One-time code — no passwords to forget.">
      <div className="card" style={{ maxWidth: 440 }}>
        {step === 'form' ? (
          <>
            <input className="input" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} />
            <button className="btn violet" disabled={busy} onClick={sendCode}>{busy ? '…' : t('sendCode')}</button>
          </>
        ) : (
          <>
            <input className="input" placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value)} maxLength={6} />
            <button className="btn violet" disabled={busy} onClick={verify}>{busy ? '…' : t('verify')}</button>
          </>
        )}
        {msg && <p className="ok">{msg}</p>}
        {err && <p className="err">{err}</p>}
        <p style={{ marginTop: 14 }}><small>No account? <Link href="/register">Create one</Link></small></p>
      </div>
    </Shell>
  );
}
