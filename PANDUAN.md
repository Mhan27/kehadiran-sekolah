# Panduan Setup Firebase — Sistem Kehadiran SMP Muhammadiyah 7 Surabaya

Paket ini terdiri dari 4 file: `index.html`, `app.js`, `style.css`, `logo.png`. Semua logika ada di `app.js`, dan file itulah satu-satunya yang perlu kamu edit untuk menghubungkan ke Firebase.

## 1. Buat Proyek Firebase
1. Buka [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → beri nama → selesaikan wizard.

## 2. Aktifkan Authentication (Anonymous)
Login di aplikasi tetap pakai **username & password biasa** (tanpa konsep email), dicek langsung dari data admin yang tersimpan di Firestore. Di baliknya, aplikasi memicu Firebase **Anonymous Auth** setiap kali dibuka — ini murni supaya Firestore Rules bisa membatasi akses data.

1. **Build → Authentication → Get started**.
2. Tab **Sign-in method** → aktifkan provider **Anonymous**.
3. Tidak perlu membuat user apa pun di tab **Users** — akun anonim dibuat otomatis.

## 3. Aktifkan Firestore Database
1. **Build → Firestore Database → Create database** → mode **production** → pilih lokasi (mis. `asia-southeast2 (Jakarta)`).
2. Buka tab **Rules**, ganti dengan:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Klik **Publish**.

## 4. Ambil firebaseConfig
1. **Project settings** (ikon gerigi) → tab **General** → scroll ke **Your apps** → klik ikon **Web (`</>`)** → **Register app**.
2. Salin objek `firebaseConfig` yang muncul.

## 5. Tempelkan ke app.js
Buka `app.js`, cari blok berikut di baris paling atas:

```js
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI_DENGAN_PROJECT.firebaseapp.com",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_PROJECT.appspot.com",
  messagingSenderId: "GANTI_DENGAN_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};
```

Ganti dengan `firebaseConfig` dari langkah 4, lalu simpan file.

## 6. Unggah ke GitHub & Aktifkan GitHub Pages
1. Buat repository baru di GitHub.
2. Unggah **keempat file** (`index.html`, `app.js`, `style.css`, `logo.png`) ke root repo — jangan diletakkan di dalam folder, karena `index.html` memuatnya dengan path relatif (`app.js`, `style.css`, `logo.png`).
3. **Settings → Pages** → Source: branch `main`, folder `/root` → **Save**.
4. Tunggu beberapa menit, buka URL yang diberikan GitHub.

## 7. Login Pertama Kali
Akun **Super Admin** dibuat otomatis saat aplikasi pertama kali terhubung ke Firestore yang masih kosong:
- Username: `superadmin`
- Password: `super123`

**Segera login dan ganti kredensial ini** — caranya: sebagai superadmin, buka menu **Tambah Admin**, buat akun admin baru dengan username/password sendiri, lalu hapus akun `superadmin` bawaan lewat Firebase Console (**Firestore Database → data → koleksi `users` → dokumen `superadmin` → Delete**). Atau ubah passwordnya langsung di Firestore Console.

## Struktur Data di Firestore
Setelah aplikasi berjalan, akan muncul 4 koleksi otomatis:
| Koleksi | Isi |
|---|---|
| `users` | Akun superadmin & admin (username sebagai ID dokumen) |
| `staff` | Data guru & karyawan |
| `schedules` | Jam masuk/pulang per pegawai (ID dokumen = ID pegawai) |
| `attendance` | Catatan kehadiran harian (ID dokumen = `idPegawai_tanggal`) |

## Troubleshooting
| Masalah | Kemungkinan Penyebab |
|---|---|
| Muncul "Firebase belum dikonfigurasi" | `firebaseConfig` di `app.js` masih berisi teks `GANTI_DENGAN_...` |
| Muncul "Gagal terhubung ke server" | Provider **Anonymous** belum aktif, atau Firestore Rules belum di-publish |
| Tidak bisa menambah/menyimpan data | Buka console browser (F12 → tab Console) saat mencoba menyimpan — pesan error akan muncul sebagai toast merah *dan* di console, biasanya karena Rules belum benar |
| Data hilang setelah refresh | Pastikan tidak ada error di console saat menyimpan; data yang gagal tersimpan ke Firestore tidak akan ikut ter-refresh |
| Logo tidak muncul | Pastikan `logo.png` ikut diunggah ke repo, sejajar dengan `index.html` |
