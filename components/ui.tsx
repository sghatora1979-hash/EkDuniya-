'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getLang, setLang, tr, LANGS, type Lang, type StrKey } from '../lib/i18n';
import { hourTheme, applyTheme, msToNextHour, type HourTheme } from '../lib/theme';
import { MobileNav, Sidebar } from './hybrid';

export function useLang() {
  const [lang, setL] = useState<Lang>('en');
  useEffect(() => setL(getLang()), []);
  const switchLang = (l: Lang) => { setLang(l); setL(l); };
  const t = (k: StrKey) => tr(k, lang);
  return { lang, switchLang, t };
}

// Applies the hourly futuristic theme + shows the current theme badge
export function useHourTheme() {
  const [theme, setTheme] = useState<HourTheme>(hourTheme());
  useEffect(() => {
    const tick = () => setTheme(hourTheme());
    applyTheme(hourTheme());
    const t1 = setInterval(() => { const th = hourTheme(); setTheme(th); applyTheme(th); }, 60000);
    const t2 = setTimeout(function roll() {
      const th = hourTheme(); setTheme(th); applyTheme(th);
      setTimeout(roll, msToNextHour());
    }, msToNextHour());
    return () => { clearInterval(t1); clearTimeout(t2); };
  }, []);
  return theme;
}

export function ThemeBadge() {
  const theme = useHourTheme();
  return (
    <span className="themebadge" title="Theme changes every hour">
      <span className="themedot" /> {theme.name} · new theme hourly
    </span>
  );
}

export function Navbar() {
  const { lang, switchLang, t } = useLang();
  const links: [string, StrKey][] = [
    ['/home', 'home'], ['/reels', 'reels'], ['/live', 'live'], ['/family', 'family'],
    ['/briefcase', 'briefcase'], ['/messages', 'messages'],
    ['/rewards', 'rewards'], ['/business', 'business'], ['/profile', 'profile'],
  ];
  return (
    <nav className="nav">
      <Link href="/" className="logo">🇮🇳 EkDuniya</Link>
      <div className="navlinks">
        {links.map(([h, k]) => <Link key={h} href={h}>{t(k)}</Link>)}
      </div>
      <select
        className="langbtn"
        value={lang}
        onChange={e => switchLang(e.target.value as Lang)}
        aria-label="Language"
      >
        {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </nav>
  );
}

export function Shell({ children, title, sub, wide = false }: {
  children: React.ReactNode; title: string; sub?: string; wide?: boolean;
}) {
  return (
    <div className="wrap">
      <Navbar />
      <main className="main">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h1 className="ptitle" style={{ margin: '14px 0 4px' }}>{title}</h1>
          <ThemeBadge />
        </div>
        {sub && <p className="psub">{sub}</p>}
        {wide ? (
          <div className="hybrid">
            <div className="feed-col">{children}</div>
            <Sidebar />
          </div>
        ) : (
          children
        )}
      </main>
      <footer className="foot">EkDuniya 🇮🇳 — Made for India · Web3-ready · v1</footer>
      <MobileNav />
    </div>
  );
}

// Daily rotating message colour — 7 colours, changes every day
export const DAY_COLORS = ['#FF6B35', '#8B5CF6', '#059669', '#DC2626', '#2563EB', '#DB2777', '#CA8A04'];
export function dayColor(): string {
  return DAY_COLORS[Math.floor(Date.now() / 86400000) % DAY_COLORS.length];
}
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
