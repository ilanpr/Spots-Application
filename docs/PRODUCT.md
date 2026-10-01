# Produk dan alur pengguna

Spots membantu orang menemukan tempat dari pengalaman pengunjung lain. Rekomendasi kuliner dan kafe berada di tempat yang sama dengan destinasi perjalanan. Foto, video, cerita, rating, dan lokasi memberi konteks sebelum seseorang berangkat.

## Alur utama

1. Pengunjung membuka landing page di `/#home` dan masuk ke aplikasi lewat tombol jelajah.
2. Feed `/#feed` menampilkan tempat dekat pengguna jika izin lokasi tersedia. Tanpa koordinat, daftar diurutkan berdasarkan popularitas.
3. Tab Jelajah dunia dan halaman `/#explore` menampilkan tempat populer tanpa batas radius 20 km. Pencarian dan kategori menyaring daftar.
4. Halaman `/#map` menampilkan pin dalam radius 20 km dari titik yang dipilih. Titik awalnya Jakarta, lalu berpindah ke lokasi pengguna jika GPS diizinkan. Pengguna juga bisa memilih kota lain.
5. Ketukan pada kartu atau pin membuka detail. Di sana ada semua slide media, rating, komentar, tombol simpan, suka, dan tautan arah ke Google Maps.
6. Pengguna masuk atau mendaftar ketika ingin membuat postingan atau memberi interaksi. Halaman Tersimpan dan Profil juga memerlukan akun.

## Layar

| Layar | Isi |
| --- | --- |
| Landing | Gambaran produk, cara pakai, dan pintu masuk ke aplikasi |
| Beranda | Feed dekat lokasi, pencarian, kategori, kartu postingan |
| Jelajah | Rekomendasi populer dari berbagai kota |
| Peta | Pin, popup singkat, daftar tempat di sekitar titik peta |
| Tersimpan | Postingan yang disimpan oleh akun aktif |
| Profil | Nama akun, jumlah cerita, postingan sendiri, dan tombol keluar |
| Detail | Galeri, cerita, rating, komentar, suka, simpan, dan petunjuk arah |
| Bagikan spot | Unggah media, pilih kategori, tulis cerita, tandai koordinat |

Navigasi aplikasi memakai hash URL. Halaman detail, login, dan formulir postingan tampil sebagai dialog, bukan URL terpisah.

## Cara rekomendasi diurutkan

Feed dekat lokasi memakai koordinat browser. Server membatasi hasil ke radius 20 km dan mengurutkannya dari yang paling dekat. Jika jaraknya sama, jumlah suka dan simpan menjadi pembeda. Ketika koordinat tidak tersedia, feed memakai urutan populer.

Jelajah menghitung skor dari jumlah suka, simpan, komentar, dan rating. Hasil dibatasi sampai 40 postingan per permintaan. Rumus saat ini dapat dilihat di `feedPosts()` dalam `server.mjs`. Ini peringkat sederhana untuk aplikasi lokal, belum sistem personalisasi perilaku pengguna.

## Batas produk saat ini

- Postingan berisi satu sampai lima slide foto atau video.
- Kategori yang tersedia adalah kuliner, kafe, dan destinasi.
- Rating memakai angka 1 sampai 5. Satu akun mempunyai satu rating per postingan dan bisa mengubahnya.
- Suka dan simpan berfungsi sebagai tombol aktif atau batal.
- Peta membutuhkan koneksi ke ubin OpenStreetMap. Gambar awal menggunakan URL Unsplash.
- Belum ada mengikuti akun, pesan pribadi, moderasi, atau notifikasi.

Postingan yang dibuat saat database kosong adalah data awal untuk menguji alur. Lihat [dokumentasi database](DATABASE.md) sebelum memakai isinya sebagai rekomendasi publik.
