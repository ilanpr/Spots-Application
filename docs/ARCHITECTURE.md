# Arsitektur aplikasi

Spots adalah aplikasi web satu proses. Browser memuat HTML, CSS, dan JavaScript dari server Node.js yang sama dengan API. Data akun dan postingan berada di MySQL; berkas media unggahan berada di folder lokal `uploads/`.

```text
Browser
  | HTML, CSS, JS, /api/*, /uploads/*
  v
server.mjs (Node.js HTTP)
  | mysql2 pool                 | berkas media
  v                             v
MySQL 8                      uploads/
```

Leaflet dimuat dari unpkg, ubin peta dari OpenStreetMap, dan gambar awal dari Unsplash. Tombol arah membuka Google Maps di tab baru. Ketiga layanan luar itu tidak menyimpan data aplikasi.

## Bagian utama

| Berkas | Tanggung jawab |
| --- | --- |
| `index.html` | Struktur landing, aplikasi, navigasi, formulir, dan dialog |
| `style.css` | Sistem warna, layout responsif, transisi, dan animasi |
| `app.js` | State tampilan, permintaan API, feed, peta, galeri, GPS, dan interaksi |
| `server.mjs` | Server HTTP, autentikasi, pemilihan feed, unggahan, dan berkas statis |
| `schema.sql` | Tabel, indeks, serta relasi MySQL |
| `preview.mjs` | Pratinjau tampilan terpisah tanpa database |

Tidak ada proses build untuk frontend. Perubahan pada tiga berkas frontend cukup dimuat ulang di browser.

## Permintaan dari browser

`app.js` mengirim permintaan ke `/api/*` dengan `fetch` dan kredensial dari origin yang sama. Server membaca cookie sesi, mengambil pengguna aktif dari tabel `sessions`, lalu menjalankan query yang sesuai. Respons API selalu JSON. Saat pengguna belum masuk, endpoint publik tetap dapat dibaca, sedangkan unggahan dan interaksi mengembalikan status `401`.

Halaman berpindah dengan hash URL seperti `/#feed` dan `/#map`. Tidak ada router server untuk setiap halaman. Pada layar sempit navigasi utama berada di bawah; pada layar lebar sidebar mengambil alih.

## Lokasi dan rekomendasi

Koordinat berasal dari Browser Geolocation API, pilihan kota, atau titik yang diketuk di peta saat membuat postingan. Browser mengirim `lat` dan `lng` ke API. Untuk mode dekat, server terlebih dahulu mengambil kandidat dalam kotak koordinat, lalu menghitung jarak dan membatasi hasil ke 20 km. Hasil yang lolos diurutkan menurut jarak.

Mode jelajah tidak dibatasi radius. Server memberi skor dari suka, simpan, komentar, dan rating, lalu mengembalikan paling banyak 40 postingan. Query detail dan media untuk hasil feed dijalankan di `server.mjs`; browser tidak menghitung ulang skor.

## Alur unggahan

1. Formulir mengirim `multipart/form-data` berisi metadata, koordinat, dan satu sampai lima field `media`.
2. Server memeriksa field wajib, ukuran berkas, dan tanda format berkas.
3. Berkas ditulis ke `uploads/`. Baris `posts` dan `post_media` ditulis dalam transaksi MySQL.
4. Jika transaksi gagal, server membatalkan transaksi dan menghapus berkas yang baru ditulis.
5. URL `/uploads/<nama-berkas>` melayani media. Respons mendukung byte range untuk pemutaran video.

Urutan slide disimpan di `post_media.position`. Kolom `posts.image` dan `posts.media_type` menunjuk slide pertama agar kartu dan pin punya thumbnail utama.

## Data saat pertama dijalankan

`initialize()` membaca `schema.sql` dan menambahkan migrasi kecil untuk instalasi lama. Bila tabel `posts` kosong, server membuat postingan awal dengan `is_demo=1`, akun internal untuk penulisnya, dan beberapa interaksi. Perubahan pengguna sesudah itu tersimpan di MySQL. Detail pengelolaan data awal ada di [DATABASE.md](DATABASE.md).
