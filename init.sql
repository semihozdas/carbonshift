-- CarbonShift Database Schema (v2 — production-ready)

-- ─────────────────────────────────────────────────────────────────────────────
-- Geography
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    UNIQUE(city_id, name)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    avatar_url TEXT,
    city_id INTEGER REFERENCES cities(id),
    district_id INTEGER REFERENCES districts(id),
    cc_balance DECIMAL(15, 2) DEFAULT 0.00,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    total_co2_saved DECIMAL(15, 2) DEFAULT 0.00,
    total_distance_km DECIMAL(15, 2) DEFAULT 0.00,
    daily_steps INTEGER DEFAULT 0,
    profile_completion_percentage INTEGER DEFAULT 0,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─────────────────────────────────────────────────────────────────────────────
-- Admin Users
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tasks (templates)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) CHECK (type IN ('daily', 'weekly', 'monthly')),
    icon VARCHAR(50) DEFAULT 'leaf',
    cc_reward DECIMAL(10, 2) DEFAULT 0.00,
    xp_reward INTEGER DEFAULT 0,
    requirement_type VARCHAR(50),
    requirement_value DECIMAL(15, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    progress DECIMAL(15, 2) DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    period_start DATE DEFAULT CURRENT_DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, task_id, period_start)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Badges
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'medal',
    color VARCHAR(20) DEFAULT '#00FF87',
    rarity VARCHAR(20) DEFAULT 'common',
    requirement_code VARCHAR(50),
    requirement_value DECIMAL(15, 2),
    cc_reward DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Activities
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    transport_mode VARCHAR(20) CHECK (transport_mode IN ('walk', 'bus', 'car', 'bike')),
    distance_km DECIMAL(10, 3) NOT NULL,
    co2_saved DECIMAL(10, 3) NOT NULL,
    cc_earned DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER,
    avg_speed_kmh DECIMAL(6, 2),
    step_count INTEGER,
    start_lat DECIMAL(10, 8),
    start_lng DECIMAL(11, 8),
    end_lat DECIMAL(10, 8),
    end_lng DECIMAL(11, 8),
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_anomaly ON activities(is_anomaly) WHERE is_anomaly = TRUE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Bus Stops
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bus_stops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    city_id INTEGER REFERENCES cities(id),
    routes TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Campaigns
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    cc_bonus_multiplier DECIMAL(4, 2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Community Tasks
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value DECIMAL(15, 2),
    current_value DECIMAL(15, 2) DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'km',
    reward_cc DECIMAL(10, 2),
    is_completed BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_task_participants (
    id SERIAL PRIMARY KEY,
    community_task_id INTEGER REFERENCES community_tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    contribution DECIMAL(15, 2) DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(community_task_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Streak & Economy
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_streaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cc_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cc_transactions_user ON cc_transactions(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Rewards
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'gift',
    cc_cost DECIMAL(15, 2) NOT NULL,
    stock_count INTEGER DEFAULT -1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reward_id INTEGER REFERENCES rewards(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    redemption_code VARCHAR(50) UNIQUE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Security & Settings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50),
    description TEXT,
    severity VARCHAR(20) DEFAULT 'info',
    ip_address VARCHAR(45),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_logs_created ON security_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Functions & Triggers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calc_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    IF NEW.full_name IS NOT NULL AND NEW.full_name <> '' THEN score := score + 25; END IF;
    IF NEW.city_id IS NOT NULL THEN score := score + 25; END IF;
    IF NEW.district_id IS NOT NULL THEN score := score + 25; END IF;
    IF NEW.is_email_verified = TRUE OR NEW.password_hash IS NOT NULL THEN score := score + 25; END IF;
    NEW.profile_completion_percentage := score;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calc_profile_completion ON users;
CREATE TRIGGER trg_calc_profile_completion
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION calc_profile_completion();

CREATE OR REPLACE FUNCTION calc_level_from_xp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level := GREATEST(1, FLOOR(SQRT(NEW.xp::numeric / 100.0)) + 1)::integer;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calc_level ON users;
CREATE TRIGGER trg_calc_level
BEFORE INSERT OR UPDATE OF xp ON users
FOR EACH ROW EXECUTE FUNCTION calc_level_from_xp();

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Data
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO cities (name) VALUES
('İstanbul'), ('Ankara'), ('İzmir'), ('Bursa'), ('Antalya'),
('Adana'), ('Konya'), ('Gaziantep'), ('Şanlıurfa'), ('Kocaeli'),
('Mersin'), ('Diyarbakır'), ('Kayseri'), ('Eskişehir'), ('Trabzon'),
('Samsun'), ('Denizli'), ('Balıkesir'), ('Hatay'), ('Manisa')
ON CONFLICT DO NOTHING;

INSERT INTO districts (city_id, name) VALUES
(1, 'Kadıköy'), (1, 'Beşiktaş'), (1, 'Şişli'), (1, 'Üsküdar'), (1, 'Bakırköy'),
(1, 'Fatih'), (1, 'Beyoğlu'), (1, 'Sarıyer'), (1, 'Ataşehir'), (1, 'Maltepe'),
(2, 'Çankaya'), (2, 'Keçiören'), (2, 'Yenimahalle'), (2, 'Mamak'),
(3, 'Konak'), (3, 'Karşıyaka'), (3, 'Bornova'), (3, 'Buca')
ON CONFLICT DO NOTHING;

-- System Settings
INSERT INTO system_settings (key, value, description) VALUES
('walk_cc_per_km', '10', 'CC earned per kilometer walked'),
('bus_cc_per_km', '5', 'CC earned per kilometer by bus'),
('bike_cc_per_km', '8', 'CC earned per kilometer by bike'),
('car_cc_penalty_per_km', '-2', 'CC penalty per kilometer in car'),
('walk_co2_saved_per_km', '0.192', 'CO2 saved per km walk (vs car baseline)'),
('bus_co2_saved_per_km', '0.103', 'CO2 saved per km bus (vs car baseline)'),
('bike_co2_saved_per_km', '0.192', 'CO2 saved per km bike'),
('car_co2_emitted_per_km', '0.192', 'CO2 emitted per km car'),
('xp_per_km_walk', '15', 'XP per km walked'),
('xp_per_km_bus', '5', 'XP per km by bus'),
('xp_per_km_bike', '12', 'XP per km by bike'),
('anomaly_max_walk_speed', '10', 'Max realistic walking speed km/h'),
('anomaly_max_bus_speed', '90', 'Max realistic bus speed km/h'),
('anomaly_min_duration_min', '1', 'Min activity duration in minutes')
ON CONFLICT (key) DO NOTHING;

-- Tasks (templates)
INSERT INTO tasks (title, description, type, icon, cc_reward, xp_reward, requirement_type, requirement_value) VALUES
('Günlük Yürüyüş', 'Günde 5000 adım at.', 'daily', 'walk', 5.00, 50, 'steps', 5000),
('Otobüs Kullan', 'Toplu taşıma ile karbonu azalt.', 'daily', 'bus', 10.00, 100, 'bus_km', 3),
('Yeşil Başlangıç', 'Bugün ilk aktiviteni tamamla.', 'daily', 'leaf', 3.00, 30, 'activities', 1),
('Haftalık Maraton', 'Bu hafta 20km yürü.', 'weekly', 'trophy', 50.00, 500, 'walk_km', 20),
('Toplu Taşıma Şampiyonu', 'Haftada 10 otobüs yolculuğu.', 'weekly', 'bus', 75.00, 750, 'bus_trips', 10),
('Bisiklet Haftası', 'Haftada 15km bisiklet sür.', 'weekly', 'bicycle', 40.00, 400, 'bike_km', 15),
('Aylık Doğa Dostu', 'Ayda 100km toplu taşıma.', 'monthly', 'trophy', 200.00, 2000, 'bus_km', 100),
('Karbon Savaşçısı', 'Ayda 10kg CO2 tasarrufu.', 'monthly', 'leaf', 300.00, 3000, 'co2_saved', 10)
ON CONFLICT DO NOTHING;

-- Badges
INSERT INTO badges (name, description, icon, color, rarity, requirement_code, requirement_value, cc_reward) VALUES
('Yeşil Başlangıç', 'İlk aktiviteni tamamla.', 'sprout', '#00FF87', 'common', 'first_activity', 1, 10),
('Adım Atan', '10km yürü.', 'walk', '#00FF87', 'common', 'walk_km', 10, 25),
('Koşucu', '50km yürü.', 'medal', '#3B82F6', 'rare', 'walk_km', 50, 100),
('Maratoncu', '200km yürü.', 'trophy', '#8B5CF6', 'epic', 'walk_km', 200, 500),
('Karbon Dostu', '10kg CO2 tasarrufu.', 'leaf', '#00FF87', 'rare', 'co2_saved', 10, 100),
('Karbon Kahramanı', '100kg CO2 tasarrufu.', 'shield', '#F59E0B', 'legendary', 'co2_saved', 100, 1000),
('Ateş Koşucu', '7 gün üst üste aktivite.', 'flame', '#F59E0B', 'rare', 'streak', 7, 100),
('Yenilmez', '30 gün üst üste aktivite.', 'flame', '#EC4899', 'legendary', 'streak', 30, 1000),
('Toplu Taşıma Aşığı', '50 otobüs yolculuğu.', 'bus', '#3B82F6', 'rare', 'bus_trips', 50, 150),
('Bisiklet Tutkunu', '100km bisiklet.', 'bicycle', '#8B5CF6', 'epic', 'bike_km', 100, 300)
ON CONFLICT DO NOTHING;

-- Bus Stops (Istanbul samples)
INSERT INTO bus_stops (name, latitude, longitude, city_id, routes) VALUES
('Taksim Meydanı', 41.0369, 28.9850, 1, '30A, 40, 54E'),
('Kadıköy Rıhtım', 40.9910, 29.0230, 1, '16A, 19FB, 500T'),
('Beşiktaş Meydan', 41.0428, 29.0075, 1, '25E, 40, 42T'),
('Şişli Camii', 41.0600, 28.9870, 1, '54E, 59A'),
('Üsküdar İskele', 41.0270, 29.0150, 1, '9Ü, 11ÜS, 15F'),
('Levent Metro', 41.0760, 29.0150, 1, '29, 59R'),
('Mecidiyeköy', 41.0670, 28.9920, 1, '29, 54E, 25E'),
('Bakırköy Meydan', 40.9780, 28.8740, 1, '76, 72E'),
('Zeytinburnu', 40.9900, 28.9050, 1, '76, 81'),
('Avcılar Merkez', 40.9810, 28.7180, 1, '76, 72A'),
('Beylikdüzü', 41.0020, 28.6430, 1, '76CA, 76DB'),
('Eminönü', 41.0170, 28.9700, 1, '55ET, 77T'),
('Karaköy', 41.0250, 28.9740, 1, '25A, 26'),
('Ortaköy', 41.0475, 29.0270, 1, '40, 42T'),
('Beyazıt', 41.0100, 28.9630, 1, '91O, 92')
ON CONFLICT DO NOTHING;

-- Rewards
INSERT INTO rewards (title, description, icon, cc_cost) VALUES
('İstanbulkart 10 TL Yükleme', 'İstanbulkart''ına 10 TL bakiye.', 'credit-card', 1000.00),
('Market %10 İndirim', 'Anlaşmalı marketlerde %10 indirim.', 'shopping-cart', 500.00),
('Kahve Kuponu', 'Anlaşmalı kafelerde 1 kahve hediye.', 'coffee', 750.00),
('5 TL Nakit İade', 'Hesabına 5 TL nakit iade.', 'banknote', 1500.00),
('Fidan Dikimi', 'Adına 1 adet fidan dikilsin.', 'tree-pine', 2000.00),
('Spor Salonu 1 Gün', '1 günlük spor salonu geçiş.', 'dumbbell', 800.00)
ON CONFLICT DO NOTHING;

-- Campaigns
INSERT INTO campaigns (title, description, end_date, cc_bonus_multiplier) VALUES
('Bahar Kampanyası', 'Bu ay otobüs yolculukları 2x CC kazandırır!', CURRENT_TIMESTAMP + INTERVAL '30 days', 2.0),
('Dünya Yürüyüş Günü', '5km üzeri yürüyüşlerde ekstra 50 CC!', CURRENT_TIMESTAMP + INTERVAL '7 days', 1.5)
ON CONFLICT DO NOTHING;

-- Community Tasks
INSERT INTO community_tasks (title, description, target_value, unit, reward_cc, end_date) VALUES
('Topluluk Hedefi: 10.000 km', 'Birlikte 10.000 km yürüyelim!', 10000, 'km', 100, CURRENT_TIMESTAMP + INTERVAL '30 days'),
('1 Milyon CO2 Tasarrufu', 'Hep birlikte 1000kg CO2 tasarrufu yapalım!', 1000, 'kg CO2', 200, CURRENT_TIMESTAMP + INTERVAL '60 days')
ON CONFLICT DO NOTHING;

-- Admin user seed is done at server startup (see backend/src/db/seed.js)
-- because bcrypt needs Node.js runtime.
