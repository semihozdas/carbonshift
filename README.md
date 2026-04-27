# CarbonShift

CarbonShift, GPS tabanlı otomatik karbon ayak izi takip uygulamasıdır. Kullanıcıların ulaşım modlarını (yürüyüş, otobüs, araba) otomatik olarak tespit eder, karbon tasarrufunu hesaplar ve kullanıcıları CarbonCoin (CC) ile ödüllendirir.

## Özellikler

- **Otomatik Takip**: GPS ve sensörler yardımıyla ulaşım modu tespiti.
- **Karbon Hesaplama**: Bilimsel verilere dayalı karbon ayak izi hesaplaması.
- **Ödül Sistemi**: Karbon tasarrufu yaptıkça kazanılan CarbonCoin'ler.
- **Görevler**: Günlük, haftalık ve aylık hedefler.
- **Liderlik Tablosu**: Topluluk içinde rekabet.
- **Admin Paneli**: Kullanıcı yönetimi, anomali tespiti ve sistem ayarları.

## Teknoloji Stack

- **Mobil**: React Native, Expo SDK 54, Expo Router, Google Maps API.
- **Backend**: Node.js, Express, PostgreSQL, Redis, Firebase Admin SDK.
- **Admin**: React, Vite, JWT Auth.
- **Altyapı**: Docker, Docker Compose.

## Kurulum

1. **Firebase Ayarları**:
   - Firebase Console üzerinden bir proje oluşturun.
   - Authentication (Email/Password) ve Firestore'u aktif edin.
   - `.env` dosyasını `FIREBASE_*` bilgileriyle doldurun.

2. **Google Maps API**:
   - Google Cloud Console üzerinden Maps SDK'yı aktif edin ve API key alın.
   - `app.json` ve `.env` dosyalarına ekleyin.

3. **Uygulamayı Başlatma**:
   ```bash
   # Docker konteynerlarını ayağa kaldırın
   docker-compose up -d --build

   # Mobil uygulamayı başlatın
   npm install
   npx expo start
   ```

4. **Admin Girişi**:
   - URL: `http://localhost:3000`
   - E-posta: `admin@carbonshift.local`
   - Şifre: `admin123`

## Klasör Yapısı

- `/app`: Expo Router ekranları.
- `/src`: Mobil uygulama bileşenleri ve servisleri.
- `/backend`: Node.js API ve veritabanı mantığı.
- `/admin`: React tabanlı yönetim paneli.
- `init.sql`: Veritabanı şeması ve seed verileri.

## Lisans

MIT
