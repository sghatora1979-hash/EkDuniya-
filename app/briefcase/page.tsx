'use client';
import { useEffect, useState } from 'react';
import { supa, isSupaConfigured } from '../../lib/supabase';
import { RequireAuth } from '../../lib/auth';
import { useLang, Shell } from '../../components/ui';

type Item = { id: string; title: string; kind: string; file_url: string | null; created_at: string };

export default function Briefcase() {
  return <RequireAuth><Vault /></RequireAuth>;
}

function Vault() {
  const { t } = useLang();
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [hasPw, setHasPw] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('doc');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    try { setHasPw(!!localStorage.getItem('av_vault_pw')); } catch {}
  }, []);

  async function load() {
    if (!isSupaConfigured()) return;
    const { data: { user } } = await supa().auth.getUser();
    if (!user) return;
    const { data } = await supa().from('av_vault').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setItems(data as Item[]);
  }

  function setupPw() {
    if (newPw.length < 4) { setErr('PIN must be 4+ characters.'); return; }
    try { localStorage.setItem('av_vault_pw', newPw); } catch {}
    setHasPw(true); setUnlocked(true); setNewPw(''); setErr('');
    load();
  }
  function unlock() {
    try {
      if (pw === localStorage.getItem('av_vault_pw')) { setUnlocked(true); setErr(''); setPw(''); load(); }
      else setErr('Wrong PIN.');
    } catch { setErr('Wrong PIN.'); }
  }

  async function upload() {
    if (!title.trim() || busy) return;
    setBusy(true); setErr('');
    try {
      const { data: { user } } = await supa().auth.getUser();
      if (!user) throw new Error('Not logged in.');
      let fileUrl: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}_${file.name}`;
        const { error } = await supa().storage.from('av-vault').upload(path, file);
        if (error) throw error;
        fileUrl = path;
      }
      const { error } = await supa().from('av_vault').insert({ user_id: user.id, title: title.trim(), kind, file_url: fileUrl });
      if (error) throw error;
      setTitle(''); setFile(null); await load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Upload failed.'); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    await supa().from('av_vault').delete().eq('id', id);
    await load();
  }

  if (!unlocked) {
    return (
      <Shell title={t('briefcase')} sub="Your private digital locker.">
        <div className="card vaultlock">
          <div style={{ fontSize: '3.5rem' }}>🔐</div>
          <h2>{hasPw ? 'Enter your Briefcase PIN' : 'Set your Briefcase PIN'}</h2>
          <p style={{ color: 'var(--mut)' }}>
            {hasPw
              ? 'Nobody can open it without your PIN — not even us.'
              : 'Choose a PIN. It locks your documents & private photos on this device.'}
          </p>
          <input
            className="input" style={{ maxWidth: 260, margin: '10px auto', textAlign: 'center' }}
            type="password" placeholder="••••"
            value={hasPw ? pw : newPw}
            onChange={e => hasPw ? setPw(e.target.value) : setNewPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (hasPw ? unlock() : setupPw())}
          />
          <br />
          <button className="btn violet" onClick={hasPw ? unlock : setupPw}>{hasPw ? 'Unlock' : 'Set PIN & open'}</button>
          {err && <p className="err">{err}</p>}
          <div className="note" style={{ textAlign: 'left', marginTop: 18 }}>
            v1 honesty: the PIN gates access in your browser and files sit in a <b>private</b> storage bucket.
            True end-to-end encryption (where even the server can't read files) ships in v2.
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={t('briefcase')} sub="🔓 Unlocked — private to you.">
      <div className="card">
        <div className="row">
          <input className="input" style={{ flex: 2, margin: 0 }} placeholder="Title — e.g. Property papers" value={title} onChange={e => setTitle(e.target.value)} />
          <select className="input" style={{ flex: 1, margin: 0 }} value={kind} onChange={e => setKind(e.target.value)}>
            <option value="doc">📄 Document</option>
            <option value="photo">📸 Photo</option>
          </select>
        </div>
        <input className="input" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button className="btn violet" disabled={busy} onClick={upload}>{busy ? '…' : '+ Lock it in Briefcase'}</button>
        {err && <p className="err">{err}</p>}
      </div>
      {items.map(it => (
        <div className="vaultitem" key={it.id}>
          <div className="ic">{it.kind === 'photo' ? '📸' : '📄'}</div>
          <div style={{ flex: 1 }}>
            <b>{it.title}</b>
            <br /><small style={{ color: 'var(--mut)' }}>{new Date(it.created_at).toLocaleDateString()}{it.file_url ? ' · file stored privately' : ''}</small>
          </div>
          <button onClick={() => remove(it.id)} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
        </div>
      ))}
      {items.length === 0 && <div className="note">Empty locker. Add documents, certificates, family photos — all private. 🔐</div>}
      <button className="btn ghost" onClick={() => setUnlocked(false)}>🔒 Lock Briefcase</button>
    </Shell>
  );
}
