import React, { useState, useEffect } from 'react';
import { Save, Sliders, Shield, Zap } from 'lucide-react';
import { t, card, btnPrimary, inputBase } from '../theme';
import api from '../utils/api';

// Keys match backend locationService.js and anomalyService.js exactly
const SETTING_GROUPS = [
  {
    key: 'co2',
    title: 'CO2 Tasarruf Oranları',
    sub: 'Km başına kaç kg CO2 tasarruf edildiği (backend: walk_co2_saved_per_km)',
    icon: Sliders,
    color: '#22C55E',
    fields: [
      { key: 'walk_co2_saved_per_km',  label: 'Yürüyüş',      sub: 'varsayılan: 0.192', suffix: 'kg/km' },
      { key: 'bike_co2_saved_per_km',  label: 'Bisiklet',      sub: 'varsayılan: 0.192', suffix: 'kg/km' },
      { key: 'bus_co2_saved_per_km',   label: 'Toplu Taşıma',  sub: 'varsayılan: 0.103', suffix: 'kg/km' },
      { key: 'car_co2_emitted_per_km', label: 'Araç (emisyon)', sub: 'varsayılan: 0.192', suffix: 'kg/km' },
    ],
  },
  {
    key: 'cc',
    title: 'CC & XP Kazanç Oranları',
    sub: 'Km başına kazanılan Carbon Coin ve XP',
    icon: Zap,
    color: '#F59E0B',
    fields: [
      { key: 'walk_cc_per_km',       label: 'Yürüyüş CC',      sub: 'varsayılan: 10',  suffix: 'CC/km' },
      { key: 'bike_cc_per_km',       label: 'Bisiklet CC',      sub: 'varsayılan: 8',   suffix: 'CC/km' },
      { key: 'bus_cc_per_km',        label: 'Toplu Taşıma CC',  sub: 'varsayılan: 5',   suffix: 'CC/km' },
      { key: 'car_cc_penalty_per_km',label: 'Araç CC cezası',   sub: 'varsayılan: -2',  suffix: 'CC/km' },
      { key: 'xp_per_km_walk',       label: 'Yürüyüş XP',      sub: 'varsayılan: 15',  suffix: 'XP/km' },
      { key: 'xp_per_km_bike',       label: 'Bisiklet XP',      sub: 'varsayılan: 12',  suffix: 'XP/km' },
      { key: 'xp_per_km_bus',        label: 'Otobüs XP',        sub: 'varsayılan: 5',   suffix: 'XP/km' },
    ],
  },
  {
    key: 'anomaly',
    title: 'Anomali Eşikleri',
    sub: 'Şüpheli aktivite tespiti için sınır değerleri',
    icon: Shield,
    color: '#EF4444',
    fields: [
      { key: 'anomaly_max_walk_speed',     label: 'Maks. Yürüyüş Hızı',  sub: 'varsayılan: 10', suffix: 'km/s' },
      { key: 'anomaly_max_bus_speed',      label: 'Maks. Otobüs Hızı',   sub: 'varsayılan: 90', suffix: 'km/s' },
      { key: 'anomaly_max_distance_km',    label: 'Maks. Mesafe',         sub: 'varsayılan: 500', suffix: 'km' },
      { key: 'anomaly_min_duration_min',   label: 'Min. Süre',            sub: 'varsayılan: 1',  suffix: 'dk' },
    ],
  },
];

function Section({ title, sub, icon: Icon, color, fields, values, onChange }) {
  return (
    <div style={{ ...card, borderRadius: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800 }}>{title}</h2>
          {sub && <p style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{sub}</p>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {fields.map(f => (
          <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', alignItems: 'center', gap: 20 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{f.label}</p>
              {f.sub && <p style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{f.sub}</p>}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="0.001"
                value={values[f.key] ?? ''}
                onChange={e => onChange(f.key, e.target.value)}
                style={{ ...inputBase, paddingRight: f.suffix ? 60 : 14, width: '100%', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = t.primaryBorder}
                onBlur={e => e.target.style.borderColor = t.border}
              />
              {f.suffix && (
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: t.textMuted, fontWeight: 600 }}>
                  {f.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/settings')
      .then(r => setValues(r.data || {}))
      .catch(e => setError('Ayarlar yüklenemedi: ' + (e.response?.data?.error || e.message)))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const body = {};
      for (const [k, v] of Object.entries(values)) {
        if (v !== '' && v !== null && v !== undefined) {
          body[k] = Number(v);
        }
      }
      await api.put('/admin/settings', body);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.response?.data?.error || 'Kayıt hatası');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="anim-fade-slide" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>Sistem Ayarları</h1>
          <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>CO2 oranları, CC kazanımları ve anomali eşikleri</p>
        </div>
        <button onClick={handleSave} disabled={saving || loading} style={{
          ...btnPrimary, padding: '10px 20px', borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 6,
          background: saved ? 'linear-gradient(135deg, #22C55E, #16A34A)' : 'linear-gradient(135deg, #4DFFAA, #00FF87)',
          boxShadow: saved ? '0 0 20px rgba(34,197,94,0.4)' : `0 0 20px rgba(0,255,135,0.3)`,
          opacity: saving || loading ? 0.6 : 1,
        }}>
          <Save size={15} />
          {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Kaydet'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#EF4444' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 200, background: t.bgCard, borderRadius: 18, border: `1px solid ${t.border}` }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {SETTING_GROUPS.map((group, i) => (
            <div key={group.key} style={group.key === 'cc' ? { gridColumn: '1 / -1' } : {}}>
              <Section
                title={group.title}
                sub={group.sub}
                icon={group.icon}
                color={group.color}
                fields={group.fields}
                values={values}
                onChange={handleChange}
              />
            </div>
          ))}
        </div>
      )}

      <div style={{ ...card, borderRadius: 16, background: 'rgba(0,255,135,0.04)', border: `1px solid ${t.primaryBorder}` }}>
        <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.6 }}>
          ⚠️ Bu değerler, kullanıcıların her km için kazandığı CC ve CO2 tasarrufunu belirler. Değişiklikler anında uygulanır.
          Mobil uygulamada yeni aktivite kaydedildiğinde backend bu tabloyu kullanır.
        </p>
      </div>
    </div>
  );
}
