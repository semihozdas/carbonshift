import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, MapPin, X, Bus } from 'lucide-react';
import { t, card, btnPrimary } from '../theme';
import api from '../utils/api';

const EMPTY_FORM = { name: '', latitude: '', longitude: '', routes: '' };

function AddStopModal({ onClose, onSave }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const inputStyle = {
    background: t.bgElevated, border: `1px solid ${t.border}`, borderRadius: 8,
    padding: '9px 12px', fontSize: 13, color: t.text, width: '100%', boxSizing: 'border-box',
    outline: 'none', transition: 'border-color 0.2s',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { setError('Durak adı zorunlu'); return; }
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lng)) { setError('Geçerli enlem/boylam girin'); return; }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) { setError('Koordinat aralık dışı'); return; }

    setLoading(true); setError('');
    try {
      await api.post('/admin/bus-stops', {
        name: form.name.trim(),
        latitude: lat,
        longitude: lng,
        routes: form.routes.trim() || null,
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20,
        padding: 28, width: '100%', maxWidth: 460,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Yeni Otobüs Durağı</h2>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>
              Koordinatları Google Maps'ten kopyalayabilirsiniz
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, display: 'block', marginBottom: 5 }}>DURAK ADI</label>
            <input value={form.name} onChange={e => set('name')(e.target.value)} placeholder="Örn: Taksim Meydanı"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = t.primaryBorder}
              onBlur={e => e.target.style.borderColor = t.border} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, display: 'block', marginBottom: 5 }}>ENLEM (latitude)</label>
              <input value={form.latitude} onChange={e => set('latitude')(e.target.value)}
                placeholder="41.0369" type="number" step="any"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = t.primaryBorder}
                onBlur={e => e.target.style.borderColor = t.border} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, display: 'block', marginBottom: 5 }}>BOYLAM (longitude)</label>
              <input value={form.longitude} onChange={e => set('longitude')(e.target.value)}
                placeholder="28.9850" type="number" step="any"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = t.primaryBorder}
                onBlur={e => e.target.style.borderColor = t.border} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: t.textMuted, fontWeight: 700, display: 'block', marginBottom: 5 }}>
              HAT NUMARALARI <span style={{ fontWeight: 400 }}>(opsiyonel)</span>
            </label>
            <input value={form.routes} onChange={e => set('routes')(e.target.value)}
              placeholder="34, 25E, 76T"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = t.primaryBorder}
              onBlur={e => e.target.style.borderColor = t.border} />
          </div>

          <div style={{ background: t.bgElevated, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: t.textMuted, lineHeight: 1.6 }}>
            💡 Google Maps'te bir noktaya sağ tıklayın → koordinatları kopyalayın (Örn: <strong style={{ color: t.text }}>41.0369, 28.9850</strong>)
          </div>

          {error && <p style={{ fontSize: 12, color: '#EF4444' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btnPrimary, padding: '11px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={15} />
            {loading ? 'Ekleniyor...' : 'Durağı Ekle'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BusStops() {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/bus-stops');
      setStops(data || []);
    } catch (e) {
      console.error('bus stops load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" durağını silmek istediğinizden emin misiniz?`)) return;
    try {
      await api.delete(`/admin/bus-stops/${id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.error || 'Silinemedi');
    }
  };

  const filtered = stops.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.routes?.includes(search)
  );

  return (
    <div className="anim-fade-slide" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {showAdd && (
        <AddStopModal
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); load(); }}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>Otobüs Durakları</h1>
          <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>
            {stops.length} durak · Mobil uygulamada otobüs tespiti için kullanılır
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ ...btnPrimary, padding: '10px 18px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> Durak Ekle
        </button>
      </div>

      {/* Algorithm info card */}
      <div style={{ ...card, borderRadius: 16, background: 'rgba(59,130,246,0.06)', border: `1px solid rgba(59,130,246,0.2)` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bus size={18} color="#3B82F6" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Otobüs Tespit Algoritması</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                '🚶 Yürüyüş: Ortalama hız < 8 km/s',
                '🚲 Bisiklet: Ortalama hız 8-25 km/s, durak ziyareti yok',
                '🚌 Otobüs: Araç hızında (>10 km/s) hareket + en az 2 farklı durağa yakınlaşırken yavaşlama',
                '🚗 Araç: Araç hızında hareket + otobüs durak paternı yok → CC puanı düşer',
              ].map((line, i) => (
                <p key={i} style={{ fontSize: 12, color: t.textMuted }}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: t.bgElevated, border: `1px solid ${t.border}`, borderRadius: 10,
        padding: '8px 12px', maxWidth: 320,
        transition: 'border-color 0.2s',
      }}
        onFocusCapture={e => e.currentTarget.style.borderColor = t.primaryBorder}
        onBlurCapture={e => e.currentTarget.style.borderColor = t.border}
      >
        <MapPin size={14} color={t.textMuted} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Durak ara..."
          style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: t.text, width: '100%' }} />
      </div>

      {/* Stops list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: 60, background: t.bgCard, borderRadius: 12, border: `1px solid ${t.border}` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, borderRadius: 16, textAlign: 'center', padding: '40px 20px' }}>
          <Bus size={32} color={t.textMuted} style={{ margin: '0 auto 12px' }} />
          <p style={{ color: t.textMuted, fontSize: 14 }}>
            {search ? 'Arama sonucu yok.' : 'Henüz durak eklenmemiş. Durak ekleyerek otobüs tespitini geliştirin.'}
          </p>
        </div>
      ) : (
        <div style={{ ...card, borderRadius: 16, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {['#', 'Durak Adı', 'Enlem', 'Boylam', 'Hat Numaraları', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: t.textMuted, fontWeight: 700, letterSpacing: 0.5 }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((stop, idx) => (
                <tr key={stop.id}
                  style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontSize: 12, color: t.textMuted, width: 40 }}>{idx + 1}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bus size={14} color="#3B82F6" />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{stop.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: t.textMuted, fontFamily: 'monospace' }}>
                    {Number(stop.latitude).toFixed(5)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: t.textMuted, fontFamily: 'monospace' }}>
                    {Number(stop.longitude).toFixed(5)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {stop.routes ? (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {String(stop.routes).split(',').map((r, i) => (
                          <span key={i} style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6, padding: '2px 7px', fontSize: 11, color: '#3B82F6', fontWeight: 700 }}>
                            {r.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: t.textMuted }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(stop.id, stop.name)}
                      title="Sil"
                      style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#EF4444', cursor: 'pointer', transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats row */}
      {!loading && stops.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Toplam Durak', value: stops.length, color: '#3B82F6' },
            { label: 'Hat Tanımlı', value: stops.filter(s => s.routes).length, color: t.primary },
            { label: 'Algoritma Kapsamı', value: `${stops.length > 0 ? '✓ Aktif' : '✗ Durak Yok'}`, color: stops.length >= 5 ? t.primary : t.gold },
          ].map((s, i) => (
            <div key={i} style={{ ...card, borderRadius: 14, textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
