'use client';
import Link from 'next/link';
import { useLang } from '../components/ui';

export default function Landing() {
  const { t } = useLang();
  const feats: [string, string, string][] = [
    ['📝', 'Social Feed', 'Posts, photos, hashtags — India\u2019s public digital square.'],
    ['🎬', 'Reels & Live', 'Short clips and live broadcasts with creator rewards.'],
    ['🌳', 'Family Tree', 'From great-grandparents to 2026 — stories, dates, albums.'],
    ['💼', 'Briefcase Vault', 'Password-locked locker for documents & private photos.'],
    ['💼', 'Business Network', 'Profiles, jobs, company pages, local shops.'],
    ['💬', 'Messages', 'Private chats & groups — colour changes every day.'],
    ['🏆', 'Rewards', 'Earn coins for genuine engagement. Fraud-proof by design.'],
    ['🪪', 'Verified Identity', 'Email + phone OTP. Optional ID check via approved methods only.'],
    ['🌐', 'Web3-Ready', 'Decentralized identity (W3C DIDs) — your data, your control.'],
  ];
  return (
    <div className="wrap">
      <div className="hero">
        <h1>🇮🇳 EkDuniya</h1>
        <p>{t('tagline')}</p>
        <div className="tricolor" />
        <Link href="/welcome" className="btn">✨ Take the tour</Link>{' '}
        <Link href="/register" className="btn ghost">{t('createAccount')} — free</Link>{' '}
        <Link href="/login" className="btn ghost">{t('login')}</Link>
        <div className="feats">
          {feats.map(([e, title, d]) => (
            <div className="feat" key={title}><b>{e} {title}</b><span>{d}</span></div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 26, textAlign: 'left' }}>
          <b>Building honestly:</b> v1 uses real Supabase auth + database. We never ask for or display your Aadhaar number —
          ID checks happen only through approved, compliant methods. Private photos and documents stay off public blockchains.
        </div>
      </div>
    </div>
  );
}
