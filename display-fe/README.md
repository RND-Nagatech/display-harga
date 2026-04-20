
# display-harga


Project ini adalah sistem display harga digital yang dapat digunakan untuk berbagai jenis bisnis retail, toko, restoran, atau usaha lain yang membutuhkan tampilan harga dan media promosi secara dinamis.

Fitur utama:
- Manajemen kategori harga
- Manajemen media display (video/gambar/link)
- Layar display harga dengan rotasi media otomatis

## Struktur

Frontend ini ada di folder `display-fe` dan terhubung ke backend Express di folder `server`.

## Menjalankan project

### 1. Install dependency

Jalankan dari root repo:

```bash
cd /Users/aandiyanti/Documents/RnD/PROJECT/display-harga
npm run install:all
```

### 2. Jalankan backend

```bash
npm run dev:server
```

Backend default berjalan di `http://localhost:7118`.

### 3. Jalankan frontend

Terminal baru:

```bash
npm run dev:client
```

Frontend default berjalan di `http://localhost:8080`.


## Fitur

- Master kategori dengan CRUD sederhana
- Master media display untuk upload video lokal, gambar, atau link YouTube
- Layar display harga dengan rotasi media otomatis
- Fallback hero default saat media belum tersedia

## Data

Metadata tersimpan di MongoDB (lihat `.env` di root). File upload video disimpan di `server/uploads`.
