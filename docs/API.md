# API HTTP

Semua endpoint berada pada origin web yang sama. Body dan respons memakai JSON kecuali `POST /api/posts`, yang memakai `multipart/form-data`. Kesalahan dikembalikan sebagai `{"error":"pesan"}`. Cookie sesi dikirim otomatis oleh browser.

## Endpoint publik

| Metode | URL | Respons |
| --- | --- | --- |
| GET | `/api/health` | `{"ok":true,"database":"mysql"}` |
| GET | `/api/me` | `{"user":null}` atau data akun aktif |
| GET | `/api/posts` | `posts` dan `radiusKm` |
| GET | `/api/posts/:id/comments` | Maksimal 100 komentar terbaru |

Parameter `GET /api/posts`:

| Parameter | Nilai | Keterangan |
| --- | --- | --- |
| `mode` | `near` atau `explore` | Nilai lain diperlakukan sebagai `near` |
| `lat`, `lng` | Koordinat desimal | Dipakai untuk jarak dan radius 20 km pada mode `near` |
| `category` | `kuliner`, `kafe`, `destinasi` | Filter kategori |
| `q` | Teks pencarian | Mencari judul, kota, negara, dan cerita |

Contoh: `/api/posts?mode=near&lat=-6.9175&lng=107.6191&category=kuliner`.

Jika koordinat tidak ada atau tidak valid, mode `near` memakai daftar populer. Setiap respons feed berisi maksimal 40 post. Objek post memuat metadata tempat, `media` berurutan, jarak bila tersedia, jumlah interaksi, rating rata-rata, serta status `liked`, `saved`, dan `myRating` untuk akun aktif.

## Akun dan sesi

| Metode | URL | Body |
| --- | --- | --- |
| POST | `/api/register` | `{"name":"Nama","email":"nama@contoh.com","password":"minimal8"}` |
| POST | `/api/login` | `{"email":"nama@contoh.com","password":"minimal8"}` |
| POST | `/api/logout` | Tidak perlu body |

Email harus valid dan kata sandi minimal delapan karakter. Pendaftaran memakai nama dengan panjang maksimal 60 karakter. Login dan pendaftaran mengembalikan `{"user":{"id":"...","name":"...","email":"..."}}` serta cookie `sid` dengan `HttpOnly`, `SameSite=Lax`, dan masa berlaku 30 hari. Nilai token di database disimpan sebagai hash SHA-256. Kata sandi disimpan sebagai hasil scrypt dengan salt.

## Postingan dan interaksi

| Metode | URL | Keterangan |
| --- | --- | --- |
| POST | `/api/posts` | Membuat postingan baru, perlu login |
| POST | `/api/posts/:id/like` | Menyalakan atau membatalkan suka |
| POST | `/api/posts/:id/save` | Menyimpan atau menghapus dari tersimpan |
| POST | `/api/posts/:id/rating` | `{"score":5}`, angka bulat 1 sampai 5 |
| POST | `/api/posts/:id/comments` | `{"body":"Komentar"}`, minimal 2 karakter |
| GET | `/api/profile` | Akun, postingan sendiri, dan postingan tersimpan |

Form unggahan memerlukan `title`, `city`, `country`, `category`, `story`, `lat`, `lng`, dan satu sampai lima field `media`. Kategori hanya `kuliner`, `kafe`, atau `destinasi`. Koordinat harus berada pada rentang lintang dan bujur yang valid.

Foto yang diterima: JPG, PNG, WebP dengan batas 8 MB per berkas. Video yang diterima: MP4, WebM, MOV dengan batas 40 MB per berkas. Total media maksimal 80 MB. Tanda format di dalam berkas diperiksa di server, bukan hanya ekstensi. Respons sukses memakai status `201` dan berisi post yang baru dibuat.

Rating satu akun untuk satu post disimpan ulang saat nilainya berubah. Endpoint suka dan simpan bersifat toggle. Komentar baru memakai status `201`; interaksi lain memakai `200`.

## Status dan batas yang perlu diketahui

- `400`: input tidak valid, format berkas salah, atau komentar terlalu pendek.
- `401`: endpoint membutuhkan akun.
- `404`: post atau berkas tidak ditemukan.
- `409`: email sudah terdaftar.
- `500`: server gagal menyelesaikan permintaan.

API saat ini belum menyediakan pagination, penghapusan postingan, atau endpoint admin. Daftar profil dibatasi 300 post per jenis oleh server. Lihat [OPERATIONS.md](OPERATIONS.md) sebelum membuka layanan ke publik.
