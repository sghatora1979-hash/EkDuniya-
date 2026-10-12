'use client';
/**
 * EkDuniya FB/IG hybrid UI: mobile bottom nav, desktop sidebar with Muse AI,
 * Stories carousel, and sponsored posts. All client-side, Supabase-backed.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supa, isSupaConfigured } from '../lib/supabase';
import { useLang } from './ui';

/* ---------------- Mobile bottom nav ---------------- */
const TABS = [
  { href: '/home', icon: '🏠', key: 'home' as const },
  { href: '/reels', icon: '🎬', key: 'reels' as const },
  { href: '/home', icon: '➕', key: 'create' as const },
  { href: '/messages', icon: '💬', key: 'messages' as const },
  { href: '/profile', icon: '👤', key: 'profile' as const },
];

export function MobileNav() {
  const path = usePathname();
  const { t } = useLang();
  return (
    <nav className="mobilenav" aria-label="Primary">
      <div className="mrow">
        {TABS.map((tb) => (
          <Link
            key={tb.key}
            href={tb.href}
            className={tb.key !== 'create' && path === tb.href ? 'active' : ''}
          >
            <span className="mic">{tb.icon}</span>
            {t(tb.key)}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/* ---------------- Desktop sidebar ---------------- */
const SIDE_LINKS: Array<{ href: string; icon: string; key: 'home' | 'reels' | 'live' | 'family' | 'messages' | 'rewards' | 'business' | 'profile' }> = [
  { href: '/home', icon: '🏠', key: 'home' },
  { href: '/reels', icon: '🎬', key: 'reels' },
  { href: '/live', icon: '📡', key: 'live' },
  { href: '/family', icon: '🌳', key: 'family' },
  { href: '/messages', icon: '💬', key: 'messages' },
  { href: '/rewards', icon: '🏆', key: 'rewards' },
  { href: '/business', icon: '💼', key: 'business' },
  { href: '/profile', icon: '👤', key: 'profile' },
];

const MUSE_REPLIES = [
  'Namaste! 🇮🇳 Main Muse hun — EkDuniya ka AI dost. Kuch bhi pucho!',
  'Bahut badhiya sawal! 👏 Iska jawab: EkDuniya me sab kuch sambhav hai — feed, reels, parivaar, sab!',
  'Samajh gaya! 💡 Tip: roz post karo aur 🏆 rewards jeeto!',
  'Wah! 🎉 Tum EkDuniya ke star ho! Kuch aur puchna hai?',
];

export function Sidebar() {
  const { t } = useLang();
  const [q, setQ] = useState('');
  const [chat, setChat] = useState<Array<{ me: boolean; text: string }>>([
    { me: false, text: MUSE_REPLIES[0] },
  ]);

  function ask() {
    if (!q.trim()) return;
    const mine = q.trim();
    setQ('');
    setChat((c) => [...c, { me: true, text: mine }]);
    setTimeout(() => {
      const reply = MUSE_REPLIES[1 + Math.floor(Math.random() * (MUSE_REPLIES.length - 1))];
      setChat((c) => [...c, { me: false, text: reply }]);
    }, 700);
  }

  return (
    <aside className="sidebar">
      <div className="sidecard">
        <h3>🧭 {t('home')}</h3>
        {SIDE_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="sidelink">
            <span className="sic">{l.icon}</span> {t(l.key)}
          </Link>
        ))}
      </div>
      <div className="sidecard aicard">
        <h3>✨ Muse AI</h3>
        <div style={{ maxHeight: 180, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {chat.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.me ? 'flex-end' : 'flex-start',
                background: m.me ? 'var(--acc)' : 'rgba(255,255,255,.7)',
                color: m.me ? '#fff' : 'var(--ink)',
                padding: '7px 11px', borderRadius: 12, fontSize: '.82rem', maxWidth: '92%',
              }}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="airow">
          <input
            className="input" style={{ margin: 0 }} placeholder="Muse se pucho…"
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
          />
          <button className="btn violet" style={{ padding: '10px 16px' }} onClick={ask}>➤</button>
        </div>
      </div>
      <div className="sidecard">
        <h3>⭐ {t('rewards')}</h3>
        <p style={{ fontSize: '.85rem', color: 'var(--mut)', margin: 0 }}>
          Post karo, doston ko jodo, 🏆 jeeto!
        </p>
        <Link href="/rewards" className="btn ghost" style={{ marginTop: 10, fontSize: '.85rem', padding: '8px 18px' }}>
          {t('rewards')} →
        </Link>
      </div>
    </aside>
  );
}

/* ---------------- Stories carousel ---------------- */
export type Story = {
  id: string; user_id: string; caption: string; cover_emoji: string;
  media_url: string | null; created_at: string;
  av_profiles?: { full_name: string };
};

export function StoriesBar({ onSelect }: { onSelect: (stories: Story[], idx: number) => void }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      if (!isSupaConfigured()) return;
      const { data } = await supa()
        .from('av_stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(30);
      if (data) {
        setStories(data as Story[]);
        const ids = Array.from(new Set((data as Story[]).map((s) => s.user_id)));
        if (ids.length) {
          const { data: profs } = await supa().from('av_profiles').select('id,full_name').in('id', ids);
          const m: Record<string, string> = {};
          (profs || []).forEach((p: { id: string; full_name: string }) => (m[p.id] = p.full_name));
          setNames(m);
        }
      }
    })();
  }, []);

  function markSeen(id: string) {
    setSeen((s) => new Set(s).add(id));
  }

  return (
    <div className="stories" aria-label="Stories">
      <Link href="/reels" className="story create" style={{ textDecoration: 'none' }}>
        <div className="ring"><div className="ringin">➕</div></div>
        <small>Create</small>
      </Link>
      {stories.map((s, i) => (
        <div
          key={s.id} className={`story ${seen.has(s.id) ? 'seen' : ''}`}
          onClick={() => { markSeen(s.id); onSelect(stories, i); }}
        >
          <div className="ring"><div className="ringin">{s.cover_emoji}</div></div>
          <small>{(names[s.user_id] || 'Member').split(' ')[0]}</small>
        </div>
      ))}
    </div>
  );
}

export function StoryViewer({ stories, idx, onClose, onNav }: {
  stories: Story[]; idx: number; onClose: () => void; onNav: (i: number) => void;
}) {
  const s = stories[idx];
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick(0);
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    const close = setTimeout(() => {
      if (idx < stories.length - 1) onNav(idx + 1);
      else onClose();
    }, 6000);
    return () => { clearInterval(id); clearTimeout(close); };
  }, [idx]);

  if (!s) return null;
  return (
    <div className="storyviewer" onClick={onClose}>
      <div className="sframe" onClick={(e) => e.stopPropagation()}>
        <div className="sbar">
          {stories.map((_, i) => (
            <i key={i} className={i < idx || (i === idx && tick >= 6) ? 'done' : ''} />
          ))}
        </div>
        <button className="sclose" onClick={onClose}>✕</button>
        <div className="scontent">
          <div className="big">{s.cover_emoji}</div>
          <h3 style={{ margin: '0 0 8px' }}>{s.caption || 'Story'}</h3>
          <small style={{ opacity: .7 }}>{new Date(s.created_at).toLocaleString()}</small>
        </div>
        {idx > 0 && (
          <button className="sclose" style={{ right: 'auto', left: 14 }} onClick={() => onNav(idx - 1)}>‹</button>
        )}
        {idx < stories.length - 1 && (
          <button className="sclose" style={{ top: 'auto', bottom: 20, right: 14 }} onClick={() => onNav(idx + 1)}>›</button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Refer & Earn — share to every app ---------------- */
export function ShareButtons({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const eu = encodeURIComponent(url);
  const et = encodeURIComponent(text);

  const APPS = [
    { name: 'WhatsApp', icon: '💚', cls: 'green', href: `https://wa.me/?text=${et}%20${eu}` },
    { name: 'Telegram', icon: '✈️', cls: 'sky', href: `https://t.me/share/url?url=${eu}&text=${et}` },
    { name: 'Facebook', icon: '📘', cls: 'blue', href: `https://www.facebook.com/sharer/sharer.php?u=${eu}` },
    { name: 'Messenger', icon: '💬', cls: 'blue', href: `fb-messenger://share?link=${eu}` },
    { name: 'LinkedIn', icon: '💼', cls: 'blue', href: `https://www.linkedin.com/sharing/share-offsite/?url=${eu}` },
    { name: 'Instagram', icon: '📸', cls: 'pink', href: undefined },
  ];

  async function nativeShare() {
    try {
      if (navigator.share) await navigator.share({ title: 'EkDuniya', text, url });
    } catch { /* dismissed */ }
  }

  function copy() {
    navigator.clipboard?.writeText(`${text} ${url}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: 'center' }}>
        {typeof navigator !== 'undefined' && (navigator as Navigator & { share?: unknown }).share && (
          <button className="btn3d" onClick={nativeShare}>📤 Share…</button>
        )}
        {APPS.map((a) =>
          a.href ? (
            <a key={a.name} className={`btn3d ${a.cls}`} style={{ padding: '12px 18px', fontSize: '.9rem' }}
              href={a.href} target="_blank" rel="noopener noreferrer" title={`Share on ${a.name}`}>
              {a.icon} {a.name}
            </a>
          ) : (
            <button key={a.name} className={`btn3d ${a.cls}`} style={{ padding: '12px 18px', fontSize: '.9rem' }}
              onClick={copy} title="Copy link — paste it in Instagram DM or story">
              {a.icon} {a.name}
            </button>
          )
        )}
        <button className="btn3d gold" style={{ padding: '12px 18px', fontSize: '.9rem' }} onClick={copy}>
          {copied ? '✓ Copied!' : '🔗 Copy link'}
        </button>
      </div>
      {copied && <p className="ok" style={{ textAlign: 'center' }}>Link copied — paste it anywhere! 📋</p>}
    </div>
  );
}

export function ReferCard() {
  const [refUrl, setRefUrl] = useState('https://ek-duniya.vercel.app/welcome');
  useEffect(() => {
    (async () => {
      try {
        if (!isSupaConfigured()) return;
        const { data: { user } } = await supa().auth.getUser();
        const base = typeof window !== 'undefined' ? window.location.origin : 'https://ek-duniya.vercel.app';
        setRefUrl(user ? `${base}/welcome?ref=${user.id.slice(0, 8)}` : `${base}/welcome`);
      } catch { /* keep default */ }
    })();
  }, []);
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem' }}>🎁</div>
      <h3 style={{ margin: '6px 0' }}>Refer a Friend — sab jagah share karo!</h3>
      <p style={{ color: 'var(--mut)', fontSize: '.92rem' }}>
        Dost judega to tumhe <b>+50 🏆</b> coins! WhatsApp, Telegram, Facebook, Messenger, LinkedIn, Instagram — kahin bhi bhejo!
      </p>
      <div className="note" style={{ wordBreak: 'break-all', fontSize: '.82rem' }}>{refUrl}</div>
      <ShareButtons
        url={refUrl}
        text="EkDuniya join karo — India ka apna social network! 🇮🇳 Feed, Clips, Live, Family Tree — sab kuch ek jagah!"
      />
    </div>
  );
}

/* ---------------- Sponsored posts ---------------- */
const SPONSORS = [
  { name: 'Calm Horizons', emoji: '🌅', text: 'Find your peace — meditation retreats across the Himalayas. Book your escape today!', cta: 'Learn more' },
  { name: 'Articulate', emoji: '🎨', text: 'Speak 22 Indian languages fluently! Join 2 lakh+ learners on Articulate.', cta: 'Try free' },
  { name: 'Desi Dhaaga', emoji: '🧵', text: 'Handloom sarees, direct from weavers. Festive collection — up to 40% off!', cta: 'Shop now' },
];

export function SponsoredCard({ seed = 0 }: { seed?: number }) {
  const s = SPONSORS[seed % SPONSORS.length];
  return (
    <div className="card sponsored">
      <span className="sponlabel">Sponsored</span>
      <div className="posthead">
        <div className="avatar">{s.emoji}</div>
        <div className="pmeta"><b>{s.name}</b><small>Sponsored · EkDuniya Ads</small></div>
      </div>
      <p className="ptext">{s.text}</p>
      <div className="pactions">
        <button className="btn violet" style={{ padding: '8px 20px', fontSize: '.88rem' }}>{s.cta} →</button>
      </div>
    </div>
  );
}
