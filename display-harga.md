# Dokumentasi Sistem Display TV Harga Multi-Bisnis

## 1. Ringkasan Proyek

Sistem ini adalah platform **Digital Signage + Price Management + Promo Display** yang digunakan untuk menampilkan harga, promo, video, pengumuman, dan konten visual lain pada TV / monitor digital di berbagai jenis bisnis seperti retail, minimarket, restoran, barbershop, toko emas, apotek, klinik, gym, dan bisnis layanan lainnya.

Tujuan utama sistem:
- menampilkan harga secara menarik dan dinamis pada layar TV
- memudahkan update harga dan promo dari panel admin
- mendukung penayangan video, banner, running text, dan layout campuran
- mendukung banyak cabang dan banyak device
- mendukung penjadwalan tayang otomatis
- mendukung integrasi data dari POS / ERP / API eksternal
- tetap berjalan saat koneksi internet bermasalah melalui cache offline pada player

---

## 2. Tujuan Sistem

### 2.1 Tujuan Bisnis
- memberikan tampilan harga yang modern seperti display di minimarket / supermarket
- mempermudah perubahan harga tanpa harus cetak ulang materi fisik
- meningkatkan efektivitas promosi melalui layar digital
- membuat sistem yang bisa dijual ke berbagai model bisnis
- menyiapkan fondasi produk SaaS / multi-tenant untuk banyak client

### 2.2 Tujuan Teknis
- menyediakan CMS / admin panel untuk pengelolaan konten
- menyediakan player untuk TV / Android Box / browser fullscreen
- menyediakan backend API untuk distribusi data dan monitoring device
- mendukung layout yang fleksibel dan bisa dikembangkan
- mendukung monitoring online/offline device

---

## 3. Cakupan Sistem

Sistem dibagi menjadi 3 komponen utama:

### 3.1 Admin Panel / CMS
Digunakan oleh admin untuk:
- mengelola tenant
- mengelola cabang
- mengelola device
- mengelola kategori
- mengelola item / layanan
- mengelola harga
- mengelola promo
- mengelola media
- mengelola template layout
- mengelola scene / slide
- mengelola playlist
- mengelola jadwal tayang
- memantau status device

### 3.2 Backend API
Digunakan untuk:
- autentikasi user dan device
- menyimpan master data dan transaksi konfigurasi
- menyediakan data untuk player
- sinkronisasi harga dan promo
- mengirim playlist aktif ke device
- menyimpan log device
- menyimpan heartbeat / last seen

### 3.3 Player App / TV App
Digunakan untuk:
- menampilkan konten pada layar TV
- mengambil playlist aktif dari server
- menampilkan item, harga, video, promo, dan pengumuman
- menyimpan cache lokal untuk fallback offline
- refresh data secara periodik
- melaporkan status online/offline ke backend

---

## 4. Jenis Bisnis yang Didukung

Sistem harus dirancang generik agar bisa digunakan di berbagai model bisnis.

### 4.1 Retail / Minimarket
Konten utama:
- daftar produk
- harga normal
- harga promo
- banner promo
- video iklan
- running text

### 4.2 Restoran / Cafe
Konten utama:
- daftar menu
- harga menu
- foto makanan
- promo combo
- video menu / ambience

### 4.3 Barbershop / Salon
Konten utama:
- daftar layanan
- harga layanan
- stylist of the month
- promo paket
- video branding

### 4.4 Toko Emas / Perhiasan
Konten utama:
- harga emas hari ini
- harga buyback
- promo cicilan / member
- pengumuman kadar / gramasi

### 4.5 Apotek / Klinik / Gym / Bisnis Lain
Konten utama:
- harga layanan
- promo periodik
- pengumuman
- video edukasi
- display paket atau membership

---

## 5. Konsep Arsitektur Sistem

### 5.1 Komponen Arsitektur
1. **Frontend CMS**
2. **Backend API**
3. **Database**
4. **Media Storage**
5. **Player Device**
6. **Realtime / Scheduler Layer**

### 5.2 Rekomendasi Teknologi

#### Backend
- Node.js
- Express.js atau NestJS
- MongoDB untuk fleksibilitas konfigurasi layout JSON

#### Frontend CMS
- Next.js / React
- Tailwind CSS
- Redux / Zustand bila diperlukan

#### Player
- Web app fullscreen
- Android wrapper / Android TV app

#### Media Storage
- local storage server
- MinIO / S3 compatible storage

#### Realtime dan Sync
- WebSocket / Socket.IO untuk notifikasi update cepat
- fallback polling berkala untuk sinkronisasi data

---

## 6. Peran User / Role

### 6.1 Super Admin
Hak akses:
- kelola semua tenant
- kelola paket langganan
- kelola semua konfigurasi global
- monitoring seluruh sistem

### 6.2 Admin Tenant
Hak akses:
- kelola cabang
- kelola device tenant
- kelola item, harga, promo
- kelola template, scene, playlist, jadwal
- melihat laporan tenant

### 6.3 Admin Cabang
Hak akses:
- kelola device di cabangnya
- kelola harga cabang
- melihat playlist yang aktif di cabang
- melihat status device cabang

### 6.4 Operator Harga
Hak akses:
- input / ubah harga
- import harga
- melihat histori perubahan harga

### 6.5 Operator Konten / Marketing
Hak akses:
- upload gambar dan video
- membuat promo
- membuat scene dan playlist
- mengatur jadwal tayang

### 6.6 Viewer / Monitoring
Hak akses:
- hanya melihat dashboard, monitoring, dan laporan tertentu

---

## 7. Master Data yang Harus Disiapkan

## 7.1 Master Tenant
Digunakan jika sistem akan multi-client atau SaaS.

### Tujuan
Menyimpan data perusahaan / client pemilik display.

### Field
- `id_tenant`
- `kode_tenant`
- `nama_tenant`
- `jenis_bisnis`
- `nama_perusahaan`
- `alamat`
- `kota`
- `provinsi`
- `no_hp`
- `email`
- `logo_url`
- `domain`
- `timezone`
- `paket_langganan`
- `status_aktif`
- `created_at`
- `updated_at`

---

## 7.2 Master Cabang

### Tujuan
Menyimpan data cabang / outlet dari tenant.

### Field
- `id_cabang`
- `id_tenant`
- `kode_cabang`
- `nama_cabang`
- `alamat`
- `kota`
- `provinsi`
- `no_telp`
- `pic_nama`
- `pic_no_hp`
- `status_aktif`
- `created_at`
- `updated_at`

---

## 7.3 Master Area Display

### Tujuan
Menentukan posisi atau area penempatan layar.

### Contoh
- kasir
- depan toko
- etalase
- ruang tunggu
- promo area
- rak tertentu

### Field
- `id_area_display`
- `id_tenant`
- `id_cabang`
- `kode_area`
- `nama_area`
- `deskripsi`
- `status_aktif`
- `created_at`
- `updated_at`

---

## 7.4 Master Device / TV / Player

### Tujuan
Mendaftarkan semua layar yang akan menerima konten.

### Field
- `id_device`
- `id_tenant`
- `id_cabang`
- `id_area_display`
- `kode_device`
- `nama_device`
- `serial_number`
- `token_pairing`
- `tipe_device`
- `os_device`
- `versi_aplikasi`
- `resolusi_lebar`
- `resolusi_tinggi`
- `orientasi_layar`
- `ip_terakhir`
- `last_seen`
- `status_online`
- `status_aktif`
- `id_playlist_default`
- `cache_offline_enabled`
- `catatan`
- `created_at`
- `updated_at`

### Catatan
Satu cabang bisa memiliki banyak device, dan setiap device bisa menampilkan playlist yang berbeda.

---

## 7.5 Master Kategori

### Tujuan
Mengelompokkan item / layanan agar mudah ditampilkan dan difilter.

### Field
- `id_kategori`
- `id_tenant`
- `kode_kategori`
- `nama_kategori`
- `parent_id`
- `icon_url`
- `warna_tema`
- `urutan_tampil`
- `status_aktif`
- `created_at`
- `updated_at`

---

## 7.6 Master Item

### Tujuan
Menyimpan data produk, layanan, atau item informasi yang dapat ditampilkan pada layar.

### Catatan Desain
Gunakan istilah netral **item** agar dapat dipakai untuk retail maupun layanan.

### Tipe Item
- `PRODUCT`
- `SERVICE`
- `PROMO_ONLY`
- `INFO_ONLY`

### Field
- `id_item`
- `id_tenant`
- `kode_item`
- `sku`
- `barcode`
- `nama_item`
- `nama_pendek`
- `tipe_item`
- `id_kategori`
- `brand`
- `satuan`
- `deskripsi`
- `gambar_utama`
- `video_utama`
- `tag`
- `is_favorit`
- `is_highlight`
- `status_aktif`
- `urutan_tampil`
- `custom_attribute_json`
- `created_at`
- `updated_at`

### Contoh `custom_attribute_json`
#### Retail
```json
{
  "ukuran": "250ml",
  "rasa": "jeruk"
}
```

#### Barbershop
```json
{
  "durasi_menit": 45,
  "gender_target": "pria"
}
```

#### Toko Emas
```json
{
  "kadar": "24K",
  "berat_gram": 10
}
```

---

## 7.7 Master Harga

### Tujuan
Menyimpan harga item secara fleksibel, termasuk harga per cabang dan harga promo.

### Alasan Harus Dipisah dari Master Item
- harga bisa berbeda per cabang
- harga bisa berubah berdasarkan periode
- harga member dan non-member bisa berbeda
- histori harga lebih mudah dikelola

### Field
- `id_harga`
- `id_tenant`
- `id_item`
- `id_cabang` nullable
- `harga_normal`
- `harga_promo`
- `harga_coret`
- `harga_member`
- `harga_grosir`
- `mulai_berlaku`
- `akhir_berlaku`
- `status_aktif`
- `sumber_harga`
- `last_update_by`
- `last_update_at`
- `created_at`
- `updated_at`

---

## 7.8 Master Promo

### Tujuan
Menyimpan data promosi yang akan ditampilkan pada layar.

### Jenis Promo
- `DISKON_PERSEN`
- `DISKON_NOMINAL`
- `BUNDLE`
- `BELI_X_GRATIS_Y`
- `FLASH_SALE`
- `HARGA_SPESIAL`
- `INFO_PROMO`

### Field
- `id_promo`
- `id_tenant`
- `kode_promo`
- `nama_promo`
- `jenis_promo`
- `deskripsi`
- `banner_url`
- `video_url`
- `warna_tema`
- `tanggal_mulai`
- `tanggal_selesai`
- `jam_mulai`
- `jam_selesai`
- `hari_aktif`
- `prioritas_tampil`
- `status_aktif`
- `created_at`
- `updated_at`

### Detail Relasi Promo ke Item
Collection / tabel detail:
- `id_promo_detail`
- `id_promo`
- `id_item`
- `nilai_promo`
- `teks_label_promo`
- `urutan`
- `created_at`
- `updated_at`

---

## 7.9 Master Media Library

### Tujuan
Menyimpan semua aset gambar dan video yang dipakai dalam display.

### Field
- `id_media`
- `id_tenant`
- `nama_file`
- `tipe_media`
- `url_file`
- `thumbnail_url`
- `ukuran_file`
- `durasi_detik`
- `resolusi_lebar`
- `resolusi_tinggi`
- `format_file`
- `status_aktif`
- `uploaded_by`
- `uploaded_at`
- `created_at`
- `updated_at`

### Tipe Media
- `IMAGE`
- `VIDEO`
- `AUDIO` opsional bila nanti dibutuhkan

---

## 7.10 Master Template Layout

### Tujuan
Mendefinisikan template tampilan layar.

### Catatan
Ini adalah pembeda utama produk karena menentukan fleksibilitas tampilan.

### Field
- `id_template`
- `id_tenant`
- `nama_template`
- `tipe_layout`
- `orientasi`
- `background_type`
- `background_value`
- `font_family`
- `warna_tema`
- `json_layout`
- `preview_image`
- `status_aktif`
- `created_by`
- `updated_at`

### Contoh isi `json_layout`
```json
{
  "header": {
    "show": true,
    "height": 100
  },
  "price_list": {
    "show": true,
    "x": 50,
    "y": 150,
    "w": 900,
    "h": 700
  },
  "video_panel": {
    "show": true,
    "x": 1000,
    "y": 150,
    "w": 800,
    "h": 700
  },
  "ticker": {
    "show": true,
    "position": "bottom"
  }
}
```

---

## 7.11 Master Scene / Slide

### Tujuan
Menyimpan satu tampilan tayang spesifik yang akan diputar pada layar.

### Contoh Scene
- scene daftar harga kategori minuman
- scene promo weekend
- scene video branding full screen
- scene pengumuman toko

### Field
- `id_scene`
- `id_tenant`
- `nama_scene`
- `id_template`
- `tipe_konten`
- `durasi_tayang_detik`
- `sumber_data`
- `konfigurasi_json`
- `status_aktif`
- `urutan_default`
- `created_at`
- `updated_at`

### Tipe Konten
- `PRICE_LIST`
- `PROMO_BANNER`
- `VIDEO_ONLY`
- `MIXED_CONTENT`
- `ANNOUNCEMENT`
- `CUSTOM`

---

## 7.12 Master Playlist

### Tujuan
Menentukan kumpulan scene yang akan diputar pada layar.

### Field Header
- `id_playlist`
- `id_tenant`
- `nama_playlist`
- `deskripsi`
- `orientasi`
- `status_aktif`
- `default_duration`
- `created_by`
- `created_at`
- `updated_at`

### Field Detail Playlist
- `id_playlist_detail`
- `id_playlist`
- `id_scene`
- `urutan`
- `durasi_override_detik`
- `transisi`
- `status_aktif`
- `created_at`
- `updated_at`

---

## 7.13 Master Jadwal Tayang

### Tujuan
Mengatur kapan playlist tertentu aktif pada device / cabang / area tertentu.

### Field
- `id_jadwal`
- `id_tenant`
- `nama_jadwal`
- `id_playlist`
- `target_type`
- `target_id`
- `tanggal_mulai`
- `tanggal_selesai`
- `jam_mulai`
- `jam_selesai`
- `hari_aktif`
- `prioritas`
- `status_aktif`
- `created_at`
- `updated_at`

### Nilai `target_type`
- `DEVICE`
- `AREA`
- `CABANG`
- `GLOBAL_TENANT`

---

## 7.14 Master Announcement / Running Text

### Tujuan
Menampilkan informasi singkat pada ticker atau pengumuman tertentu.

### Field
- `id_announcement`
- `id_tenant`
- `judul`
- `isi_text`
- `tipe`
- `warna_text`
- `warna_background`
- `kecepatan`
- `tanggal_mulai`
- `tanggal_selesai`
- `jam_mulai`
- `jam_selesai`
- `status_aktif`
- `created_at`
- `updated_at`

---

## 7.15 Master User

### Field
- `id_user`
- `id_tenant`
- `nama_user`
- `username`
- `email`
- `no_hp`
- `password_hash`
- `role`
- `status_aktif`
- `last_login`
- `created_at`
- `updated_at`

---

## 7.16 Master Integrasi

### Tujuan
Untuk sinkronisasi data dari POS / ERP / sistem lain.

### Field
- `id_integrasi`
- `id_tenant`
- `nama_integrasi`
- `tipe_integrasi`
- `endpoint`
- `http_method`
- `auth_type`
- `credential_ref`
- `jadwal_sinkron`
- `mapping_json`
- `status_aktif`
- `created_at`
- `updated_at`

---

## 8. Menu Sistem yang Harus Ada

## 8.1 Dashboard

### Fungsi
Menampilkan ringkasan kondisi sistem.

### Widget yang direkomendasikan
- jumlah tenant aktif
- jumlah cabang aktif
- jumlah device online
- jumlah device offline
- jumlah item aktif
- promo aktif hari ini
- playlist aktif
- jadwal tayang hari ini
- device error terbaru
- log sinkronisasi terakhir

---

## 8.2 Master Data

### Submenu
- tenant
- cabang
- area display
- device
- kategori
- item
- harga
- promo
- media library
- announcement
- user
- role
- integrasi

---

## 8.3 Konten dan Tampilan

### Submenu
- template layout
- scene / slide
- playlist
- jadwal tayang
- preview display
- theme setting

---

## 8.4 Operasional Device

### Submenu
- pairing device
- monitoring device
- refresh content
- restart player
- device log
- device screenshot terakhir
- update versi aplikasi player

---

## 8.5 Laporan

### Submenu
- laporan device online/offline
- laporan konten tayang
- laporan error device
- laporan perubahan harga
- laporan promo aktif
- laporan media usage
- laporan jadwal tayang
- audit trail user

---

## 8.6 Pengaturan

### Submenu
- profil tenant
- branding
- resolusi default
- refresh interval
- pengaturan cache offline
- bahasa
- timezone
- storage setting
- security setting
- API key

---

## 9. Alur Kerja Sistem

## 9.1 Alur Setup Awal Tenant
1. super admin membuat tenant
2. tenant menambahkan cabang
3. tenant menambahkan area display
4. tenant mendaftarkan device / TV
5. tenant membuat kategori item
6. tenant input item
7. tenant input harga
8. tenant upload media
9. tenant membuat template layout
10. tenant membuat scene
11. tenant membuat playlist
12. tenant membuat jadwal tayang
13. device melakukan pairing dan mulai menarik konten

---

## 9.2 Alur Update Harga
1. operator harga membuka menu harga
2. memilih cabang atau global tenant
3. mengubah harga item
4. sistem menyimpan histori perubahan
5. sistem menandai playlist / scene terkait untuk refresh
6. player melakukan sinkronisasi dan menampilkan harga terbaru

---

## 9.3 Alur Pembuatan Promo
1. operator marketing membuat promo baru
2. menentukan periode aktif
3. memilih item terkait bila perlu
4. upload banner / video promo
5. memilih scene atau membuat scene baru
6. memasukkan scene promo ke playlist
7. membuat jadwal tayang bila perlu
8. player menampilkan promo sesuai jadwal

---

## 9.4 Alur Pairing Device
1. admin membuat device pada panel admin
2. sistem menghasilkan kode pairing / token
3. token dimasukkan ke aplikasi player
4. player mengirim request registrasi ke backend
5. backend memverifikasi token
6. backend mengaktifkan device
7. device menerima konfigurasi awal dan playlist default

---

## 9.5 Alur Player Saat Tampil
1. player login / autentikasi device
2. player mengambil konfigurasi device
3. player mengambil jadwal aktif
4. player menentukan playlist yang harus ditayangkan
5. player mengunduh media yang dibutuhkan
6. player menyimpan cache lokal
7. player memutar scene sesuai urutan
8. player mengirim heartbeat berkala
9. jika offline, player tetap memutar cache terakhir

---

## 10. Kebutuhan Fitur Wajib

## 10.1 Fitur Admin Wajib
- login/logout
- manajemen user dan role
- CRUD tenant
- CRUD cabang
- CRUD area display
- CRUD device
- CRUD kategori
- CRUD item
- CRUD harga
- CRUD promo
- CRUD media
- CRUD template
- CRUD scene
- CRUD playlist
- CRUD jadwal tayang
- preview tampilan
- monitoring status device

## 10.2 Fitur Player Wajib
- pairing device
- login device otomatis
- ambil konfigurasi layar
- download media
- cache offline
- tampilkan harga / promo / video
- looping playlist
- auto refresh data
- heartbeat online status
- fallback saat server tidak tersedia

## 10.3 Fitur Monitoring Wajib
- last seen device
- online/offline status
- versi aplikasi player
- status sinkron media
- error log player
- histori update konten

---

## 11. Fitur Bernilai Jual Tinggi

Fitur ini tidak wajib di MVP, tetapi sangat menarik untuk roadmap produk:
- drag and drop layout builder
- drag and drop playlist editor
- sinkron harga dari POS / ERP
- update real-time melalui WebSocket
- remote refresh device
- remote screenshot device
- emergency broadcast ke semua layar
- analytics penayangan konten
- multi-template per industri
- dukungan portrait dan landscape
- auto hide item sold out
- QR code promo / katalog
- white-label tenant

---

## 12. Non-Functional Requirement

## 12.1 Performance
- player harus tetap lancar pada resolusi Full HD
- perpindahan scene tidak patah-patah
- refresh data tidak mengganggu playback

## 12.2 Availability
- sistem tetap bisa tayang saat koneksi internet putus
- cache lokal harus menyimpan playlist terakhir yang valid

## 12.3 Security
- autentikasi user menggunakan JWT / session secure
- autentikasi device menggunakan token pairing + token device
- file media yang sensitif harus diakses melalui URL aman jika perlu
- role permission harus jelas

## 12.4 Scalability
- mendukung banyak tenant
- mendukung banyak cabang per tenant
- mendukung banyak device per cabang
- mendukung jumlah media dan playlist yang besar

## 12.5 Maintainability
- struktur kode harus modular
- template layout dipisah dari logic player
- integrasi eksternal dipisah dalam service khusus

---

## 13. Standar Media yang Disarankan

### Gambar
- format: jpg / png / webp
- resolusi ideal: 1920x1080 atau menyesuaikan template
- ukuran maksimal file ditentukan sistem

### Video
- format: mp4 h264
- resolusi ideal: 1920x1080
- durasi dibatasi agar player ringan
- file perlu dioptimasi

### Font dan UI
- gunakan font yang terbaca jelas dari jarak jauh
- ukuran harga harus dominan
- warna harus punya kontras tinggi

---

## 14. Strategi Offline Cache

Player wajib memiliki mekanisme offline.

### Yang perlu di-cache
- playlist aktif terakhir
- scene aktif terakhir
- semua media yang dibutuhkan playlist aktif
- data harga terakhir
- konfigurasi template terakhir

### Perilaku Saat Offline
- player tetap memutar playlist cache
- player tetap menampilkan harga terakhir yang tersimpan
- player mencoba reconnect berkala
- player mengirim heartbeat kembali saat koneksi pulih

---

## 15. Struktur Data Collection / Tabel yang Disarankan

Jika menggunakan pendekatan MongoDB, berikut nama collection yang direkomendasikan.

### Master Data
- `tm_tenant`
- `tm_cabang`
- `tm_area_display`
- `tm_device`
- `tm_kategori`
- `tm_item`
- `tm_harga`
- `tm_promo`
- `tm_promo_detail`
- `tm_media`
- `tm_template_layout`
- `tm_scene`
- `tm_playlist`
- `tm_playlist_detail`
- `tm_jadwal_tayang`
- `tm_announcement`
- `tm_user`
- `tm_role`
- `tm_integrasi`

### Operasional / Log
- `tt_device_heartbeat`
- `tt_device_log`
- `tt_sync_log`
- `tt_harga_log`
- `tt_publish_log`
- `tt_audit_trail`

---

## 16. Collection Log Operasional yang Disarankan

## 16.1 `tt_device_heartbeat`
Menyimpan status hidup device.

### Field
- `id_device`
- `waktu_heartbeat`
- `status_online`
- `ip_address`
- `versi_aplikasi`
- `storage_free`
- `memory_usage`
- `catatan`

## 16.2 `tt_device_log`
Menyimpan error dan aktivitas player.

### Field
- `id_device`
- `level_log`
- `kode_log`
- `pesan_log`
- `detail_json`
- `created_at`

## 16.3 `tt_sync_log`
Menyimpan histori sinkronisasi konten.

### Field
- `id_device`
- `jenis_sync`
- `status_sync`
- `waktu_mulai`
- `waktu_selesai`
- `detail_json`

## 16.4 `tt_harga_log`
Menyimpan histori perubahan harga.

### Field
- `id_harga`
- `id_item`
- `harga_lama`
- `harga_baru`
- `changed_by`
- `changed_at`

## 16.5 `tt_publish_log`
Menyimpan histori publish playlist / scene.

### Field
- `entity_type`
- `entity_id`
- `aksi`
- `executed_by`
- `executed_at`
- `catatan`

## 16.6 `tt_audit_trail`
Menyimpan aktivitas user admin.

### Field
- `id_user`
- `modul`
- `aksi`
- `referensi_id`
- `data_lama_json`
- `data_baru_json`
- `created_at`

---

## 17. API yang Perlu Disiapkan

## 17.1 Auth API
- login user
- logout user
- refresh token
- pairing device
- validate device token

## 17.2 Master API
- CRUD tenant
- CRUD cabang
- CRUD area display
- CRUD device
- CRUD kategori
- CRUD item
- CRUD harga
- CRUD promo
- CRUD media
- CRUD template
- CRUD scene
- CRUD playlist
- CRUD jadwal tayang
- CRUD announcement

## 17.3 Player API
- get device config
- get active schedule
- get active playlist
- get scene detail
- get media manifest
- submit heartbeat
- submit device log
- submit sync result

## 17.4 Monitoring API
- get online devices
- get offline devices
- get device detail
- get device logs
- get sync logs
- get audit trail

## 17.5 Integration API
- import harga
- import item
- webhook update harga
- webhook publish playlist

---

## 18. UI Halaman yang Perlu Dibuat

## 18.1 Dashboard
Komponen halaman:
- summary card device online/offline
- chart aktivitas device
- list error terbaru
- jadwal aktif hari ini
- preview playlist yang sedang tayang

## 18.2 Halaman Item
Komponen halaman:
- filter kategori
- filter cabang
- pencarian item
- tabel item
- tombol tambah / edit / hapus
- upload gambar item
- import excel opsional

## 18.3 Halaman Harga
Komponen halaman:
- filter cabang
- filter kategori
- pencarian item
- tabel harga
- edit inline harga
- histori perubahan harga

## 18.4 Halaman Promo
Komponen halaman:
- daftar promo aktif / nonaktif
- upload banner / video
- pilih item terkait
- periode promo
- preview promo

## 18.5 Halaman Template Layout
Komponen halaman:
- daftar template
- preview template
- form edit JSON / builder sederhana
- orientasi layar
- background
- slot konten

## 18.6 Halaman Scene
Komponen halaman:
- pilih template
- atur sumber data
- konfigurasi isi scene
- preview scene

## 18.7 Halaman Playlist
Komponen halaman:
- daftar scene di kiri
- urutan playlist di kanan
- durasi per scene
- tombol publish
- preview playlist

## 18.8 Halaman Jadwal
Komponen halaman:
- kalender / timeline jadwal
- target device / area / cabang
- pilih playlist
- periode aktif
- prioritas

## 18.9 Halaman Device Monitoring
Komponen halaman:
- tabel device
- status online/offline
- last seen
- versi app
- tombol refresh / restart
- log device

---

## 19. MVP yang Direkomendasikan

Agar implementasi tidak terlalu berat, MVP sebaiknya fokus pada fitur inti berikut.

### Modul MVP
- login admin
- tenant dan cabang
- device dan pairing
- kategori
- item
- harga
- promo banner sederhana
- media library
- template statis sederhana
- scene
- playlist
- jadwal tayang
- player fullscreen
- cache offline dasar
- monitoring online/offline dasar

### Yang Belum Wajib di MVP
- drag and drop layout builder tingkat lanjut
- analytics tayangan detail
- remote screenshot device
- integrasi POS kompleks
- emergency broadcast

---

## 20. Tahapan Implementasi yang Disarankan

## Phase 1 — Pondasi Sistem
Fokus:
- setup backend
- setup frontend admin
- setup player app
- autentikasi user dan device
- desain database dasar

### Output
- login admin berjalan
- CRUD master utama siap
- device bisa pairing

## Phase 2 — Price & Promo Engine
Fokus:
- item
- harga
- promo
- media library
- histori perubahan harga

### Output
- admin bisa mengelola item, harga, promo
- player bisa menampilkan item dan harga

## Phase 3 — Display Engine
Fokus:
- template layout
- scene
- playlist
- jadwal tayang
- preview display

### Output
- admin bisa mengatur konten tayang
- player bisa memutar scene sesuai jadwal

## Phase 4 — Device Monitoring & Offline Cache
Fokus:
- heartbeat
- sync log
- device log
- cache offline
- monitoring dashboard

### Output
- status device terpantau
- player tetap tampil saat internet putus

## Phase 5 — Advanced Feature
Fokus:
- integrasi POS / ERP
- realtime update
- remote command
- analytics konten
- template builder lanjutan

---

## 21. Risiko dan Hal yang Perlu Diantisipasi

### 21.1 Risiko Teknis
- video terlalu besar membuat player lag
- layout terlalu kompleks membuat rendering berat
- jadwal konflik jika prioritas tidak dirancang dengan benar
- device low-end bisa gagal memutar media berat

### 21.2 Risiko Operasional
- admin salah publish playlist ke device yang salah
- harga tidak sinkron antar cabang
- device mati tetapi masih dianggap online bila heartbeat tidak jelas

### 21.3 Solusi Awal
- validasi ukuran file media
- gunakan prioritas pada jadwal
- log semua perubahan penting
- wajibkan preview sebelum publish
- gunakan heartbeat timeout yang jelas

---

## 22. Aturan Bisnis Dasar yang Disarankan

1. satu device hanya menjalankan satu playlist aktif pada satu waktu
2. jika ada lebih dari satu jadwal aktif, sistem memilih prioritas tertinggi
3. jika tidak ada jadwal aktif, gunakan playlist default device
4. harga aktif ditentukan dari periode harga yang masih berlaku
5. promo aktif ditentukan dari tanggal, jam, dan hari aktif
6. scene tidak boleh dipublish bila referensi template tidak valid
7. playlist tidak boleh dipublish bila seluruh scene nonaktif
8. device yang tidak heartbeat lebih dari ambang tertentu dianggap offline
9. semua perubahan harga harus masuk histori log
10. semua publish playlist harus masuk audit trail

---

## 23. Persiapan Sebelum Coding

Sebelum masuk implementasi, sebaiknya finalkan hal-hal berikut:

### 23.1 Keputusan Produk
- internal only atau dijual ke banyak client
- single tenant atau multi-tenant
- target device: browser, Android TV, Android Box, mini PC

### 23.2 Keputusan UI/UX
- orientasi default: landscape atau portrait
- template awal apa saja
- format daftar harga seperti apa
- apakah perlu mode split video + harga

### 23.3 Keputusan Data
- harga input manual atau integrasi
- item dari sistem lain atau input mandiri
- promo berdiri sendiri atau selalu terkait item

### 23.4 Keputusan Infrastruktur
- media disimpan di local server atau object storage
- player berkomunikasi via polling atau websocket
- apakah perlu CDN untuk video / image

---

## 24. Rekomendasi Implementasi Teknis Pertama

Urutan implementasi paling aman:

1. buat struktur database master utama
2. buat auth admin dan auth device
3. buat CRUD kategori, item, harga
4. buat CRUD media dan promo
5. buat template layout sederhana berbasis JSON
6. buat scene dan playlist
7. buat jadwal tayang
8. buat player fullscreen web
9. buat offline cache player
10. buat monitoring device

---

## 25. Penutup

Dokumentasi ini dirancang sebagai dasar implementasi sistem display TV harga yang fleksibel untuk banyak jenis bisnis. Dengan struktur data yang generik dan modular, sistem bisa dimulai dari MVP sederhana lalu dikembangkan menjadi produk digital signage yang lebih besar dan bernilai jual tinggi.

Langkah lanjutan yang paling disarankan setelah dokumen ini:
1. finalkan struktur database / collection
2. buat daftar endpoint API
3. buat wireframe menu admin
4. buat flow pairing dan flow player
5. mulai implementasi Phase 1

