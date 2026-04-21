# Dokumentasi Project `display-harga`

## 1. Ringkasan

`display-harga` adalah project standalone untuk menampilkan **Display TV Harga Emas**. Project ini dibuat terpisah dari aplikasi Nagagold, sehingga tidak lagi bergantung pada script, route, database, atau module Nagagold.

Fokus aplikasi:
- Mengelola master kategori harga emas.
- Mengelola media TV, terutama link YouTube untuk hero display.
- Menampilkan halaman Display TV dengan design luxury seperti fitur TV Harga Emas di Nagagold.
- Mengelola user login.
- Mengelola pengaturan sistem/toko.

Route utama:
- Admin panel: `/`
- Master Kategori: `/categories`
- Master Media: `/media`
- Manage User: `/users`
- Pengaturan Sistem: `/settings`
- Display TV: `/display`

## 2. Lokasi Project

Folder project:

```bash
/Users/aandiyanti/Documents/RnD/PROJECT/display-harga
```

Struktur utama:

```text
display-harga/
  display-fe/          Frontend React + Vite
  server/              Backend Express + MongoDB
  server/uploads/      Penyimpanan file upload lokal jika fitur diaktifkan lagi
  .env                 Konfigurasi lokal, ignored by git
  .env.example         Template env backend
  display-harga.md     Dokumentasi project ini
```

## 3. Stack Teknologi

Frontend:
- React
- Vite
- TypeScript
- Tailwind CSS
- React Query
- Radix UI/shadcn-style components

Backend:
- Node.js
- Express
- MongoDB native driver
- JWT
- bcryptjs
- multer

Database:
- MongoDB
- Database default: `db_display_nagagold`

## 4. Environment

File env backend ada di root project:

```bash
/Users/aandiyanti/Documents/RnD/PROJECT/display-harga/.env
```

Contoh isi:

```env
PORT=7118
JWT_SECRET=change_me
MONGODB_URI="mongodb://user:password@host:27017/db_display_nagagold?authSource=admin"
```

Catatan:
- `.env` tidak boleh di-commit.
- `.env.example` hanya berisi placeholder.
- Jika koneksi database berubah, update `MONGODB_URI` di `.env`.
- Backend otomatis membaca `.env` root project.

Frontend dev proxy:

```text
display-fe/vite.config.ts
```

Default:
- Frontend dev port: `8080`
- Backend API target: `http://localhost:7118`
- Proxy dev:
  - `/api` ke backend
  - `/uploads` ke backend

## 5. Database dan Collection

Project ini memakai collection berikut.

### 5.1 `tm_kategori`

Master kategori harga emas yang ditampilkan di Display TV.

Field utama:

```js
{
  code: string,
  name: string,
  price: number,
  buybackPrice: number,
  isActive: boolean,
  createdAt: string,
  updatedAt: string
}
```

Digunakan oleh:
- Master Kategori
- Dashboard
- Display TV

Catatan:
- Input `price` dan `buybackPrice` di frontend diformat ribuan saat diketik.
- Data yang dikirim ke backend tetap number.
- Index unique dibuat pada `code`.

### 5.2 `tm_media`

Master media yang tampil di area hero Display TV.

Field untuk YouTube:

```js
{
  label: string,
  type: "youtube",
  sourceUrl: string,
  embedUrl: string,
  durationSec: number,
  isActive: boolean,
  createdAt: string,
  updatedAt: string
}
```

Field untuk file lokal:

```js
{
  label: string,
  type: "file",
  fileName: string,
  url: string,
  isActive: boolean,
  createdAt: string,
  updatedAt: string
}
```

Catatan:
- UI upload lokal saat ini di-hide/comment.
- Logic backend dan FE untuk upload lokal masih ada, jadi bisa diaktifkan lagi nanti.
- YouTube tetap aktif dan bisa dipakai dari Master Media.

### 5.3 `tm_user`

User login admin panel.

Field utama:

```js
{
  username: string,
  passwordHash: string,
  level: "owner" | "admin" | "operator",
  isActive: boolean,
  createdAt: string,
  updatedAt: string
}
```

Role:
- `owner`: akses setara admin.
- `admin`: akses admin.
- `operator`: akses terbatas.

Catatan:
- Jika collection masih kosong, backend otomatis membuat default admin:
```

### 5.4 `tp_system`

Pengaturan identitas sistem/toko.

Field utama:

```js
{
  _id: "singleton",
  companyCode: string,
  companyName: string,
  address: string,
  phone: string,
  updatedAt: string
}
```

Digunakan oleh:
- Sidebar admin
- Display TV
- Login footer/code
- Dashboard context

Catatan:
- `companyName` dipakai sebagai identitas toko.
- Copyright Display TV dan login tetap:

```text
NAGATECH SISTEM INTEGRATOR
```

## 6. Backend API

Base URL dev:

```text
http://localhost:7118/api
```

Endpoint publik:

```text
GET /api/health
GET /api/display
POST /api/auth/login
```

Endpoint auth:

```text
GET /api/auth/me
```

Endpoint kategori:

```text
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

Endpoint media:

```text
GET    /api/media
POST   /api/media/youtube
POST   /api/media/upload
PUT    /api/media/:id
DELETE /api/media/:id
```

Endpoint system:

```text
GET /api/system
PUT /api/system
```

Endpoint user:

```text
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

## 7. Frontend Behavior

### 7.1 Login

Fitur login:
- Login menggunakan username/password dari `tm_user`.
- Checkbox `Ingat saya` menyimpan username dan password di localStorage perangkat tersebut.
- Setelah login selalu masuk ke dashboard `/`.
- Tidak lagi kembali ke halaman terakhir sebelum logout.
- Link `Lupa password?` di-hide.
- Caption `Belum punya akun? Hubungi admin` di-hide.

### 7.2 Dashboard

Dashboard menampilkan:
- Total kategori.
- Total media.
- Total pengguna.
- Rata-rata harga.
- Kategori terbaru.
- Playlist aktif.

Card dashboard memakai aksen warna soft.

### 7.3 Master Kategori

Field:
- Kode Kategori
- Nama Kategori
- Harga
- Harga Buyback
- Status aktif

Input Harga dan Harga Buyback:
- Saat user mengetik `5000000`, tampilan menjadi `5.000.000`.
- Saat disimpan, nilai tetap dikirim sebagai number.

### 7.4 Master Media

Saat ini UI utama menampilkan:
- Tambah media YouTube.
- Preview media.
- Aktif/nonaktif media.
- Hapus media.

Upload lokal:
- UI upload lokal di-comment.
- Logic masih tersedia di FE dan backend.

### 7.5 Manage User

Fitur:
- Tambah user.
- Edit user.
- Hapus user.
- Role `owner`, `admin`, `operator`.
- Toggle user aktif.

Role picker:
- Dibuat dropdown inline di bawah field role.
- Tidak lagi modal konfirmasi penuh.

### 7.6 Layout Admin

Layout saat ini:
- Sidebar kiri berisi menu.
- Brand sidebar: `Display Harga Emas`.
- Subtitle sidebar memakai `companyName`.
- Header atas berisi:
  - Tanggal System
  - Theme toggle
  - Info user login
  - Dropdown logout ketika user/panah diklik

### 7.7 Display TV

Route:

```text
/display
```

Sumber data:

```text
GET /api/display
```

Data yang dipakai:
- `categories` dari `tm_kategori`
- `media` dari `tm_media`
- `system` dari `tp_system`

Behavior:
- Refresh data otomatis setiap 30 detik.
- Jam berjalan realtime.
- Kategori dibagi kiri dan kanan.
- Jika data lebih banyak dari kapasitas layar, halaman list berganti otomatis.
- Running ticker bergerak.
- Highlight harga dan buyback berganti otomatis.
- Hero menampilkan video jika media aktif tersedia.
- Jika tidak ada video atau video loading, tampil gambar default `gold-tv-hero.png`.
- Copyright tetap `©Nagatech Sistem Integrator - tahun berjalan`.

Label Display TV:
- Kolom harga: `Harga`
- Kolom buyback: `Buyback`
- Card bawah video untuk buyback: `Buyback`

Theme:
- Dark mode: tampilan luxury dark.
- Light mode: tampilan TV ikut terang dengan aksen emas.

## 8. Asset Penting

Hero default:

```text
display-fe/src/assets/gold-tv-hero.png
```

Login background:

```text
display-fe/src/assets/login-bg.svg
```

CSS Display TV:

```text
display-fe/src/pages/DisplayTVMonolith.css
```

Komponen Display TV:

```text
display-fe/src/pages/DisplayTV.tsx
```

## 9. Step-by-Step Develop Lokal

### 9.1 Masuk ke folder project

```bash
cd /Users/aandiyanti/Documents/RnD/PROJECT/display-harga
```

### 9.2 Install dependency

Jika `node_modules` belum ada:

```bash
npm install
```

Atau:

```bash
npm run install:all
```

### 9.3 Siapkan `.env`

Buat file:

```bash
.env
```

Isi minimal:

```env
PORT=7118
JWT_SECRET=change_me
MONGODB_URI="isi_mongodb_uri_di_sini"
```

Pastikan database dapat diakses dari komputer ini.

### 9.4 Jalankan backend

Terminal 1:

```bash
npm --workspace server run dev
```

Backend akan jalan di:

```text
http://localhost:7118
```

Cek health:

```bash
curl http://localhost:7118/api/health
```

Response normal:

```json
{
  "data": {
    "ok": true,
    "mongoDb": "db_display_nagagold"
  }
}
```

### 9.5 Jalankan frontend

Terminal 2:

```bash
npm --workspace display-fe run dev
```

Frontend dev akan jalan di:

```text
http://localhost:8080
```

Login:

```text
username: 
password:
```

Catatan:
- Saat dev, frontend memakai proxy `/api` dan `/uploads` ke backend `localhost:7118`.
- Jadi browser cukup buka `http://localhost:8080`.

## 10. Step-by-Step Develop via Network/LAN

Tujuan: aplikasi dibuka dari device lain di jaringan yang sama, misalnya laptop lain, HP, Android TV, atau TV browser.

### 10.1 Cari IP komputer server

Di Mac:

```bash
ipconfig getifaddr en0
```

Jika pakai LAN kabel bisa jadi:

```bash
ipconfig getifaddr en1
```

Contoh hasil:

```text
192.168.1.25
```

### 10.2 Jalankan backend

```bash
cd /Users/aandiyanti/Documents/RnD/PROJECT/display-harga
npm --workspace server run dev
```

Backend akan listen di port:

```text
7118
```

Test dari komputer server:

```bash
curl http://localhost:7118/api/health
```

Test dari device lain:

```text
http://192.168.1.25:7118/api/health
```

### 10.3 Jalankan frontend dev network

Vite sudah diset:

```ts
host: "::",
port: 8080
```

Jalankan:

```bash
npm --workspace display-fe run dev
```

Buka dari device lain:

```text
http://192.168.1.25:8080
```

Buka display TV:

```text
http://192.168.1.25:8080/display
```

Catatan:
- Di mode develop, API tetap aman karena Vite proxy meneruskan `/api` ke backend lokal komputer server.
- Pastikan firewall Mac mengizinkan koneksi masuk ke Node/Vite.

### 10.4 Jika device lain tidak bisa akses

Cek:
- Komputer dan device berada di jaringan Wi-Fi/LAN yang sama.
- Backend jalan.
- Frontend jalan.
- IP benar.
- Port `8080` tidak diblokir.
- Port `7118` tidak diblokir.
- VPN/firewall tidak memblokir koneksi lokal.


## 11. Step-by-Step Build & Deploy Production (Server/Network)

### 11.1 Clone Project dari GitHub

Clone project dari repository resmi:

```bash
git clone https://github.com/RND-Nagatech/display-harga.git
```

### 11.2 Struktur Penempatan Folder

- **Backend (server):**  
  Clone folder `server` ke:  
  `/home/nodeapp/server`

- **Frontend (display-fe):**  
  Clone folder `display-fe` ke:  
  `/var/www/html/display-fe`

Contoh:

```bash
# Backend
git clone https://github.com/RND-Nagatech/display-harga.git
cp -r display-harga/server /home/nodeapp/server

# Frontend
cp -r display-harga/display-fe /var/www/html/display-fe
```

> **Catatan:**  
> Pastikan folder `server` dan `display-fe` berada di lokasi yang sesuai dengan kebutuhan server/hosting Anda.

### 11.3 Setup Backend

1. Masuk ke folder backend:
  ```bash
  cd /home/nodeapp/server
  ```
2. Install dependencies:
  ```bash
  npm install
  ```
3. Copy `.env.example` menjadi `.env` dan sesuaikan konfigurasi database:
  ```bash
  cp .env.example .env
  nano .env
  ```
4. Jalankan backend:
  ```bash
  npm run start
  ```
   Backend berjalan di port sesuai `.env` (default: 7118).

### 11.4 Setup Frontend

1. Masuk ke folder frontend:
  ```bash
  cd /var/www/html/display-fe
  ```
2. Install dependencies:
  ```bash
  npm install
  ```
3. (Opsional) Edit file `.env.production` untuk set API URL jika backend beda host/port:
  ```env
  VITE_API_BASE_URL="http://IP_SERVER:7118/api"
  ```
4. Build frontend:
  ```bash
  npm run build
  ```
   Hasil build ada di `/var/www/html/display-fe/dist`.

5. Konfigurasikan web server (Nginx/Apache) untuk serve folder `dist` sebagai static site.

## 12. Build untuk TV / Display

Untuk TV browser dalam jaringan:

1. Jalankan backend.
2. Jalankan frontend dev atau preview.
3. Buka URL display:

```text
http://IP_SERVER:8080/display
```

4. Fullscreen browser:
   - Chrome: `View > Enter Full Screen`
   - Keyboard Mac: `Control + Command + F`

Rekomendasi:
- Gunakan resolusi landscape.
- Gunakan browser Chrome/Chromium.
- Matikan sleep display pada device player.
- Pastikan koneksi ke backend stabil.

## 13. Verifikasi Setelah Perubahan

Frontend:

```bash
npm --workspace display-fe run build
```

Backend syntax:

```bash
node --check server/server.js
```

Health API:

```bash
curl http://localhost:7118/api/health
```

Login API:

```bash
curl -X POST http://localhost:7118/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"","password":""}'
```

Display data:

```bash
curl http://localhost:7118/api/display
```

## 14. Troubleshooting

### 14.1 Tidak bisa login

Cek:
- Backend sudah jalan di `7118`.
- MongoDB bisa connect.
- User ada di `tm_user`.
- User `isActive` bukan `false`.
- Password benar.

Test langsung:

```bash
curl -X POST http://localhost:7118/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"","password":""}'
```

### 14.2 Frontend muncul tapi API gagal

Jika develop:
- Pastikan frontend dibuka dari `http://localhost:8080` atau `http://IP_SERVER:8080`.
- Pastikan Vite dev masih jalan.
- Pastikan backend `7118` jalan.

Jika build/preview:
- Pastikan `VITE_API_BASE_URL` sudah benar sebelum build.

### 14.3 Display TV kosong

Cek:
- `tm_kategori` punya data.
- Kategori `isActive` true.
- `price` dan `buybackPrice` angka valid.
- Endpoint `/api/display` mengembalikan `categories`.

### 14.4 Video tidak muncul

Cek:
- Media `isActive` true.
- Link YouTube valid.
- Jika file lokal dipakai, pastikan file tersedia di `server/uploads`.
- Endpoint `/uploads/...` bisa diakses dari browser.

### 14.5 Device lain tidak bisa buka

Cek:
- IP server benar.
- Device satu jaringan.
- Port `8080` dan `7118` tidak diblokir firewall.
- Jika memakai preview/build, `VITE_API_BASE_URL` memakai IP server, bukan `localhost`.

## 15. Catatan Pengembangan

Hal yang sudah disesuaikan:
- Project berdiri sendiri dari Nagagold.
- Database memakai collection baru `tm_kategori`, `tm_media`, `tm_user`, `tp_system`.
- Display TV memakai design luxury motion dari Nagagold, tetapi data dari backend standalone.
- Hero video dapat memakai YouTube dan auto-rotate.
- Hero image fallback tetap tersedia.
- Theme light/dark diterapkan ke admin dan Display TV.
- Copyright dikunci ke Nagatech Sistem Integrator.
- Login remember-me menyimpan username/password di perangkat.
- Setelah login selalu masuk dashboard.
- Upload lokal media di-hide dari UI, tetapi logic masih ada.

Hal yang bisa dikembangkan nanti:
- Build executable/kiosk untuk Android TV.
- Reverse proxy Nginx agar frontend dan backend satu domain.
- Pengaturan interval rotasi media dari UI.
- Pengaturan tema Display TV dari database.
- Multi-display profile.
- Import kategori dari Excel.
- Audit log perubahan harga.
