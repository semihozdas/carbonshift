import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Users, Leaf, Star, AlertTriangle, Activity } from 'lucide-react';
import { t, card } from '../theme';
import api from '../utils/api';

const MODE_MAP = {
  walk: { name: 'Yürüyüş', color: '#00FF87' },
  bus: { name: 'Toplu Taşıma', color: '#3B82F6' },
  bike: { name: 'Bisiklet', color: '#F59E0B' },
  bicycle: { name: 'Bisiklet', color: '#F59E0B' },
  car: { name: 'Araç', color: '#EF4444' },
};
const MODE_ICON = { walk: '🚶', bus: '🚌', bike: '🚲', bicycle: '🚲', car: '🚗' };

function formatDay(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const chartTooltip = {
  contentStyle: {
    background: '#0F1623', border: '1px solid rgba(0,255,135,0.2)',
    borderRadius: 10, fontSize: 12, color: '#fff',
  },
  cursor: { stroke: 'rgba(0,255,135,0.15)', strokeWidth: 1 },
};

function StatCard({ title, value, sub, icon: Icon, color, loading }) {
  return (
    <div style={{
      ...card, display: 'flex', gap: 16, alignItems: 'flex-start',
      border: `1px solid ${t.border}`, transition: 'border-color 0.2s', cursor: 'default',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color + '40'}
      onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 14, flexShrink: 0,
        background: color + '18', border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: t.textMuted, fontWeight: 600, letterSpacing: 0.3, marginBottom: 6 }}>{title}</p>
        {loading ? (
          <div style={{ height: 26, width: 80, borderRadius: 6, background: t.bgElevated }} />
        ) : (
          <p style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.8, color: t.text, lineHeight: 1 }}>{value}</p>
        )}
        {sub && <p style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{sub}</p>}
      </div>
    </div>
  );
}

const AUTO_REFRESH_MS = 30_000;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [actChart, setActChart] = useState([]);
  const [modeChart, setModeChart] = useState([]);
  const [recentActs, setRecentActs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [statsRes, actRes, modeRes, recentRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/dashboard/chart/activity'),
        api.get('/admin/dashboard/chart/transport-mode'),
        api.get('/admin/dashboard/recent-activities'),
      ]);
      setStats(statsRes.data);
      setActChart(actRes.data.map(r => ({ ...r, day: formatDay(r.day) })));
      setModeChart(
        modeRes.data.map(r => ({
          name: MODE_MAP[r.transport_mode]?.name || r.transport_mode,
          value: r.c,
          km: r.km,
          color: MODE_MAP[r.transport_mode]?.color || '#888',
        }))
        );
        setRecentActs(recentRes.data);
        setLastRefreshed(new Date());
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
  }, []);

  useEffect(() => {
    load(false);
    intervalRef.current = setInterval(() => load(false), AUTO_REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [load]);

  const handleManualRefresh = () => load(true);

  return (
    <div className="anim-fade-slide" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header row with refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>Dashboard</h1>
          {lastRefreshed && (
            <p style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>
              Son güncelleme: {lastRefreshed.toLocaleTimeString('tr-TR')} · 30 sn'de bir otomatik yenileniyor
            </p>
          )}
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: t.bgElevated, border: `1px solid ${t.border}`,
            borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
            color: refreshing ? t.textMuted : t.primary, fontSize: 13, fontWeight: 700,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!refreshing) e.currentTarget.style.borderColor = t.primaryBorder; }}
          onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Yükleniyor...' : 'Yenile'}
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard title="Toplam Kullanıcı" value={stats?.users?.toLocaleString() || '—'} icon={Users} color={t.primary} loading={loading} />
        <StatCard title="CO2 Tasarruf" value={stats ? `${Number(stats.co2_total).toFixed(1)} kg` : '—'} icon={Leaf} color='#22C55E' loading={loading} sub="Toplam" />
        <StatCard title="Toplam CC" value={stats ? Number(stats.cc_total).toLocaleString() : '—'} icon={Star} color={t.gold} loading={loading} sub="Tüm kullanıcılar" />
        <StatCard title="Anomali" value={stats?.anomalies?.toLocaleString() || '—'} icon={AlertTriangle} color='#EF4444' loading={loading} sub="Şüpheli aktivite" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ ...card, borderRadius: 18 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>14 Günlük Aktivite</h2>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>Günlük aktivite sayısı ve mesafe</p>
          </div>
          {loading ? (
            <div style={{ height: 220, background: t.bgElevated, borderRadius: 10 }} />
          ) : actChart.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, fontSize: 13 }}>Veri yok</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={actChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={t.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={t.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradKm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: t.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: t.textMuted }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip}
                  formatter={(v, n) => [
                    n === 'count' ? `${v} aktivite` : `${Number(v).toFixed(1)} km`,
                    n === 'count' ? 'Aktivite' : 'Mesafe (km)',
                  ]}
                />
                <Area type="monotone" dataKey="count" stroke={t.primary} strokeWidth={2} fill="url(#gradCount)" name="count" />
                <Area type="monotone" dataKey="km" stroke="#3B82F6" strokeWidth={2} fill="url(#gradKm)" name="km" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ ...card, borderRadius: 18 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Ulaşım Modu</h2>
            <p style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>Aktivite dağılımı</p>
          </div>
          {loading ? (
            <div style={{ height: 200, background: t.bgElevated, borderRadius: 10 }} />
          ) : modeChart.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted, fontSize: 13 }}>Veri yok</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={modeChart} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {modeChart.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltip.contentStyle}
                    formatter={(v, n, p) => [`${v} aktivite · ${Number(p.payload.km).toFixed(1)} km`, p.payload.name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {modeChart.map((m, i) => {
                  const total = modeChart.reduce((s, x) => s + x.value, 0) || 1;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 5, background: m.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: t.textMuted, flex: 1 }}>{m.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{Math.round((m.value / total) * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent activities */}
      <div style={{ ...card, borderRadius: 18 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800 }}>Son Aktiviteler</h2>
          <p style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>Gerçek zamanlı kullanıcı hareketleri</p>
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 52, background: t.bgElevated, borderRadius: 10 }} />)}
          </div>
        ) : recentActs.length === 0 ? (
          <p style={{ fontSize: 13, color: t.textMuted, textAlign: 'center', padding: '24px 0' }}>Henüz aktivite yok</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentActs.slice(0, 12).map((a, i) => {
              const mode = MODE_MAP[a.transport_mode] || { name: a.transport_mode, color: '#888' };
              const icon = MODE_ICON[a.transport_mode] || '🚶';
              const diff = Date.now() - new Date(a.created_at).getTime();
              const min = Math.floor(diff / 60000);
              const ago = min < 1 ? 'Az önce' : min < 60 ? `${min} dk önce` : `${Math.floor(min/60)} saat önce`;
              return (
                <div key={a.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 12,
                  background: t.bgElevated, border: `1px solid ${t.border}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: mode.color + '18', border: `1px solid ${mode.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  }}>{icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{a.full_name || a.email}</p>
                    <p style={{ fontSize: 11, color: t.textMuted }}>{Number(a.distance_km).toFixed(2)} km · {mode.name}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: mode.color }}>+{Number(a.cc_earned).toFixed(0)} CC</p>
                    <p style={{ fontSize: 11, color: t.textMuted }}>{ago}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {stats && (
        <div style={{ ...card, borderRadius: 18, background: 'linear-gradient(135deg, rgba(0,255,135,0.06), transparent)', border: `1px solid ${t.primaryBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Activity size={16} color={t.primary} />
            <h3 style={{ fontSize: 15, fontWeight: 800 }}>Bugün</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { label: 'Aktivite', value: stats.activities_today, color: t.primary },
              { label: 'Toplam Kullanıcı', value: stats.users, color: '#3B82F6' },
              { label: 'Anomali', value: stats.anomalies, color: '#EF4444' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value?.toLocaleString()}</p>
                <p style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
