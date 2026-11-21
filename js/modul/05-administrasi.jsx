// ===== Modul Administrasi: Dashboard, Informasi, Absensi, Surat, Keuangan =====

const Dashboard = () => {
  const DB = useDB();
  const sekolah = useSekolah();
  const st = DB.statistik;
  const pengumuman = [...DB.rows('Pengumuman')].sort((a, b) => String(b.tgl).localeCompare(String(a.tgl))).slice(0, 4);

  const dataSiswa = st.perRombel.map((r) => ({ rombel: r.kelas, jumlah: r.jumlah }));
  const dataAbsensi = st.perRombel.map((r) => ({ rombel: r.kelas, hadir: r.hadir }));
  const tinggi = (nilai, maks) => Math.max(nilai > 0 ? 6 : 0, Math.round((nilai / Math.max(1, maks)) * 150));
  const singkat = (k) => String(k).split(' ')[0];

  const Kartu = ({ label, nilai, warna, ikon }) => (
    <div className={`bg-white p-4 rounded-lg border shadow-sm border-l-4 ${warna} flex items-center justify-between`}>
      <div><p className="text-sm text-gray-500">{label}</p><h3 className="text-2xl font-bold">{nilai}</h3></div>
      <i className={`fas ${ikon} text-2xl text-gray-300`}></i>
    </div>
  );

  const Grafik = ({ judul, ikon, warna, data, kunci }) => {
    const maks = Math.max(1, ...data.map((d) => d[kunci]));
    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="font-bold text-gray-700 mb-4 border-b pb-2"><i className={`fas ${ikon} text-${warna}-600`}></i> {judul}</h3>
        {data.length === 0 ? <KosongInfo teks="Belum ada rombel. Tambahkan di Pengaturan Sistem → Rombel." /> : (
          <div className="flex items-end justify-around h-48 border-b-2 border-gray-200 pb-2 gap-2">
            {data.map((d, i) => (
              <div key={i} className="flex flex-col items-center justify-end h-full flex-1 group">
                <span className="text-[11px] font-bold mb-1 text-gray-600">{d[kunci]}</span>
                <div className={`bg-${warna}-500 w-full max-w-[48px] rounded-t transition-all duration-500 hover:bg-${warna}-700`} style={{ height: tinggi(d[kunci], maks) }}></div>
                <span className="text-xs font-semibold mt-2" title={d.rombel}>{singkat(d.rombel)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Kartu label="Total Siswa Aktif" nilai={st.totalSiswa} warna="border-l-blue-500" ikon="fa-user-graduate" />
        <Kartu label="Guru & Tenaga Pendidik" nilai={st.totalGuru} warna="border-l-green-500" ikon="fa-chalkboard-teacher" />
        <Kartu label="Total Rombel" nilai={st.totalRombel} warna="border-l-yellow-500" ikon="fa-door-open" />
        <Kartu label="Siswa Hadir Hari Ini" nilai={`${st.hadirHariIni} / ${st.totalSiswa}`} warna="border-l-purple-500" ikon="fa-clipboard-check" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Grafik judul="Jumlah Siswa per Rombel" ikon="fa-chart-bar" warna="blue" data={dataSiswa} kunci="jumlah" />
        <Grafik judul="Siswa Hadir Hari Ini per Rombel" ikon="fa-chart-line" warna="green" data={dataAbsensi} kunci="hadir" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="font-bold text-gray-700 mb-3 border-b pb-2"><i className="fas fa-bullhorn text-yellow-600"></i> Pengumuman Terbaru</h3>
          {pengumuman.length === 0 ? <KosongInfo teks="Belum ada pengumuman." /> : pengumuman.map((p) => (
            <div key={p.id} className="py-2 border-b last:border-b-0 text-sm"><p className="font-semibold text-gray-800">{p.judul}</p><p className="text-xs text-gray-500">{tanggalPanjang(p.tgl)}</p></div>
          ))}
        </div>
        {st.tunggakan !== null && (
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="font-bold text-gray-700 mb-3 border-b pb-2"><i className="fas fa-money-check-alt text-red-600"></i> Ringkasan Keuangan</h3>
            <p className="text-sm text-gray-500">Total tunggakan seluruh siswa</p>
            <p className="text-2xl font-extrabold text-red-600">{formatRupiah(st.tunggakan)}</p>
            <p className="text-xs text-gray-400 mt-2">Tahun ajaran {sekolah.tahunAjaran}</p>
          </div>
        )}
      </div>
    </div>
  );
};


const PusatInformasi = () => {
  const sekolah = useSekolah();
  const DB = useDB();
  const bisaKelola = DB.punyaPeran(['admin', 'kepsek']);
  const [proses, jalankan] = useAksi();
  const pengumumanList = [...DB.rows('Pengumuman')].sort((a, b) => String(b.tgl).localeCompare(String(a.tgl)));
  const FORM_KOSONG = () => ({ id: '', judul: '', tgl: hariIniISO(), isi: '' });
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(FORM_KOSONG());
  const [selectedPreview, setSelectedPreview] = useState(pengumumanList[0] || FORM_KOSONG());

  const handleChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    setFormData(updated);
    setSelectedPreview(updated);   // pratinjau langsung
  };

  const simpanPengumuman = (e) => {
    e.preventDefault();
    jalankan(async () => {
      const tersimpan = await DB.simpan('Pengumuman', { ...formData, id: editId || '' });
      showAlert(editId ? 'Pengumuman berhasil diperbarui.' : 'Pengumuman baru berhasil diterbitkan.');
      setSelectedPreview(tersimpan);
      setEditId(null);
      setFormData(FORM_KOSONG());
    });
  };

  const handleEdit = (item) => { setEditId(item.id); setFormData(item); setSelectedPreview(item); };

  const handleDelete = (id) => {
    if (confirm('Yakin ingin menghapus pengumuman ini?'))
      jalankan(async () => { await DB.hapus('Pengumuman', id); setSelectedPreview(FORM_KOSONG()); showAlert('Pengumuman dihapus.'); });
  };

  const handleKirimWA = (item) =>
    handleWA(`*PENGUMUMAN ${sekolah.namaSekolah}*\n\n*${item.judul}*\nTanggal: ${tanggalPanjang(item.tgl)}\n\n${item.isi}`);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SISI KIRI: FORM INPUT & DAFTAR PENGUMUMAN */}
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
          {bisaKelola ? (
          <>
          <h3 className="font-bold text-gray-700 text-base border-b pb-2">
            {editId ? "Ubah Pengumuman" : "Buat Pengumuman Baru"}
          </h3>

          <form onSubmit={simpanPengumuman} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Judul Pengumuman</label>
              <input name="judul" required value={formData.judul} onChange={handleChange} placeholder="Cth: Libur Nasional..." className="w-full border p-2 rounded text-sm mt-1"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Tanggal Terbit</label>
              <input name="tgl" required type="date" value={formData.tgl} onChange={handleChange} className="w-full border p-2 rounded text-sm mt-1"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Isi Pengumuman</label>
              <textarea name="isi" required rows="4" value={formData.isi} onChange={handleChange} placeholder="Tulis isi pengumuman di sini..." className="w-full border p-2 rounded text-sm mt-1"></textarea>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={proses} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white p-2.5 rounded font-bold text-sm shadow-sm">
                {editId ? "Perbarui Pengumuman" : "Terbitkan & Pratinjau"}
              </button>
              {editId && (
                <button type="button" onClick={() => { setEditId(null); setFormData(FORM_KOSONG()); }} className="bg-gray-400 text-white px-4 rounded text-sm">Batal</button>
              )}
            </div>
          </form>
          </>
          ) : <h3 className="font-bold text-gray-700 text-base border-b pb-2">Daftar Pengumuman Sekolah</h3>}

          {/* Daftar Pengumuman Tersimpan */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-bold text-xs uppercase text-gray-500">{bisaKelola ? 'Daftar Pengumuman Tersimpan' : 'Pilih Pengumuman'}</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {pengumumanList.map(item => (
                <div key={item.id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-gray-800">{item.judul}</p>
                    <span className="text-gray-500">{tanggalPanjang(item.tgl)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setSelectedPreview(item)} className="bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200" title="Lihat"><i className="fas fa-eye"></i></button>
                    {bisaKelola && <button onClick={() => handleEdit(item)} className="bg-yellow-50 text-yellow-600 px-2 py-1 rounded border border-yellow-200" title="Ubah"><i className="fas fa-edit"></i></button>}
                    {bisaKelola && <button onClick={() => handleDelete(item.id)} className="bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200" title="Hapus"><i className="fas fa-trash"></i></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SISI KANAN: LIVE PRATINJAU KERTAS A4 & AKSI (CETAK / WA) */}
        <div className="bg-gray-200 p-6 rounded-lg flex flex-col items-center">
          <div className="w-full max-w-[420px] flex justify-between items-center mb-2 no-print">
            <h4 className="font-bold text-gray-700 text-xs"><i className="fas fa-eye text-blue-600"></i> Live Pratinjau Pengumuman</h4>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold shadow-sm"><i className="fas fa-print"></i> {bisaKelola ? 'Cetak A4' : 'Unduh PDF'}</button>
              <button onClick={() => handleKirimWA(selectedPreview)} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold shadow-sm"><i className="fab fa-whatsapp"></i> Kirim WA</button>
            </div>
          </div>

          <div id="printable-a4-area" className="bg-white w-full max-w-[420px] p-8 shadow-xl font-serif text-xs leading-relaxed relative border text-black space-y-4">
            <div className="text-center border-b-2 border-green-800 pb-3">
              <h2 className="font-extrabold text-sm text-green-900 tracking-wide">SDIT ANNIHAYAH RAWAMERTA</h2>
              <p className="text-[9px] text-gray-600">Pusat Informasi Resmi Sekolah</p>
            </div>

            <div className="text-center py-2 space-y-1">
              <span className="bg-green-100 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">PENGUMUMAN RESMI</span>
              <h3 className="font-bold text-sm text-gray-900 mt-1">{selectedPreview.judul || '(Judul Pengumuman)'}</h3>
              <p className="text-[10px] text-gray-500">Tanggal: {tanggalPanjang(selectedPreview.tgl)}</p>
            </div>

            <div className="border-t border-b py-4 my-2 text-justify whitespace-pre-line text-gray-700 text-[11px]">
              {selectedPreview.isi || 'Belum ada isi pengumuman yang ditulis...'}
            </div>

            <div className="mt-8 flex justify-end pt-4">
              <div className="text-center text-[10px]">
                <p>{sekolah.kota}, {tanggalPanjang(selectedPreview.tgl)}</p>
                <p>Kepala SDIT Annihayah,</p>
                <br/><br/><br/>
                <p className="font-bold underline">{sekolah.kepsek}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const STATUS_ABSEN = ['Hadir', 'Sakit', 'Izin', 'Alpha'];

// ---------------------------------------------------------------------------
// Pemindai QR memakai pustaka html5-qrcode (kamera belakang, pilih kamera,
// dan cadangan "scan dari foto" lewat kamera bawaan HP bila izin kamera diblokir)
// ---------------------------------------------------------------------------
const PemindaiQR = ({ onKode, ukuran = 'max-w-sm' }) => {
  const idElemen = useRef('pemindai-' + Math.random().toString(36).slice(2, 8)).current;
  const scannerRef = useRef(null);
  const [kamera, setKamera] = useState([]);
  const [idKamera, setIdKamera] = useState('');
  const [status, setStatus] = useState('mati');            // mati | memulai | menyala | galat
  const [pesan, setPesan] = useState('');
  const kodeRef = useRef(onKode);
  kodeRef.current = onKode;
  const adaPustaka = typeof window.Html5Qrcode !== 'undefined';

  const hentikan = async () => {
    const s = scannerRef.current;
    if (s) { try { if (s.isScanning) await s.stop(); } catch (e) { /* sudah berhenti */ } }
    setStatus('mati');
  };

  const mulai = async (idPilihan) => {
    if (!adaPustaka) { setStatus('galat'); setPesan('Pustaka pemindai belum termuat. Periksa koneksi internet lalu muat ulang halaman.'); return; }
    setStatus('memulai'); setPesan('');
    try {
      if (!scannerRef.current) scannerRef.current = new window.Html5Qrcode(idElemen, { verbose: false });
      const s = scannerRef.current;
      if (s.isScanning) await s.stop();
      const konfigurasi = { fps: 10, qrbox: (w, h) => { const m = Math.floor(Math.min(w, h) * 0.72); return { width: m, height: m }; } };
      const sumber = idPilihan ? { deviceId: { exact: idPilihan } } : { facingMode: 'environment' };
      await s.start(sumber, konfigurasi, (teks) => kodeRef.current(String(teks).trim()), () => {});
      setStatus('menyala');
      try { const daftar = await window.Html5Qrcode.getCameras(); setKamera(daftar); } catch (e) { /* daftar kamera opsional */ }
    } catch (err) {
      setStatus('galat');
      const t = String(err && err.message ? err.message : err);
      setPesan(/permission|denied|NotAllowed/i.test(t)
        ? 'Akses kamera ditolak atau diblokir. Izinkan kamera pada peramban, atau gunakan tombol "Scan dari Foto" di bawah.'
        : 'Kamera tidak dapat dinyalakan: ' + t);
    }
  };

  useEffect(() => { mulai(''); return () => { const s = scannerRef.current; if (s) { try { if (s.isScanning) s.stop().then(() => s.clear()).catch(() => {}); else s.clear(); } catch (e) { /* abaikan */ } } }; }, []);

  const ganti = () => {
    if (kamera.length < 2) return;
    const i = Math.max(0, kamera.findIndex((k) => k.id === idKamera));
    const baru = kamera[(i + 1) % kamera.length].id;
    setIdKamera(baru); mulai(baru);
  };

  const dariFoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!adaPustaka) return showAlert('Pustaka pemindai belum termuat.', 'error');
    try {
      await hentikan();
      if (!scannerRef.current) scannerRef.current = new window.Html5Qrcode(idElemen, { verbose: false });
      const teks = await scannerRef.current.scanFile(file, false);
      kodeRef.current(String(teks).trim());
    } catch (err) { showAlert('QR tidak terbaca pada foto. Dekatkan kamera dan pastikan kode terlihat jelas.', 'error'); }
  };

  return (
    <div className={`w-full ${ukuran} mx-auto space-y-3`}>
      <div className="relative rounded-lg overflow-hidden border-4 border-green-600 bg-black min-h-[220px]">
        <div id={idElemen} className="w-full"></div>
        {status !== 'menyala' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs p-4 text-center gap-2">
            {status === 'memulai' && <><i className="fas fa-circle-notch fa-spin text-2xl"></i><span>Menyalakan kamera…</span></>}
            {status === 'galat' && <><i className="fas fa-video-slash text-2xl"></i><span>{pesan}</span></>}
            {status === 'mati' && <span>Kamera mati</span>}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {status === 'menyala'
          ? <button onClick={hentikan} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-stop mr-1"></i> Matikan Kamera</button>
          : <button onClick={() => mulai(idKamera)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-camera mr-1"></i> Nyalakan Kamera</button>}
        {kamera.length > 1 && <button onClick={ganti} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-sync-alt mr-1"></i> Ganti Kamera</button>}
        <label className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-xs font-bold cursor-pointer">
          <i className="fas fa-image mr-1"></i> Scan dari Foto
          <input type="file" accept="image/*" capture="environment" onChange={dariFoto} className="hidden" />
        </label>
      </div>
    </div>
  );
};

// Logika pencatatan bersama (dipakai halaman Absensi & mode scanner)
const useCatatAbsensi = () => {
  const DB = useDB();
  const terakhirRef = useRef({ kode: '', waktu: 0 });
  const [hasil, setHasil] = useState(null);
  const tampilkan = (ok, pesan) => { setHasil({ ok, pesan }); setTimeout(() => setHasil(null), 4000); };
  const catat = async (nisn, status, metode) => {
    try { const res = await DB.catatAbsensi({ nisn, status, metode }); tampilkan(true, res.message); }
    catch (e) { tampilkan(false, e.message); }
  };
  const dariQR = (kode) => {                       // cegah pemindaian ganda kode yang sama berturut-turut
    const t = terakhirRef.current;
    if (!kode || (kode === t.kode && Date.now() - t.waktu < 6000)) return;
    terakhirRef.current = { kode, waktu: Date.now() };
    catat(kode, 'Hadir', 'QR');
  };
  return { hasil, catat, dariQR };
};

const KotakHasil = ({ hasil }) => hasil ? (
  <div className={`border px-6 py-3 rounded-lg font-bold text-base shadow-lg text-center ${hasil.ok ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}>
    <i className={`fas ${hasil.ok ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>{hasil.pesan}
  </div>
) : null;

// ---------------------------------------------------------------------------
// ABSENSI QR + KEDIP MATA (siswa & guru)
// Semua pemeriksaan (baca QR, deteksi kedip) berjalan di peramban. TIDAK ada foto, video, atau data wajah
// yang disimpan atau dikirim; server hanya menerima isi QR dan penanda "kedip terdeteksi".
// ---------------------------------------------------------------------------
const JSQR_SUMBER = [
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js',
  'https://unpkg.com/jsqr@1.4.0/dist/jsQR.js'
];
const FACE_SUMBER = [
  { js: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js', model: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/' },
  { js: 'https://unpkg.com/@vladmandic/face-api@1.7.12/dist/face-api.js', model: 'https://unpkg.com/@vladmandic/face-api@1.7.12/model/' }
];
const QRGEN_URL = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';

const muatSkripLuar = (url, siap) => new Promise((resolve, reject) => {
  if (siap()) { resolve(); return; }
  const s = document.createElement('script');
  s.src = url; s.async = true;
  s.onload = () => resolve();
  s.onerror = () => { s.remove(); reject(new Error('gagal memuat ' + url)); };
  document.head.appendChild(s);
});

// Pembaca QR (jsQR) dan pemeriksa kedip (face-api) DIMUAT TERPISAH: Sakit/Izin dan QR tetap bisa dipakai
// walau pemeriksa kedip gagal dimuat. Tiap pustaka mencoba beberapa sumber (CDN) sebelum menyerah.
let _pustakaBacaQR = null;
const muatPustakaQR = () => {
  if (!_pustakaBacaQR) {
    _pustakaBacaQR = (async () => {
      for (const url of JSQR_SUMBER) { try { await muatSkripLuar(url, () => window.jsQR); if (window.jsQR) return; } catch (e) { /* coba sumber berikutnya */ } }
      throw new Error('Pembaca QR gagal dimuat. Periksa koneksi internet.');
    })().catch((e) => { _pustakaBacaQR = null; throw e; });
  }
  return _pustakaBacaQR;
};
let _pustakaKedip = null;
const muatPustakaKedip = () => {
  if (_pustakaKedip) return _pustakaKedip;
  _pustakaKedip = (async () => {
    for (const sumber of FACE_SUMBER) {
      try {
        await muatSkripLuar(sumber.js, () => window.faceapi);
        const f = window.faceapi;                                   // hanya pendeteksi wajah + titik mata; TANPA model pengenal wajah
        await f.nets.tinyFaceDetector.loadFromUri(sumber.model);
        await f.nets.faceLandmark68Net.loadFromUri(sumber.model);
        return f;
      } catch (e) { /* coba sumber berikutnya */ }
    }
    throw new Error('Pemeriksa kedip mata gagal dimuat. Periksa koneksi internet.');
  })().catch((e) => { _pustakaKedip = null; throw e; });
  return _pustakaKedip;
};
let _pustakaQR = null;
const muatPembuatQR = () => {
  if (!_pustakaQR) _pustakaQR = muatSkripLuar(QRGEN_URL, () => window.qrcode).catch((e) => { _pustakaQR = null; throw e; });
  return _pustakaQR;
};

const jedaKedip = (ms) => new Promise((r) => setTimeout(r, ms));
const earSatuMata = (p) => { const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y); return (d(p[1], p[5]) + d(p[2], p[4])) / (2 * d(p[0], p[3])); };
const earRerata = (lm) => (earSatuMata(lm.getLeftEye()) + earSatuMata(lm.getRightEye())) / 2;     // kecil = mata menutup

// ---- Kamera: membuka dengan beberapa percobaan + pesan galat yang jelas ----
const bukaStreamKamera = async (arah, idPerangkat) => {
  const dasar = { width: { ideal: 1280 }, height: { ideal: 720 } };            // resolusi lebih tinggi agar QR kartu terbaca
  const percobaan = [];
  if (idPerangkat) percobaan.push({ ...dasar, deviceId: { exact: idPerangkat } });
  percobaan.push({ ...dasar, facingMode: { ideal: arah } });
  percobaan.push({ facingMode: { ideal: arah } });
  percobaan.push(true);                                                          // kamera apa pun yang ada
  let galat = null;
  for (const video of percobaan) {
    try { return await navigator.mediaDevices.getUserMedia({ video, audio: false }); }
    catch (e) { galat = e; if (/NotAllowed|Security|PermissionDenied/i.test(String(e && e.name))) break; }
  }
  throw galat;
};

const petunjukLingkungan = () => {
  const ua = navigator.userAgent || '';
  if (/FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok|Snapchat|; wv\)/i.test(ua)) return ' Aplikasi ini terbuka di peramban bawaan aplikasi lain; buka di Chrome atau Safari.';
  try { const pp = document.permissionsPolicy || document.featurePolicy; if (pp && pp.allowsFeature && !pp.allowsFeature('camera')) return ' Halaman ini tertanam di situs lain yang memblokir kamera; buka di tab baru.'; } catch (e) { /* abaikan */ }
  return '';
};
const pesanGalatKamera = (e) => {
  const n = String((e && e.name) || '');
  if (/NotAllowed|PermissionDenied|Security/i.test(n)) return { kode: 'ditolak', pesan: 'Izin kamera ditolak atau diblokir. Izinkan Kamera lewat ikon kunci di bilah alamat, lalu tekan Coba Lagi.' + petunjukLingkungan() };
  if (/NotFound|DevicesNotFound/i.test(n)) return { kode: 'tidak-ada', pesan: 'Perangkat ini tidak memiliki kamera yang dapat dipakai.' };
  if (/NotReadable|TrackStart|Abort/i.test(n)) return { kode: 'dipakai', pesan: 'Kamera sedang dipakai aplikasi atau tab lain. Tutup yang lain, lalu tekan Coba Lagi.' };
  return { kode: 'lain', pesan: 'Kamera tidak dapat dinyalakan (' + (n || 'galat tak dikenal') + ').' + petunjukLingkungan() };
};

// ---- Pembaca QR: BarcodeDetector bawaan peramban bila ada (cepat & akurat), jsQR sebagai cadangan ----
let _detektorQR;
const detektorQR = () => {
  if (_detektorQR === undefined) { try { _detektorQR = typeof window.BarcodeDetector === 'function' ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null; } catch (e) { _detektorQR = null; } }
  return _detektorQR;
};
const bacaQRDariSumber = async (sumber, lebarSumber, tinggiSumber, kanvas, g, maks, cobaDua) => {
  const d = detektorQR();
  if (d) { try { const hasil = await d.detect(sumber); if (hasil && hasil.length && hasil[0].rawValue) return hasil[0].rawValue; } catch (e) { /* lanjut ke jsQR */ } }
  if (!window.jsQR) return null;
  const s = Math.min(1, maks / lebarSumber);
  kanvas.width = Math.max(1, Math.round(lebarSumber * s)); kanvas.height = Math.max(1, Math.round(tinggiSumber * s));
  g.drawImage(sumber, 0, 0, kanvas.width, kanvas.height);
  const px = g.getImageData(0, 0, kanvas.width, kanvas.height);
  const q = window.jsQR(px.data, px.width, px.height, { inversionAttempts: cobaDua ? 'attemptBoth' : 'dontInvert' });
  return q ? q.data : null;
};
const POLA_QR_ABSEN = /^SIM\|[SG]\|/;

const bunyiAbsen = (ok) => {
  try {
    if (navigator.vibrate) navigator.vibrate(ok ? 120 : [80, 60, 80]);
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    bunyiAbsen.ctx = bunyiAbsen.ctx || new AC();
    const a = bunyiAbsen.ctx, o = a.createOscillator(), gn = a.createGain();
    o.frequency.value = ok ? 880 : 220; gn.gain.value = 0.08;
    o.connect(gn); gn.connect(a.destination); o.start(); o.stop(a.currentTime + (ok ? 0.12 : 0.25));
  } catch (e) { /* bunyi hanya pelengkap */ }
};

const PilIndikator = ({ ok, teks }) => <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${ok ? 'bg-green-500 text-white' : 'bg-black/60 text-white'}`}>{ok ? '✓' : '…'} {teks}</span>;

const ScannerAbsenKedip = ({ onSukses, ukuran = 'max-w-md', jenisAwal = 'masuk' }) => {
  const DB = useDB();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const pengelola = DB.punyaPeran(['admin', 'kepsek']);
  const kedipWajib = String(DB.pengaturan.kedipWajib) !== '0';
  const [kategori, setKategori] = useState('Hadir');           // Hadir | Sakit | Izin
  const [jenisGuru, setJenisGuru] = useState(jenisAwal);        // masuk | pulang (berlaku untuk QR guru)
  const [kamera, setKamera] = useState({ status: 'mati', pesan: '', kode: '', depan: true });
  const [perangkat, setPerangkat] = useState([]);
  const [libQR, setLibQR] = useState({ status: 'memuat', pesan: '' });
  const [libKedip, setLibKedip] = useState({ status: 'tunda', pesan: '' });   // tunda | memuat | siap | galat
  const [ind, setInd] = useState({ qr: false, kedip: false, wajah: false });
  const [hasil, setHasil] = useState(null);
  const [kodeSurat, setKodeSurat] = useState('');
  const [terakhir, setTerakhir] = useState([]);
  const [kirim, setKirim] = useState(false);
  const perluKedip = kategori === 'Hadir' && kedipWajib;
  const refs = useRef({ kategori: 'Hadir', jenis: 'masuk', perluKedip: true, kedipSiap: false, qr: null, kedip: 0, cool: {}, kirim: false, kodeSurat: '', proses: null, urutan: 0, arah: 'user', idPerangkat: '' }).current;
  refs.kategori = kategori; refs.jenis = jenisGuru; refs.kodeSurat = kodeSurat; refs.perluKedip = perluKedip; refs.kedipSiap = libKedip.status === 'siap';
  useEffect(() => { setJenisGuru(jenisAwal); }, [jenisAwal]);

  const muatQR = () => { setLibQR({ status: 'memuat', pesan: '' }); muatPustakaQR().then(() => setLibQR({ status: 'siap', pesan: '' })).catch((e) => setLibQR({ status: 'galat', pesan: e.message })); };
  const muatKedip = () => { setLibKedip({ status: 'memuat', pesan: '' }); muatPustakaKedip().then(() => setLibKedip({ status: 'siap', pesan: '' })).catch((e) => setLibKedip({ status: 'galat', pesan: e.message })); };
  useEffect(() => { muatQR(); }, []);
  useEffect(() => { if (perluKedip && libKedip.status === 'tunda') muatKedip(); }, [perluKedip]);       // pemeriksa kedip hanya dimuat bila dibutuhkan

  const hentikanKamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => { t.onended = null; t.stop(); }); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  };
  const mulaiKamera = async (arah, idPerangkat) => {
    hentikanKamera();
    refs.arah = arah; refs.idPerangkat = idPerangkat || '';
    const urutan = ++refs.urutan;                                   // hasil percobaan lama diabaikan bila ada percobaan baru / komponen ditutup
    setKamera({ status: 'memulai', pesan: '', kode: '', depan: arah === 'user' });
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setKamera({ status: 'galat', kode: 'tidak-ada', pesan: 'Peramban ini tidak mendukung kamera. Gunakan Chrome atau Safari versi terbaru.' + petunjukLingkungan(), depan: arah === 'user' });
      return;
    }
    try {
      const s = await bukaStreamKamera(arah, idPerangkat);
      if (urutan !== refs.urutan) { s.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = s;
      const trek = s.getVideoTracks()[0];
      const st = (trek && trek.getSettings && trek.getSettings()) || {};
      const depan = st.facingMode ? st.facingMode === 'user' : arah === 'user';
      if (trek) trek.onended = () => { if (streamRef.current === s) setKamera({ status: 'galat', kode: 'putus', pesan: 'Kamera terputus. Tekan Coba Lagi.', depan }); };
      if (st.deviceId) refs.idPerangkat = st.deviceId;
      const v = videoRef.current;
      if (v) { v.srcObject = s; try { await v.play(); } catch (e) { /* diputar otomatis */ } }
      setKamera({ status: 'siap', pesan: '', kode: '', depan });
      try { const d = await navigator.mediaDevices.enumerateDevices(); setPerangkat(d.filter((x) => x.kind === 'videoinput')); } catch (e) { /* daftar kamera opsional */ }
    } catch (e) {
      if (urutan !== refs.urutan) return;
      const g = pesanGalatKamera(e);
      setKamera({ status: 'galat', kode: g.kode, pesan: g.pesan, depan: arah === 'user' });
    }
  };
  useEffect(() => { mulaiKamera('user', ''); return () => { refs.urutan++; hentikanKamera(); }; }, []);

  // Pulihkan kamera bila tab sempat disembunyikan/layar dikunci; layar dijaga tetap menyala selama pemindai terbuka
  useEffect(() => {
    let kunci = null;
    const mintaKunciLayar = async () => { try { if (navigator.wakeLock && document.visibilityState === 'visible') kunci = await navigator.wakeLock.request('screen'); } catch (e) { /* tidak didukung/diizinkan */ } };
    const saatTampil = () => {
      if (document.visibilityState !== 'visible') return;
      mintaKunciLayar();
      const t = streamRef.current && streamRef.current.getVideoTracks()[0];
      if (!t || t.readyState !== 'live') mulaiKamera(refs.arah, refs.idPerangkat);
      else if (videoRef.current && videoRef.current.paused) videoRef.current.play().catch(() => {});
    };
    mintaKunciLayar();
    document.addEventListener('visibilitychange', saatTampil);
    return () => { document.removeEventListener('visibilitychange', saatTampil); try { if (kunci) kunci.release(); } catch (e) { /* abaikan */ } };
  }, []);

  useEffect(() => { if (!hasil) return undefined; const t = setTimeout(() => setHasil(null), 5000); return () => clearTimeout(t); }, [hasil]);

  const proses = async (payload) => {
    refs.kirim = true; setKirim(true);
    try {
      const res = await DB.catatQR(payload);
      const d = res.data || {};
      setHasil({ ok: true, pesan: res.message }); bunyiAbsen(true);
      setTerakhir((x) => [{ id: Date.now(), nama: d.nama, ident: d.ident, kategori: d.kategori, jam: d.jam }, ...x].slice(0, 6));
      if (onSukses) onSukses(d);
      return true;
    } catch (e) { setHasil({ ok: false, pesan: e.message }); bunyiAbsen(false); return false; }
    finally { refs.kirim = false; setKirim(false); }
  };
  refs.proses = proses;

  // Putaran pemindaian: QR dibaca terus-menerus; kedip (deteksi wajah di perangkat) hanya bila Hadir + kedip diwajibkan
  useEffect(() => {
    if (kamera.status !== 'siap' || libQR.status !== 'siap') return undefined;
    let hidup = true;
    const kanvas = document.createElement('canvas');
    const g = kanvas.getContext('2d', { willReadFrequently: true });
    let i = 0, tertutup = false, buka = 0, dasar = 0, terakhirInd = '', opsi = null;
    (async () => {
      while (hidup) {
        const v = videoRef.current;
        if (!v || !v.videoWidth || v.readyState < 2) { await jedaKedip(150); continue; }
        i++;
        let wajah = false;
        const pakaiKedip = refs.perluKedip && refs.kedipSiap && !!window.faceapi;
        try {
          if (!pakaiKedip || i % 3 === 1) {
            const teks = await bacaQRDariSumber(v, v.videoWidth, v.videoHeight, kanvas, g, 960, false);
            if (teks && POLA_QR_ABSEN.test(teks)) refs.qr = { kode: teks, t: Date.now() };
          }
          if (pakaiKedip) {
            const f = window.faceapi;
            if (!opsi) opsi = new f.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
            const semua = await f.detectAllFaces(v, opsi).withFaceLandmarks();      // hanya dihitung di memori, tidak disimpan/dikirim
            if (semua.length === 1) {
              wajah = true;
              const ear = earRerata(semua[0].landmarks);
              dasar = Math.max(ear, dasar * 0.995);                                  // dasar = bukaan mata normal (menyesuaikan tiap orang)
              if (ear < dasar * 0.72) { if (buka >= 2) tertutup = true; }
              else if (ear > dasar * 0.85) { if (tertutup) { tertutup = false; refs.kedip = Date.now(); } buka++; }
            } else { tertutup = false; buka = 0; }
          } else await jedaKedip(refs.kategori === 'Hadir' ? 110 : 150);
        } catch (e) { await jedaKedip(200); }

        const now = Date.now();
        const qr = refs.qr && now - refs.qr.t < 5000 ? refs.qr : null;
        const kedipOk = now - refs.kedip < 5000;
        const tanda = `${!!qr}|${kedipOk}|${wajah}`;
        if (tanda !== terakhirInd) { terakhirInd = tanda; setInd({ qr: !!qr, kedip: kedipOk, wajah }); }

        if (qr && !refs.kirim && !(refs.cool[qr.kode] > now)) {
          if (refs.kategori === 'Hadir') {
            if (!refs.perluKedip || kedipOk) {
              refs.cool[qr.kode] = now + 12000; refs.qr = null; refs.kedip = 0;
              const ok = await refs.proses({ kode: qr.kode, kategori: 'Hadir', kedip: refs.perluKedip, jenis: refs.jenis });
              if (!ok) refs.cool[qr.kode] = Date.now() + 4000;
            }
          } else if (!refs.kodeSurat) { refs.kodeSurat = qr.kode; refs.qr = null; setKodeSurat(qr.kode); }
        }
        await jedaKedip(40);
      }
    })();
    return () => { hidup = false; };
  }, [kamera.status, libQR.status]);

  // Cadangan bila kamera langsung tidak dapat dipakai: foto kartu QR dengan kamera bawaan HP (tanpa pemeriksaan kedip)
  const bacaFotoQR = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setKirim(true);
    try {
      await muatPustakaQR();
      const url = URL.createObjectURL(file);
      const img = await new Promise((resolve, reject) => { const im = new Image(); im.onload = () => resolve(im); im.onerror = () => reject(new Error('Berkas bukan gambar yang valid.')); im.src = url; });
      URL.revokeObjectURL(url);
      const kanvas = document.createElement('canvas');
      const teks = await bacaQRDariSumber(img, img.naturalWidth, img.naturalHeight, kanvas, kanvas.getContext('2d', { willReadFrequently: true }), 1600, true);
      if (!teks || !POLA_QR_ABSEN.test(teks)) throw new Error('QR kartu tidak terbaca pada foto. Dekatkan kartu dan pastikan seluruh QR terlihat jelas.');
      if (kategori === 'Hadir') {
        if (refs.perluKedip) throw new Error('Kedip mata wajib untuk Hadir. Gunakan kamera langsung.');
        await proses({ kode: teks, kategori: 'Hadir', kedip: false, jenis: jenisGuru });
      } else { refs.kodeSurat = teks; setKodeSurat(teks); }
    } catch (err) { setHasil({ ok: false, pesan: err.message }); }
    setKirim(false);
  };

  const pilihSurat = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || !kodeSurat) return;
    setKirim(true);
    try {
      let blob = file, mime = file.type;
      if (mime.startsWith('image/')) { blob = await kecilkanGambar(file, 1100); mime = 'image/jpeg'; }
      else if (mime !== 'application/pdf') throw new Error('Gunakan foto atau berkas PDF.');
      if (blob.size > 4.5 * 1024 * 1024) throw new Error('Ukuran surat maksimal 4,5 MB.');
      const base64 = await bacaBase64(blob);
      const ok = await proses({ kode: kodeSurat, kategori, jenis: jenisGuru, mime, base64 });
      if (ok) { setKodeSurat(''); refs.kodeSurat = ''; }
    } catch (err) { setHasil({ ok: false, pesan: err.message }); }
    setKirim(false);
  };
  const batalSurat = () => { setKodeSurat(''); refs.kodeSurat = ''; refs.qr = null; };
  const gantiKategori = (k) => { setKategori(k); batalSurat(); refs.kedip = 0; };

  const gantiKamera = () => {
    if (perangkat.length > 1) {
      const i = perangkat.findIndex((d) => d.deviceId === refs.idPerangkat);
      mulaiKamera(refs.arah, perangkat[(i + 1) % perangkat.length].deviceId);
    } else mulaiKamera(refs.arah === 'user' ? 'environment' : 'user', '');
  };
  const cobaLagi = () => {
    if (kamera.status !== 'siap') mulaiKamera(refs.arah, refs.idPerangkat);
    if (libQR.status === 'galat') muatQR();
    if (libKedip.status === 'galat') muatKedip();
  };
  const bukaTabBaru = async () => {
    try {
      let url = '';
      if (window.SIM_CONFIG && window.SIM_CONFIG.API_URL) url = location.href.split('#')[0].split('?')[0];     // situs statis: alamat halaman ini sendiri
      else { const res = await apiPanggil('urlAplikasi'); url = res.data && res.data.url; }
      if (!url) throw new Error('Alamat aplikasi tidak tersedia. Buka alamat web app langsung di Chrome.');
      const w = window.open(url + (url.indexOf('?') < 0 ? '?mode=scanner' : '&mode=scanner'), '_blank');
      if (!w) showAlert('Salin alamat ini ke Chrome: ' + url + '?mode=scanner', 'info');
    } catch (err) { showAlert(err.message, 'error'); }
  };
  const gantiKedipWajib = async () => {
    if (kedipWajib && !confirm('Nonaktifkan kewajiban kedip mata? Hadir akan tercatat hanya dengan QR kartu. Lakukan ini hanya bila pemeriksa kedip tidak dapat dimuat.')) return;
    try { await DB.simpanPengaturan({ kedipWajib: kedipWajib ? '0' : '1' }); showAlert(kedipWajib ? 'Kedip mata tidak lagi diwajibkan.' : 'Kedip mata kembali diwajibkan.'); }
    catch (err) { showAlert('Gagal: ' + err.message, 'error'); }
  };

  const warnaKat = { Hadir: 'bg-green-600', Sakit: 'bg-yellow-500', Izin: 'bg-blue-600' };
  const kameraGalat = kamera.status === 'galat';
  const perluTabBaru = kameraGalat && ['ditolak', 'tidak-ada', 'lain'].includes(kamera.kode);
  const fotoQRBerguna = !(kategori === 'Hadir' && perluKedip);

  return (
    <div className={`w-full ${ukuran} mx-auto space-y-3 text-gray-800`}>
      <div className="flex gap-1.5 justify-center">
        {['Hadir', 'Sakit', 'Izin'].map((k) => (
          <button key={k} onClick={() => gantiKategori(k)} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 ${kategori === k ? `${warnaKat[k]} text-white border-transparent` : 'bg-white text-gray-600 border-gray-300'}`}>{k}{k === 'Hadir' ? (kedipWajib ? ' (QR + kedip)' : ' (QR)') : ' (QR + surat)'}</button>
        ))}
      </div>
      {kategori === 'Hadir' && (
        <div className="flex items-center justify-center gap-2 text-xs">
          <span className="text-gray-600 font-semibold">Untuk guru:</span>
          {['masuk', 'pulang'].map((j) => <button key={j} onClick={() => setJenisGuru(j)} className={`px-3 py-1 rounded-full font-bold border ${jenisGuru === j ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300'}`}>{j === 'masuk' ? 'Masuk' : 'Pulang'}</button>)}
        </div>
      )}

      <div className="relative rounded-lg overflow-hidden bg-black border-4 border-green-600 min-h-[220px]">
        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-auto ${kamera.depan ? 'scale-x-[-1]' : ''}`}></video>
        {kamera.status === 'siap' && libQR.status === 'siap' && (
          <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1.5">
            <PilIndikator ok={ind.qr} teks="QR" />
            {perluKedip && <PilIndikator ok={ind.kedip} teks={libKedip.status === 'siap' ? (ind.wajah ? 'Kedip mata' : 'Kedip (wajah belum terlihat)') : libKedip.status === 'galat' ? 'Kedip tidak tersedia' : 'Kedip (memuat…)'} />}
          </div>
        )}
        {(kamera.status !== 'siap' || libQR.status !== 'siap') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-xs p-4 text-center gap-2 bg-black/60">
            {(kamera.status === 'memulai' || (kamera.status === 'siap' && libQR.status === 'memuat')) && <><i className="fas fa-circle-notch fa-spin text-2xl"></i><span>{libQR.status === 'memuat' && kamera.status === 'siap' ? 'Memuat pembaca QR…' : 'Menyalakan kamera…'}</span></>}
            {kameraGalat && <><i className="fas fa-video-slash text-2xl"></i><span>{kamera.pesan}</span></>}
            {!kameraGalat && libQR.status === 'galat' && <><i className="fas fa-wifi text-2xl"></i><span>{libQR.pesan}</span></>}
          </div>
        )}
        {kirim && <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-sm font-semibold text-center py-2"><i className="fas fa-circle-notch fa-spin mr-2"></i>Memproses…</div>}
      </div>

      {perluKedip && libKedip.status === 'galat' && (
        <div className="border border-orange-300 bg-orange-50 rounded-lg p-2.5 text-[11px] text-orange-800 text-center">
          <i className="fas fa-exclamation-triangle mr-1"></i>{libKedip.pesan} Sakit/Izin tetap dapat dipakai.{pengelola ? ' Admin dapat menonaktifkan kewajiban kedip sementara di bawah.' : ' Hubungi admin bila masalah berlanjut.'}
        </div>
      )}

      <p className="text-[11px] text-center text-gray-500">
        {kategori === 'Hadir' ? (kedipWajib ? 'Tunjukkan kartu QR ke kamera, lalu kedipkan mata. Hadir tercatat bila QR dan kedip terdeteksi.' : 'Tunjukkan kartu QR ke kamera. Hadir tercatat saat QR terbaca.') : `Tunjukkan kartu QR ke kamera, lalu lampirkan surat ${kategori.toLowerCase()}.`}
      </p>

      {kodeSurat && (
        <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3 space-y-2">
          <p className="text-sm font-semibold">QR {kodeSurat.split('|')[1] === 'G' ? 'guru' : 'siswa'} terbaca. Lampirkan surat {kategori.toLowerCase()} (foto atau PDF):</p>
          <div className="flex flex-wrap gap-2">
            <label className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-bold cursor-pointer"><i className="fas fa-camera mr-1"></i> Foto Surat
              <input type="file" accept="image/*" capture="environment" onChange={pilihSurat} disabled={kirim} className="hidden" /></label>
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-bold cursor-pointer"><i className="fas fa-file-upload mr-1"></i> Pilih Berkas
              <input type="file" accept="image/*,application/pdf" onChange={pilihSurat} disabled={kirim} className="hidden" /></label>
            <button onClick={batalSurat} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-xs font-bold">Batal</button>
          </div>
        </div>
      )}

      {hasil && <div className={`border px-4 py-3 rounded-lg font-bold text-sm text-center ${hasil.ok ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}><i className={`fas ${hasil.ok ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>{hasil.pesan}</div>}

      <div className="flex flex-wrap gap-2 justify-center">
        <button onClick={gantiKamera} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-sync-alt mr-1"></i> Ganti Kamera</button>
        {(kameraGalat || libQR.status === 'galat' || libKedip.status === 'galat') && <button onClick={cobaLagi} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-redo mr-1"></i> Coba Lagi</button>}
        {perluTabBaru && <button onClick={bukaTabBaru} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-external-link-alt mr-1"></i> Buka di Tab Baru</button>}
        {fotoQRBerguna && (
          <label className={`bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-xs font-bold cursor-pointer ${kirim ? 'opacity-60 pointer-events-none' : ''}`}><i className="fas fa-image mr-1"></i> QR dari Foto
            <input type="file" accept="image/*" capture="environment" onChange={bacaFotoQR} disabled={kirim} className="hidden" /></label>
        )}
      </div>

      {pengelola && (
        <label className="flex items-start justify-center gap-2 text-[11px] text-gray-600 cursor-pointer">
          <input type="checkbox" checked={kedipWajib} onChange={gantiKedipWajib} className="mt-0.5" />
          <span>Wajibkan kedip mata untuk Hadir <span className="text-gray-400">(matikan hanya bila pemeriksa kedip tidak dapat dimuat)</span></span>
        </label>
      )}

      {terakhir.length > 0 && (
        <div className="border rounded-lg bg-white text-gray-800 overflow-hidden">
          <p className="text-[11px] font-bold px-3 py-2 border-b bg-gray-50">Tercatat di perangkat ini</p>
          {terakhir.map((t) => <div key={t.id} className="flex justify-between gap-2 text-xs px-3 py-1.5 border-b last:border-0"><span className="truncate">{t.nama} <span className="text-gray-400">{t.ident}</span></span><span className="whitespace-nowrap font-semibold">{t.kategori} {String(t.jam || '').slice(0, 5)}</span></div>)}
        </div>
      )}
      <p className="text-[10px] text-center text-gray-400"><i className="fas fa-user-shield mr-1"></i>Kamera hanya memeriksa ada tidaknya kedipan. Tidak ada foto, video, maupun data wajah yang disimpan atau dikirim. Yang tercatat: nama, NIS/NISN/NIP/NIY, waktu, dan kategori.</p>
    </div>
  );
};

// Penampil surat sakit/izin (dibaca lewat server; hanya admin/kepsek)
const bacaSuratAbsen = async (tabel, id, judul, setInfo) => {
  setInfo({ judul, memuat: true, url: '' });
  try {
    const res = await apiPanggil('suratAbsen', { tabel, id });
    if (!res.data.ada) { setInfo({ judul, memuat: false, url: '' }); return; }
    setInfo({ judul, memuat: false, mime: res.data.mime, nama: res.data.nama, url: `data:${res.data.mime};base64,${res.data.base64}` });
  } catch (e) { setInfo(null); showAlert('Gagal memuat surat: ' + e.message, 'error'); }
};
const PenampilSurat = ({ info, tutup }) => (
  <Modal isOpen={!!info} onClose={tutup} title={info ? info.judul : ''} size="max-w-2xl">
    {info && (info.memuat ? <KosongInfo teks="Memuat surat…" /> : !info.url ? <KosongInfo teks="Surat tidak tersedia." /> : info.mime === 'application/pdf'
      ? <a href={info.url} download={info.nama || 'surat.pdf'} className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm"><i className="fas fa-download mr-2"></i>Unduh surat (PDF)</a>
      : <img src={info.url} alt="Surat" className="w-full rounded border" />)}
  </Modal>
);

// ---------------------------------------------------------------------------
// KARTU QR — satu QR untuk satu siswa/guru (admin & kepala sekolah)
// ---------------------------------------------------------------------------
const QRGambar = ({ teks }) => {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let batal = false;
    muatPembuatQR().then(() => { if (batal) return; const q = window.qrcode(0, 'M'); q.addData(teks); q.make(); setSvg(q.createSvgTag({ cellSize: 4, margin: 0, scalable: true })); }).catch(() => setSvg(''));
    return () => { batal = true; };
  }, [teks]);
  return <div className="qr-kotak" dangerouslySetInnerHTML={{ __html: svg }} />;
};

const KartuQR = () => {
  const DB = useDB();
  const sekolah = useSekolah();
  const [tab, setTab] = useState('siswa');
  const [data, setData] = useState({ siswa: [], guru: [] });
  const [siap, setSiap] = useState(false);
  const [kelas, setKelas] = useState('');
  const [cari, setCari] = useState('');
  useEffect(() => { apiPanggil('daftarQR').then((res) => { setData(res.data); setSiap(true); }).catch((e) => { showAlert('Gagal memuat QR: ' + e.message, 'error'); setSiap(true); }); }, []);
  const daftarKelas = [...new Set(data.siswa.map((s) => s.kelas).filter(Boolean))].sort();
  const q = cari.trim().toLowerCase();
  const daftar = (tab === 'siswa' ? data.siswa.filter((s) => (!kelas || s.kelas === kelas)) : data.guru).filter((x) => !q || String(x.nama).toLowerCase().includes(q));

  return (
    <div className="space-y-4">
      <style>{`
        .qr-kotak { width: 100%; height: 100%; } .qr-kotak svg { width: 100%; height: 100%; display: block; }
        .kartu-qr { width: 92mm; height: 54mm; border: 1px solid #166534; border-radius: 3mm; padding: 2.5mm; box-sizing: border-box; display: flex; gap: 2.5mm; background: #fff; color: #000; break-inside: avoid; page-break-inside: avoid; overflow: hidden; }
        @media print { @page { size: A4 portrait; margin: 8mm; } }
      `}</style>
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3 items-center justify-between no-print">
        <div className="flex gap-1">
          {[['siswa', 'Siswa'], ['guru', 'Guru']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded font-bold text-sm ${tab === k ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{l} ({data[k].length})</button>)}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {tab === 'siswa' && <select value={kelas} onChange={(e) => setKelas(e.target.value)} className="border p-2 rounded text-sm bg-white"><option value="">Semua kelas</option>{daftarKelas.map((k) => <option key={k}>{k}</option>)}</select>}
          <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama…" className="border p-2 rounded text-sm" />
          <button onClick={() => window.print()} disabled={!daftar.length} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded font-bold text-sm"><i className="fas fa-print mr-1"></i> Cetak {daftar.length} Kartu</button>
        </div>
      </div>
      <p className="text-xs text-gray-500 no-print">Satu QR untuk satu orang. Kartu lama (isi hanya NISN) tidak berlaku lagi; cetak ulang kartu di sini dan bagikan. QR ditandatangani server sehingga tidak dapat dipalsukan.</p>
      {!siap ? <KosongInfo teks="Memuat…" /> : daftar.length === 0 ? <KosongInfo teks="Tidak ada data." /> : (
        <div className="bg-gray-300 p-3 rounded-lg overflow-x-auto">
          <div id="printable-a4-area" className="bg-white mx-auto" style={{ width: '194mm', padding: '0', display: 'grid', gridTemplateColumns: 'repeat(2, 92mm)', gap: '3mm', justifyContent: 'center' }}>
            {daftar.map((x) => (
              <div key={tab + (x.nisn || x.id)} className="kartu-qr">
                <div style={{ width: '36mm', height: '36mm', alignSelf: 'center', flex: 'none' }}><QRGambar teks={x.kode} /></div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5mm', borderBottom: '0.6mm solid #166534', paddingBottom: '1mm' }}>
                    {sekolah.logoUrl && <img src={sekolah.logoUrl} alt="" style={{ width: '8mm', height: '8mm', objectFit: 'contain' }} />}
                    <div style={{ lineHeight: 1.1 }}><div style={{ fontSize: '7pt', fontWeight: 'bold', color: '#166534' }}>{sekolah.namaSekolah}</div><div style={{ fontSize: '6pt' }}>KARTU ABSENSI {tab === 'siswa' ? 'SISWA' : 'GURU'}</div></div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9.5pt', fontWeight: 'bold', lineHeight: 1.15, wordBreak: 'break-word' }}>{x.nama}</div>
                    {tab === 'siswa' ? <div style={{ fontSize: '7.5pt', marginTop: '1mm' }}>Kelas {x.kelas || '-'}<br />NISN {x.nisn}{x.nis ? <> · NIS {x.nis}</> : null}</div>
                      : <div style={{ fontSize: '7.5pt', marginTop: '1mm' }}>NIP/NIY {x.nip || '-'}</div>}
                  </div>
                  <div style={{ fontSize: '5.5pt', color: '#555' }}>Tunjukkan QR ke kamera lalu kedipkan mata</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AbsensiWebcam = () => {
  const DB = useDB();
  const containerRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [nisnManual, setNisnManual] = useState('');
  const [statusManual, setStatusManual] = useState('Hadir');
  const [proses, jalankan] = useAksi();
  const { hasil, catat, dariQR } = useCatatAbsensi();
  const pengelola = DB.punyaPeran(['admin', 'kepsek']);
  const [suratInfo, setSuratInfo] = useState(null);
  const tandaiAlfa = () => {
    if (!confirm('Tandai ALPHA semua siswa aktif yang belum tercatat hari ini (tanpa QR)? Lakukan di akhir jam sekolah.')) return;
    jalankan(async () => { const res = await apiPanggil('tandaiAlfa', { jenis: 'siswa' }); showAlert(res.message); await DB.muatUlang(); });
  };

  const siswaAktif = DB.rows('Siswa').filter((s) => !['Nonaktif', 'Pindah', 'Lulus'].includes(s.status));
  const absenHariIni = DB.rows('Absensi').filter((a) => a.tanggal === DB.hariIni).sort((a, b) => String(b.jam).localeCompare(String(a.jam)));
  const hitung = (st) => absenHariIni.filter((a) => a.status === st).length;
  const belumAbsen = Math.max(0, siswaAktif.length - absenHariIni.length);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) { if (containerRef.current.requestFullscreen) containerRef.current.requestFullscreen(); setIsFullScreen(true); }
    else { if (document.exitFullscreen) document.exitFullscreen(); setIsFullScreen(false); }
  };

  const simpanManual = (e) => {
    e.preventDefault();
    if (!nisnManual) return showAlert('Pilih siswa terlebih dahulu.', 'error');
    jalankan(() => catat(nisnManual, statusManual, 'Manual'));
  };

  return (
    <div className="space-y-6">
      <div ref={containerRef}
        className={isFullScreen ? 'fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center p-4 overflow-y-auto' : 'bg-white p-6 rounded-lg shadow-sm border flex flex-col items-center'}>
        <div className="w-full flex justify-between items-center mb-4 max-w-2xl">
          <h3 className={`font-bold ${isFullScreen ? 'text-white' : 'text-gray-700'}`}>Absensi QR + Kedip Mata</h3>
          <button onClick={toggleFullScreen} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold shadow-sm">
            <i className={`fas ${isFullScreen ? 'fa-compress' : 'fa-expand'} mr-2`}></i>{isFullScreen ? 'Tutup Layar Penuh' : 'Buka Layar Penuh'}
          </button>
        </div>
        {!isFullScreen && <p className="text-xs text-gray-500 mb-4 text-center">Hadir = QR kartu + kedip mata. Sakit/Izin = QR kartu + unggah surat. Alpha = tidak ada QR hingga akhir hari. Tidak ada foto/video/data wajah yang disimpan.</p>}
        <ScannerAbsenKedip ukuran={isFullScreen ? 'max-w-xl' : 'max-w-sm'} />
        <div className="mt-4 w-full max-w-md"><KotakHasil hasil={hasil} /></div>
      </div>

      {!isFullScreen && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-900 no-print">
            <i className="fas fa-mobile-alt mr-1"></i><strong>Pakai seperti aplikasi:</strong> buka alamat web aplikasi ini dengan tambahan <code className="bg-white px-1 rounded">?mode=scanner</code> di belakangnya
            (contoh: <code className="bg-white px-1 rounded">…/exec?mode=scanner</code>), lalu pilih <em>Tambahkan ke Layar Utama</em> di peramban HP. Halaman itu hanya berisi pemindai layar penuh.
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {STATUS_ABSEN.map((st) => (
              <div key={st} className="bg-white border rounded-lg p-3 text-center shadow-sm"><p className="text-xs text-gray-500">{st}</p><p className="text-xl font-bold">{hitung(st)}</p></div>
            ))}
            <div className="bg-white border rounded-lg p-3 text-center shadow-sm col-span-2 md:col-span-1"><p className="text-xs text-gray-500">Belum Absen</p><p className="text-xl font-bold text-orange-600">{belumAbsen}</p></div>
          </div>

          <form onSubmit={simpanManual} className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs font-semibold text-gray-600">Catat Manual (tanpa kartu)</label>
              <select value={nisnManual} onChange={(e) => setNisnManual(e.target.value)} className="w-full border p-2 rounded text-sm mt-1 bg-white">
                <option value="">-- Pilih siswa --</option>
                {siswaAktif.map((s) => <option key={s.id} value={s.nisn}>{s.nama} ({s.kelas || 'tanpa kelas'})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Status</label>
              <select value={statusManual} onChange={(e) => setStatusManual(e.target.value)} className="border p-2 rounded text-sm mt-1 bg-white block">
                {STATUS_ABSEN.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button type="submit" disabled={proses} className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-2 rounded text-sm font-bold">Catat</button>
          </form>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-bold text-sm text-gray-700">Daftar Kehadiran Hari Ini ({tanggalPanjang(DB.hariIni)})</h4>
              {pengelola && <button onClick={tandaiAlfa} disabled={proses} className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-3 py-1.5 rounded text-xs font-bold"><i className="fas fa-user-times mr-1"></i> Tandai Alfa (belum absen)</button>}
            </div>
            {absenHariIni.length === 0 ? <KosongInfo teks="Belum ada kehadiran tercatat hari ini." /> : (
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b sticky top-0"><tr><th className="p-2.5">Jam</th><th className="p-2.5">Nama</th><th className="p-2.5">Kelas</th><th className="p-2.5">Status</th><th className="p-2.5">Metode</th>{pengelola && <th className="p-2.5">Surat</th>}</tr></thead>
                  <tbody>
                    {absenHariIni.map((a) => (
                      <tr key={a.id} className="border-b"><td className="p-2.5">{a.jam}</td><td className="p-2.5 font-medium">{a.nama}</td><td className="p-2.5">{a.kelas}</td>
                        <td className="p-2.5"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.status === 'Hadir' ? 'bg-green-100 text-green-700' : a.status === 'Alpha' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.status}</span></td>
                        <td className="p-2.5 text-xs text-gray-500">{a.metode}</td>
                        {pengelola && <td className="p-2.5">{a.suratId ? <button onClick={() => bacaSuratAbsen('Absensi', a.id, `Surat ${a.status} — ${a.nama}`, setSuratInfo)} className="text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded text-xs hover:bg-blue-50"><i className="fas fa-file-alt"></i> Lihat</button> : null}</td>}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      <PenampilSurat info={suratInfo} tutup={() => setSuratInfo(null)} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// MODE SCANNER (?mode=scanner): halaman layar penuh khusus pemindai, cocok dipasang di layar utama HP
// ---------------------------------------------------------------------------
const ModeScanner = ({ onKeluar }) => {
  const DB = useDB();
  const sekolah = useSekolah();
  const { hasil, catat, dariQR } = useCatatAbsensi();
  const [nisn, setNisn] = useState('');
  const bolehAbsen = DB.punyaPeran(['admin', 'kepsek', 'guru', 'bendahara']);
  const terbaru = DB.rows('Absensi').filter((a) => a.tanggal === DB.hariIni).sort((a, b) => String(b.jam).localeCompare(String(a.jam))).slice(0, 6);
  const hadirHariIni = DB.rows('Absensi').filter((a) => a.tanggal === DB.hariIni && a.status === 'Hadir').length;

  if (!bolehAbsen) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white border rounded-lg shadow p-8 text-center space-y-3 max-w-sm">
        <i className="fas fa-lock text-3xl text-red-500"></i>
        <p className="text-sm text-gray-700">Akun Anda tidak memiliki akses absensi.</p>
        <button onClick={onKeluar} className="bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold">Keluar</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 gap-4">
      <div className="w-full max-w-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {sekolah.logoUrl && <img src={sekolah.logoUrl} alt="" className="w-9 h-9 object-contain bg-white rounded-full p-0.5" />}
          <div className="min-w-0"><p className="font-bold text-sm truncate">Absensi {sekolah.namaSekolah}</p><p className="text-[10px] text-green-300">{DB.user.nama} · {hadirHariIni} hadir hari ini</p></div>
        </div>
        <button onClick={onKeluar} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded font-semibold">Keluar</button>
      </div>
      <ScannerAbsenKedip ukuran="max-w-md" />
      <div className="w-full max-w-md bg-gray-800 rounded-lg overflow-hidden">
        <p className="text-xs font-bold p-3 border-b border-gray-700">Terakhir tercatat</p>
        {terbaru.length === 0 ? <p className="text-xs text-gray-400 p-4 text-center">Belum ada.</p> : terbaru.map((a) => (
          <div key={a.id} className="flex justify-between text-xs px-3 py-2 border-b border-gray-700 last:border-b-0"><span className="truncate pr-2">{a.nama} <span className="text-gray-400">({a.kelas})</span></span><span className="text-green-300 whitespace-nowrap">{a.status} {String(a.jam).slice(0, 5)}</span></div>
        ))}
      </div>
    </div>
  );
};


// ---------------------------------------------------------------------------
// LEMBAR SURAT KELUAR — SATU komponen dipakai oleh tinjauan langsung (live) DAN tampilan/cetak,
// sehingga hasilnya selalu sama. Ukuran kertas F4/Folio 215,9 × 355,6 mm (8,5 × 14 inci), Times New Roman 12 pt,
// margin kiri/kanan 2,2 cm — mengikuti contoh SURAT_PINDAH_SEKOLAH.docx.
// ---------------------------------------------------------------------------
const SK_KOP = 'data:image/jpeg;base64,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';
const SK_TTD_STEMPEL = 'data:image/png;base64,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';
const skNomor = (n) => String(n || '').replace(/\s*\/\s*/g, ' / ');

// Pembungkus: mengecilkan tampilan di layar saja (cetak selalu ukuran penuh)
const SuratSkala = ({ children }) => {
  const ref = useRef(null);
  const [k, setK] = useState(0.7);
  useEffect(() => {
    const hit = () => { if (ref.current) setK(Math.max(0.3, Math.min(1, (ref.current.clientWidth - 2) / 816))); };
    hit();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(hit); ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return (
    <>
      <style>{`
        @media print { @page { size: 612pt 1008pt; margin: 0; } .sk-luar { height: auto !important; overflow: visible !important; } .sk-skala { transform: none !important; width: auto !important; } }
        .sk { width: 612pt; min-height: 1008pt; background: #fff; color: #000; font-family: 'Times New Roman', Times, 'Liberation Serif', serif; font-size: 12pt; position: relative; box-sizing: border-box; padding: 129.2pt 62.35pt 40pt; }
        .sk p { margin: 0; line-height: 15.87pt; text-align: justify; }
        .sk .tengah { text-align: center; }
        .sk .spasi { height: 13.8pt; }
        .sk table { border-collapse: collapse; width: 100%; }
        .sk td { padding: 0; line-height: 15.87pt; vertical-align: top; text-align: left; }
        .sk .kop { position: absolute; left: 57.3pt; top: 5.2pt; width: 481pt; height: 126pt; }
      `}</style>
      <div ref={ref} className="sk-luar w-full" style={{ height: 1344 * k, overflow: 'hidden' }}>
        <div className="sk-skala shadow-lg" style={{ width: 816, transform: `scale(${k})`, transformOrigin: 'top left' }}>{children}</div>
      </div>
    </>
  );
};

const SuratLembar = ({ data, sekolah, idCetak }) => {
  const d = data || {};
  const jenis = d.jenisSurat;
  const judul = jenis === 'pindah' ? 'SURAT KETERANGAN PINDAH SEKOLAH' : 'SURAT KETERANGAN';
  const tahunAjaran = sekolah.tahunAjaran || '2026/2027';
  const Tabel = ({ baris, lebar = 107.9 }) => (
    <table><tbody>{baris.map(([label, nilai, tebal]) => <tr key={label}><td style={{ width: `${lebar}pt` }}>{label}</td><td>: {tebal ? <b>{nilai}</b> : nilai}</td></tr>)}</tbody></table>
  );
  const titik = '……………………………………………………………………………';

  return (
    <div id={idCetak || undefined} style={{ width: '612pt', padding: 0, margin: 0, background: '#fff' }}>
      <div className="sk">
        <img className="kop" src={SK_KOP} alt="Kop surat" />
        <p className="tengah"><b><u>{judul}</u></b></p>
        <p className="tengah" style={{ marginBottom: '11.73pt' }}>Nomor : {skNomor(d.noSurat)}</p>

        {jenis === 'aktif' && (<>
          <p>Yang bertanda tangan dibawah ini, Kepala SDIT Annihayah Kecamatan Rawamerta Kabupaten Karawang menerangkan dengan sesungguhnya bahwa :</p>
          <div className="spasi"></div>
          <Tabel baris={[['Nama Peserta Didik', d.namaSiswa, true], ['NIS', d.nis], ['NISN', d.nisn], ['Tempat, Tgl Lahir', d.ttl], ['Jenis Kelamin', d.jk], ['Kelas', d.kelas]]} />
          <div className="spasi"></div>
          <p>Benar bahwa anak tersebut adalah Peserta Didik di SDIT ANNIHAYAH Korwilcambidik Rawamerta, dan <b>AKTIF</b> dikelas {d.kelas} Tahun Ajaran {tahunAjaran}. Demikian surat keterangan ini saya buat untuk dipergunakan sebagaimana mestinya.</p>
        </>)}

        {jenis === 'terima' && (<>
          <p>Yang bertanda tangan dibawah ini, Kepala SDIT Annihayah Kecamatan Rawamerta Kabupaten Karawang menerangkan dengan sesungguhnya bahwa :</p>
          <div className="spasi"></div>
          <Tabel baris={[['Nama', d.namaSiswa, true], ['NISN', d.nisn], ['Tempat,tanggal lahir', d.ttl], ['Sekolah Asal', d.sekolahAsal]]} />
          <div className="spasi"></div>
          <p>Yang bersangkutan telah <b>DITERIMA</b> sebagai siswa kelas <b>{d.kelas}</b> SDIT Annihayah Kecamatan Rawamerta Kabupaten Karawang Tahun Pelajaran {tahunAjaran}.</p>
          <div className="spasi"></div>
          <p>Demikian Surat Keterangan ini dibuat, supaya dapat dipergunakan sebagaimana mestinya.</p>
        </>)}

        {jenis === 'pindah' && (<>
          <p>Yang bertanda tangan di bawah ini, Kepala SDIT Annihayah Kecamatan Rawamerta Kabupaten Karawang dengan ini menerangkan bahwa :</p>
          <div className="spasi"></div>
          <Tabel baris={[['Nama', d.namaSiswa], ['NIS', d.nis], ['NISN', d.nisn], ['Jenis Kelamin', d.jk], ['Kelas', d.kelas]]} />
          <div className="spasi"></div>
          <p>Sesuai dengan permohonan Pindah Sekolah orang tua / wali siswa :</p>
          <div className="spasi"></div>
          <Tabel lebar={113.3} baris={[['Nama Ayah', d.ayah], ['Nama Ibu', d.ibu]]} />
          <div className="spasi"></div>
          <p>Telah mengajukan pindah ke <b>{d.sekolahTujuan}</b> atas permintaan orang tua / wali siswa dengan alasan {d.alasanPindah || 'permintaan orangtua'}.</p>
          <div className="spasi"></div>
          <p>Bersama ini kami sertakan Buku Laporan Hasil Pendidikan (Raport) yang bersangkutan. Demikian Keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
        </>)}

        {/* Tanda tangan + stempel — lebar kolom menyesuaikan panjang nama (rata kanan pada margin halaman), nama tidak terpotong */}
        <div style={{ height: '15.87pt' }}></div>
        <div style={{ marginLeft: 'auto', width: 'max-content', minWidth: '189.6pt', maxWidth: '330pt', position: 'relative' }}>
          <img src={SK_TTD_STEMPEL} alt="" style={{ position: 'absolute', left: '-78pt', top: '12pt', width: '171pt', height: 'auto', pointerEvents: 'none', mixBlendMode: 'multiply', opacity: 0.92 }} />
          <p style={{ textAlign: 'left', position: 'relative' }}>Rawamerta, {d.tanggalSurat}</p>
          <p style={{ textAlign: 'left', position: 'relative' }}>Kepala SDIT Annihayah</p>
          <div style={{ height: `${15.87 * 4}pt` }}></div>
          <p style={{ textAlign: 'left', position: 'relative' }}><b><u><NamaTtd nama={sekolah.kepsek} maks="330pt" /></u></b></p>
          <p style={{ textAlign: 'left', position: 'relative' }}>NIP. {sekolah.nipKepsek || '-'}</p>
        </div>

        {jenis === 'pindah' && (<>
          <div style={{ height: '15.87pt', position: 'relative' }}><div style={{ position: 'absolute', left: '0.85pt', width: '468pt', top: '7pt', borderTop: '1pt dashed #000' }}></div></div>
          <p>Setelah anak diterima di sekolah tujuan, mohon blanko ini diisi dan dikembalikan kepada kami.</p>
          <Tabel baris={[['Nama Sekolah', titik], ['Status Sekolah', titik], ['Alamat', titik], ['Desa / Kelurahan', titik], ['Kecamatan', titik], ['Kabupaten', titik], ['Provinsi', titik], ['Diterima Tanggal', titik]]} />
          <div style={{ height: '9.2pt' }}></div>
          <p className="tengah" style={{ marginLeft: '297.7pt' }}>Kepala Sekolah</p>
          <div style={{ height: `${15.87 * 3}pt` }}></div>
          <p className="tengah" style={{ marginLeft: '297.7pt' }}>……………………………………</p>
        </>)}
      </div>
    </div>
  );
};

const ManajemenSurat = () => {
  const sekolah = useSekolah();
  const DB = useDB();
  const [proses, jalankan] = useAksi();
  const [tab, setTab] = useState('masuk');
  const [modalMasukOpen, setModalMasukOpen] = useState(false);
  const [modalKeluarOpen, setModalKeluarOpen] = useState(false);
  const [previewSuratOpen, setPreviewSuratOpen] = useState(false);
  const [modalViewMasukOpen, setModalViewMasukOpen] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState(null);
  const [selectedSuratMasuk, setSelectedSuratMasuk] = useState(null);

  const siswaList = DB.rows('Siswa');
  const daftarSuratMasuk = DB.rows('Surat_Masuk').map((s) => ({ ...s, fileBukti: s.fileUrl }));
  const daftarSuratKeluar = DB.rows('Surat_Keluar');

  const ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const KELAS_ROMAWI = { 1: 'I (Satu)', 2: 'II (Dua)', 3: 'III (Tiga)', 4: 'IV (Empat)', 5: 'V (Lima)', 6: 'VI (Enam)' };
  const nomorBerikutnya = () => {
    const d = new Date();
    return `400.3.11/${String(daftarSuratKeluar.length + 1).padStart(3, '0')}/SDIT-ANN/${ROMAWI[d.getMonth()]}/${d.getFullYear()}`;
  };
  const MASUK_KOSONG = () => ({ id: '', noAgenda: '', tglTerima: hariIniISO(), pengirim: '', perihal: '', fileBukti: '', namaFile: '' });
  const KELUAR_KOSONG = () => ({ id: '', jenisSurat: 'aktif', noSurat: nomorBerikutnya(), tanggalSurat: tanggalHariIni(), namaSiswa: '', nis: '', nisn: '', ttl: '',
    kelas: '', jk: 'Laki-laki', ayah: '', ibu: '', sekolahAsal: '', sekolahTujuan: '', alasanPindah: '' });

  const [suratMasukData, setSuratMasukData] = useState(MASUK_KOSONG());
  const [suratData, setSuratData] = useState(KELUAR_KOSONG());

  const bukaTambahMasuk = () => { setSuratMasukData(MASUK_KOSONG()); setModalMasukOpen(true); };
  const bukaTambahKeluar = () => { setSuratData(KELUAR_KOSONG()); setModalKeluarOpen(true); };
  const handleSuratChange = (e) => setSuratData({ ...suratData, [e.target.name]: e.target.value });
  const handleSuratMasukChange = (e) => setSuratMasukData({ ...suratMasukData, [e.target.name]: e.target.value });

  // Mengisi data surat otomatis dari Data Siswa
  const pilihSiswa = (e) => {
    const s = siswaList.find((x) => x.nisn === e.target.value);
    if (!s) return;
    setSuratData({ ...suratData, namaSiswa: s.nama, nisn: s.nisn, nis: s.nis, jk: s.jk || suratData.jk,
      ttl: [s.tempatLahir, tanggalPanjang(s.tglLahir)].filter(Boolean).join(', '),
      kelas: KELAS_ROMAWI[tingkatDariKelas(s.kelas)] || s.kelas, ayah: s.namaAyah, ibu: s.namaIbu });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    jalankan(async () => {
      const hasil = await DB.unggah(file, 'surat');
      setSuratMasukData((d) => ({ ...d, fileBukti: hasil.url, namaFile: file.name }));
      showAlert(`File ${file.name} berhasil diunggah ke Drive.`);
    });
  };

  const handleSimpanSuratMasuk = (e) => {
    e.preventDefault();
    const d = suratMasukData;
    jalankan(async () => {
      await DB.simpan('Surat_Masuk', { id: d.id, noAgenda: d.noAgenda, tglTerima: d.tglTerima, pengirim: d.pengirim, perihal: d.perihal, namaFile: d.namaFile, fileUrl: d.fileBukti });
      showAlert('Surat masuk berhasil disimpan.');
      setModalMasukOpen(false);
    });
  };
  const handleEditMasuk = (item) => { setSuratMasukData({ ...MASUK_KOSONG(), ...item }); setModalMasukOpen(true); };
  const handleDeleteMasuk = (id) => {
    if (confirm('Yakin ingin menghapus surat masuk ini?')) jalankan(async () => { await DB.hapus('Surat_Masuk', id); showAlert('Surat masuk dihapus.'); });
  };

  const handleSimpanSurat = (e) => {
    e.preventDefault();
    jalankan(async () => {
      await DB.simpan('Surat_Keluar', suratData);
      showAlert('Surat keluar berhasil disimpan.');
      setModalKeluarOpen(false);
    });
  };
  const handleEdit = (surat) => { setSuratData({ ...KELUAR_KOSONG(), ...surat }); setModalKeluarOpen(true); };
  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus surat keluar ini?')) jalankan(async () => { await DB.hapus('Surat_Keluar', id); showAlert('Surat keluar dihapus.'); });
  };
  const handleOpenPreview = (surat) => { setSelectedSurat(surat); setPreviewSuratOpen(true); };

  const getJudulSurat = (jenis) => {
    switch (jenis) {
      case 'pindah': return 'SURAT KETERANGAN PINDAH SEKOLAH';
      case 'terima': return 'SURAT KETERANGAN';
      default: return 'SURAT KETERANGAN';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <div className="flex border-b">
        <button onClick={() => setTab('masuk')} className={`pb-2 px-4 font-bold text-sm ${tab === 'masuk' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>Manajemen Surat Masuk</button>
        <button onClick={() => setTab('keluar')} className={`pb-2 px-4 font-bold text-sm ${tab === 'keluar' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>Manajemen Surat Keluar</button>
      </div>
      
      {/* --- TAB SURAT MASUK --- */}
      {tab === 'masuk' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-700 text-sm">Arsip Dokumen Surat Masuk</h3>
            <button onClick={bukaTambahMasuk} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5">
              <i className="fas fa-plus"></i> Catat Surat Masuk
            </button>
          </div>

          <table className="w-full text-sm border text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 border">No. Agenda</th>
                <th className="p-3 border">Tgl Terima</th>
                <th className="p-3 border">Instansi Pengirim</th>
                <th className="p-3 border">Perihal</th>
                <th className="p-3 border text-center">Bukti File</th>
                <th className="p-3 border text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {daftarSuratMasuk.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 border font-semibold">{item.noAgenda}</td>
                  <td className="p-3 border">{item.tglTerima}</td>
                  <td className="p-3 border">{item.pengirim}</td>
                  <td className="p-3 border text-blue-800 font-medium">{item.perihal}</td>
                  <td className="p-3 border text-center">
                    {item.fileBukti ? (
                      <a href={item.fileBukti} target="_blank" rel="noreferrer" className="text-green-600 underline text-xs font-bold"><i className="fas fa-file-alt"></i> Lihat File</a>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Tidak ada file</span>
                    )}
                  </td>
                  <td className="p-3 border text-center flex justify-center gap-1.5">
                    <button onClick={() => { setSelectedSuratMasuk(item); setModalViewMasukOpen(true); }} className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded text-xs"><i className="fas fa-eye"></i> View</button>
                    <button onClick={() => handleEditMasuk(item)} className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded text-xs"><i className="fas fa-edit"></i> Ubah</button>
                    <button onClick={() => handleDeleteMasuk(item.id)} className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded text-xs"><i className="fas fa-trash"></i> Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* --- TAB SURAT KELUAR --- */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-700 text-sm">Arsip Dokumen Surat Keluar</h3>
            <button onClick={bukaTambahKeluar} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5">
              <i className="fas fa-plus"></i> Buat Surat Keluar
            </button>
          </div>
          
          <table className="w-full text-sm border text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 border">No Surat</th>
                <th className="p-3 border">Jenis / Perihal</th>
                <th className="p-3 border">Nama Siswa</th>
                <th className="p-3 border text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {daftarSuratKeluar.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 border font-semibold">{item.noSurat}</td>
                  <td className="p-3 border capitalize">Surat Keterangan {item.jenisSurat}</td>
                  <td className="p-3 border font-semibold">{item.namaSiswa}</td>
                  <td className="p-3 border text-center flex justify-center gap-1.5">
                    <button onClick={() => handleOpenPreview(item)} className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded text-xs"><i className="fas fa-eye"></i> View</button>
                    <button onClick={() => handleEdit(item)} className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded text-xs"><i className="fas fa-edit"></i> Ubah</button>
                    <button onClick={() => handleDelete(item.id)} className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded text-xs"><i className="fas fa-trash"></i> Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM SURAT MASUK */}
      <Modal isOpen={modalMasukOpen} onClose={() => setModalMasukOpen(false)} title={suratMasukData.id ? "Ubah Surat Masuk" : "Catat Surat Masuk Baru"}>
        <form onSubmit={handleSimpanSuratMasuk} className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold">No. Agenda</label><input name="noAgenda" required value={suratMasukData.noAgenda} onChange={handleSuratMasukChange} className="w-full border p-2 rounded mt-1"/></div>
            <div><label className="text-xs font-semibold">Tgl Diterima</label><input name="tglTerima" required type="date" value={suratMasukData.tglTerima} onChange={handleSuratMasukChange} className="w-full border p-2 rounded mt-1"/></div>
          </div>
          <div><label className="text-xs font-semibold">Instansi Pengirim</label><input name="pengirim" required value={suratMasukData.pengirim} onChange={handleSuratMasukChange} className="w-full border p-2 rounded mt-1"/></div>
          <div><label className="text-xs font-semibold">Perihal</label><input name="perihal" required value={suratMasukData.perihal} onChange={handleSuratMasukChange} className="w-full border p-2 rounded mt-1 font-bold text-blue-800"/></div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Unggah Bukti Surat (PDF / JPG / PNG)</label>
            <input type="file" accept=".pdf,image/png,image/jpeg" onChange={handleFileUpload} className="w-full border p-2 rounded mt-1 text-xs bg-gray-50"/>
            {suratMasukData.namaFile && <p className="text-[10px] text-green-600 mt-1 font-semibold">File terpilih: {suratMasukData.namaFile}</p>}
          </div>
          <button type="submit" className="w-full bg-green-600 text-white p-2.5 rounded font-bold shadow-sm mt-2">Simpan Surat Masuk</button>
        </form>
      </Modal>

      {/* MODAL VIEW SURAT MASUK */}
      <Modal isOpen={modalViewMasukOpen} onClose={() => setModalViewMasukOpen(false)} title="Detail Surat Masuk">
        {selectedSuratMasuk && (
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-gray-50 border rounded space-y-1">
              <p><strong>No Agenda:</strong> {selectedSuratMasuk.noAgenda}</p>
              <p><strong>Tanggal Terima:</strong> {selectedSuratMasuk.tglTerima}</p>
              <p><strong>Pengirim:</strong> {selectedSuratMasuk.pengirim}</p>
              <p><strong>Perihal:</strong> <span className="text-blue-800 font-bold">{selectedSuratMasuk.perihal}</span></p>
            </div>
            {selectedSuratMasuk.fileBukti ? (
              <div className="text-center p-4 border bg-gray-100 rounded">
                <a href={selectedSuratMasuk.fileBukti} target="_blank" rel="noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold shadow"><i className="fas fa-external-link-alt mr-1"></i> Buka File Lampiran Surat</a>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic text-center">Tidak ada lampiran file bukti.</p>
            )}
          </div>
        )}
      </Modal>

      {/* --- MODAL FORM SURAT KELUAR DENGAN SPLIT-VIEW LIVE PREVIEW DINAMIS FLEKSIBEL --- */}
      <Modal isOpen={modalKeluarOpen} onClose={() => setModalKeluarOpen(false)} title={suratData.id ? "Ubah Surat Keluar" : "Buat Surat Keluar (Split-View)"} size="max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[75vh]">
          
          {/* SISI KIRI: FORM INPUT FLEKSIBEL */}
          <form onSubmit={handleSimpanSurat} className="bg-gray-50 p-4 rounded-lg border overflow-y-auto space-y-3 text-sm">
            <h4 className="font-bold text-gray-700 border-b pb-2">Form Data Surat Keluar</h4>
            <div>
              <label className="text-xs font-semibold text-gray-600">Jenis / Perihal Surat</label>
              <select name="jenisSurat" value={suratData.jenisSurat} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white font-bold text-blue-800">
                <option value="aktif">Surat Keterangan Aktif Siswa</option>
                <option value="terima">Surat Keterangan Siswa Diterima</option>
                <option value="pindah">Surat Keterangan Pindah Sekolah</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Isi Otomatis dari Data Siswa</label>
              <select onChange={pilihSiswa} value="" className="w-full border p-2 rounded text-sm mt-1 bg-white">
                <option value="">-- Pilih siswa --</option>
                {siswaList.map((s) => <option key={s.id} value={s.nisn}>{s.nama} ({s.kelas || 'tanpa kelas'})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-600">Nomor Surat</label><input name="noSurat" value={suratData.noSurat} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white" required/></div>
              <div><label className="text-xs text-gray-600">Tanggal Surat</label><input name="tanggalSurat" value={suratData.tanggalSurat} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white" required/></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-600">Nama Siswa</label><input name="namaSiswa" value={suratData.namaSiswa} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white" required/></div>
              <div><label className="text-xs text-gray-600">NISN</label><input name="nisn" value={suratData.nisn} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white" required/></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs text-gray-600">Tempat, Tgl Lahir</label><input name="ttl" value={suratData.ttl} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white" required/></div>
              <div><label className="text-xs text-gray-600">Kelas / Tingkat</label><input name="kelas" value={suratData.kelas} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white" required/></div>
            </div>

            {/* FIELD KHUSUS SURAT TERIMA */}
            {suratData.jenisSurat === 'terima' && (
              <div>
                <label className="text-xs font-semibold text-blue-800">Sekolah Asal Siswa</label>
                <input name="sekolahAsal" value={suratData.sekolahAsal} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white font-medium" placeholder="Cth: MI Miftahul Ilmi"/>
              </div>
            )}

            {/* FIELD KHUSUS SURAT PINDAH */}
            {suratData.jenisSurat === 'pindah' && (
              <div className="space-y-2 border-t pt-2 border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-gray-600">NIS</label><input name="nis" value={suratData.nis} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white"/></div>
                  <div><label className="text-xs text-gray-600">Jenis Kelamin</label><input name="jk" value={suratData.jk} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white"/></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-gray-600">Nama Ayah</label><input name="ayah" value={suratData.ayah} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white"/></div>
                  <div><label className="text-xs text-gray-600">Nama Ibu</label><input name="ibu" value={suratData.ibu} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white"/></div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-blue-800">Sekolah Tujuan Pindah</label>
                  <textarea name="sekolahTujuan" rows="2" value={suratData.sekolahTujuan} onChange={handleSuratChange} className="w-full border p-2 rounded text-sm mt-1 bg-white" placeholder="Nama & Alamat Sekolah Tujuan"></textarea>
                </div>
                <div><label className="text-xs text-gray-600">Alasan Pindah</label><input name="alasanPindah" value={suratData.alasanPindah} onChange={handleSuratChange} placeholder="permintaan orangtua" className="w-full border p-2 rounded text-sm mt-1 bg-white"/></div>
              </div>
            )}

            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white p-2.5 rounded font-bold shadow-sm mt-3">Simpan Surat Keluar</button>
          </form>

          {/* SISI KANAN: TINJAUAN LANGSUNG — komponen yang SAMA dengan tampilan & cetak */}
          <div className="bg-gray-300 p-3 rounded-lg overflow-y-auto">
            <SuratSkala><SuratLembar data={suratData} sekolah={sekolah} /></SuratSkala>
          </div>

        </div>
      </Modal>

      {/* MODAL VIEW & CETAK PDF — isi dan ukuran identik dengan tinjauan langsung (kertas F4/Folio) */}
      <Modal isOpen={previewSuratOpen} onClose={() => setPreviewSuratOpen(false)} title="Pratinjau Dokumen Resmi" size="max-w-4xl">
        {selectedSurat && (
          <div className="space-y-4">
            <div className="bg-gray-300 p-3 rounded-lg">
              <SuratSkala><SuratLembar data={selectedSurat} sekolah={sekolah} idCetak="printable-a4-area" /></SuratSkala>
            </div>
            <div className="flex justify-between items-center border-t pt-4 no-print">
              <p className="text-xs text-gray-500">Saat mencetak pilih ukuran kertas <b>F4 / Folio (Legal 8,5×14 in)</b>, margin <b>Tidak ada</b>, skala 100%. Untuk PDF pilih <i>Save as PDF</i>.</p>
              <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold whitespace-nowrap"><i className="fas fa-print"></i> Cetak / PDF</button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

const Keuangan = () => {
  const sekolah = useSekolah();
  const DB = useDB();
  const bisaKelola = DB.punyaPeran(['admin', 'kepsek', 'bendahara']);
  const [proses, jalankan] = useAksi();
  const [modalBayarOpen, setModalBayarOpen] = useState(false);
  const [modalBiayaOpen, setModalBiayaOpen] = useState(false);
  const [modalViewOpen, setModalViewOpen] = useState(false);
  const logoSekolah = sekolah.logoUrl;

  const siswaRows = DB.rows('Siswa');
  const tagihanRows = DB.rows('Tagihan');
  const daftarSiswa = useMemo(() => siswaRows.filter((s) => !['Nonaktif', 'Pindah', 'Lulus'].includes(s.status))
    .map((s) => ({ id: s.id, nisn: s.nisn, nama: s.nama, kelas: s.kelas || '-', riwayatBiaya: tagihanRows.filter((t) => t.nisn === s.nisn) })), [siswaRows, tagihanRows]);
  const namaDari = (nisn) => { const s = daftarSiswa.find((x) => x.nisn === nisn); return s ? s.nama : ''; };

  const [selectedSiswaKeuangan, setSelectedSiswaKeuangan] = useState(daftarSiswa[0] ? daftarSiswa[0].nisn : '');   // NISN
  const [viewNisn, setViewNisn] = useState(null);
  const selectedSiswaView = daftarSiswa.find((s) => s.nisn === viewNisn) || null;
  const [metodePembayaran, setMetodePembayaran] = useState('Tunai (Cash di Loket Sekolah)');
  const [nominalBayar, setNominalBayar] = useState('');
  const nomorKwitansi = `TRX/${new Date().getFullYear()}/${String(DB.rows('Pembayaran').length + 1).padStart(4, '0')}`;

  const [tagihanBaru, setTagihanBaru] = useState({ siswa: daftarSiswa[0] ? daftarSiswa[0].nisn : '', jenisBiaya: '', nominal: '', keterangan: '' });
  const handleInputTagihanChange = (e) => setTagihanBaru({ ...tagihanBaru, [e.target.name]: e.target.value });

  const handleSimpanTagihan = (e) => {
    e.preventDefault();
    const s = daftarSiswa.find((x) => x.nisn === tagihanBaru.siswa);
    if (!s) return showAlert('Pilih siswa terlebih dahulu.', 'error');
    jalankan(async () => {
      await DB.simpan('Tagihan', { id: '', nisn: s.nisn, nama: s.nama, kelas: s.kelas, jenisBiaya: tagihanBaru.jenisBiaya, nominal: Number(tagihanBaru.nominal), keterangan: tagihanBaru.keterangan });
      showAlert(`Tagihan "${tagihanBaru.jenisBiaya}" untuk ${s.nama} berhasil ditambahkan.`);
      setTagihanBaru({ ...tagihanBaru, jenisBiaya: '', nominal: '', keterangan: '' });
      setModalBiayaOpen(false);
    });
  };

  const handleProsesBayar = (e) => {
    e.preventDefault();
    jalankan(async () => {
      const res = await DB.bayar({ nisn: selectedSiswaKeuangan, nominal: Number(nominalBayar), metode: metodePembayaran });
      showAlert(res.message);
      setNominalBayar('');
      setModalBayarOpen(false);
    });
  };

  const hitungTotalTunggakan = (riwayat) => {
    return riwayat.reduce((total, b) => {
      const sisa = b.nominal - b.terbayar;
      return total + (b.status !== 'Lunas' ? sisa : 0);
    }, 0);
  };


  return (
    <div className="space-y-6">
      {/* Tombol Aksi Atas */}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap justify-between items-center gap-3 no-print">
        <h3 className="font-bold text-gray-700">{bisaKelola ? 'Manajemen Keuangan, Tunggakan & Pembayaran' : 'Rincian Biaya & Tunggakan Anak'}</h3>
        {bisaKelola && (
        <div className="flex gap-2">
          <button onClick={() => setModalBiayaOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded text-xs font-bold shadow-sm">
            <i className="fas fa-plus-circle mr-1"></i> Tambah Biaya & Tagihan Siswa
          </button>
          <button onClick={() => setModalBayarOpen(true)} className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded text-xs font-bold shadow-sm">
            <i className="fas fa-credit-card mr-1"></i> Proses Pembayaran
          </button>
          <button onClick={() => window.print()} className="bg-gray-700 hover:bg-gray-800 text-white px-3.5 py-2 rounded text-xs font-bold shadow-sm">
            <i className="fas fa-print mr-1"></i> Cetak Kwitansi Berwarna
          </button>
        </div>
        )}
      </div>

      {/* TABEL REKAP TUNGGAKAN SISWA */}
      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
        <h4 className="font-bold text-sm text-gray-700 border-b pb-2">Rekap Status Keuangan & Tunggakan Siswa</h4>
        <table className="w-full text-sm border text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2.5 border">Nama Siswa</th>
              <th className="p-2.5 border">Kelas</th>
              <th className="p-2.5 border text-center">Jumlah Jenis Tagihan</th>
              <th className="p-2.5 border text-right">Total Tunggakan (Sisa)</th>
              <th className="p-2.5 border text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {daftarSiswa.map((s, idx) => {
              const totalTunggakan = hitungTotalTunggakan(s.riwayatBiaya);
              return (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="p-2.5 border font-semibold">{s.nama}</td>
                  <td className="p-2.5 border">{s.kelas}</td>
                  <td className="p-2.5 border text-center">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-semibold">
                      {s.riwayatBiaya.length} Tagihan
                    </span>
                  </td>
                  <td className="p-2.5 border text-right font-bold text-red-600">
                    {formatRupiah(totalTunggakan)}
                  </td>
                  <td className="p-2.5 border text-center space-x-1.5">
                    <button onClick={() => { setViewNisn(s.nisn); setModalViewOpen(true); }} className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded text-xs font-bold hover:bg-blue-100">
                      <i className="fas fa-eye mr-1"></i> View Rincian
                    </button>
                    {bisaKelola && (<button onClick={() => { setSelectedSiswaKeuangan(s.nisn); setModalBayarOpen(true); }} className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded text-xs font-bold hover:bg-green-100">
                      Bayar Sekarang
                    </button>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {bisaKelola && (
      <>
      {/* PRATINJAU KWITANSI DENGAN WATERMARK LOGO SEKOLAH */}
      <div className="bg-gray-200 p-6 rounded-lg flex justify-center">
        <div id="printable-a4-area" className="bg-white w-[650px] shadow-2xl relative border-[6px] border-solid border-green-700 bg-gradient-to-br from-green-50/50 to-white text-black p-8 font-serif space-y-4 overflow-hidden">
          
          {/* WATERMARK LOGO SEKOLAH */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] z-0">
            <img src={logoSekolah} alt="Watermark Logo" className="w-[320px] h-[320px] object-contain" />
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-center border-b-2 border-green-800 pb-3">
              <div>
                <h1 className="font-extrabold text-xl text-green-900 tracking-wide">KWITANSI PEMBAYARAN RESMI</h1>
                <p className="text-xs font-bold text-green-700">YAYASAN ANNIHAYAH - SDIT ANNIHAYAH</p>
              </div>
              <div className="text-right text-xs bg-green-100 p-2 rounded border border-green-300">
                <p>No. Transaksi : <strong className="text-green-900">{nomorKwitansi}</strong></p>
                <p>Metode : <strong className="text-blue-800">{metodePembayaran}</strong></p>
              </div>
            </div>

            <table className="w-full text-sm leading-9 mt-4">
              <tbody>
                <tr><td className="w-1/3 font-semibold text-gray-700">Sudah Terima Dari</td><td>:</td><td className="border-b border-dashed border-gray-400 font-bold italic text-black">{namaDari(selectedSiswaKeuangan)}</td></tr>
                <tr><td className="font-semibold text-gray-700">Jumlah Uang</td><td>:</td><td className="border-b border-dashed border-gray-400 bg-yellow-50 px-3 font-extrabold italic text-green-900">=== {formatRupiah(Number(nominalBayar))} ===</td></tr>
                <tr><td className="font-semibold text-gray-700 align-top">Untuk Pembayaran</td><td className="align-top">:</td><td className="border-b border-dashed border-gray-400 align-top">Pembayaran Iuran SPP & Administrasi Sekolah</td></tr>
              </tbody>
            </table>

            <div className="mt-8 flex justify-between items-end pt-4 border-t border-gray-200">
              <div className="bg-green-700 text-white px-6 py-2.5 rounded-lg font-extrabold text-base shadow">
                Total : {formatRupiah(Number(nominalBayar))},-
              </div>
              <div className="text-center text-xs">
                <p>{sekolah.kota}, {tanggalHariIni()}</p>
                <p>Penerima / Bendahara Sekolah,</p>
                <br/><br/>
                <p className="font-bold underline text-green-900 text-sm">Staf Keuangan SDIT</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      </>
      )}

      {/* MODAL VIEW RINCIAN BIAYA & TUNGGAKAN PER SISWA */}
      <Modal isOpen={modalViewOpen} onClose={() => setModalViewOpen(false)} title="Rincian Biaya & Tunggakan Siswa" size="max-w-3xl">
        {selectedSiswaView && (
          <div className="space-y-4 text-sm">
            <div className="bg-gray-50 p-3 rounded border flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Nama Siswa / Kelas</p>
                <p className="font-bold text-gray-800">{selectedSiswaView.nama} ({selectedSiswaView.kelas})</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-bold uppercase">Total Sisa Tunggakan</p>
                <p className="font-extrabold text-red-600 text-base">{formatRupiah(hitungTotalTunggakan(selectedSiswaView.riwayatBiaya))}</p>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-xs text-gray-700 mb-2 uppercase">Daftar Tagihan & Riwayat Pembayaran</h5>
              <table className="w-full text-xs border text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Jenis Biaya / Keterangan</th>
                    <th className="p-2 border text-right">Nominal</th>
                    <th className="p-2 border text-right">Terbayar</th>
                    <th className="p-2 border text-right">Sisa Tunggakan</th>
                    <th className="p-2 border text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSiswaView.riwayatBiaya.map((b) => {
                    const sisa = b.nominal - b.terbayar;
                    return (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="p-2 border font-semibold">
                          {b.jenisBiaya}
                          <p className="text-[10px] text-gray-500 font-normal">{b.keterangan}</p>
                        </td>
                        <td className="p-2 border text-right">{formatRupiah(b.nominal)}</td>
                        <td className="p-2 border text-right text-green-700">{formatRupiah(b.terbayar)}</td>
                        <td className="p-2 border text-right font-bold text-red-600">{formatRupiah(sisa)}</td>
                        <td className="p-2 border text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.status === 'Lunas' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button onClick={() => setModalViewOpen(false)} className="bg-gray-600 text-white px-4 py-2 rounded text-xs font-bold hover:bg-gray-700">
                Tutup Rincian
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL PROSES PEMBAYARAN */}
      <Modal isOpen={modalBayarOpen} onClose={() => setModalBayarOpen(false)} title="Proses Pembayaran Keuangan Siswa">
        <form onSubmit={handleProsesBayar} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Pilih Siswa (Terintegrasi Data Siswa)</label>
            <select required value={selectedSiswaKeuangan} onChange={(e) => setSelectedSiswaKeuangan(e.target.value)} className="w-full border p-2.5 rounded mt-1 text-sm bg-white font-bold text-blue-900">
              {daftarSiswa.map((s, idx) => (
                <option key={idx} value={s.nisn}>{s.nama} ({s.kelas}) - Tunggakan: {formatRupiah(hitungTotalTunggakan(s.riwayatBiaya))}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Nominal Pembayaran (Rp)</label>
            <input required type="number" value={nominalBayar} onChange={(e) => setNominalBayar(e.target.value)} className="w-full border p-2.5 rounded mt-1 text-sm font-bold text-green-800"/>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Pilih Kanal / Metode Pembayaran</label>
            <select value={metodePembayaran} onChange={(e) => setMetodePembayaran(e.target.value)} className="w-full border p-2.5 rounded mt-1 text-sm bg-white font-bold">
              <option value="Virtual Account (VA BCA)">Virtual Account (VA BCA)</option>
              <option value="Virtual Account (VA Mandiri)">Virtual Account (VA Mandiri)</option>
              <option value="Virtual Account (VA BSI)">Virtual Account (VA BSI)</option>
              <option value="Dompet Digital (DANA / OVO / GoPay)">Dompet Digital (DANA / OVO / GoPay)</option>
              <option value="Tunai (Cash di Loket Sekolah)">Tunai (Cash di Loket Sekolah)</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded font-bold text-sm shadow">
            Proses Pembayaran & Terbitkan Kwitansi
          </button>
        </form>
      </Modal>

      {/* MODAL TAMBAH BIAYA & TAGIHAN DENGAN LIVE PRATINJAU KWITANSI BERWARNA */}
      <Modal isOpen={modalBiayaOpen} onClose={() => setModalBiayaOpen(false)} title="Tambah Biaya & Tagihan Siswa (Live Preview Kwitansi)" size="max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SISI KIRI: FORM INPUT */}
          <form onSubmit={handleSimpanTagihan} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700">Pilih Siswa (Terintegrasi Data Siswa)</label>
              <select name="siswa" required value={tagihanBaru.siswa} onChange={handleInputTagihanChange} className="w-full border p-2 rounded mt-1 text-sm bg-white font-bold text-blue-900">
                {daftarSiswa.map((s, idx) => (
                  <option key={idx} value={s.nisn}>{s.nama} ({s.kelas})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Jenis Biaya / Perihal Tagihan</label>
              <input name="jenisBiaya" required value={tagihanBaru.jenisBiaya} onChange={handleInputTagihanChange} className="w-full border p-2 rounded mt-1 text-sm"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Nominal Tagihan (Rp)</label>
              <input name="nominal" required type="number" value={tagihanBaru.nominal} onChange={handleInputTagihanChange} className="w-full border p-2 rounded mt-1 text-sm font-bold text-green-800"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Keterangan / Catatan</label>
              <textarea name="keterangan" rows="2" value={tagihanBaru.keterangan} onChange={handleInputTagihanChange} className="w-full border p-2 rounded text-sm"></textarea>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded font-bold text-sm shadow">
              Simpan & Terbitkan Tagihan
            </button>
          </form>

          {/* SISI KANAN: LIVE PRATINJAU KWITANSI BERWARNA */}
          <div className="bg-gray-100 p-4 rounded-lg flex flex-col items-center justify-center border">
            <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase">Live Pratinjau Kwitansi Berwarna</p>
            
            <div className="bg-white w-full max-w-[340px] shadow-lg relative border-[4px] border-solid border-green-700 bg-gradient-to-br from-green-50/50 to-white text-black p-4 font-serif space-y-2 text-xs overflow-hidden">
              
              {/* WATERMARK DI LIVE PREVIEW */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
                <img src={logoSekolah} alt="Watermark" className="w-[180px] h-[180px] object-contain" />
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-center border-b border-green-800 pb-1.5">
                  <div>
                    <h2 className="font-extrabold text-[11px] text-green-900">KWITANSI TAGIHAN</h2>
                    <p className="text-[8px] font-bold text-green-700">SDIT ANNIHAYAH</p>
                  </div>
                  <span className="text-[8px] bg-green-100 px-1.5 py-0.5 rounded font-bold text-green-800">BARU</span>
                </div>

                <div className="space-y-1 mt-2">
                  <p><strong>Siswa:</strong> <span className="text-blue-900 font-bold">{namaDari(tagihanBaru.siswa)}</span></p>
                  <p><strong>Perihal:</strong> {tagihanBaru.jenisBiaya}</p>
                  <p><strong>Ket:</strong> {tagihanBaru.keterangan}</p>
                </div>

                <div className="mt-4 pt-2 border-t flex justify-between items-center">
                  <div className="bg-green-700 text-white px-3 py-1 rounded font-extrabold text-xs">
                    {formatRupiah(Number(tagihanBaru.nominal || 0))}
                  </div>
                  <div className="text-[9px] text-center">
                    <p>Bendahara Sekolah</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </Modal>
    </div>
  );
};
