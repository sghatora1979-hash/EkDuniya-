'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supa, isSupaConfigured } from '../../lib/supabase';
import { RequireAuth, signOut } from '../../lib/auth';
import { useLang, Shell } from '../../components/ui';

export default function Profile() {
  return <RequireAuth><Editor /></RequireAuth>;
}

function Editor() {
  const { t } = useLang();
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [emoji, setEmoji] = useState('🙂');
  const [email, setEmail] = useState('');
  const [kyc, setKyc] = useState('none');
  const [wallet, setWallet] = useState('');
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const EMOJIS = ['🙂', '👩🏽', '👨🏽', '👩🏽‍🦱', '👨🏽‍🦱', '🧑🏽‍💼', '👵🏽', '👴🏽', '🧕🏽', '👲🏽'];

  const SOCIALS: Array<{ key: string; icon: string; label: string; prefix: string }> = [
    { key: 'telegram', icon: '✈️', label: 'Telegram', prefix: 'https://t.me/' },
    { key: 'facebook', icon: '📘', label: 'Facebook', prefix: 'https://facebook.com/' },
    { key: 'instagram', icon: '📸', label: 'Instagram', prefix: 'https://instagram.com/' },
    { key: 'tiktok', icon: '🎵', label: 'TikTok', prefix: 'https://tiktok.com/@' },
    { key: 'vk', icon: '🔷', label: 'VK', prefix: 'https://vk.com/' },
    { key: 'youtube', icon: '▶️', label: 'YouTube', prefix: 'https://youtube.com/@' },
  ];

  useEffect(() => {
    (async () => {
      if (!isSupaConfigured()) return;
      const { data: { user } } = await supa().auth.getUser();
      if (!user) return;
      setEmail(user.email || '');
      const { data } = await supa().from('av_profiles').select('*').eq('id', user.id).single();
      if (data) {
        setName(data.full_name || ''); setUsername(data.username || '');
        setBio(data.bio || ''); setEmoji(data.avatar_emoji || '🙂');
        setKyc(data.kyc_status || 'none'); setWallet(data.wallet_address || '');
        setSocials((data.social_links as Record<string, string>) || {});
      }
    })();
  }, []);

  async function save() {
    setErr(''); setMsg('');
    try {
      const { data: { user } } = await supa().auth.getUser();
      if (!user) return;
      const { error } = await supa().from('av_profiles').update({
        full_name: name.trim(), username: username.trim().toLowerCase() || null,
        bio: bio.trim(), avatar_emoji: emoji, wallet_address: wallet.trim() || null,
        social_links: socials,
      }).eq('id', user.id);
      if (error) throw error;
      setMsg('Profile saved ✓');
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Save failed.'); }
  }

  async function logout() {
    await signOut();
    router.push('/');
  }

  return (
    <Shell title={t('profile')} sub="One identity across feed, family, briefcase & business.">
      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              style={{ fontSize: '1.8rem', background: emoji === e ? 'rgba(192,132,252,.25)' : 'transparent', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, cursor: 'pointer', padding: 6 }}>
              {e}
            </button>
          ))}
        </div>
        <input className="input" placeholder={t('fullName')} value={name} onChange={e => setName(e.target.value)} />
        <input className="input" placeholder="username (unique)" value={username} onChange={e => setUsername(e.target.value)} />
        <textarea className="input" placeholder="Bio…" value={bio} onChange={e => setBio(e.target.value)} />
        <input className="input" placeholder="Web3 wallet address (optional — W3C DID ready)" value={wallet} onChange={e => setWallet(e.target.value)} />
        <div className="genlabel">🔗 Social links</div>
        {SOCIALS.map(s => (
          <div className="row" key={s.key} style={{ marginBottom: 4 }}>
            <span style={{ fontSize: '1.3rem', width: 34, textAlign: 'center' }} title={s.label}>{s.icon}</span>
            <input
              className="input" style={{ flex: 1, margin: 0 }}
              placeholder={`${s.label} username`}
              value={socials[s.key] || ''}
              onChange={e => setSocials({ ...socials, [s.key]: e.target.value.trim() })}
            />
            {socials[s.key] && (
              <a href={`${s.prefix}${socials[s.key]}`} target="_blank" rel="noopener noreferrer"
                className="btn ghost" style={{ padding: '8px 14px', fontSize: '.85rem' }}>Open ↗</a>
            )}
          </div>
        ))}
        <div className="row" style={{ margin: '10px 0' }}>
          <span className="pill">📧 {email}</span>
          <span className={`pill ${kyc === 'verified' ? 'ok' : 'warn'}`}>🪪 KYC: {kyc}</span>
        </div>
        <button className="btn violet" onClick={save}>Save</button>{' '}
        <button className="btn ghost" onClick={logout}>Log out</button>
        {msg && <p className="ok">{msg}</p>}
        {err && <p className="err">{err}</p>}
      </div>
      <div className="note">
        <b>Web3-ready:</b> add your wallet address to link a decentralized identity (W3C DID).
        Private photos, family records and documents always stay off public blockchains.
      </div>
    </Shell>
  );
}
