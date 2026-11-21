// ============================================================================
//  JS_Core — Lapisan dasar: koneksi backend, penyimpanan data (DB), notifikasi,
//  komponen umum, dan fungsi bantu. Dimuat PERTAMA sebelum file modul lain.
// ============================================================================
const { useState, useEffect, useRef, useMemo, useContext, createContext, useCallback } = React;

// Gambar kosong bawaan (tanpa internet) menggantikan placeholder eksternal.
const FOTO_KOSONG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="120" viewBox="0 0 100 120"><rect width="100" height="120" fill="#e5e7eb"/>' +
  '<circle cx="50" cy="44" r="18" fill="#9ca3af"/><path d="M14 112c4-26 22-38 36-38s32 12 36 38z" fill="#9ca3af"/></svg>');

// ---------------------------------------------------------------------------
// 1. PEMANGGIL BACKEND  →  google.script.run.api(aksi, payload)
// ---------------------------------------------------------------------------
// Sesi login (token disimpan di sessionStorage bila diizinkan peramban, selain itu di memori)
const SESI = { token: '', user: null };
const simpanSesi = (token, user) => { SESI.token = token; SESI.user = user; try { sessionStorage.setItem('sim_sesi', JSON.stringify({ token, user })); } catch (e) { /* disimpan di memori saja */ } };
const muatSesi = () => {
  try { const d = JSON.parse(sessionStorage.getItem('sim_sesi') || 'null'); if (d && d.token) { SESI.token = d.token; SESI.user = d.user; return d.user; } } catch (e) { /* abaikan */ }
  return SESI.user;
};
const KUNCI_BOOT = 'sim_boot_v2';
const hapusSesi = () => { SESI.token = ''; SESI.user = null; try { sessionStorage.removeItem('sim_sesi'); sessionStorage.removeItem(KUNCI_BOOT); } catch (e) { /* abaikan */ } };

// Alamat server (js/config.js). Bila kosong, aplikasi berjalan di dalam Google Apps Script (google.script.run).
const API_URL = (window.SIM_CONFIG && window.SIM_CONFIG.API_URL) || '';
const AKSI_BACA = ['boot', 'list', 'publicConfig', 'waktuServer', 'ambilMusik', 'daftarArsip', 'riwayatKelas', 'listPengguna', 'listDaftarSatu', 'getDaftarSatu', 'daftarQR', 'hitungDaftarSatu', 'urlAplikasi'];

const kegagalanApi = (pesan) => {
  if (/Sesi berakhir/i.test(pesan)) window.dispatchEvent(new Event('sim-logout'));   // token kedaluwarsa/dicabut → kembali ke login
  return new Error(pesan);
};

// Mode situs statis: POST JSON (text/plain agar tanpa preflight CORS) ke Web App Google Apps Script.
// Aksi baca yang gagal karena jaringan diulang sekali; aksi tulis TIDAK diulang (mencegah data ganda).
const apiFetch = async (aksi, payload, percobaan = 0) => {
  const ctl = new AbortController();
  const batas = setTimeout(() => ctl.abort(), 90000);
  let res;
  try {
    const r = await fetch(API_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', signal: ctl.signal,
      body: JSON.stringify({ aksi, payload: { ...payload, token: SESI.token } })
    });
    res = await r.json();
  } catch (e) {
    if (percobaan < 1 && AKSI_BACA.includes(aksi)) return apiFetch(aksi, payload, percobaan + 1);
    throw new Error(e && e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet.');
  } finally { clearTimeout(batas); }
  if (res && res.success) return res;
  throw kegagalanApi((res && res.message) || 'Terjadi kesalahan pada server.');
};

const apiPanggil = (aksi, payload = {}) => {
  if (API_URL) return apiFetch(aksi, payload);
  return new Promise((resolve, reject) => {
    if (typeof google === 'undefined' || !google.script || !google.script.run) {
      reject(new Error('Alamat server belum diisi di js/config.js.'));
      return;
    }
    google.script.run
      .withSuccessHandler((res) => { if (res && res.success) resolve(res); else reject(kegagalanApi((res && res.message) || 'Terjadi kesalahan pada server.')); })
      .withFailureHandler((err) => reject(kegagalanApi((err && err.message) || 'Gagal terhubung ke server.')))
      .api(aksi, { ...payload, token: SESI.token });
  });
};

// ---------------------------------------------------------------------------
// 2. NOTIFIKASI (pengganti alert bawaan browser)
// ---------------------------------------------------------------------------
const showAlert = (pesan, tipe) => {
  const jenis = tipe || (/^(gagal|error|tidak|nominal melebihi)/i.test(String(pesan)) ? 'error' : 'sukses');
  window.dispatchEvent(new CustomEvent('sim-toast', { detail: { pesan: String(pesan), tipe: jenis, id: Date.now() + Math.random() } }));
};

const ToastHost = () => {
  const [daftar, setDaftar] = useState([]);
  useEffect(() => {
    const onToast = (e) => {
      const t = e.detail;
      setDaftar((d) => [...d, t]);
      setTimeout(() => setDaftar((d) => d.filter((x) => x.id !== t.id)), t.tipe === 'error' ? 7000 : 3500);
    };
    window.addEventListener('sim-toast', onToast);
    return () => window.removeEventListener('sim-toast', onToast);
  }, []);
  const warna = { sukses: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
  const ikon = { sukses: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  return (
    <div className="fixed top-4 right-4 z-[200] space-y-2 w-80 max-w-[90vw] no-print">
      {daftar.map((t) => (
        <div key={t.id} className={`${warna[t.tipe] || warna.info} text-white px-4 py-3 rounded-lg shadow-lg text-sm flex gap-3 items-start`}>
          <i className={`fas ${ikon[t.tipe] || ikon.info} mt-0.5`}></i><span className="flex-1">{t.pesan}</span>
          <button onClick={() => setDaftar((d) => d.filter((x) => x.id !== t.id))} className="opacity-80 hover:opacity-100"><i className="fas fa-times"></i></button>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. DATABASE (STATE GLOBAL) — semua modul membaca & menulis lewat useDB()
// ---------------------------------------------------------------------------
const DBContext = createContext(null);
const useDB = () => useContext(DBContext);
const useSekolah = () => useContext(DBContext).pengaturan;

const gantiBerdasarkanNisn = (rows, nisn, baru) => [...rows.filter((r) => r.nisn !== nisn), ...baru];

// Cadangan data di sessionStorage (hanya selama tab terbuka; dihapus saat keluar). Dipakai agar halaman terbuka SEKETIKA
// dengan data terakhir, sementara data terbaru diambil diam-diam di latar belakang (stale-while-revalidate).
const bacaBootCache = () => {
  try {
    const d = JSON.parse(sessionStorage.getItem(KUNCI_BOOT) || 'null');
    return d && SESI.user && d.u === SESI.user.username && d.data ? d.data : null;
  } catch (e) { return null; }
};
const tulisBootCache = (data) => {
  try { sessionStorage.setItem(KUNCI_BOOT, JSON.stringify({ u: SESI.user && SESI.user.username, data })); }
  catch (e) { try { sessionStorage.removeItem(KUNCI_BOOT); } catch (e2) { /* abaikan */ } }
};

const DBProvider = ({ children }) => {
  const awal = useRef(undefined);
  if (awal.current === undefined) awal.current = bacaBootCache();
  const [data, setData] = useState(awal.current);
  const [status, setStatus] = useState(awal.current ? 'ready' : 'loading');
  const [galat, setGalat] = useState('');
  const [sibuk, setSibuk] = useState(0);
  const [menyegarkan, setMenyegarkan] = useState(false);
  const dataRef = useRef(awal.current);
  dataRef.current = data;

  // Memuat data dari server. Bila data lama sudah tampil, layar TIDAK dikosongkan (tanpa kedip, menu tidak kembali ke Dashboard).
  const muat = useCallback(async (opsi) => {
    const o = (opsi && typeof opsi === 'object' && !opsi.nativeEvent) ? opsi : {};
    if (!dataRef.current) setStatus('loading');
    setMenyegarkan(true);
    try { const res = await apiPanggil('boot', { segar: !!o.segar }); setData(res.data); setStatus('ready'); }
    catch (e) {
      if (dataRef.current) showAlert('Gagal menyegarkan data: ' + e.message, 'error');
      else { setGalat(e.message); setStatus('error'); }
    } finally { setMenyegarkan(false); }
  }, []);
  useEffect(() => { muat(); }, [muat]);
  useEffect(() => { if (!data) return undefined; const t = setTimeout(() => tulisBootCache(data), 1500); return () => clearTimeout(t); }, [data]);

  const jalankan = async (fn) => {
    setSibuk((n) => n + 1);
    try { return await fn(); } finally { setSibuk((n) => n - 1); }
  };

  const gabung = (tabel, rec) => setData((d) => {
    const rows = d[tabel] || [];
    const ada = rows.some((r) => r.id === rec.id);
    return { ...d, [tabel]: ada ? rows.map((r) => (r.id === rec.id ? rec : r)) : [...rows, rec] };
  });
  const buang = (tabel, id) => setData((d) => ({ ...d, [tabel]: (d[tabel] || []).filter((r) => r.id !== id) }));

  const nilai = useMemo(() => {
    if (!data) return null;
    const rows = (t) => data[t] || [];
    return {
      rows,
      pengaturan: data.Pengaturan || {},
      hariIni: (data.meta && data.meta.hariIni) || new Date().toISOString().slice(0, 10),
      user: data.meta.user,                         // { username, nama, role }
      statistik: data.meta.statistik,               // ringkasan sekolah untuk Dashboard
      punyaPeran: (daftar) => daftar.includes(data.meta.user.role),
      sibuk: sibuk > 0,
      menyegarkan,
      muatUlang: () => muat({ segar: true }),

      // OPTIMISTIC UI: tampilan berubah SEKETIKA; server menyusul di latar belakang. Bila server menolak, tampilan dikembalikan
      // dan pesan galat muncul. Mengembalikan baris tersimpan dari server.
      simpan: (tabel, rec) => jalankan(async () => {
        const lama = rec.id ? (dataRef.current[tabel] || []).find((r) => r.id === rec.id) : null;
        const idSementara = lama ? null : 'tmp-' + Math.random().toString(36).slice(2, 10);
        gabung(tabel, lama ? { ...lama, ...rec } : { ...rec, id: idSementara });
        try {
          const res = await apiPanggil('save', { tabel, data: rec });
          if (idSementara) setData((d) => ({ ...d, [tabel]: (d[tabel] || []).map((r) => (r.id === idSementara ? res.data : r)) }));
          else gabung(tabel, res.data);
          return res.data;
        } catch (e) { if (lama) gabung(tabel, lama); else buang(tabel, idSementara); throw e; }
      }),
      hapus: (tabel, id) => jalankan(async () => {
        const baris = dataRef.current[tabel] || [];
        const urutan = baris.findIndex((r) => r.id === id);
        const lama = urutan >= 0 ? baris[urutan] : null;
        buang(tabel, id);                                                       // baris langsung hilang dari tampilan
        try { await apiPanggil('delete', { tabel, id }); }
        catch (e) { if (lama) setData((d) => { const r = [...(d[tabel] || [])]; r.splice(Math.min(urutan, r.length), 0, lama); return { ...d, [tabel]: r }; }); throw e; }
      }),
      simpanNilaiRapor: (payload) => jalankan(async () => {
        const res = await apiPanggil('saveNilaiRapor', payload);
        setData((d) => ({ ...d, Nilai_Rapor: gantiBerdasarkanNisn(d.Nilai_Rapor || [], payload.nisn, res.data) }));
        return res;
      }),
      simpanPengaturan: (obj) => jalankan(async () => {
        const res = await apiPanggil('saveSetting', { data: obj });
        setData((d) => ({ ...d, Pengaturan: res.data }));
        return res;
      }),
      bayar: (payload) => jalankan(async () => {
        const res = await apiPanggil('bayarTagihan', payload);
        setData((d) => ({
          ...d,
          Tagihan: gantiBerdasarkanNisn(d.Tagihan || [], payload.nisn, res.data.Tagihan),
          Pembayaran: gantiBerdasarkanNisn(d.Pembayaran || [], payload.nisn, res.data.Pembayaran)
        }));
        return res;
      }),
      catatAbsensi: (payload) => jalankan(async () => {
        const res = await apiPanggil('catatAbsensi', payload);
        gabung('Absensi', res.data.catatan);
        return res;
      }),
      // Absensi QR + kedip mata: hanya kode QR & penanda kedip yang dikirim (tanpa foto/video/data wajah)
      catatQR: (payload) => jalankan(async () => {
        const res = await apiPanggil('absenQR', payload);
        if (res.data && res.data.tabel === 'Absensi' && res.data.catatan) gabung('Absensi', res.data.catatan);
        return res;
      }),
      unggah: (file, jenis) => jalankan(() => unggahBerkas(file, jenis))
    };
  }, [data, sibuk, menyegarkan, muat]);

  if (status === 'loading') return <LayarMemuat />;
  if (status === 'error') return <LayarGalat pesan={galat} ulangi={muat} />;
  return (
    <DBContext.Provider value={nilai}>
      {nilai.sibuk && <div className="fixed top-0 left-0 right-0 h-1 bg-green-500 animate-pulse z-[300] no-print"></div>}
      {children}
    </DBContext.Provider>
  );
};

const LayarMemuat = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#052e16,#14532d 55%,#065f46)' }}>
    <i className="fas fa-circle-notch fa-spin text-4xl text-emerald-300 mb-4"></i>
    <p className="font-semibold tracking-wide">Memuat data sekolah…</p>
    <p className="text-xs text-emerald-200 mt-1">Kunjungan berikutnya akan jauh lebih cepat</p>
  </div>
);

const LayarGalat = ({ pesan, ulangi }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
    <div className="bg-white border rounded-lg shadow p-8 max-w-lg text-center space-y-4">
      <i className="fas fa-database text-4xl text-red-500"></i>
      <h2 className="font-bold text-lg text-gray-800">Database tidak dapat dimuat</h2>
      <p className="text-sm text-gray-600">{pesan}</p>
      <button onClick={() => ulangi()} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold text-sm">Coba Lagi</button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// 4. UNGGAH BERKAS KE GOOGLE DRIVE (foto dikecilkan dulu di browser)
// ---------------------------------------------------------------------------
const bacaBase64 = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(',')[1]);
  r.onerror = () => reject(new Error('Gagal membaca berkas.'));
  r.readAsDataURL(blob);
});

const kecilkanGambar = (file, sisiMaks = 900) => new Promise((resolve, reject) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const skala = Math.min(1, sisiMaks / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * skala); c.height = Math.round(img.height * skala);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal memproses gambar.'))), 'image/jpeg', 0.85);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Berkas bukan gambar yang valid.')); };
  img.src = url;
});

const unggahBerkas = async (file, jenis) => {
  let blob = file, mime = file.type;
  if (mime.startsWith('image/')) { blob = await kecilkanGambar(file); mime = 'image/jpeg'; }
  const base64 = await bacaBase64(blob);
  const res = await apiPanggil('upload', { nama: file.name, mime, base64, jenis });
  return res.data; // { id, url, nama }
};

// ---------------------------------------------------------------------------
// 5. FUNGSI BANTU
// ---------------------------------------------------------------------------
const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka || 0);

const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
// '2026-10-02' → '2 Oktober 2026' (teks lain dikembalikan apa adanya)
const tanggalPanjang = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${parseInt(m[3], 10)} ${BULAN_ID[parseInt(m[2], 10) - 1]} ${m[1]}` : (iso || '');
};
const hariIniISO = () => new Date().toISOString().slice(0, 10);
const tanggalHariIni = () => tanggalPanjang(hariIniISO());

const handlePrint = () => window.print();

const handleWA = (pesan) => window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`, '_blank');

// Tingkat kelas dari nama rombel: '6A - Abu Bakar' → 6, 'VI (Enam)' → 6
const tingkatDariKelas = (kelas) => {
  const k = String(kelas || '').trim();
  const angka = /^(\d+)/.exec(k);
  if (angka) return parseInt(angka[1], 10);
  const rom = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 }[(/^([IVX]+)\b/.exec(k.toUpperCase()) || [])[1]];
  return rom || 0;
};

const PERIODE_NILAI = ['PTS 1 (Triwulan 1)', 'Rapor Semester 1 (Triwulan 2)', 'PTS 2 (Triwulan 3)', 'Rapor Semester 2 (Triwulan 4)'];
const semesterDariPeriode = (periode) => (String(periode).includes('2') ? 'Semester 2' : 'Semester 1');
const CAPAIAN_DEFAULT = 'Mencapai Kompetensi dengan baik.';

// ---------------------------------------------------------------------------
// 6. KOMPONEN UMUM
// ---------------------------------------------------------------------------
const Modal = ({ isOpen, onClose, title, children, size = 'max-w-md' }) => {
  useEffect(() => {
    if (!isOpen) return;
    const tutup = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', tutup);
    return () => window.removeEventListener('keydown', tutup);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className={`bg-white p-6 rounded-lg shadow-xl w-full ${size} max-h-[95vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4 border-b pb-2 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-xl" aria-label="Tutup"><i className="fas fa-times"></i></button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Tombol simpan yang menonaktifkan diri selama proses (mencegah klik ganda)
const useAksi = () => {
  const [proses, setProses] = useState(false);
  const jalankan = async (fn) => {
    if (proses) return;
    setProses(true);
    try { await fn(); } catch (e) { showAlert('Gagal: ' + e.message, 'error'); } finally { setProses(false); }
  };
  return [proses, jalankan];
};

const KosongInfo = ({ teks }) => <div className="p-8 text-center text-sm text-gray-500">{teks}</div>;

// Nama penanda tangan (kepsek / wali kelas / guru) pada dokumen cetak: tetap SATU baris dan ukuran hurufnya menyesuaikan panjang nama
// agar tidak terpotong atau turun ke baris bawah. Nama pendek tidak berubah. `maks` = lebar maksimum yang tersedia (mm/pt/px).
// Bila nama sangat panjang dan sudah dikecilkan sampai batas terbaca, barulah dibagi dua baris secara seimbang.
const NamaTtd = ({ nama, maks = '60mm', min = 0.72 }) => {
  const ref = useRef(null);
  const teks = String(nama || '');
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const sesuaikan = () => {
      el.style.fontSize = ''; el.style.whiteSpace = 'nowrap';
      const probe = document.createElement('div');
      probe.style.cssText = `position:absolute;visibility:hidden;height:0;overflow:hidden;width:${maks}`;
      document.body.appendChild(probe);
      const batas = probe.offsetWidth;
      probe.remove();
      const lebar = el.offsetWidth;
      if (batas > 0 && lebar > batas) {
        const asli = parseFloat(getComputedStyle(el).fontSize) || 12;
        el.style.fontSize = `${asli * Math.max(min, (batas / lebar) * 0.98)}px`;
        if (el.offsetWidth > batas) { el.style.whiteSpace = 'normal'; el.style.textWrap = 'balance'; }
      }
    };
    sesuaikan();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sesuaikan);
    return undefined;
  }, [teks, maks]);
  return <span ref={ref} style={{ whiteSpace: 'nowrap' }}>{teks}</span>;
};
