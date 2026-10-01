# Database MySQL

Database `spots_to_go` memakai MySQL 8 dan charset `utf8mb4`. Struktur awal ada di `schema.sql`. Server menjalankan skema saat startup, lalu memeriksa beberapa kolom dan indeks yang diperlukan oleh instalasi lama.

## Tabel dan relasi

| Tabel | Fungsi | Kunci dan relasi |
| --- | --- | --- |
| `users` | Akun dan hash kata sandi | `id` adalah UUID; `email` unik |
| `sessions` | Sesi login sampai 30 hari | Hash token adalah primary key; `user_id` ke `users` |
| `posts` | Cerita, kategori, lokasi, dan thumbnail pertama | `user_id` ke `users`, boleh null untuk data lama |
| `post_media` | Semua slide media dalam urutan tampil | Primary key gabungan `post_id` dan `position` |
| `reactions` | Suka dan simpan | Satu baris per pengguna, post, dan jenis reaksi |
| `ratings` | Nilai 1 sampai 5 dari pengguna | Satu baris per pengguna dan post |
| `comments` | Komentar pada post | Terhubung ke `posts` dan `users` |

Menghapus post melalui SQL juga menghapus media metadata, reaksi, rating, dan komentar karena relasi `ON DELETE CASCADE`. Penghapusan itu tidak otomatis menghapus berkas di `uploads/`. Menghapus akun membuat `posts.user_id` menjadi null, sedangkan sesi dan interaksinya dihapus oleh relasi.

Indeks pada `posts.created_at`, `posts.category`, dan pasangan `posts.lat, posts.lng` membantu query feed. Jumlah suka, simpan, komentar, serta rata-rata rating tidak disimpan sebagai kolom tetap; semuanya dihitung dari tabel interaksi ketika post dibaca.

## Data awal

Ketika `posts` kosong, `server.mjs` membuat delapan postingan awal. Postingan itu diberi `is_demo=1`. Server juga membuat akun internal dengan domain `spots.invalid` untuk penulisnya dan mengisi sebagian rating, reaksi, serta komentar. Akun tersebut tidak dimaksudkan untuk login.

Koordinat awal mengacu pada area kota, bukan alamat usaha yang sudah diverifikasi. Untuk memisahkan konten baru dari data awal:

```sql
SELECT id, title, city, lat, lng, is_demo, created_at
FROM spots_to_go.posts
ORDER BY created_at DESC;
```

Postingan yang diunggah pengguna memakai `is_demo=0`. Server tidak menambah data awal lagi selama tabel `posts` tidak kosong.

## Mengedit lewat MySQL Workbench

Pilih koneksi MySQL 8 yang portnya sama dengan `DB_PORT`. Di panel Schemas, refresh lalu buka `spots_to_go`. Anda bisa memakai `Select Rows - Limit 1000` pada tabel, tetapi query eksplisit memudahkan melihat perubahan yang tepat.

Contoh memperbarui cerita dan lokasi satu post:

```sql
START TRANSACTION;

UPDATE spots_to_go.posts
SET story = 'Datang sebelum jam makan siang supaya tidak terlalu ramai.',
    lat = -6.9175000,
    lng = 107.6191000
WHERE id = 'ganti-dengan-id-post';

SELECT id, title, story, lat, lng
FROM spots_to_go.posts
WHERE id = 'ganti-dengan-id-post';

COMMIT;
```

Periksa baris yang akan berubah sebelum menjalankan `COMMIT`. Gunakan `ROLLBACK` bila hasilnya salah. Setelah itu muat ulang halaman web untuk mengambil data terbaru.

Untuk melihat slide dan interaksi satu post:

```sql
SELECT position, media_type, url
FROM spots_to_go.post_media
WHERE post_id = 'ganti-dengan-id-post'
ORDER BY position;

SELECT kind, COUNT(*) AS jumlah
FROM spots_to_go.reactions
WHERE post_id = 'ganti-dengan-id-post'
GROUP BY kind;

SELECT ROUND(AVG(score), 1) AS rating, COUNT(*) AS jumlah_rating
FROM spots_to_go.ratings
WHERE post_id = 'ganti-dengan-id-post';
```

Jika mengubah media secara manual, jaga agar `post_media.position` tetap berurutan mulai dari 0. Samakan `posts.image` dan `posts.media_type` dengan slide pertama. Cara paling aman untuk menambah konten baru tetap lewat formulir web karena server memeriksa berkas, menyimpan file, dan menulis metadata bersama.

## Backup

Simpan dua hal sekaligus: dump database `spots_to_go` dan folder `uploads/`. Dump database saja tidak membawa foto atau video. Menu `Server > Data Export` di Workbench dapat membuat dump SQL. Simpan salinan folder `uploads/` pada waktu yang sama agar URL media di database tetap menunjuk ke berkas yang ada.
