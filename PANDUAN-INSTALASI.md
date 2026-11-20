# PANDUAN INSTALASI — SIM SDIT ANNIHAYAH (GitHub Pages / Netlify / Vercel + Google Apps Script)

Arsitektur: **frontend statis** (folder `sim-sdit-annihayah`) berbicara dengan **Google Apps Script** (backend JSON) lewat `fetch`.
Data tetap di Google Sheets & Google Drive milik sekolah. Tidak ada iframe, tidak ada `google.script.run`.

> **Folder kerja untuk Git/GitHub/Netlify/Vercel = folder `sim-sdit-annihayah` hasil ekstrak ZIP** (folder yang LANGSUNG berisi `index.html`).
> Jangan masuk lebih dalam, jangan naik satu level.

---

## BAGIAN A — Backend (Google Apps Script)

Proyek Apps Script lama Anda dipakai terus (spreadsheet & folder Drive yang sama, tidak ada data yang pindah).

1. Buka proyek Apps Script SIM Anda.
2. **Ganti isi** berkas: `Kode.gs`, `Database.gs`, `AbsensiQR.gs`. **Tambahkan** `NaikKelas.gs` bila belum ada.
   Berkas lain (`Auth.gs`, `Setup.gs`, `AbsensiGuru.gs`, `DaftarSatu.gs`) tidak berubah.
3. (Opsional) Ganti `appsscript.json`: *Project Settings → centang "Show appsscript.json manifest file in editor"*, lalu ganti isinya.
4. **Deploy → Manage deployments → ikon pensil (Edit) → Version: New version → Deploy.**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone** (bukan "Anyone with Google account" — frontend tidak bisa login Google)
   - Mengedit deployment yang ada **mempertahankan URL `/exec`** yang sama.
5. Salin URL `/exec`. Uji di browser: URL itu harus menampilkan teks JSON `"API aktif…"`.

Keamanan: semua aksi tetap dicek di server (token sesi + peran). URL `/exec` memang publik, sama seperti sebelumnya.

> Tampilan lama (HtmlService) masih bisa dibuka lewat `URL-exec?ui=gas` selama berkas `Index.html` & `JS_*.html` lama belum dihapus. Setelah frontend baru berjalan baik, berkas-berkas itu boleh dihapus.

---

## BAGIAN B — Isi alamat server di frontend

1. Buka `sim-sdit-annihayah/js/config.js` dengan Notepad.
2. Ganti `ISI_URL_EXEC_DI_SINI` dengan URL `/exec` tadi (tetap di dalam tanda kutip). Simpan.

---

## BAGIAN C — Deploy ke GitHub Pages (gratis)

**Persiapan (sekali saja)**
1. Pasang Git: Windows → https://git-scm.com/download/win (pengaturan default). Mac → ketik `git --version` di Terminal. Cek: `git --version`
2. Buat akun di https://github.com (username jadi bagian alamat situs: `username.github.io`).
3. Identitas Git:
   ```
   git config --global user.name "Nama Anda"
   git config --global user.email "email@akun-github.com"
   ```
4. Di GitHub: **+ → New repository** → isi nama (mis. `sim-annihayah`), pilih **Public**, **jangan** centang README/.gitignore/license → Create.

**Push pertama**
5. Buka folder `sim-sdit-annihayah` di File Explorer → klik address bar → ketik `powershell` → Enter.
6. **Gerbang wajib — cek isi folder:**
   ```
   dir
   ```
   Harus terlihat `index.html`, `css`, `js` di daftar teratas. Jika yang terlihat folder `sim-sdit-annihayah` lagi, masuk dulu: `cd sim-sdit-annihayah`. **Jangan lanjut sebelum `index.html` terlihat.**
7. Jalankan satu per satu:
   ```
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
   (`git add .` — ada **titik** di akhir.)
8. Saat diminta password, tempel **Personal Access Token** (bukan password akun): https://github.com/settings/tokens → *Generate new token (classic)* → centang **repo** → salin `ghp_…`. Saat menempel, layar terlihat kosong — itu normal.
   Alternatif tanpa terminal: **GitHub Desktop** (https://desktop.github.com) → Add Local Repository → Publish.
9. Di repo GitHub: **Settings → Pages** → Source **Deploy from a branch** → Branch **main** / **(root)** → Save → centang **Enforce HTTPS** (**wajib** untuk kamera absensi).
10. Tunggu 1–2 menit → situs ada di `https://USERNAME.github.io/NAMA-REPO/`.

> ⚠️ Jangan memakai "Add file → Upload files" di web GitHub — struktur folder `css/` `js/` rusak dan situs jadi 404/tanpa gaya.

---

## BAGIAN D — Alternatif: Netlify

- **Termudah:** buka https://app.netlify.com/drop → seret folder `sim-sdit-annihayah` (yang berisi `index.html`) ke halaman itu. Selesai; Anda mendapat alamat `*.netlify.app`.
- **Dari GitHub:** *Add new site → Import an existing project* → pilih repo → *Build command* kosongkan, *Publish directory* `.` → Deploy. Setiap `git push` otomatis terbit ulang.

## BAGIAN E — Alternatif: Vercel

- **Terminal:** `npm i -g vercel` lalu di dalam folder `sim-sdit-annihayah`: `vercel` (jawab: *Framework* = Other, *Build command* kosong, *Output directory* `.`), lalu `vercel --prod`.
- **Dari GitHub:** https://vercel.com/new → Import repo → *Framework Preset* **Other**, kosongkan Build Command, *Output Directory* `.` → Deploy.

Semua platform di atas memberi HTTPS otomatis. Domain sendiri bisa ditambahkan dari pengaturan *Domains* masing-masing platform.

---

## BAGIAN F — Memperbarui aplikasi

- **GitHub Pages / Netlify-GitHub / Vercel-GitHub:** dari folder proyek: `git add .` → `git commit -m "Deskripsi"` → `git push`. Tunggu 1–2 menit. Bila masih tampil lama: Ctrl+Shift+R.
- **Frontend:** modul yang berubah otomatis disusun ulang di peramban pengguna; tidak perlu menghapus cache.
- **Backend:** ubah kode → *Deploy → Manage deployments → Edit → New version*.

---

## Apa yang dibuat lebih cepat?

| Bagian | Sebelumnya | Sekarang |
|---|---|---|
| Buka aplikasi (kunjungan ke-2 dst.) | Menyusun ±600 KB kode tiap kali dibuka | Hasil susunan disimpan di peramban → langsung jalan |
| Layar kosong saat memuat | Putih beberapa detik | Layar pembuka beranimasi tampil seketika, dengan progres |
| Data setelah login | Menunggu server | Data terakhir tampil seketika, data terbaru menyusul diam-diam |
| Pindah menu | Halaman dibangun ulang | Halaman yang pernah dibuka tetap hidup (kecuali halaman kamera) → seketika |
| Simpan / hapus data | Menunggu server baru tabel berubah | Tabel berubah seketika; server menyusul; bila ditolak, otomatis dikembalikan + pesan galat |
| Baca Google Sheets | Tiap permintaan membaca ulang semua tab | Tab disimpan di cache server (terkompresi); dibuang otomatis setiap ada penulisan |
| Musik latar | Diunduh saat membuka | Diunduh 2,5 detik setelah aplikasi tampil |
| Tombol muat ulang | Layar dikosongkan, menu kembali ke Dashboard | Menyegarkan diam-diam, tetap di halaman yang sama |

Batas yang jujur: setiap permintaan ke Google Apps Script tetap butuh waktu jaringan (kira-kira 0,3–1,5 detik; bangun dari "tidur" bisa lebih lama — layar pembuka sudah membangunkan server lebih awal). Kunjungan **pertama** sesudah pembaruan butuh beberapa detik untuk menyusun kode (ditutupi layar pembuka).
Data di cache server terbarui otomatis setiap ada penulisan lewat aplikasi. Jika Anda mengedit Google Sheets **langsung**, tekan tombol muat ulang (ikon panah melingkar, admin/kepsek) atau tunggu maksimal 10 menit.

---

## Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| Layar pembuka bertuliskan "Alamat server belum diisi" | `js/config.js` belum diisi | Isi `API_URL`, simpan, push ulang |
| "Tidak dapat terhubung ke server" | URL `/exec` salah, atau akses deployment bukan **Anyone** | Buka URL `/exec` di browser: harus tampil JSON. Cek *Who has access = Anyone*, deploy *New version* |
| Halaman 404 di GitHub Pages | `index.html` tidak di root repo (folder salah di-push) | Buka repo di browser: `index.html` harus terlihat di root. Jika tidak, ulangi dari folder yang benar: `git push -u origin main --force` |
| Tampil tanpa gaya / modul 404 | Folder `css/` `js/` tidak ikut (upload lewat web) | Push ulang lewat terminal dari folder `sim-sdit-annihayah` |
| `Password authentication is not supported` | GitHub menolak password biasa | Pakai Personal Access Token |
| Kamera tidak menyala | Situs bukan HTTPS / izin kamera ditolak | Pastikan alamat berawalan `https://`, izinkan Kamera di ikon kunci bilah alamat |
| Data lama tampil sesudah update | Cache peramban | Ctrl+Shift+R atau jendela Incognito |
| "Sesi berakhir" berulang | Token kedaluwarsa | Login ulang |
| Log masuk ditolak "Terlalu banyak percobaan" | Proteksi 5× salah sandi | Tunggu 15 menit |
