import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { t, card, btnPrimary } from '../theme';
import api from '../utils/api';

const RARITY = {
  common:    { label: 'Yaygın',  color: '#64748B', bg: 'rgba(100,116,139,0.15)' },
  rare:      { label: 'Nadir',   color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  epic:      { label: 'Epik',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  legendary: { label: 'Efsane', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
};

const ICONS = ['leaf', 'shield', 'flame', 'earth', 'bicycle', 'star', 'trophy', 'ribbon', 'sparkles', 'footsteps', 'bus', 'walk'];

const EMPTY_FORM = {
  name: '', description: '', icon: 'leaf', color: '#00FF87',
  rarity: 'common', requirement_code: 'total_co2', requirement_value: 10,
  cc_reward: 50, is_active: true,
};

function BadgeModal({ badge, onClose, onSave }) {
  const [form, setForm] = useState(badge ? { ...badge } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!badge;

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const inputStyle = {
    background: t.bgElevated, border: `1px solid ${t.border}`, borderRadius: 8,
    padding: '9px 12px', fontSize: 13, color: t.text, width: '100%', boxSizing: 'border-box',
    outline: 'none', transition: 'border-color 0.2s',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { setError('Ad zorunlu'); return; }
    setLoading(true); setError('');
    try {
      const body = { ...form, requirement_value: Number(form.requirement_value), cc_reward: Number(form.cc_reward) };
      if (isEdit) { await api.put(`/admin/badges/${badge.id}`, body); }
      else { await api.post('/admin/badges', body); }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, children }) => (
    <div>
      <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{isEdit ? 'Rozet Düzenle' : 'Yeni Rozet'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="AD">
            <input value={form.name} onChange={e => set('name')(e.target.value)} placeholder="Rozet adı" style={inputStyle}
              onFocus={e => e.target.style.borderColor = t.primaryBorder} onBlur={e => e.target.style.borderColor = t.border} />
          </Field>
          <Field label="AÇIKLAMA">
            <input value={form.description || ''} onChange={e => set('description')(e.target.value)} placeholder="Kısa açıklama" style={inputStyle}
              onFocus={e => e.target.style.borderColor = t.primaryBorder} onBlur={e => e.target.style.borderColor = t.border} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="İKON">
              <select value={form.icon} onChange={e => set('icon')(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="RENK">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.color || '#00FF87'} onChange={e => set('color')(e.target.value)}
                  style={{ width: 38, height: 38, borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', cursor: 'pointer', padding: 2 }} />
                <input value={form.color || ''} onChange={e => set('color')(e.target.value)} placeholder="#00FF87"
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => e.target.style.borderColor = t.primaryBorder} onBlur={e => e.target.style.borderColor = t.border} />
              </div>
            </Field>
            <Field label="NADİRLİK">
              <select value={form.rarity} onChange={e => set('rarity')(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {Object.entries(RARITY).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="CC ÖDÜL">
              <input type="number" value={form.cc_reward} onChange={e => set('cc_reward')(e.target.value)} placeholder="50" style={inputStyle}
                onFocus={e => e.target.style.borderColor = t.primaryBorder} onBlur={e => e.target.style.borderColor = t.border} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="KOŞUL KODU">
              <select value={form.requirement_code} onChange={e => set('requirement_code')(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['total_co2', 'total_distance', 'total_cc', 'streak_days', 'activity_count', 'walk_distance', 'bus_distance', 'bike_distance'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="HEDEF">
              <input type="number" value={form.requirement_value} onChange={e => set('requirement_value')(e.target.value)} placeholder="100" style={inputStyle}
                onFocus={e => e.target.style.borderColor = t.primaryBorder} onBlur={e => e.target.style.borderColor = t.border} />
            </Field>
          </div>
          {error && <p style={{ fontSize: 12, color: '#EF4444' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btnPrimary, padding: '11px', borderRadius: 10 }}>
            {loading ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Badges() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);

  const loadBadges = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/badges');
      setBadges(data || []);
    } catch (e) {
      console.error('badges load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBadges(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Bu rozeti silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/admin/badges/${id}`);
      loadBadges();
    } catch (e) {
      alert(e.response?.data?.error || 'Hata');
    }
  };

  const filtered = filter === 'all' ? badges : badges.filter(b => b.rarity === filter);

  return (
    <div className="anim-fade-slide" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {modal && (
        <BadgeModal badge={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={() => { setModal(null); loadBadges(); }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>Rozet Yönetimi</h1>
          <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>{badges.length} rozet tanımlanmış</p>
        </div>
        <button onClick={() => setModal('new')} style={{ ...btnPrimary, padding: '10px 18px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> Yeni Rozet
        </button>
      </div>

      {/* Rarity summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {Object.entries(RARITY).map(([key, r]) => (
          <div key={key} style={{
            ...card, borderRadius: 14, textAlign: 'center',
            border: `1px solid ${r.color}30`, background: r.bg,
            cursor: 'pointer', transition: 'all 0.2s',
            outline: filter === key ? `2px solid ${r.color}` : 'none',
          }} onClick={() => setFilter(key === filter ? 'all' : key)}>
            <p style={{ fontSize: 22, fontWeight: 900, color: r.color }}>
              {badges.filter(b => b.rarity === key).length}
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, color: r.color, marginTop: 3 }}>{r.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {[['all', 'Tümü'], ...Object.entries(RARITY).map(([k, r]) => [k, r.label])].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: filter === key ? (RARITY[key]?.bg || t.primaryGlow) : 'transparent',
            color: filter === key ? (RARITY[key]?.color || t.primary) : t.textMuted,
            transition: 'all 0.18s',
          }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 110, background: t.bgCard, borderRadius: 16, border: `1px solid ${t.border}` }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, borderRadius: 16, textAlign: 'center', padding: '40px 20px', color: t.textMuted }}>Rozet bulunamadı.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {filtered.map(badge => {
            const r = RARITY[badge.rarity] || RARITY.common;
            const color = badge.color || r.color;
            return (
              <div key={badge.id} style={{
                ...card, borderRadius: 16, padding: '18px',
                border: `1px solid ${color}25`, position: 'relative',
                background: `linear-gradient(135deg, ${color}08, transparent)`,
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = color + '50'}
                onMouseLeave={e => e.currentTarget.style.borderColor = color + '25'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: color + '20', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {badge.icon === 'leaf' ? '🌿' : badge.icon === 'flame' ? '🔥' : badge.icon === 'shield' ? '🛡️' : badge.icon === 'star' ? '⭐' : badge.icon === 'trophy' ? '🏆' : '🎖️'}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setModal(badge)} style={{ width: 28, height: 28, borderRadius: 8, background: t.bgElevated, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, cursor: 'pointer' }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(badge.id)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', cursor: 'pointer' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: t.text, marginBottom: 3 }}>{badge.name}</p>
                <p style={{ fontSize: 11, color: t.textMuted, marginBottom: 10, lineHeight: 1.4 }}>{badge.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ background: r.bg, color: r.color, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, border: `1px solid ${r.color}30` }}>{r.label}</span>
                  <span style={{ fontSize: 11, color: t.gold, fontWeight: 700 }}>+{badge.cc_reward} CC</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
