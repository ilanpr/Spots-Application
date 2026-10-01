# Instalasi lokal

Panduan ini memakai MySQL 8 dan Node.js 22.13 atau lebih baru. XAMPP tidak diperlukan untuk menjalankan aplikasi. Jika XAMPP dipakai untuk proyek lain, MariaDB milik XAMPP boleh tetap berjalan di port 3306 dan MySQL 8 memakai port 3307.

## 1. Siapkan database

Buka MySQL Workbench dan pastikan koneksinya menuju instance MySQL 8 yang akan dipakai aplikasi. Jalankan:

```sql
SELECT VERSION() AS version, @@port AS port;

CREATE DATABASE IF NOT EXISTS spots_to_go
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'spots_app'@'127.0.0.1'
  IDENTIFIED BY 'password-lokal-yang-kuat';

GRANT ALL PRIVILEGES ON spots_to_go.*
  TO 'spots_app'@'127.0.0.1';
```

Gunakan kata sandi yang Anda pilih sendiri. Jika akun `spots_app` sudah ada, jangan mengulang `CREATE USER` untuk mengganti sandi. Atur ulang sandinya dengan `ALTER USER` di Workbench, lalu samakan dengan `.env`.

## 2. Siapkan konfigurasi

Dari folder proyek, salin template:

```powershell
Copy-Item .env.example .env
```

Isi `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME`. Pada instalasi MySQL 8 berdampingan dengan XAMPP, gunakan `DB_PORT=3307` jika memang itu port yang tampil pada hasil `SELECT @@port`. `PORT` adalah port web, bawaan `3000`.

Akun database dibuat untuk `127.0.0.1`, jadi gunakan nilai host yang sama di `.env`. File ini hanya untuk mesin lokal dan sudah dikecualikan dari Git.

## 3. Jalankan aplikasi

```powershell
npm install
npm start
```

Buka [http://localhost:3000](http://localhost:3000). Pada startup, server membaca `schema.sql`, membuat tabel yang belum ada, dan menyiapkan folder `uploads/`. Jika `posts` masih kosong, server menambahkan postingan awal.

Untuk melihat hanya tampilannya tanpa MySQL:

```powershell
npm run preview
```

Buka [http://localhost:3100](http://localhost:3100). Server pratinjau tidak menyimpan login, unggahan, atau interaksi.

## 4. Periksa dari Workbench

Refresh daftar schema, lalu buka `spots_to_go`. Query berikut cukup untuk memastikan aplikasi memakai database yang benar:

```sql
SHOW TABLES FROM spots_to_go;
SELECT COUNT(*) AS jumlah_post FROM spots_to_go.posts;
SELECT id, title, city, is_demo FROM spots_to_go.posts
ORDER BY created_at DESC LIMIT 10;
```

Tabel yang tersedia: `users`, `sessions`, `posts`, `post_media`, `reactions`, `ratings`, dan `comments`. Setelah membuat postingan dari web, muat ulang query untuk melihat baris baru.

## Jika tidak tersambung

- Pesan `MySQL belum siap`: cek layanan MySQL, port, akun, sandi, dan nama database di `.env`.
- Port `3000` terpakai: ubah `PORT` di `.env`, lalu buka alamat dengan port baru.
- Tabel tidak terlihat: pastikan Workbench terhubung ke MySQL 8 yang sama. phpMyAdmin bawaan XAMPP biasanya menunjuk ke MariaDB XAMPP, bukan MySQL 8 di port 3307.
- GPS tidak muncul pada ponsel: akses dari perangkat lain memerlukan HTTPS. `localhost` pada komputer sendiri dapat memakai API lokasi browser.
- Peta atau gambar tidak muncul: periksa koneksi internet karena ubin peta dan sebagian gambar diambil dari layanan luar.

Struktur tabel dan contoh query penyuntingan ada di [dokumentasi database](DATABASE.md).
