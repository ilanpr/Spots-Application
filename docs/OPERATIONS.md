# Operasi dan kesiapan layanan

Dokumen ini mencatat apa yang disimpan aplikasi, pemeriksaan harian yang sederhana, dan pekerjaan yang masih diperlukan sebelum membuka akses publik. Server saat ini cocok untuk pengembangan lokal atau satu instance yang diawasi.

## Menjalankan dan memeriksa

Mulai MySQL 8 terlebih dahulu, lalu jalankan `npm start` dari folder proyek. Server akan berhenti jika database tidak bisa diakses. Setelah berjalan, periksa:

```text
http://localhost:3000/api/health
```

Respons normal adalah `{"ok":true,"database":"mysql"}`. Buka feed, masuk ke akun uji, buat satu post, lalu periksa apakah barisnya muncul di `posts` dan `post_media`. Untuk video, pastikan berkas dapat diputar melalui URL `/uploads/`.

Konfigurasi koneksi database berada di `.env`. Jangan mengunggah file itu, menyalin isinya ke issue, atau menaruh kata sandi pada dokumentasi. `.env.example` hanya berisi nilai contoh.

## Penyimpanan dan pemulihan

MySQL menyimpan akun, hash sesi, koordinat, post, urutan media, rating, reaksi, dan komentar. Berkas foto atau video berada di `uploads/`. Kedua bagian harus dicadangkan bersama. Saat memulihkan, impor dump MySQL lalu kembalikan folder `uploads/` dengan nama berkas yang sama.

File yang ada di `uploads/` tidak dilacak oleh Git. Menarik versi kode baru tidak membawa foto dan video dari mesin lain. Jika aplikasi nanti berjalan pada lebih dari satu server, media perlu dipindah ke penyimpanan bersama dan proses backup diatur ulang.

## Layanan pihak ketiga

Peta memakai Leaflet dan ubin OpenStreetMap. Pertahankan atribusi pada peta dan ikuti kebijakan penggunaan ubin OpenStreetMap. Untuk trafik yang lebih besar, pilih layanan ubin yang sesuai kapasitasnya. Gambar awal dan aset landing mengambil gambar dari Unsplash; periksa hak pakai dan ketersediaan sumber sebelum menggantinya dengan materi pemasaran tetap.

GPS browser bekerja di `localhost`. Untuk akses dari perangkat lain, gunakan HTTPS supaya izin lokasi tersedia. Unggahan dari kamera ponsel mengikuti dukungan browser dan perangkat.

## Sebelum dibuka ke publik

- Tambahkan moderasi, pelaporan, dan penghapusan konten.
- Terapkan pembatasan permintaan pada login, komentar, dan unggahan.
- Hapus metadata lokasi sensitif dari foto unggahan jika kebijakan privasi mengharuskannya.
- Siapkan kebijakan privasi lokasi, aturan konten, dan prosedur penghapusan akun.
- Pasang HTTPS dan tinjau konfigurasi cookie, proxy, serta header keamanan.
- Buat jadwal backup dan uji pemulihan database bersama folder media.
- Tinjau batas penyimpanan dan pemakaian peta jika trafik meningkat.

Endpoint belum mempunyai pagination dan server memakai penyimpanan media lokal. Dua hal itu perlu ditangani sebelum volume postingan atau jumlah server bertambah.
