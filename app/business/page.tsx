'use client';
import { useEffect, useState } from 'react';
import { supa, isSupaConfigured } from '../../lib/supabase';
import { RequireAuth } from '../../lib/auth';
import { useLang, Shell } from '../../components/ui';

type Biz = { id: string; name: string; category: string; city: string; description: string; created_at: string };
const CATS = ['Shop', 'Startup', 'Creator', 'Jobs', 'Services', 'Restaurant', 'Other'];

export default function Business() {
  return <RequireAuth><Network /></RequireAuth>;
}

function Network() {
  const { t } = useLang();
  const [list, setList] = useState<Biz[]>([]);
  const [name, setName] = useState('');
  const [cat, setCat] = useState('Shop');
  const [city, setCity] = useState('');
  const [desc, setDesc] = useState('');

  async function load() {
    if (!isSupaConfigured()) return;
    const { data } = await supa().from('av_business').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setList(data as Biz[]);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!name.trim()) return;
    const { data: { user } } = await supa().auth.getUser();
    if (!user) return;
    await supa().from('av_business').insert({ user_id: user.id, name: name.trim(), category: cat, city: city.trim(), description: desc.trim() });
    setName(''); setCity(''); setDesc(''); await load();
  }

  return (
    <Shell title={t('business')} sub="Profiles, jobs, shops & creators — professional India.">
      <div className="card">
        <div className="row">
          <input className="input" style={{ flex: 2, margin: 0 }} placeholder="Business / page name" value={name} onChange={e => setName(e.target.value)} />
          <select className="input" style={{ flex: 1, margin: 0 }} value={cat} onChange={e => setCat(e.target.value)}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <input className="input" style={{ flex: 1, margin: 0 }} placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
          <input className="input" style={{ flex: 2, margin: 0 }} placeholder="What do you do?" value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div style={{ marginTop: 10 }}><button className="btn violet" onClick={add}>+ Create page</button></div>
      </div>
      {list.map(b => (
        <div className="card" key={b.id}>
          <div className="posthead">
            <div className="avatar">🏢</div>
            <div className="pmeta"><b>{b.name}</b><small>{b.category}{b.city ? ` · ${b.city}` : ''}</small></div>
          </div>
          {b.description && <p className="ptext">{b.description}</p>}
          <span className="pill">{b.category}</span>
        </div>
      ))}
      {list.length === 0 && <div className="note">No business pages yet — list your shop or startup first! 🏪</div>}
    </Shell>
  );
}
