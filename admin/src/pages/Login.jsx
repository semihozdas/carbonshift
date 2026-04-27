import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Leaf, ArrowRight, Zap } from 'lucide-react';
import { t, inputBase, btnPrimary } from '../theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('E-posta ve şifre gerekli.'); return; }
    setLoading(true); setError('');
    try {
      const res = await axios.post('/api/admin/auth/login', { email, password });
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUser', JSON.stringify(res.data.admin));
      window.location.href = '/';
    } catch {
      setError('Geçersiz e-posta veya şifre.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = () => { setEmail('admin@carbonshift.com'); setPassword('admin123'); };

  return (
    <div style={{
      minHeight: '100vh',
      background: t.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background */}
      <div style={{
        position: 'absolute', top: -150, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,255,135,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, right: -100,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(0,255,135,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,135,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: t.bgCard,
        border: `1px solid ${t.primaryBorder}`,
        borderRadius: 24,
        padding: 36,
        boxShadow: `0 0 60px rgba(0,255,135,0.06), 0 40px 80px rgba(0,0,0,0.5)`,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: '0 auto 16px',
            background: `linear-gradient(135deg, ${t.primaryLight}, ${t.primary})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 24px ${t.primaryGlow}`,
          }}>
            <Leaf size={26} color="#000" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 6 }}>
            Carbon<span style={{ color: t.primary }}>Shift</span>
          </h1>
          <p style={{ fontSize: 13, color: t.textMuted }}>Yönetim Paneline Hoş Geldiniz</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Email */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: focusedField === 'email' ? t.primary : t.textMuted,
              transition: 'color 0.2s', display: 'flex',
            }}>
              <Mail size={16} />
            </div>
            <input
              type="email"
              placeholder="E-posta adresi"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
              style={{
                ...inputBase,
                paddingLeft: 40,
                borderColor: focusedField === 'email' ? t.primaryBorder : t.border,
              }}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: focusedField === 'pass' ? t.primary : t.textMuted,
              transition: 'color 0.2s', display: 'flex',
            }}>
              <Lock size={16} />
            </div>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Şifre"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('pass')}
              onBlur={() => setFocusedField(null)}
              required
              style={{
                ...inputBase,
                paddingLeft: 40, paddingRight: 40,
                borderColor: focusedField === 'pass' ? t.primaryBorder : t.border,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: t.textMuted,
                display: 'flex', cursor: 'pointer', transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = t.text}
              onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div style={{
              background: t.errorGlow, border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#EF4444',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...btnPrimary,
              justifyContent: 'center',
              padding: '13px 20px',
              fontSize: 15,
              borderRadius: 12,
              marginTop: 4,
              opacity: loading ? 0.7 : 1,
              boxShadow: `0 0 20px ${t.primaryGlow}`,
            }}
          >
            {loading ? 'Giriş yapılıyor...' : (
              <>
                Giriş Yap
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: t.border }} />
          <span style={{ fontSize: 12, color: t.textMuted }}>veya</span>
          <div style={{ flex: 1, height: 1, background: t.border }} />
        </div>

        {/* Demo */}
        <button
          onClick={demoLogin}
          style={{
            width: '100%',
            background: t.primaryGlowSoft,
            border: `1px solid ${t.primaryBorder}`,
            borderRadius: 12, padding: '11px 20px',
            color: t.primary, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,135,0.12)'; e.currentTarget.style.borderColor = t.primaryBorderStrong; }}
          onMouseLeave={e => { e.currentTarget.style.background = t.primaryGlowSoft; e.currentTarget.style.borderColor = t.primaryBorder; }}
        >
          <Zap size={14} />
          Demo hesapla dene
        </button>

        {/* Stats footer */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 28, paddingTop: 20, borderTop: `1px solid ${t.border}` }}>
          {[
            { label: 'Kullanıcı', value: '1,240' },
            { label: 'Aktif Görev', value: '48' },
            { label: 'CO2 Tasarruf', value: '450 kg' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.primary }}>{s.value}</div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
