'use client';
/**
 * EkDuniya Live — "live telecast", web3-style.
 * v1: real camera preview + live room UI + live chat.
 * Broadcast-to-viewers uses a streaming backend (e.g. LiveKit/Livepeer);
 * until keys are added, the room runs in demo mode — clearly labeled.
 */
import { useEffect, useRef, useState } from 'react';
import { supa, isSupaConfigured } from '../../lib/supabase';
import { RequireAuth } from '../../lib/auth';
import { useLang, Shell } from '../../components/ui';

type LiveRow = { id: string; user_id: string; title: string; status: string; viewer_count: number; started_at: string };

const FAKE_VIEWERS = ['Aarav 🇮🇳', 'Priya 🌸', 'Rohan 🎮', 'Sneha ✨', 'Vikram 🔥', 'Anaya 💫', 'Kabir 🎭', 'Ishita 🌺'];
const FAKE_CHATS = [
  'Namaste! 🙏', 'Bahut badhiya! 👏', 'Kahan se ho? 🇮🇳', '🔥🔥🔥',
  'First time dekh raha hun!', 'Superb stream! ✨', 'Hello from Mumbai! 🌊',
  'Keep going! 💪', 'Nice! 🎉', 'Jai ho! 🙌',
];

export default function Live() {
  return <RequireAuth><LiveHome /></RequireAuth>;
}

function LiveHome() {
  const { t } = useLang();
  const [lives, setLives] = useState<LiveRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [room, setRoom] = useState<{ title: string; id?: string } | null>(null);

  async function load() {
    if (!isSupaConfigured()) return;
    const { data } = await supa().from('av_lives')
      .select('*').eq('status', 'live').order('started_at', { ascending: false }).limit(20);
    if (data) {
      setLives(data as LiveRow[]);
      const ids = Array.from(new Set((data as LiveRow[]).map((l) => l.user_id)));
      if (ids.length) {
        const { data: profs } = await supa().from('av_profiles').select('id,full_name').in('id', ids);
        const m: Record<string, string> = {};
        (profs || []).forEach((p: { id: string; full_name: string }) => (m[p.id] = p.full_name));
        setNames(m);
      }
    }
  }
  useEffect(() => { load(); }, []);

  if (room) return <LiveRoom title={room.title} liveId={room.id} onEnd={() => { setRoom(null); load(); }} />;

  return (
    <Shell title={t('live')} sub="Live telecast — decentralized streaming, web3 style. 📡" wide>
      <div className="card" style={{ textAlign: 'center', padding: 28 }}>
        <div style={{ fontSize: '3rem' }}>📡</div>
        <h2 style={{ margin: '8px 0' }}>Go Live on EkDuniya</h2>
        <p style={{ color: 'var(--mut)' }}>Apne camera se live jao — doston se real-time me judo!</p>
        <GoLiveButton onGo={(title, id) => setRoom({ title, id })} />
        <p className="note" style={{ marginTop: 14, textAlign: 'left' }}>
          v1 demo: tumhara camera preview real hai; viewers ko broadcast ke liye streaming keys (LiveKit/Livepeer) baad me judengi.
        </p>
      </div>
      <h3>🔴 {lives.length > 0 ? 'Live now' : 'Koi live nahi hai'}</h3>
      {lives.map((l) => (
        <div className="card" key={l.id}>
          <div className="posthead">
            <div className="avatar">📡</div>
            <div className="pmeta">
              <b>{l.title}</b>
              <small><span className="livedot" /> LIVE · {(names[l.user_id] || 'Member').split(' ')[0]} · 👁 {l.viewer_count}</small>
            </div>
          </div>
        </div>
      ))}
      {lives.length === 0 && <p style={{ color: 'var(--mut)' }}>Pehle live jao — tumhara stream yahan dikhega! 🎉</p>}
    </Shell>
  );
}

function GoLiveButton({ onGo }: { onGo: (title: string, id?: string) => void }) {
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    let id: string | undefined;
    try {
      if (isSupaConfigured()) {
        const { data: { user } } = await supa().auth.getUser();
        if (user) {
          const { data } = await supa().from('av_lives')
            .insert({ user_id: user.id, title: title.trim() || 'Mera Live Stream 🎥' })
            .select('id').single();
          id = data?.id;
        }
      }
    } catch { /* demo mode */ }
    setBusy(false);
    onGo(title.trim() || 'Mera Live Stream 🎥', id);
  }
  return (
    <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
      <input
        className="input" style={{ maxWidth: 300, margin: 0 }} placeholder="Stream ka title…"
        value={title} onChange={(e) => setTitle(e.target.value)}
      />
      <button className="btn3d red" disabled={busy} onClick={go}>
        {busy ? '…' : '🔴 Go Live'}
      </button>
    </div>
  );
}

function LiveRoom({ title, liveId, onEnd }: { title: string; liveId?: string; onEnd: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [viewers, setViewers] = useState(1);
  const [chats, setChats] = useState<Array<{ who: string; text: string }>>([]);
  const [msg, setMsg] = useState('');
  const [camErr, setCamErr] = useState('');
  const chatBox = useRef<HTMLDivElement>(null);

  // Real camera preview
  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setCamErr('Camera nahi khul saka — browser se camera permission do. (Demo mode me bina camera ke bhi chalega.)');
      }
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  // Simulated viewers + chat (demo)
  useEffect(() => {
    const v = setInterval(() => setViewers((n) => Math.max(1, n + Math.floor(Math.random() * 5) - 1)), 3000);
    const c = setInterval(() => {
      const who = FAKE_VIEWERS[Math.floor(Math.random() * FAKE_VIEWERS.length)];
      const text = FAKE_CHATS[Math.floor(Math.random() * FAKE_CHATS.length)];
      setChats((ch) => [...ch.slice(-29), { who, text }]);
    }, 4500);
    return () => { clearInterval(v); clearInterval(c); };
  }, []);

  useEffect(() => {
    chatBox.current?.scrollTo({ top: chatBox.current.scrollHeight, behavior: 'smooth' });
  }, [chats]);

  async function end() {
    try {
      if (liveId && isSupaConfigured()) {
        await supa().from('av_lives').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', liveId);
      }
    } catch { /* ignore */ }
    onEnd();
  }

  function send() {
    if (!msg.trim()) return;
    setChats((ch) => [...ch.slice(-29), { who: 'Tum ⭐', text: msg.trim() }]);
    setMsg('');
  }

  return (
    <div className="liveroom">
      <div className="lvideo">
        {camErr ? (
          <div className="lnocam">📷<p>{camErr}</p></div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted />
        )}
        <div className="ltop">
          <span className="lbadge"><span className="livedot" /> LIVE</span>
          <span className="lbadge">👁 {viewers}</span>
          <span className="lbadge demo">DEMO</span>
        </div>
        <div className="ltitle">{title}</div>
        <button className="lend" onClick={end}>■ End Stream</button>
      </div>
      <div className="lchat">
        <b style={{ padding: '10px 14px 0' }}>💬 Live chat</b>
        <div className="lchats" ref={chatBox}>
          {chats.map((c, i) => (
            <div key={i} className="lchatmsg"><b>{c.who}:</b> {c.text}</div>
          ))}
          {chats.length === 0 && <p style={{ color: 'var(--mut)', fontSize: '.85rem', padding: '0 14px' }}>Viewers judenge to chat yahan dikhega…</p>}
        </div>
        <div className="lchatbar">
          <input className="input" style={{ margin: 0 }} placeholder="Kuch bolo…" value={msg}
            onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
          <button className="btn violet" style={{ padding: '10px 16px' }} onClick={send}>➤</button>
        </div>
      </div>
    </div>
  );
}
