'use client';
import { useEffect, useRef, useState } from 'react';
import { supa, isSupaConfigured } from '../../lib/supabase';
import { RequireAuth } from '../../lib/auth';
import { useLang, Shell } from '../../components/ui';

type Reel = { id: string; user_id: string; title: string; cover_emoji: string; views: number; created_at: string; av_profiles?: { full_name: string } };
const EMOJIS = ['🎬', '💃', '🎭', '🎪', '🪔', '🏏', '🎶', '🍛'];
const BG = ['#4c1d95', '#701a5c', '#0c4a6e', '#14532d', '#7c2d12', '#1e1b4b'];

export default function Reels() {
  return <RequireAuth><ReelGrid /></RequireAuth>;
}

function ReelGrid() {
  const { t } = useLang();
  const [reels, setReels] = useState<Reel[]>([]);
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎬');
  const [watch, setWatch] = useState<number | null>(null);
  const touchY = useRef<number | null>(null);

  async function load() {
    if (!isSupaConfigured()) return;
    const { data } = await supa().from('av_reels').select('*').order('created_at', { ascending: false }).limit(40);
    if (data) setReels(data as Reel[]);
  }
  useEffect(() => { load(); }, []);

  async function publish() {
    if (!title.trim()) return;
    const { data: { user } } = await supa().auth.getUser();
    if (!user) return;
    await supa().from('av_reels').insert({ user_id: user.id, title: title.trim(), cover_emoji: emoji });
    setTitle(''); await load();
  }

  return (
    <Shell title={t('reels')} sub="Short clips, desi style. Video upload via storage in v1.1." wide>
      <div className="card">
        <div className="row">
          <input className="input" style={{ flex: 1, margin: 0 }} placeholder="Clip title…" value={title} onChange={e => setTitle(e.target.value)} />
          <select className="input" style={{ width: 90, margin: 0 }} value={emoji} onChange={e => setEmoji(e.target.value)}>
            {EMOJIS.map(e => <option key={e}>{e}</option>)}
          </select>
          <button className="btn violet" onClick={publish}>{t('post')}</button>
        </div>
      </div>
      <div className="reelgrid">
        {reels.map((r, i) => (
          <div className="reel" key={r.id} style={{ ['--rc' as string]: BG[i % BG.length] }} onClick={() => setWatch(i)}>
            <div style={{ fontSize: '2.2rem' }}>{r.cover_emoji}</div>
            <b>{r.title}</b>
            <small>👁 {r.views} views · tap to watch</small>
          </div>
        ))}
      </div>
      {reels.length === 0 && <div className="card"><p style={{ color: 'var(--mut)' }}>No clips yet — post the first one! 🎬</p></div>}
      {watch !== null && reels[watch] && (
        <Viewer reel={reels[watch]} color={BG[watch % BG.length]}
          onClose={() => setWatch(null)}
          onNext={() => setWatch((watch + 1) % reels.length)}
          onPrev={() => setWatch((watch - 1 + reels.length) % reels.length)} />
      )}
    </Shell>
  );
}

function Viewer({ reel, color, onClose, onNext, onPrev }: {
  reel: Reel; color: string; onClose: () => void; onNext: () => void; onPrev: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const touchY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (dy < -60) onNext();
    else if (dy > 60) onPrev();
    touchY.current = null;
  };
  return (
    <div className="viewer" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="stage" style={{ background: `linear-gradient(180deg, ${color} 0%, #000 130%)` }}>
        <button className="close" onClick={onClose}>✕</button>
        <div className="vemoji">{reel.cover_emoji}</div>
        <h2>{reel.title}</h2>
        <p style={{ color: 'rgba(255,255,255,.75)' }}>👁 {reel.views} views</p>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="vlike" onClick={() => setLiked(!liked)}>{liked ? '❤️' : '🤍'}</button>
        </div>
        <p className="hint">👆 Swipe up / down for next reel</p>
      </div>
    </div>
  );
}
