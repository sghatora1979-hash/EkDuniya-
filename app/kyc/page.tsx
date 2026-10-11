'use client';
import { useEffect, useState } from 'react';
import { supa, isSupaConfigured } from '../../lib/supabase';
import { RequireAuth } from '../../lib/auth';
import { useLang, Shell } from '../../components/ui';

type Doc = { id: string; doc_type: string; status: string; created_at: string };

export default function Kyc() {
  return <RequireAuth><Verify /></RequireAuth>;
}

function Verify() {
  const { t } = useLang();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docType, setDocType] = useState('aadhaar');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  async function load() {
    if (!isSupaConfigured()) return;
    const { data: { user } } = await supa().auth.getUser();
    if (!user) return;
    const { data } = await supa().from('av_kyc').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setDocs(data as Doc[]);
  }
  useEffect(() => { load(); }, []);

  async function upload() {
    if (!file || busy) return;
    setBusy(true); setErr(''); setOk('');
    try {
      const { data: { user } } = await supa().auth.getUser();
      if (!user) throw new Error('Not logged in.');
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supa().storage.from('av-kyc').upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supa().from('av_kyc').insert({ user_id: user.id, doc_type: docType, file_url: path, status: 'pending' });
      if (error) throw error;
      setFile(null); setOk('Document received — status: pending review.');
      await load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Upload failed.'); }
    finally { setBusy(false); }
  }

  return (
    <Shell title={t('kyc')} sub="Optional. Verified badge for trusted accounts.">
      <div className="note">
        <b>Our promise:</b> we <b>never</b> ask you to publish or share your Aadhaar number publicly.
        Documents go to a <b>private</b> bucket, visible only to you. Status becomes "verified" only through an
        approved, compliant verification process — never automatically.
      </div>
      <div className="card">
        <div className="row">
          <select className="input" style={{ flex: 1, margin: 0 }} value={docType} onChange={e => setDocType(e.target.value)}>
            <option value="aadhaar">Aadhaar (masked copy recommended)</option>
            <option value="pan">PAN</option>
            <option value="voter">Voter ID</option>
            <option value="passport">Passport</option>
          </select>
          <input className="input" style={{ flex: 2, margin: 0 }} type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
        <div style={{ marginTop: 10 }}>
          <button className="btn violet" disabled={busy || !file} onClick={upload}>{busy ? '…' : 'Submit for review'}</button>
        </div>
        {ok && <p className="ok">{ok}</p>}
        {err && <p className="err">{err}</p>}
      </div>
      <h3>Your submissions</h3>
      {docs.map(d => (
        <div className="vaultitem" key={d.id}>
          <div className="ic">🪪</div>
          <div style={{ flex: 1 }}>
            <b style={{ textTransform: 'capitalize' }}>{d.doc_type}</b>
            <br /><small style={{ color: 'var(--mut)' }}>{new Date(d.created_at).toLocaleDateString()}</small>
          </div>
          <span className={`pill ${d.status === 'verified' ? 'ok' : 'warn'}`}>{d.status}</span>
        </div>
      ))}
      {docs.length === 0 && <p style={{ color: 'var(--mut)' }}>No documents submitted yet.</p>}
    </Shell>
  );
}
