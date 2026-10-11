'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { applyTheme, hourTheme } from '../../lib/theme';

const SLIDES: [string, string, string][] = [
  ['🌍', 'One World', 'EkDuniya — one identity for your social life, family, business and private locker. Made for India, ready for the world.'],
  ['🌳', 'Family, Forever', 'Build your family tree from great-grandparents to 2026. Save stories, dates and albums for generations.'],
  ['💼', 'Your Private Briefcase', 'A PIN-locked vault for documents and precious photos. Only you hold the key.'],
  ['🎬', 'Reels, Live & Rewards', 'Post clips, go live, earn EkDuniya Coins for genuine engagement.'],
  ['🌐', '22 Languages, Web3-Ready', 'Chat in your mother tongue — colour themes change every hour. Own your identity with decentralized tech.'],
];

export default function Welcome() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);

  useEffect(() => { applyTheme(hourTheme()); }, []);

  function done() {
    try { localStorage.setItem('ek_seen', '1'); } catch {}
    router.push('/');
  }

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx < -50 && i < SLIDES.length - 1) setI(i + 1);
    if (dx > 50 && i > 0) setI(i - 1);
    touchX.current = null;
  };

  const [emoji, title, text] = SLIDES[i];
  return (
    <div className="wrap">
      <div className="onboard" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="emoji" key={i}>{emoji}</div>
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="dots">
          {SLIDES.map((_, d) => <span key={d} className={d === i ? 'on' : ''} />)}
        </div>
        <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
          {i > 0 && <button className="btn ghost" onClick={() => setI(i - 1)}>← Back</button>}
          {i < SLIDES.length - 1
            ? <button className="btn" onClick={() => setI(i + 1)}>Next →</button>
            : <button className="btn" onClick={done}>Enter EkDuniya 🚀</button>}
        </div>
        <p style={{ marginTop: 18 }}>
          <Link href="/" style={{ color: 'var(--mut)', fontSize: '.9rem' }}>Skip</Link>
        </p>
        <p className="hint" style={{ color: 'var(--mut)', fontSize: '.8rem' }}>👆 Swipe left / right</p>
      </div>
    </div>
  );
}
