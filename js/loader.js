// ============================================================================
//  loader.js — pemuat modul aplikasi dengan CACHE HASIL KOMPILASI
//  Kunjungan pertama : unduh modul → susun JSX (Babel) → simpan hasilnya di IndexedDB peramban.
//  Kunjungan berikutnya: ambil hasil susunan dari IndexedDB → langsung jalan (Babel tidak diunduh sama sekali).
//  Modul yang isinya berubah otomatis disusun ulang (dikenali dari sidik isi berkas), jadi tidak perlu hapus cache manual.
// ============================================================================
(function () {
  'use strict';
  var C = window.SIM_CONFIG || {}, S = window.simSplash || { set: function () {}, galat: function () {}, selesai: function () {} };
  var MODUL = [
    ['01-core', 'inti aplikasi'], ['02-auth', 'login & pengguna'], ['03-efek', 'tampilan'], ['04-akademik', 'akademik & nilai'], ['05-administrasi', 'absensi, surat & keuangan'],
    ['06-pengaturan', 'pengaturan'], ['07-laporan', 'laporan'], ['08-agenda-prestasi', 'agenda & prestasi'], ['09-kelulusan', 'kelulusan & arsip'], ['10-app', 'menu utama']
  ];
  var BABEL_URL = 'https://unpkg.com/@babel/standalone@7.24.7/babel.min.js';

  if (!C.API_URL || /ISI_URL|XXXX/.test(C.API_URL)) { S.galat('Alamat server belum diisi. Buka berkas js/config.js lalu isi API_URL dengan URL Web App (/exec).'); return; }

  // Bangunkan server Google Apps Script selagi aset diunduh (mengurangi jeda saat login)
  try { fetch(C.API_URL + (C.API_URL.indexOf('?') < 0 ? '?' : '&') + 'aksi=ping', { mode: 'no-cors', cache: 'no-store' }); } catch (e) {}

  function sidik(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36) + '.' + s.length.toString(36); }
  function jeda() { return new Promise(function (r) { setTimeout(r, 0); }); }

  function bukaDB() {
    return new Promise(function (res) {
      try {
        var r = indexedDB.open('sim-kompilasi', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('js'); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { res(null); };
        r.onblocked = function () { res(null); };
      } catch (e) { res(null); }
    });
  }
  function ambil(db, k) {
    return new Promise(function (res) {
      if (!db) return res(undefined);
      try { var q = db.transaction('js', 'readonly').objectStore('js').get(k); q.onsuccess = function () { res(q.result); }; q.onerror = function () { res(undefined); }; } catch (e) { res(undefined); }
    });
  }
  function simpan(db, k, v) {
    return new Promise(function (res) {
      if (!db) return res();
      try { var tx = db.transaction('js', 'readwrite'); tx.objectStore('js').put(v, k); tx.oncomplete = res; tx.onerror = res; tx.onabort = res; } catch (e) { res(); }
    });
  }
  function bersihkan(db, pakai) {          // buang hasil susunan versi lama
    if (!db) return;
    try {
      var st = db.transaction('js', 'readwrite').objectStore('js'), q = st.getAllKeys();
      q.onsuccess = function () { (q.result || []).forEach(function (k) { if (pakai.indexOf(k) < 0) st.delete(k); }); };
    } catch (e) {}
  }
  function muatBabel() {
    return new Promise(function (res, rej) {
      if (window.Babel) return res();
      var s = document.createElement('script'); s.src = BABEL_URL; s.crossOrigin = 'anonymous';
      s.onload = function () { res(); }; s.onerror = function () { rej(new Error('Gagal mengunduh penyusun tampilan (Babel). Periksa koneksi internet.')); };
      document.head.appendChild(s);
    });
  }
  function jalankan(kode, nama) {
    var s = document.createElement('script');
    s.text = kode + '\n//# sourceURL=sim-' + nama + '.js';
    document.head.appendChild(s);          // dieksekusi seketika dalam lingkup global (sama seperti <script> biasa)
    if (s.parentNode) s.parentNode.removeChild(s);
  }

  async function utama() {
    S.set(10, 'Mengunduh modul aplikasi…');
    var sumber = await Promise.all(MODUL.map(function (m) {
      return fetch('js/modul/' + m[0] + '.jsx', { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('Berkas js/modul/' + m[0] + '.jsx tidak ditemukan (kode ' + r.status + '). Pastikan folder js/modul ikut ter-upload.');
        return r.text();
      });
    }));
    S.set(34, 'Memeriksa pembaruan…');
    var db = await bukaDB();
    var kunci = sumber.map(function (s, i) { return MODUL[i][0] + '|' + sidik(s); });
    var tersimpan = await Promise.all(kunci.map(function (k) { return ambil(db, k); }));
    var perluBabel = tersimpan.some(function (x) { return typeof x !== 'string'; });
    if (perluBabel) { S.set(40, 'Menyiapkan tampilan (hanya pertama kali / saat ada pembaruan)…'); await muatBabel(); }

    for (var i = 0; i < MODUL.length; i++) {
      var kode = tersimpan[i];
      if (typeof kode !== 'string') {
        S.set(46 + Math.round(i / MODUL.length * 48), 'Menyusun ' + MODUL[i][1] + '…');
        await jeda();
        kode = window.Babel.transform(sumber[i], { presets: ['react'], sourceType: 'script' }).code;
        simpan(db, kunci[i], kode);
      } else S.set(46 + Math.round(i / MODUL.length * 48), 'Memuat ' + MODUL[i][1] + '…');
      jalankan(kode, MODUL[i][0]);
      await jeda();
    }
    S.set(96, 'Menghubungkan ke server…');
    bersihkan(db, kunci);
  }

  utama().catch(function (e) { console.error(e); S.galat(e && e.message ? e.message : String(e)); });
})();
