import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, CreditCard, Ban, Eye, X, Footprints, Bike, Bus, Car } from 'lucide-react';
import { t, card, btnPrimary, btnGhost, inputBase } from '../theme';
import api from '../utils/api';

const STATUS_MAP = {
  active:   { label: 'Aktif', bg: 'rgba(34,197,94,0.12)',  color: '#22C55E', border: 'rgba(34,197,94,0.25)' },
  inactive: { label: 'Pasif', bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
  banned:   { label: 'Banlı', bg: 'rgba(239,68,68,0.12)',  color: '#EF4444', border: 'rgba(239,68,68,0.25)' },
};

const MODE_META = {
  walk:  { label: 'Yürüyüş', color: '#00FF87', icon: '🚶' },
  bike:  { label: 'Bisiklet', color: '#F59E0B', icon: '🚲' },
  bus:   { label: 'Otobüs',  color: '#3B82F6', icon: '🚌' },
  car:   { label: 'Araba',   color: '#EF4444', icon: '🚗' },
};

function ActionBtn({ icon: Icon, color, title, onClick }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      background: 'transparent', border: '1px solid transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color || t.textMuted, cursor: 'pointer', transition: 'all 0.18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = (color || '#fff') + '18'; e.currentTarget.style.borderColor = (color || '#fff') + '30'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
    >
      <Icon size={15} />
    </button>
  );
}

function UserDetailModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/users/${userId}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20,
        padding: 28, width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Kullanıcı Detayı</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        {loading ? (
          <p style={{ color: t.textMuted, textAlign: 'center', padding: '20px 0' }}>Yükleniyor...</p>
        ) : data ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Ad Soyad', value: data.user.full_name },
                { label: 'E-posta', value: data.user.email },
                { label: 'Seviye', value: data.user.level },
                { label: 'CC Bakiyesi', value: `${data.user.cc_balance} CC` },
                { label: 'Toplam CO2', value: `${Number(data.user.total_co2_saved).toFixed(1)} kg` },
                { label: 'Toplam Mesafe', value: `${Number(data.user.total_distance_km).toFixed(1)} km` },
                { label: 'Kayıt', value: new Date(data.user.created_at).toLocaleDateString('tr-TR') },
                { label: 'Son Giriş', value: data.user.last_login ? new Date(data.user.last_login).toLocaleDateString('tr-TR') : '—' },
              ].map((f, i) => (
                <div key={i} style={{ background: t.bgElevated, borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>{f.label.toUpperCase()}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{f.value}</p>
                </div>
              ))}
            </div>
            {data.badges?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, marginBottom: 8 }}>ROZETLER ({data.badges.length})</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {data.badges.map(b => (
                    <div key={b.id} style={{ background: (b.color || t.primary) + '18', border: `1px solid ${b.color || t.primary}30`, borderRadius: 8, padding: '4px 10px', fontSize: 12, color: b.color || t.primary, fontWeight: 700 }}>
                      {b.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.activities?.length > 0 && (
              <div>
                <p style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, marginBottom: 8 }}>SON AKTİVİTELER</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.activities.slice(0, 5).map(a => (
                    <div key={a.id} style={{ background: t.bgElevated, borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: t.text }}>{a.transport_mode} · {Number(a.distance_km).toFixed(2)} km</span>
                      <span style={{ color: t.primary }}>+{Number(a.cc_earned).toFixed(0)} CC</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ color: t.textMuted }}>Kullanıcı bulunamadı.</p>
        )}
      </div>
    </div>
  );
}

function CCModal({ user, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) { setError('Geçerli bir miktar girin'); return; }
    setLoading(true); setError('');
    try {
      await api.post(`/admin/users/${user.id}/adjust-cc`, { amount: Number(amount), reason });
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, padding: 28, width: '100%', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>CC Düzenle — {user.full_name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, display: 'block', marginBottom: 6 }}>MİKTAR (negatif olabilir)</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="+100 veya -50" style={{ ...inputBase, width: '100%', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = t.primaryBorder} onBlur={e => e.target.style.borderColor = t.border} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: t.textMuted, fontWeight: 700, display: 'block', marginBottom: 6 }}>NEDEN (opsiyonel)</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Admin düzenlemesi" style={{ ...inputBase, width: '100%', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = t.primaryBorder} onBlur={e => e.target.style.borderColor = t.border} />
          </div>
          {error && <p style={{ fontSize: 12, color: '#EF4444' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btnPrimary, padding: '11px', borderRadius: 10 }}>
            {loading ? 'Kaydediliyor...' : 'Uygula'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState(null);
  const [ccUser, setCcUser] = useState(null);
  const searchTimer = useRef(null);
  const LIMIT = 20;

  const loadUsers = useCallback(async (q = search, p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset: p * LIMIT });
      if (q) params.set('q', q);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('users load error:', e);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { loadUsers(); }, [page]);

  const handleSearch = (q) => {
    setSearch(q);
    setPage(0);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadUsers(q, 0), 400);
  };

  const handleBan = async (user) => {
    if (!window.confirm(`${user.is_banned ? 'Yasağı kaldır' : 'Banla'}: ${user.full_name}?`)) return;
    try {
      await api.post(`/admin/users/${user.id}/ban`);
      loadUsers();
    } catch (e) {
      alert(e.response?.data?.error || 'Hata');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="anim-fade-slide" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {detailId && <UserDetailModal userId={detailId} onClose={() => setDetailId(null)} />}
      {ccUser && <CCModal user={ccUser} onClose={() => setCcUser(null)} onDone={() => { setCcUser(null); loadUsers(); }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>Kullanıcı Yönetimi</h1>
          <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>{total} kullanıcı</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: t.bgElevated, border: `1px solid ${t.border}`, borderRadius: 10, padding: '8px 12px', width: 240,
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = t.primaryBorder}
            onBlurCapture={e => e.currentTarget.style.borderColor = t.border}
          >
            <Search size={14} color={t.textMuted} />
            <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="İsim veya e-posta ara..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: t.text, width: '100%' }} />
          </div>
        </div>
      </div>

      <div style={{ ...card, borderRadius: 16, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}` }}>
              {['Kullanıcı', 'CC', 'CO2 (kg)', 'Seviye', 'Durum', 'Kayıt', 'İşlemler'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, color: t.textMuted, fontWeight: 700, letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div style={{ height: 16, borderRadius: 4, background: t.bgElevated, width: j === 0 ? 140 : 60 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.map(u => {
              const status = u.is_banned ? 'banned' : 'active';
              const s = STATUS_MAP[status];
              return (
                <tr key={u.id} style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: `linear-gradient(135deg, rgba(0,255,135,0.2), rgba(0,255,135,0.05))`,
                        border: `1px solid rgba(0,255,135,0.2)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, color: t.primary,
                      }}>
                        {(u.full_name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{u.full_name || '—'}</p>
                        <p style={{ fontSize: 11, color: t.textMuted }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: t.gold }}>{Number(u.cc_balance || 0).toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#22C55E', fontWeight: 700 }}>{Number(u.total_co2_saved || 0).toFixed(1)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: t.primaryGlow, color: t.primary, fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 6, border: `1px solid ${t.primaryBorder}` }}>
                      Seviye {u.level}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                      {s.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: t.textMuted }}>
                    {new Date(u.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <ActionBtn icon={Eye} title="Detay" onClick={() => setDetailId(u.id)} />
                      <ActionBtn icon={CreditCard} color={t.gold} title="CC Düzenle" onClick={() => setCcUser(u)} />
                      <ActionBtn icon={Ban} color={u.is_banned ? '#22C55E' : '#EF4444'} title={u.is_banned ? 'Yasağı Kaldır' : 'Banla'} onClick={() => handleBan(u)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} style={{ ...btnGhost, padding: '6px 14px', borderRadius: 8, opacity: page === 0 ? 0.4 : 1 }}>← Önceki</button>
          <span style={{ fontSize: 13, color: t.textMuted }}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ ...btnGhost, padding: '6px 14px', borderRadius: 8, opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Sonraki →</button>
        </div>
      )}
    </div>
  );
}
