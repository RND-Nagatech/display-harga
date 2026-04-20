
# display-harga


Project ini adalah sistem display harga emas digital yang berdiri sendiri untuk kebutuhan layar TV toko emas.

Fitur utama:
- Manajemen kategori harga emas
- Manajemen media display (video/gambar/link)
- Layar display harga dengan rotasi media otomatis
- Manage user
- Pengaturan sistem perusahaan

## Struktur

- `display-fe`: React + Vite (Shadcn UI)
- `server`: Express + MongoDB + media upload lokal

## Catatan scope

Repo ini tidak connect ke script/backend Nagagold. Semua data yang tampil di Display TV diambil dari master project ini sendiri.

## Menjalankan project

### 1. Install dependency

```bash
cd /Users/aandiyanti/Documents/RnD/PROJECT/display-harga
npm run install:all
```

### 1.1 Setup env (MongoDB)

Copy `.env.example` menjadi `.env` lalu sesuaikan nilainya.

### 2. Jalankan backend

```bash
npm run dev:server
```

Backend default berjalan di `http://localhost:7118`.

### 3. Jalankan frontend

Terminal baru:

```bash
npm run dev:fe
```

Frontend default berjalan di `http://localhost:8080`.

Jika backend tidak di `http://localhost:7118`, buat file `display-fe/.env` lalu isi `VITE_API_BASE_URL` (lihat `display-fe/.env.example`).

## Login

Admin panel membutuhkan login.

Default user (otomatis dibuat saat server pertama kali jalan):

- username: `admin`
- password: `admin123`

## Konfigurasi (opsional)

Frontend mendukung konfigurasi untuk kebutuhan bisnis global via environment variable:

- `VITE_LOCALE` (default: `id-ID`) — format tanggal & angka
- `VITE_CURRENCY` (default: `IDR`) — format mata uang
- `VITE_CURRENCY_FRACTION_DIGITS` (default: `0`) — jumlah digit desimal
- `VITE_BRAND_NAME` (default: `Display Harga`) — nama brand yang tampil di layar TV
- `VITE_PRODUCT_NAME` (default: `Price Display Suite`) — judul aplikasi di sidebar

Contoh jalankan frontend dengan format US Dollar:

```bash
VITE_LOCALE=en-US VITE_CURRENCY=USD VITE_CURRENCY_FRACTION_DIGITS=2 npm run dev:fe
```

## Dark/Light mode

Klik tombol `Light mode` / `Dark mode` di sidebar. Preferensi disimpan di browser (localStorage).

## TV Display (tab baru, fit layar)

Menu `TV Display` di sidebar akan membuka tab baru ke route:

- `http://localhost:8080/display`

Tampilan ini dibuat full-viewport dan auto-scale untuk rasio TV (desain dasar 1920x1080). Untuk fullscreen beneran (tanpa UI browser), gunakan F11 (browser).

## Data (MongoDB)

Data disimpan di MongoDB collections:

- `tm_user` (user login, password hash)
- `tp_system` (setting perusahaan)
- `tm_kategori` (kode kategori, nama kategori, harga, harga buyback)
- `tm_media` (master media)

## Fitur

- Master kategori harga emas dengan CRUD sederhana
- Master media display untuk upload video lokal, gambar, atau link YouTube
- Layar display harga dengan rotasi media otomatis
- Fallback hero default saat media belum tersedia

## Media upload (server)

File video upload disimpan di `server/uploads` (metadata tetap di MongoDB).
