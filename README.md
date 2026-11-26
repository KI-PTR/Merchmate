# MerchMate — Website Pre-Order Souvenir

Website untuk Entrepreneur Fair dengan HTML, CSS, JavaScript, Google Sheets, dan Google Apps Script.

## File
- `index.html`: halaman katalog, keranjang, dan checkout.
- `style.css`: desain cute colorful responsif.
- `script.js`: katalog contoh, filter, keranjang, hitung total, validasi, dan pengiriman.
- `google-apps-script.gs`: endpoint untuk menyimpan pesanan ke Google Sheets.

## A. Hubungkan Google Sheets

1. Buat Google Spreadsheet baru bernama `Pesanan MerchMate`.
2. Buka **Ekstensi > Apps Script**.
3. Di `Code.gs`, hapus kode contoh lalu tempel semua isi file `google-apps-script.gs`.
4. Simpan proyek.
5. Pilih **Deploy > New deployment**.
6. Klik ikon jenis deployment dan pilih **Web app**.
7. Atur:
   - **Execute as / Jalankan sebagai:** Me.
   - **Who has access / Siapa yang memiliki akses:** Anyone, jika pilihan ini diizinkan akun Google kamu.
8. Klik **Deploy**, selesaikan izin akses, lalu salin URL Web app yang berakhiran `/exec`. Jangan gunakan URL `/dev`.
9. Buka `script.js` dan cari:
   ```js
   const GOOGLE_SCRIPT_URL = "PASTE_URL_WEB_APP_GOOGLE_APPS_SCRIPT_DI_SINI";
   ```
10. Ganti isi string tersebut dengan URL Web app. Contoh format:
   ```js
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/ID_DEPLOYMENT_KAMU/exec";
   ```
11. Simpan file dan unggah ulang `script.js` ke GitHub setelah URL dipasang.

**Penting:** website mengirim request memakai `no-cors`, sehingga browser tidak dapat membaca respons server. Konfirmasi pada browser bukan bukti mutlak bahwa data telah tersimpan. Setelah tes pesanan pertama, periksa spreadsheet dan menu **Executions** di Apps Script. Jika perlu konfirmasi server yang dapat diverifikasi, gunakan backend/proxy dengan CORS dan respons yang terverifikasi.

## B. Tes lokal

1. Buka folder ini di VS Code.
2. Jalankan `index.html` menggunakan ekstensi Live Server atau buka langsung di browser untuk mengecek tampilan.
3. Setelah menghubungkan URL Apps Script, lakukan satu pesanan percobaan.
4. Pastikan data muncul di tab `Pesanan MerchMate` dan item dengan ID pesanan yang sama tersimpan sebagai beberapa baris.

## C. Hosting gratis di GitHub Pages

1. Buat repository baru di GitHub, misalnya `merchmate-po`.
2. Unggah `index.html`, `style.css`, `script.js`, dan `README.md` ke root repository.
3. Buka **Settings > Pages**.
4. Di **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/(root)`, lalu klik **Save**.
6. Tunggu proses selesai. URL website akan ditampilkan pada halaman Pages.

File `.gs` hanya untuk ditempel ke Apps Script; file itu tidak dijalankan oleh GitHub Pages.

## D. Ganti produk, harga, dan gambar

Edit array `products` di bagian atas `script.js`. Ubah `name`, `category`, `price`, `description`, `tag`, dan `bg`. `price` adalah angka rupiah tanpa titik atau simbol `Rp`.

Ilustrasi saat ini adalah SVG demo yang dibuat oleh JavaScript. Untuk memakai foto asli, unggah gambar ke folder `assets`, lalu sesuaikan fungsi `svgArt()` dan tampilan kartu produk agar memakai file gambar tersebut.

## Cara kerja pesanan

- Keranjang mendukung banyak produk dan kuantitas `+` / `−`.
- Total dihitung otomatis.
- Nama dan WhatsApp wajib diisi; kelas dan catatan opsional.
- Setiap jenis produk pada satu checkout disimpan sebagai satu baris, dengan ID pesanan yang sama.
- Status awal: `Pre-order diterima` dan `Belum dibayar — bayar saat barang tersedia`.
- Website tidak meminta pembayaran online di awal.

## Checklist sebelum fair

- [ ] URL Apps Script sudah dipasang.
- [ ] Nama produk, harga, dan ilustrasi sudah disesuaikan.
- [ ] Pesanan uji berhasil terlihat di Google Sheets.
- [ ] Nomor WhatsApp penjual/kelompok siap untuk konfirmasi.
- [ ] Akses spreadsheet hanya diberikan kepada anggota yang perlu mengelolanya.
