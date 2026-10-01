# Spots to Go to before we Die

Aplikasi web responsif untuk rekomendasi kuliner, kafe, hidden gem, dan destinasi lewat foto, video, serta lokasi. Pengguna dapat memberi rating, komentar, suka, menyimpan spot, dan menjelajah pin di peta.

## Lihat desain tanpa MySQL

Jalankan `node preview.mjs`, lalu buka [http://localhost:3100](http://localhost:3100). Pratinjau ini memakai data contoh dan tidak menyimpan perubahan. Login, rating, komentar, dan posting aktif hanya saat aplikasi dijalankan dengan MySQL melalui `server.mjs`.

## Jalankan dengan MySQL

Butuh Node.js 22.13+ dan MySQL 8+. Tidak ada database lain.

1. Buat database dan akun MySQL:

```sql
CREATE DATABASE spots_to_go CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'spots_app'@'127.0.0.1' IDENTIFIED BY 'ganti-dengan-password-kuat';
GRANT ALL PRIVILEGES ON spots_to_go.* TO 'spots_app'@'127.0.0.1';
```

2. Salin `.env.example` menjadi `.env`, lalu isi `DB_PASSWORD`. Ubah `DB_PORT` jika MySQL berjalan di port lain, misalnya 3307 saat dipasang berdampingan dengan XAMPP.
3. Jalankan:

```bash
npm install
npm start
```

Buka [http://localhost:3000](http://localhost:3000). Skema tabel dibuat otomatis dari `schema.sql`, termasuk tabel slide `post_media`, migrasi kolom tipe media, dan indeks lokasi untuk database lama. Post lama tetap tampil sebagai satu slide. Bila tabel `posts` kosong, aplikasi menambahkan konten awal dengan `is_demo=1` agar feed, peta, rating, dan komentar dapat dicoba. Data awal ini sintetis dan koordinatnya hanya acuan kota; ganti dengan postingan dan lokasi yang sudah diverifikasi sebelum dipakai sebagai rekomendasi publik.

GPS dan kamera browser memerlukan HTTPS saat dibuka dari perangkat lain. `localhost` dapat memakai GPS pada browser modern. Foto dan video unggahan tersimpan di folder `uploads/`, sedangkan metadata, akun, sesi, rating, komentar, suka, dan simpan tersimpan di MySQL.

## Integrasi

| Fitur | Integrasi |
| --- | --- |
| Peta & pin | Leaflet 1.9.4 dan ubin OpenStreetMap; peta membuka area GPS pengguna pada zoom lokal dan mengambil spot dalam radius 20 km. Pilihan kota tersedia bila GPS ditolak |
| Petunjuk arah | Tautan ke Google Maps berdasarkan koordinat spot |
| Login | API bawaan `/api/register`, `/api/login`, `/api/logout`; kata sandi di-hash dengan scrypt, sesi memakai cookie HttpOnly |
| Lokasi | Browser Geolocation API; feed Dekatmu mengurutkan spot dalam radius 20 km menurut jarak |
| Kamera / galeri | Hingga 5 slide campuran JPG, PNG, WebP (8 MB per foto) serta MP4, WebM, MOV (40 MB per video), total maksimal 80 MB |
| Feed | Scroll vertikal antar post dan geser horizontal antar foto/video dalam post. Video diputar tanpa suara hanya saat slide aktif terlihat, berhenti saat keluar layar, dan tidak otomatis diputar bila pengguna memilih reduced motion |
| Jelajah | Maksimal 40 spot populer, diprioritaskan dari suka, simpan, komentar, dan rating |

Tidak dibutuhkan API key untuk peta dan login saat ini. Layanan ubin OpenStreetMap memerlukan atribusi yang terlihat dan mengikuti [kebijakan penggunaan ubin](https://operations.osmfoundation.org/policies/tiles/). Untuk lalu lintas produksi besar, gunakan penyedia ubin yang memiliki kapasitas dan perjanjian layanan sesuai kebutuhan.

## API

- `GET /api/posts?mode=near|explore&lat=...&lng=...&category=kuliner|kafe|destinasi&q=...`
- `GET /api/me`, `POST /api/register`, `POST /api/login`, `POST /api/logout`
- `POST /api/posts` (multipart dengan 1–5 field `media` foto/video, cerita, kategori, koordinat). Respons post memiliki array `media` berurutan
- `POST /api/posts/:id/like`, `POST /api/posts/:id/save`, `POST /api/posts/:id/rating`
- `GET /api/posts/:id/comments`, `POST /api/posts/:id/comments`
- `GET /api/profile`, `GET /api/health`

## Sebelum layanan publik

Tambahkan HTTPS, moderasi konten, pembatasan permintaan, pencadangan database dan foto, penghapusan metadata sensitif dari foto, serta kebijakan privasi lokasi. Server lokal ini cocok untuk prototipe dan satu instance; skala banyak server memerlukan penyimpanan foto bersama dan pengelolaan sesi lebih lanjut.
