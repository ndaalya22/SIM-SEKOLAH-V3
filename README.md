# SIM SDIT ANNIHAYAH — Frontend Statis

Frontend (HTML + CSS + JavaScript/React) untuk GitHub Pages, Netlify, atau Vercel.
Backend: Google Apps Script sebagai REST API (berkas `.gs` diserahkan terpisah, **tidak** ada di folder ini).

## Isi folder
```
index.html          ← halaman utama + layar pembuka (harus di root)
css/style.css
js/config.js        ← SATU-SATUNYA berkas yang wajib Anda isi (API_URL)
js/loader.js        ← pemuat modul + cache hasil susunan
js/modul/*.jsx      ← kode aplikasi (10 modul)
netlify.toml        ← pengaturan Netlify
vercel.json         ← pengaturan Vercel
.nojekyll           ← agar GitHub Pages tidak memproses ulang berkas
PANDUAN-INSTALASI.md
```

## Pasang cepat
1. Deploy backend Apps Script → salin URL `/exec`.
2. Isi `API_URL` di `js/config.js`.
3. Deploy folder ini ke GitHub Pages / Netlify / Vercel (lihat `PANDUAN-INSTALASI.md`).

Pratinjau lokal (opsional): jalankan `python -m http.server 8000` di folder ini lalu buka `http://localhost:8000`.
Jangan membuka `index.html` dengan klik ganda (file://) — modul tidak akan termuat.
