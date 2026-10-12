'use client';
import { useEffect, useState } from 'react';
import { supa, isSupaConfigured } from '../../lib/supabase';
import { RequireAuth } from '../../lib/auth';
import { useLang, Shell } from '../../components/ui';
import { ReferCard } from '../../components/hybrid';

export default function Rewards() {
  return <RequireAuth><Wallet /></RequireAuth>;
}

function Wallet() {
  const { t } = useLang();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    (async () => {
      if (!isSupaConfigured()) return;
      const { data: { user } } = await supa().auth.getUser();
      if (!user) return;
      const { data } = await supa().from('av_rewards').select('points').eq('user_id', user.id).single();
      if (data) setPoints(data.points);
    })();
  }, []);

  const badges = [
    ['🌱', 'New Member', points >= 100],
    ['📝', 'First Post', points >= 110],
    ['🔥', 'Rising Star', points >= 500],
    ['⭐', 'Creator', points >= 1000],
    ['💎', 'Apna Legend', points >= 5000],
  ];

  return (
    <Shell title={t('rewards')} sub="Earn for genuine engagement. Fraud-proof by design.">
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="rewardbig">🏆 {points.toLocaleString()}</div>
        <p style={{ color: 'var(--mut)' }}>EkDuniya Coins</p>
        <div className="note" style={{ textAlign: 'left' }}>
          <b>How earning works (v1):</b> +100 on signup · +10 per post · more actions coming.
          Rewards pay out only for genuine activity — spam and fake engagement earn nothing and can lose coins.
        </div>
      </div>
      <h3 style={{ marginTop: 20 }}>Badges</h3>
      <div className="badgegrid">
        {badges.map(([e, name, got]) => (
          <div className="badge" key={name as string} style={{ opacity: got ? 1 : 0.35 }}>
            <div className="e">{e}</div><small>{name}{got ? ' ✓' : ''}</small>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22 }}>
        <ReferCard />
      </div>
    </Shell>
  );
}
