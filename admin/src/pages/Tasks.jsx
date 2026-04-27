import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { t, card, btnPrimary } from '../theme';
import api from '../utils/api';

const TYPE_LABELS = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' };
const REQ_LABELS = {
  distance_km: 'Toplam Mesafe (km)',
  step_count: 'Adım Sayısı',
  trip_count: 'Seyahat Sayısı',
  walk_km: 'Yürüyüş Mesafesi (km)',
  bus_km: 'Otobüs Mesafesi (km)',
  bike_km: 'Bisiklet Mesafesi (km)',
  co2_saved: 'CO2 Tasarruf (kg)',
};
const CAT_COLORS = {
  walk: { color: '#00FF87', label: 'Yürüyüş' },
  bus: { color: '#3B82F6', label: 'Toplu Taşıma' },
  bicycle: { color: '#F59E0B', label: 'Bisiklet' },
  leaf: { color: '#22C55E', label: 'CO2' },
  star: { color: '#F59E0B', label: 'Genel' },
  navigate: { color: '#06B6D4', label: 'Aktivite' },
};
const PERIODS = ['Tümü', 'Günlük', 'Haftalık', 'Aylık'];

const EMPTY_FORM = {
  title: '', description: '', type: 'daily', icon: 'walk',
  cc_reward: '', xp_reward: '', requirement_type: 'distance_km',
  requirement_value: '', is_active: true,
};

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(task ? { ...task } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!task;

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) { setError('Başlık zorunlu'); return; }
    setLoading(true); setError('');
    try {
      const body = {
        ...form,
        cc_reward: Number(form.cc_reward) || 0,
        xp_reward: Number(form.xp_reward) || 0,
        requirement_value: Number(form.requirement_value) || 0,
      };
      if (isEdit) {
        await api.put(`/admin/tasks/${task.id}`, body);
      } else {
        await api.post('/admin/tasks', body);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: t.bgElevated, border: `1px solid ${t.border}`, borderRadius: 8,
    padding: '9px 12px', fontSize: 13, color: t.text, width: '100%', boxSizing: 'border-box',
    outline: 'none', transition: 'border-color 0.2s',
  };

  const Field = ({ label, children }) => (
    <div>
      <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{isEdit ? 'Görevi Düzenle' : 'Yeni Görev'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="BAŞLIK">
            <input value={form.title} onChange={e => set('title')(e.target.value)} placeholder="Görev adı" style={inputStyle}
              onFocus={e => e.target.style.borderColor = t.primaryBorder} onBlur={e => e.target.style.borderColor = t.border} />
          </Field>
          <Field label="AÇIKLAMA">
            <input value={form.description || ''} onChange={e => set('description')(e.target.value)} placeholder="Kısa açıklama" style={inputStyle}
              onFocus={e => e.target.style.borderColor = t.primaryBorder} onBlur={e => e.target.style.borderColor = t.border} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="DÖNEM">
              <select value={form.type} onChange={e => set('type')(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="daily">Günlük</option>
                <option value="weekly">Haftalık</option>
                <option value="monthly">Aylık</option>
              </select>
            </Field>
            <Field label="İKON">
              <select value={form.icon} onChange={e => set('icon')(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['walk', 'bus', 'bicycle', 'leaf', 'star', 'navigate', 'flame', 'footsteps', 'trash-bin'].map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </Field>
            <Field label="CC ÖDÜL">
              <input type="number" value={form.cc_reward} onChange={e => set('cc_reward')(e.target.value)} placeholder="10" style={inputStyle}
                onFocus={e => e.target.style.borderColor = t.primaryBorder} onBlur={e => e.target.style.borderColor = t.border} />
            </Field>
            <Field label="XP ÖDÜL">
              <input type="number" value={form.xp_reward} onChange={e => set('xp_reward')(e.target.value)} placeholder="20" style={inputStyle}
                onFocus={e => e.target.style.borderColor = t.primaryBorder} onBlur={e => e.target.style.borderColor = t.border} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="KOŞUL TİPİ">
              <select value={form.requirement_type} onChange={e => set('requirement_type')(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {Object.entries(REQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="HEDEF">
              <input type="number" value={form.requirement_value} onChange={e => set('requirement_value')(e.target.value)} placeholder="5000" style={inputStyle}
                onFocus={e => e.target.style.borderColor = t.primaryBorder} onBlur={e => e.target.style.borderColor = t.border} />
            </Field>
          </div>
          <Field label="DURUM">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => set('is_active')(!form.is_active)}>
              <div style={{
                width: 44, height: 24, borderRadius: 12, position: 'relative',
                background: form.is_active ? t.primary : t.bgElevated,
                border: `1px solid ${form.is_active ? t.primaryBorder : t.border}`,
                transition: 'all 0.25s',
              }}>
                <div style={{ position: 'absolute', top: 3, left: form.is_active ? 23 : 3, width: 16, height: 16, borderRadius: 8, background: form.is_active ? '#000' : t.textMuted, transition: 'left 0.25s' }} />
              </div>
              <span style={{ fontSize: 13, color: form.is_active ? t.primary : t.textMuted, fontWeight: 600 }}>
                {form.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </Field>
          {error && <p style={{ fontSize: 12, color: '#EF4444' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btnPrimary, padding: '11px', borderRadius: 10 }}>
            {loading ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('Tümü');
  const [modal, setModal] = useState(null); // null | 'new' | task object

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/tasks');
      setTasks(data || []);
    } catch (e) {
      console.error('tasks load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, []);

  const handleToggle = async (task) => {
    try {
      await api.put(`/admin/tasks/${task.id}`, { is_active: !task.is_active });
      loadTasks();
    } catch (e) {
      alert(e.response?.data?.error || 'Hata');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/admin/tasks/${id}`);
      loadTasks();
    } catch (e) {
      alert(e.response?.data?.error || 'Hata');
    }
  };

  const typeMap = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' };
  const filtered = periodFilter === 'Tümü' ? tasks : tasks.filter(t2 => typeMap[t2.type] === periodFilter);

  return (
    <div className="anim-fade-slide" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {modal && (
        <TaskModal
          task={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); loadTasks(); }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>Görev Yönetimi</h1>
          <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>
            {tasks.filter(t2 => t2.is_active).length} aktif, {tasks.filter(t2 => !t2.is_active).length} pasif
          </p>
        </div>
        <button onClick={() => setModal('new')} style={{ ...btnPrimary, padding: '10px 18px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> Yeni Görev
        </button>
      </div>

      {/* Period filter */}
      <div style={{ display: 'flex', gap: 6, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriodFilter(p)} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: periodFilter === p ? t.primaryGlow : 'transparent',
            color: periodFilter === p ? t.primary : t.textMuted,
            transition: 'all 0.18s',
          }}>
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 72, background: t.bgCard, borderRadius: 14, border: `1px solid ${t.border}` }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, borderRadius: 16, textAlign: 'center', padding: '40px 20px', color: t.textMuted }}>
          Görev bulunamadı.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(task => {
            const cat = CAT_COLORS[task.icon] || { color: t.primary, label: 'Genel' };
            return (
              <div key={task.id} style={{
                ...card, borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                opacity: task.is_active ? 1 : 0.55,
                transition: 'opacity 0.2s',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: cat.color + '18', border: `1px solid ${cat.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {task.icon === 'walk' ? '🚶' : task.icon === 'bus' ? '🚌' : task.icon === 'bicycle' ? '🚲' : task.icon === 'leaf' ? '🌿' : '⭐'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{task.title}</p>
                    <span style={{ background: t.bgElevated, border: `1px solid ${t.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 10, color: t.textMuted, fontWeight: 700 }}>
                      {typeMap[task.type] || task.type}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                    {REQ_LABELS[task.requirement_type] || task.requirement_type}: {task.requirement_value} · {task.cc_reward} CC · {task.xp_reward} XP
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => handleToggle(task)} title={task.is_active ? 'Pasife al' : 'Aktive et'} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: task.is_active ? t.primary : t.textMuted, display: 'flex',
                  }}>
                    {task.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => setModal(task)} title="Düzenle" style={{
                    width: 32, height: 32, borderRadius: 8, background: 'transparent',
                    border: '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: t.textMuted, cursor: 'pointer', transition: 'all 0.18s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = t.bgHover; e.currentTarget.style.borderColor = t.border; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(task.id)} title="Sil" style={{
                    width: 32, height: 32, borderRadius: 8, background: 'transparent',
                    border: '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#EF4444', cursor: 'pointer', transition: 'all 0.18s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
