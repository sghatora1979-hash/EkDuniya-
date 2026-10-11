'use client';
import { useEffect, useState } from 'react';
import { supa, isSupaConfigured } from '../../lib/supabase';
import { RequireAuth } from '../../lib/auth';
import { useLang, Shell } from '../../components/ui';

type Member = { id: string; name: string; relation: string; generation: number; birth_year: number | null; note: string };
const GEN_LABEL: Record<number, string> = { 1: '🌳 Great-grandparents', 2: '🌿 Grandparents', 3: '🌱 Parents', 4: '🌸 Children & You' };
const RELATIONS = ['Great-grandfather', 'Great-grandmother', 'Grandfather', 'Grandmother', 'Father', 'Mother', 'Uncle', 'Aunt', 'Brother', 'Sister', 'Spouse', 'Son', 'Daughter', 'Cousin'];

export default function Family() {
  return <RequireAuth><Tree /></RequireAuth>;
}

function Tree() {
  const { t } = useLang();
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Father');
  const [gen, setGen] = useState(3);
  const [year, setYear] = useState('');
  const [note, setNote] = useState('');

  async function load() {
    if (!isSupaConfigured()) return;
    const { data: { user } } = await supa().auth.getUser();
    if (!user) return;
    const { data } = await supa().from('av_family').select('*').eq('user_id', user.id).order('generation').order('birth_year', { nullsFirst: false });
    if (data) setMembers(data as Member[]);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!name.trim()) return;
    const { data: { user } } = await supa().auth.getUser();
    if (!user) return;
    await supa().from('av_family').insert({
      user_id: user.id, name: name.trim(), relation, generation: gen,
      birth_year: year ? parseInt(year) : null, note: note.trim(),
    });
    setName(''); setNote(''); setYear(''); await load();
  }

  async function remove(id: string) {
    await supa().from('av_family').delete().eq('id', id);
    await load();
  }

  return (
    <Shell title={t('family')} sub="From great-grandparents to 2026 — your history, preserved.">
      <div className="card">
        <div className="row">
          <input className="input" style={{ flex: 2, margin: 0 }} placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <select className="input" style={{ flex: 1, margin: 0 }} value={relation} onChange={e => setRelation(e.target.value)}>
            {RELATIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <select className="input" style={{ flex: 1, margin: 0 }} value={gen} onChange={e => setGen(parseInt(e.target.value))}>
            {[1, 2, 3, 4].map(g => <option key={g} value={g}>{GEN_LABEL[g]}</option>)}
          </select>
          <input className="input" style={{ flex: 1, margin: 0 }} placeholder="Birth year" value={year} onChange={e => setYear(e.target.value)} />
        </div>
        <input className="input" placeholder="Story / note (optional)" value={note} onChange={e => setNote(e.target.value)} />
        <button className="btn violet" onClick={add}>+ Add relative</button>
      </div>
      {[1, 2, 3, 4].map(g => {
        const list = members.filter(m => m.generation === g);
        if (!list.length) return null;
        return (
          <div key={g}>
            <div className="genlabel">{GEN_LABEL[g]}</div>
            {list.map(m => (
              <div className="member" key={m.id}>
                <div className="avatar">👤</div>
                <div style={{ flex: 1 }}>
                  <b>{m.name}</b>
                  <small>{m.relation}{m.birth_year ? ` · born ${m.birth_year}` : ''}{m.note ? ` — ${m.note}` : ''}</small>
                </div>
                <button onClick={() => remove(m.id)} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
              </div>
            ))}
          </div>
        );
      })}
      {members.length === 0 && <div className="note">Add your first relative above — start with grandparents and work down to today. 🌳</div>}
    </Shell>
  );
}
