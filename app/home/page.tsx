'use client';
import { useEffect, useState } from 'react';
import { supa, isSupaConfigured } from '../../lib/supabase';
import { RequireAuth } from '../../lib/auth';
import { useLang, Shell } from '../../components/ui';
import { StoriesBar, StoryViewer, SponsoredCard, type Story } from '../../components/hybrid';

type Post = { id: string; user_id: string; text: string; image_url: string | null; likes_count: number; created_at: string; av_profiles?: { full_name: string; avatar_emoji: string } };
type Profile = { id: string; full_name: string; avatar_emoji: string };

export default function Home() {
  return <RequireAuth><Feed /></RequireAuth>;
}

function Feed() {
  const { t } = useLang();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [text, setText] = useState('');
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState<{ stories: Story[]; idx: number } | null>(null);

  async function load() {
    if (!isSupaConfigured()) return;
    const { data } = await supa().from('av_posts').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) {
      setPosts(data as Post[]);
      const ids = Array.from(new Set(data.map((p: Post) => p.user_id)));
      if (ids.length) {
        const { data: profs } = await supa().from('av_profiles').select('id,full_name,avatar_emoji').in('id', ids);
        const m: Record<string, Profile> = {};
        (profs || []).forEach((p: Profile) => m[p.id] = p);
        setProfiles(m);
      }
    }
  }
  useEffect(() => { load(); }, []);

  async function publish() {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      const { data: { user } } = await supa().auth.getUser();
      if (!user) return;
      const { error } = await supa().from('av_posts').insert({ user_id: user.id, text: text.trim() });
      if (error) throw error;
      setText(''); await load();
      try { await supa().rpc('av_add_points', { uid: user.id, pts: 10 }); } catch { /* points optional */ }
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  }

  async function like(p: Post) {
    const { data: { user } } = await supa().auth.getUser();
    if (!user || liked.has(p.id)) return;
    setLiked(new Set(liked).add(p.id));
    await supa().from('av_likes').insert({ post_id: p.id, user_id: user.id });
    await supa().from('av_posts').update({ likes_count: p.likes_count + 1 }).eq('id', p.id);
    setPosts(posts.map(x => x.id === p.id ? { ...x, likes_count: x.likes_count + 1 } : x));
  }

  return (
    <Shell title={t('home')} sub="India's public digital square." wide>
      {/* Stories carousel */}
      <StoriesBar onSelect={(stories, idx) => setViewer({ stories, idx })} />
      {viewer && (
        <StoryViewer
          stories={viewer.stories} idx={viewer.idx}
          onClose={() => setViewer(null)}
          onNav={(i) => setViewer({ stories: viewer.stories, idx: i })}
        />
      )}
      <div className="card">
        <textarea className="input" placeholder={t('whatsNew')} value={text} onChange={e => setText(e.target.value)} />
        <div className="row">
          <button className="btn violet" disabled={busy || !text.trim()} onClick={publish}>{t('post')}</button>
          <small style={{ color: 'var(--mut)' }}>+10 🏆 per post</small>
        </div>
      </div>
      {!isSupaConfigured() && <div className="note">Connect Supabase keys to load the live feed.</div>}
      {posts.map((p, i) => {
        const pr = profiles[p.user_id];
        return (
          <div key={p.id}>
            <div className="card">
              <div className="posthead">
                <div className="avatar">{pr?.avatar_emoji || '🙂'}</div>
                <div className="pmeta"><b>{pr?.full_name || 'Member'}</b><small>{new Date(p.created_at).toLocaleString()}</small></div>
              </div>
              <p className="ptext">{p.text}</p>
              <div className="pactions">
                <button className={liked.has(p.id) ? 'on' : ''} onClick={() => like(p)}>❤️ {p.likes_count}</button>
                <button>💬 Comment</button>
                <button>↗️ Share</button>
              </div>
            </div>
            {(i + 1) % 4 === 0 && <SponsoredCard seed={i} />}
          </div>
        );
      })}
      {posts.length === 0 && isSupaConfigured() && <div className="card"><p style={{ color: 'var(--mut)' }}>No posts yet — be the first! 🎉</p></div>}
    </Shell>
  );
}
