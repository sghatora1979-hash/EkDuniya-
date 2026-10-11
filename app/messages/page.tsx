'use client';
import { useEffect, useState } from 'react';
import { supa, isSupaConfigured } from '../../lib/supabase';
import { RequireAuth } from '../../lib/auth';
import { useLang, Shell } from '../../components/ui';
import { hourTheme } from '../../lib/theme';

type Msg = { id: string; sender_id: string; receiver_id: string; text: string; created_at: string };
type Person = { id: string; full_name: string; avatar_emoji: string };

export default function Messages() {
  return <RequireAuth><Chat /></RequireAuth>;
}

function Chat() {
  const { t } = useLang();
  const [me, setMe] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [peer, setPeer] = useState<Person | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const th = hourTheme();
  const mc = th.acc;

  useEffect(() => {
    (async () => {
      if (!isSupaConfigured()) return;
      const { data: { user } } = await supa().auth.getUser();
      if (!user) return;
      setMe(user.id);
      const { data } = await supa().from('av_profiles').select('id,full_name,avatar_emoji').neq('id', user.id).limit(30);
      if (data) setPeople(data as Person[]);
    })();
  }, []);

  async function openChat(p: Person) {
    setPeer(p);
    if (!isSupaConfigured()) return;
    const { data: { user } } = await supa().auth.getUser();
    if (!user) return;
    const { data } = await supa().from('av_messages').select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${p.id}),and(sender_id.eq.${p.id},receiver_id.eq.${user.id})`)
      .order('created_at');
    if (data) setMsgs(data as Msg[]);
  }

  async function send() {
    if (!text.trim() || !peer) return;
    const { data: { user } } = await supa().auth.getUser();
    if (!user) return;
    await supa().from('av_messages').insert({ sender_id: user.id, receiver_id: peer.id, text: text.trim() });
    setText('');
    openChat(peer);
  }

  const shown = people.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Shell title={t('messages')} sub={`This hour: ${th.name} — theme changes every hour! 🎨`}>
      <div className="card">
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {['#FF6B35', '#8B5CF6', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#F59E0B'].map(c => (
            <div key={c} title={c} style={{
              width: 26, height: 26, borderRadius: '50%', background: c,
              border: c === mc ? '3px solid white' : '2px solid transparent',
            }} />
          ))}
        </div>
        {!peer ? (
          <>
            <input className="input" placeholder="Search people…" value={search} onChange={e => setSearch(e.target.value)} />
            <div className="chatlist">
              {shown.map(p => (
                <div className="member" key={p.id} onClick={() => openChat(p)}>
                  <div className="avatar">{p.avatar_emoji}</div>
                  <div><b>{p.full_name}</b><small>Tap to chat</small></div>
                </div>
              ))}
              {shown.length === 0 && <p style={{ color: 'var(--mut)' }}>No people yet — invite friends to EkDuniya! 💬</p>}
            </div>
          </>
        ) : (
          <>
            <div className="row">
              <button className="btn ghost" onClick={() => setPeer(null)}>← Back</button>
              <b>{peer.avatar_emoji} {peer.full_name}</b>
            </div>
            <div className="msgs">
              {msgs.map(m => (
                <div key={m.id} className={`msg ${m.sender_id === me ? 'me' : ''}`} style={m.sender_id === me ? { ['--mc' as string]: mc } : {}}>
                  <small>{m.sender_id === me ? 'You' : peer.full_name}</small>
                  {m.text}
                </div>
              ))}
              {msgs.length === 0 && <p style={{ color: 'var(--mut)' }}>Say namaste! 🙏</p>}
            </div>
            <div className="chatbar">
              <input className="input" placeholder="Type a message…" value={text}
                onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
              <button className="btn violet" onClick={send}>Send</button>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
