# PRD: Dashboard Pemantauan RSVP

## 1. Ringkasan

Aplikasi web sederhana untuk admin tunggal yang perlu mengelola dan memantau kehadiran undangan acara. Tamu undangan akan mengisi form konfirmasi (nama, jumlah orang, status hadir) secara mandiri melalui link RSVP. Data kehadiran tersebut otomatis masuk dan ter-update di dashboard admin, yang dilengkapi fitur pencarian, filter, sorting, dan cetak ke PDF.

Aplikasi ini tidak memiliki fitur pengiriman pesan, melainkan murni berfokus pada pengumpulan data RSVP dan penyajiannya secara rapi bagi admin.

## 2. Masalah yang diselesaikan

- Tanpa sistem, admin sulit melacak siapa yang sudah konfirmasi hadir atau tidak.
- Data konfirmasi yang tercecer di berbagai chat WhatsApp sulit untuk direkap.
- Admin butuh satu tempat terpusat untuk melihat total tamu yang akan hadir.

## 3. Tujuan (goals)

- Tamu undangan dapat mengisi jumlah orang dan status konfirmasi secara mandiri lewat link RSVP.
- Admin bisa memantau data RSVP yang masuk secara real-time.
- Admin bisa menambah kontak secara manual (satu per satu atau import dari Excel/Sheets) jika ada tamu yang konfirmasi via offline.
- Admin bisa melihat data yang sudah disortir (misal berdasar nama, status kehadiran) dan mencetaknya menjadi PDF.
- Data tersimpan di cloud (Firebase Firestore) sehingga bisa diakses dari device manapun, tidak hilang saat ganti browser/laptop.

## 4. Non-goals (di luar scope, JANGAN dikerjakan)

- TIDAK ada fitur pengiriman WhatsApp otomatis maupun manual dari dalam aplikasi.
- TIDAK ada sistem login/autentikasi admin di versi ini. Aplikasi diasumsikan dipakai oleh satu admin terpercaya.
- TIDAK ada role/multi-user permission.
- TIDAK ada notifikasi push atau reminder otomatis.

## 5. Target pengguna

Satu admin (pemilik acara/kegiatan) yang mengelola daftar tamu/kontak dan memantau konfirmasi kehadiran.

## 6. Tech stack

- **Frontend**: HTML, CSS, JavaScript vanilla.
- **Database**: Firebase Firestore.
- **Hosting**: bebas — bisa Firebase Hosting, atau dijalankan lokal dari file.
- **Autentikasi**: tidak ada di versi ini.

## 7. Struktur data (Firestore)

Collection: `contacts`

| Field | Tipe | Keterangan |
|---|---|---|
| `nama` | string | Nama kontak |
| `nohp` | string | Nomor HP kontak (opsional) |
| `statusHadir` | string | `"belum"`, `"hadir"`, atau `"tidak"` |
| `jumlahOrang` | number | Jumlah orang yang akan hadir (diisi via form RSVP) |
| `createdAt` | timestamp | Waktu kontak ditambahkan |
| `updatedAt` | timestamp | Waktu terakhir status diubah |

## 8. Fitur detail

### 8.1 Form RSVP Mandiri (Guest)
- Halaman web terpisah (`rsvp.html`) dengan form konfirmasi kehadiran.
- Tamu mengisi Nama Lengkap, Jumlah Orang, dan memilih "Hadir" / "Tidak Hadir".
- Data langsung tersimpan ke database `contacts`.

### 8.2 Tambah kontak manual (Admin)
- Form input: Nama, No. HP.
- Untuk mengakomodasi tamu yang konfirmasi di luar sistem link RSVP.
- Setelah submit, kontak baru masuk ke database dengan `statusHadir: "belum"`.

### 8.3 Import banyak kontak (bulk paste)
- Kotak textarea untuk paste data multi-baris, format: `Nama [tab/koma/spasi] No. HP`.
- Semua kontak yang valid ditambahkan ke database sekaligus.

### 8.4 Daftar kontak (tabel utama)
- Menampilkan semua kontak dengan kolom: Nama, No. HP, Kehadiran (dropdown), Jumlah Orang, dan tombol Hapus.
- Tabel mendukung sorting berdasarkan header (klik header Nama, No HP, Kehadiran, atau Jumlah Orang).
- Pencarian berdasarkan nama atau nomor HP.
- Filter berdasarkan status kehadiran (semua / belum konfirmasi / hadir / tidak hadir).

### 8.5 Update status kehadiran manual
- Admin memiliki dropdown per baris untuk mengubah `statusHadir` secara manual bila diperlukan.
- Perubahan langsung tersimpan ke Firestore begitu form disubmit atau dropdown diubah.

### 8.6 Statistik ringkas
- Tampilkan jumlah: total kontak, jumlah hadir, jumlah tidak hadir.

### 8.7 Export CSV & Print PDF
- Tombol export mengunduh seluruh data kontak sebagai file CSV.
- Tombol Print PDF menggunakan fitur cetak bawaan browser (`window.print()`) yang dipoles dengan CSS `@media print` sehingga tercetak rapi layaknya PDF dokumen.

### 8.8 Hapus kontak
- Tombol hapus per baris, dengan konfirmasi sebelum benar-benar menghapus dari Firestore.

## 9. Bahasa & UI

- Semua teks antarmuka menggunakan Bahasa Indonesia.
- Desain bersih, fungsional, memprioritaskan kemudahan pakai untuk admin.

## 10. Kriteria selesai (acceptance criteria)

- [ ] Tamu bisa mengisi form RSVP lewat link, dan data (kehadiran & jumlah orang) otomatis masuk ke dashboard admin.
- [ ] Admin bisa menambah kontak manual dan bulk import.
- [ ] Admin bisa melakukan pencarian dan filter berdasarkan status kehadiran.
- [ ] Admin bisa klik header tabel untuk melakukan sorting data.
- [ ] Perubahan status kehadiran tersimpan dan tetap ada setelah refresh halaman.
- [ ] Statistik menampilkan angka yang benar dan update real-time.
- [ ] Export CSV dan Print PDF bekerja dengan baik.

## 11. Catatan tambahan untuk AI coding assistant

- Jangan menambahkan fitur autentikasi/login kecuali diminta eksplisit.
- Jangan menambahkan fitur terkait pengiriman WhatsApp (ini adalah dashboard pemantauan murni).
