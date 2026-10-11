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
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Failed to send code.'); }
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
    <Shell title={t('createAccount')} sub="Email + phone OTP. One account for feed, family, briefcase & business.">
      <div className="card" style={{ maxWidth: 480 }}>
        {step === 'form' ? (
          <>
            <input className="input" placeholder={t('fullName')} value={name} onChange={e => setName(e.target.value)} />
            <input className="input" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input" placeholder={`${t('phone')} (e.g. +91 98765 43210)`} value={phone} onChange={e => setPhone(e.target.value)} />
            <div className="note">We send a one-time code to your email. Your phone number is stored with your account — never shown publicly.</div>
            <button className="btn violet" disabled={busy} onClick={sendCode}>{busy ? '…' : t('sendCode')}</button>
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
