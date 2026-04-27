import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ListTodo, Award,
  Settings, LogOut, Leaf, ChevronLeft,
  ChevronRight, Bus,
} from 'lucide-react';
import { t } from '../theme';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/users', icon: Users, label: 'Kullanıcılar' },
  { to: '/tasks', icon: ListTodo, label: 'Görevler' },
  { to: '/badges', icon: Award, label: 'Rozetler' },
  { to: '/bus-stops', icon: Bus, label: 'Otobüs Durakları' },
  { to: '/settings', icon: Settings, label: 'Ayarlar' },
];

export default function Sidebar({ open, onToggle }) {
  const w = open ? 256 : 72;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/login';
  };

  return (
    <aside style={{
      width: w,
      minWidth: w,
      height: '100vh',
      background: t.bgSidebar,
      borderRight: `1px solid ${t.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: open ? '20px 20px 20px 20px' : '20px 16px',
        borderBottom: `1px solid ${t.border}`,
        minHeight: 72,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: `linear-gradient(135deg, ${t.primaryLight}, ${t.primary})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 0 16px ${t.primaryGlow}`,
        }}>
          <Leaf size={18} color="#000" />
        </div>
        {open && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>
              Carbon<span style={{ color: t.primary }}>Shift</span>
            </div>
            <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 700, letterSpacing: 1.2 }}>ADMIN PANELİ</div>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute', top: 28, right: -12,
          width: 24, height: 24, borderRadius: 12,
          background: t.bgElevated,
          border: `1px solid ${t.borderMd}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 10,
          color: t.textMuted,
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = t.primaryBorder; e.currentTarget.style.color = t.primary; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = t.borderMd; e.currentTarget.style.color = t.textMuted; }}
      >
        {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {open && (
          <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: 1.5, padding: '8px 10px 8px', marginBottom: 4 }}>
            MENÜ
          </div>
        )}
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: 12,
              padding: open ? '10px 12px' : '10px',
              justifyContent: open ? 'flex-start' : 'center',
              borderRadius: 12,
              textDecoration: 'none',
              transition: 'all 0.18s',
              background: isActive ? t.primaryGlowSoft : 'transparent',
              border: `1px solid ${isActive ? t.primaryBorder : 'transparent'}`,
              color: isActive ? t.primary : t.textSec,
              position: 'relative',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 3, borderRadius: 99,
                    background: t.primary,
                    boxShadow: `0 0 8px ${t.primary}`,
                  }} />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {open && (
                  <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '10px', borderTop: `1px solid ${t.border}` }}>
        <button
          onClick={handleLogout}
          title="Çıkış Yap"
          style={{
            display: 'flex', alignItems: 'center',
            gap: 12, width: '100%',
            padding: open ? '10px 12px' : '10px',
            justifyContent: open ? 'flex-start' : 'center',
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 12,
            color: t.error,
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = t.errorGlow; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <LogOut size={18} />
          {open && <span style={{ fontSize: 14, fontWeight: 600 }}>Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
}
