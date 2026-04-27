import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, Menu, ChevronDown } from 'lucide-react';
import { t, inputBase } from '../theme';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/users': 'Kullanıcı Yönetimi',
  '/tasks': 'Görev Yönetimi',
  '/badges': 'Rozet Yönetimi',
  '/settings': 'Ayarlar',
};

const NOTIFS = [
  { id: 1, text: '3 anomali tespit edildi', time: '5 dk önce', type: 'warn' },
  { id: 2, text: 'Yeni kullanıcı kaydı: Zeynep A.', time: '12 dk önce', type: 'info' },
  { id: 3, text: 'Günlük CC hedefi aşıldı!', time: '1 saat önce', type: 'success' },
];

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const admin = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const title = PAGE_TITLES[location.pathname] || 'Admin Panel';

  return (
    <header style={{
      height: 64,
      background: 'rgba(6,11,20,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${t.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onMenuClick}
          style={{
            background: 'none', border: 'none', color: t.textMuted,
            display: 'flex', alignItems: 'center', padding: 6, borderRadius: 8,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = t.text}
          onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>{title}</h1>
          <p style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: t.bgElevated,
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          padding: '7px 12px',
          width: 240,
          transition: 'border-color 0.2s',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = t.primaryBorder}
          onBlurCapture={e => e.currentTarget.style.borderColor = t.border}
        >
          <Search size={14} color={t.textMuted} />
          <input
            placeholder="Ara... (Ctrl+K)"
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: t.text, width: '100%' }}
          />
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setNotifOpen(p => !p); setUserOpen(false); }}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: notifOpen ? t.bgElevated : 'transparent',
              border: `1px solid ${notifOpen ? t.borderMd : 'transparent'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: notifOpen ? t.text : t.textMuted,
              position: 'relative', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!notifOpen) { e.currentTarget.style.color = t.text; e.currentTarget.style.background = t.bgHover; } }}
            onMouseLeave={e => { if (!notifOpen) { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = 'transparent'; } }}
          >
            <Bell size={18} />
            <div style={{
              position: 'absolute', top: 7, right: 7,
              width: 8, height: 8, borderRadius: 4,
              background: '#EF4444',
              border: '2px solid #060B14',
              boxShadow: '0 0 6px rgba(239,68,68,0.8)',
            }} />
          </button>

          {notifOpen && (
            <div className="anim-fade" style={{
              position: 'absolute', right: 0, top: 46,
              background: t.bgCard,
              border: `1px solid ${t.borderMd}`,
              borderRadius: 14,
              width: 300,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              zIndex: 200,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Bildirimler</span>
                <span style={{ fontSize: 11, color: t.primary, fontWeight: 700, cursor: 'pointer' }}>Tümünü Oku</span>
              </div>
              {NOTIFS.map(n => (
                <div key={n.id} style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${t.border}`,
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = t.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0,
                    background: n.type === 'warn' ? '#F59E0B' : n.type === 'success' ? '#22C55E' : '#3B82F6',
                  }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{n.text}</p>
                    <p style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: t.bgElevated,
            border: `1px solid ${t.border}`,
            borderRadius: 10, padding: '6px 12px 6px 6px',
            cursor: 'pointer', transition: 'border-color 0.2s',
          }}
          onClick={() => { setUserOpen(p => !p); setNotifOpen(false); }}
          onMouseEnter={e => e.currentTarget.style.borderColor = t.borderMd}
          onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `linear-gradient(135deg, ${t.primaryLight}, ${t.primary})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#000',
          }}>
            {(admin.email?.[0] || 'A').toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{admin.email?.split('@')[0] || 'Admin'}</div>
            <div style={{ fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: 0.5 }}>SUPER ADMIN</div>
          </div>
          <ChevronDown size={14} color={t.textMuted} style={{ transition: 'transform 0.2s', transform: userOpen ? 'rotate(180deg)' : 'none' }} />
        </div>
      </div>
    </header>
  );
}
