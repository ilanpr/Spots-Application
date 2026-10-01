# Frontend dan interaksi

Frontend Spots menggunakan HTML, CSS, dan JavaScript browser tanpa framework UI. `index.html` memuat struktur halaman, `style.css` mengatur tampilan, dan `app.js` mengelola state serta permintaan API.

## Navigasi

Landing page muncul di `/#home`. Aplikasi memakai `/#feed`, `/#explore`, `/#map`, `/#saved`, dan `/#profile`. Pencarian berada di header aplikasi. Tab Dekatmu dan Jelajah dunia mengganti mode daftar, sedangkan filter kategori memilih kuliner, kafe, atau destinasi.

Di ponsel, navigasi utama berada di bagian bawah dan tombol tambah ada di tengah. Layar yang lebih lebar memakai sidebar. Form login, form unggah, dan detail post memakai elemen `dialog` agar fokus tetap berada pada tugas yang sedang dikerjakan.

## Feed dan galeri

Setiap kartu menampilkan penulis, kota, kategori, media, jumlah suka, rating, cerita, dan cuplikan komentar terakhir. Feed dibaca dengan scroll vertikal. Jika satu post berisi beberapa media, pengguna menggeser galeri ke samping atau menekan tombol sebelumnya dan berikutnya. Galeri memakai CSS scroll snap dan indikator slide.

Video dimuat sebagai metadata lebih dulu. Video pada slide aktif dapat diputar tanpa suara ketika cukup terlihat di layar. Saat slide berganti, halaman disembunyikan, atau post keluar dari layar, pemutaran dihentikan. Pengguna tetap mempunyai kontrol video pada elemen media.

## Peta dan pemilihan lokasi

Peta dibuat dengan Leaflet dan ubin OpenStreetMap. Kategori post menentukan warna serta gambar pin. Popup menampilkan media utama, nama tempat, rating, jumlah suka, dan komentar. Daftar di bawah peta memberi jalan lain untuk membuka pin, termasuk saat pengguna tidak ingin menelusuri peta secara manual.

Pada form unggah, lokasi bisa diambil dari GPS, dipilih dari daftar kota, atau ditandai langsung pada peta. Koordinat dikirim bersama post dan disimpan di MySQL. Tombol Arah pada detail membuka Google Maps menggunakan koordinat tersebut.

## Tampilan responsif dan gerak

Warna dasar memakai bidang terang dengan biru sebagai warna aksi. Coral, mint, dan warna lembut lain membedakan kategori serta memberi aksen. Huruf antarmuka memakai DM Sans; Nunito dipakai terutama untuk logo. SVG lokal menyimpan logo, maskot, dan favicon.

Transisi dipakai pada masuknya kartu, dialog, perpindahan header, tombol, pin, dan popup peta. Beberapa elemen memakai efek blur singkat. `IntersectionObserver` menunda efek masuk sampai elemen terlihat. CSS `prefers-reduced-motion` mengurangi animasi, dan JavaScript mematikan sebagian efek ketika preferensi itu aktif. Saat browser tidak mendukung `backdrop-filter`, latar navigasi kembali menjadi putih biasa.

## Sumber luar

- Leaflet 1.9.4 dimuat dari unpkg.
- Ubin peta diambil dari OpenStreetMap dan atribusinya tampil pada peta.
- Font dimuat dari Google Fonts.
- Gambar pada landing dan postingan awal berasal dari URL Unsplash.

Karena sebagian aset berasal dari jaringan, layar tetap dapat terbuka tanpa koneksi penuh tetapi peta, font, atau gambar luar mungkin tidak tampil. Pesan kesalahan peta disediakan ketika Leaflet tidak berhasil dimuat.
