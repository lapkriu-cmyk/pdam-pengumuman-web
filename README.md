# Web Berita / Pengumuman Pelanggan PDAM

Aplikasi ini dibuat untuk menampilkan informasi resmi PDAM kepada pelanggan, seperti perbaikan kebocoran, gangguan aliran air, jadwal pemeliharaan, dan informasi umum. Admin dapat mengontrol semua informasi melalui dashboard khusus.

## Fitur

- Halaman pelanggan: menampilkan pengumuman yang aktif dan dipublikasikan.
- Pencarian pengumuman berdasarkan judul, isi, wilayah, kategori, atau status.
- Filter kategori dan status.
- Banner otomatis untuk informasi prioritas `Penting` atau `Darurat`.
- Dashboard admin khusus.
- Login admin.
- Tambah, edit, hapus, dan sembunyikan/tampilkan pengumuman.
- Data tersimpan di file JSON sehingga tidak hilang saat server dinyalakan ulang.
- Tampilan responsif untuk HP dan desktop.

## Struktur Folder

```text
pdam_pengumuman_web/
├── admin/
│   ├── admin.css
│   ├── admin.js
│   ├── dashboard.html
│   └── login.html
├── data/
│   └── announcements.json
├── public/
│   ├── app.js
│   ├── index.html
│   └── style.css
├── .env.example
├── package.json
├── README.md
└── server.js
```

## Cara Menjalankan di Laptop/PC

1. Install Node.js versi 18 atau lebih baru.
2. Buka terminal di folder aplikasi.
3. Jalankan perintah:

```bash
npm install
npm start
```

4. Buka halaman pelanggan:

```text
http://localhost:3000
```

5. Buka halaman admin:

```text
http://localhost:3000/admin
```

## Login Admin Default

```text
Username: admin
Password: admin123
```

Segera ganti username dan password sebelum aplikasi dipakai online.

## Cara Mengganti Nama PDAM, Kontak, dan Password

Buat environment variable di server/VPS. Contoh Linux:

```bash
export PORT=3000
export SESSION_SECRET="kalimat_rahasia_yang_panjang_dan_sulit_ditebak"
export ADMIN_USERNAME="adminpdam"
export ADMIN_PASSWORD="password_baru_yang_kuat"
export PDAM_NAME="PDAM Tirta Daerah"
export PDAM_PHONE="081234567890"
export PDAM_EMAIL="layanan@pdam.go.id"
npm start
```

## Cara Isi Pengumuman dari Admin

1. Login ke `/admin`.
2. Isi judul, isi pengumuman, kategori, status, wilayah terdampak, prioritas, tanggal mulai, dan tanggal selesai.
3. Centang `Tampilkan di halaman pelanggan` agar pengumuman muncul di halaman publik.
4. Klik `Simpan Pengumuman`.

## Rekomendasi Saat Dipakai Online

- Ganti password default.
- Ganti `SESSION_SECRET`.
- Jalankan aplikasi di VPS menggunakan PM2 atau layanan hosting Node.js.
- Gunakan HTTPS/SSL.
- Backup folder `data/` secara berkala.

Contoh menjalankan dengan PM2:

```bash
npm install -g pm2
pm2 start server.js --name pdam-pengumuman
pm2 save
```
