// ===== Login, sesi, ganti sandi, dan manajemen pengguna =====
const NAMA_ROLE = { admin: 'Administrator', kepsek: 'Kepala Sekolah', guru: 'Guru', bendahara: 'Bendahara', orangtua: 'Orang Tua' };
const WARNA_ROLE = { admin: 'bg-purple-100 text-purple-700', kepsek: 'bg-indigo-100 text-indigo-700', guru: 'bg-blue-100 text-blue-700', bendahara: 'bg-yellow-100 text-yellow-700', orangtua: 'bg-green-100 text-green-700' };

// Latar bergerak bertema DATA (grafik batang, garis tren, kisi, kartu data melayang). Murni hiasan: tidak ada angka siswa
// yang ditampilkan sebelum login. Animasi hanya memakai CSS (ringan) dan mati otomatis bila perangkat meminta "kurangi gerakan".
const BATANG_LATAR = Array.from({ length: 28 }, (_, i) => ({ x: i * 36 + 8, tinggi: 40 + ((i * 53) % 150), tunda: ((i * 37) % 28) / 10 }));
const KARTU_LATAR = [
  { ikon: 'fa-user-graduate', teks: 'Data Siswa', atas: '12%', kiri: '7%', tunda: 0, kecil: false },
  { ikon: 'fa-qrcode', teks: 'Absensi QR', atas: '24%', kiri: '72%', tunda: 1.4, kecil: false },
  { ikon: 'fa-clipboard-list', teks: 'Leger Nilai', atas: '62%', kiri: '5%', tunda: 2.6, kecil: false },
  { ikon: 'fa-graduation-cap', teks: 'Kelulusan', atas: '70%', kiri: '74%', tunda: 0.8, kecil: false },
  { ikon: 'fa-folder-open', teks: 'Arsip Berkas', atas: '8%', kiri: '58%', tunda: 3.2, kecil: true },
  { ikon: 'fa-money-check-alt', teks: 'Keuangan', atas: '44%', kiri: '82%', tunda: 2, kecil: true },
  { ikon: 'fa-calendar-alt', teks: 'Agenda', atas: '82%', kiri: '38%', tunda: 1.1, kecil: true }
];

const LatarData = () => (
  <div className="latar-data" aria-hidden="true">
    <style>{`
      .latar-data { position: fixed; inset: 0; overflow: hidden; z-index: 0;
        background: radial-gradient(1100px 650px at 12% 8%, rgba(34,197,94,.30), transparent 60%), radial-gradient(900px 600px at 92% 92%, rgba(16,185,129,.28), transparent 60%), linear-gradient(135deg, #052e16, #14532d 55%, #065f46); }
      .latar-data .kisi { position: absolute; inset: -44px; background-image: linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px);
        background-size: 44px 44px; -webkit-mask-image: radial-gradient(ellipse at center, #000 25%, transparent 78%); mask-image: radial-gradient(ellipse at center, #000 25%, transparent 78%); animation: ldKisi 22s linear infinite; }
      @keyframes ldKisi { to { transform: translate(44px, 44px); } }
      .latar-data .batang { transform-box: fill-box; transform-origin: 50% 100%; animation: ldBatang 3.4s ease-in-out infinite alternate; }
      @keyframes ldBatang { from { transform: scaleY(.35); } to { transform: scaleY(1); } }
      .latar-data .garis { stroke-dasharray: 1600; stroke-dashoffset: 1600; animation: ldGaris 7s ease-in-out infinite; }
      @keyframes ldGaris { 0% { stroke-dashoffset: 1600; } 55%, 85% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -1600; } }
      .latar-data .titik { animation: ldTitik 7s ease-in-out infinite; }
      @keyframes ldTitik { 0%, 40% { opacity: 0; } 60%, 85% { opacity: 1; } 100% { opacity: 0; } }
      .latar-data .kartu { position: absolute; display: flex; align-items: center; gap: .6rem; padding: .55rem .8rem; border-radius: .9rem; color: #ecfdf5; font-size: .72rem; font-weight: 700;
        background: rgba(255,255,255,.10); border: 1px solid rgba(255,255,255,.18); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); box-shadow: 0 10px 30px rgba(0,0,0,.18); animation: ldMelayang 9s ease-in-out infinite; }
      .latar-data .kartu .meter { display: flex; align-items: flex-end; gap: 2px; height: 16px; }
      .latar-data .kartu .meter i { width: 4px; border-radius: 2px; background: #6ee7b7; transform-origin: bottom; animation: ldBatang 1.6s ease-in-out infinite alternate; }
      @keyframes ldMelayang { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
      .login-kartu { animation: ldMasuk .75s cubic-bezier(.2,.8,.2,1) both; }
      @keyframes ldMasuk { from { opacity: 0; transform: translateY(26px) scale(.97); } to { opacity: 1; transform: none; } }
      .login-logo { animation: ldDenyut 3.2s ease-in-out infinite; }
      @keyframes ldDenyut { 0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,.45); } 50% { box-shadow: 0 0 0 14px rgba(34,197,94,0); } }
      @media (prefers-reduced-motion: reduce) { .latar-data *, .login-kartu, .login-logo { animation: none !important; } }
    `}</style>
    <div className="kisi"></div>
    <svg className="absolute bottom-0 left-0 w-full" style={{ height: '46%' }} viewBox="0 0 1008 220" preserveAspectRatio="none">
      {BATANG_LATAR.map((b) => <rect key={b.x} className="batang" x={b.x} y={220 - b.tinggi} width="22" height={b.tinggi} rx="4" fill="rgba(110,231,183,.16)" style={{ animationDelay: `${b.tunda}s` }} />)}
    </svg>
    <svg className="absolute left-0 w-full" style={{ top: '28%', height: '34%' }} viewBox="0 0 1000 300" preserveAspectRatio="none">
      <path className="garis" d="M0 230 C 90 210, 140 120, 230 150 S 380 260, 470 170 S 620 60, 710 110 S 880 190, 1000 40" fill="none" stroke="rgba(167,243,208,.55)" strokeWidth="3" strokeLinecap="round" />
      <path className="garis" style={{ animationDelay: '1.2s' }} d="M0 270 C 120 250, 190 200, 300 215 S 450 280, 560 220 S 760 140, 860 170 S 960 120, 1000 100" fill="none" stroke="rgba(52,211,153,.35)" strokeWidth="2" strokeLinecap="round" />
      {[[230, 150], [470, 170], [710, 110], [1000, 40]].map(([x, y]) => <circle key={x} className="titik" cx={x} cy={y} r="6" fill="#a7f3d0" />)}
    </svg>
    {KARTU_LATAR.map((k) => (
      <div key={k.teks} className={`kartu ${k.kecil ? 'hidden md:flex' : 'hidden sm:flex'}`} style={{ top: k.atas, left: k.kiri, animationDelay: `${k.tunda}s` }}>
        <i className={`fas ${k.ikon} text-emerald-200`}></i><span>{k.teks}</span>
        <span className="meter">{[8, 14, 10, 16, 12].map((h, i) => <i key={i} style={{ height: h, animationDelay: `${i * 0.18 + k.tunda * 0.1}s` }}></i>)}</span>
      </div>
    ))}
  </div>
);

const bacaCfgTersimpan = () => { try { return JSON.parse(localStorage.getItem('sim_cfg') || 'null'); } catch (e) { return null; } };

const LoginScreen = ({ onLogin }) => {
  const [cfg, setCfg] = useState(() => bacaCfgTersimpan() || { namaSekolah: (window.SIM_CONFIG && window.SIM_CONFIG.NAMA_DEFAULT) || 'SIM Sekolah', namaYayasan: '', logoUrl: '' });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [lihat, setLihat] = useState(false);
  const [proses, setProses] = useState(false);
  const [galat, setGalat] = useState('');

  useEffect(() => {
    apiPanggil('publicConfig').then((r) => { setCfg(r.data); try { localStorage.setItem('sim_cfg', JSON.stringify(r.data)); } catch (e) { /* abaikan */ } }).catch(() => {});
  }, []);

  const masuk = async (e) => {
    e.preventDefault();
    setProses(true); setGalat('');
    try {
      const res = await apiPanggil('login', { username, password });
      simpanSesi(res.data.token, res.data.user);
      onLogin(res.data.user);
    } catch (err) { setGalat(err.message); setPassword(''); }
    finally { setProses(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <LatarData />
      <div className="login-kartu relative z-10 w-full max-w-sm rounded-2xl p-8 space-y-5 shadow-2xl border border-white/40" style={{ background: 'rgba(255,255,255,.93)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
        <div className="text-center space-y-2">
          {cfg.logoUrl && <img src={cfg.logoUrl} alt="Logo" className="login-logo w-20 h-20 object-contain mx-auto rounded-full bg-white p-1" />}
          <h1 className="font-extrabold text-xl text-green-900 leading-tight">SIM {cfg.namaSekolah}</h1>
          {cfg.namaYayasan && <p className="text-xs text-gray-500">{cfg.namaYayasan}</p>}
          <p className="text-sm text-gray-600">Silakan masuk untuk melanjutkan</p>
        </div>
        <form onSubmit={masuk} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600">Nama Pengguna</label>
            <div className="relative mt-1"><i className="fas fa-user absolute left-3 top-3 text-gray-400 text-sm"></i>
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" required className="w-full border rounded-lg pl-9 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Kata Sandi</label>
            <div className="relative mt-1"><i className="fas fa-lock absolute left-3 top-3 text-gray-400 text-sm"></i>
              <input type={lihat ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="w-full border rounded-lg pl-9 pr-10 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <button type="button" onClick={() => setLihat(!lihat)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600" aria-label="Tampilkan sandi"><i className={`fas ${lihat ? 'fa-eye-slash' : 'fa-eye'}`}></i></button></div>
          </div>
          {galat && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3"><i className="fas fa-exclamation-circle mr-1"></i>{galat}</div>}
          <button type="submit" disabled={proses} className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold p-3 rounded-lg shadow transition-colors">
            {proses ? <><i className="fas fa-circle-notch fa-spin mr-2"></i>Memeriksa…</> : 'Masuk'}
          </button>
        </form>
        <p className="text-[11px] text-center text-gray-400">Lupa kata sandi? Hubungi admin sekolah.</p>
      </div>
    </div>
  );
};

const AuthGate = () => {
  const [user, setUser] = useState(() => muatSesi());
  useEffect(() => { if (window.simSplash) window.simSplash.selesai(); }, []);          // tampilan pertama sudah siap → tutup layar pembuka
  useEffect(() => {
    const habis = () => { hapusSesi(); setUser(null); showAlert('Sesi berakhir, silakan login kembali.', 'info'); };
    window.addEventListener('sim-logout', habis);
    return () => window.removeEventListener('sim-logout', habis);
  }, []);
  const keluar = () => { hapusSesi(); setUser(null); };
  if (!user) return <LoginScreen onLogin={setUser} />;
  return <DBProvider key={user.username}><App onKeluar={keluar} /></DBProvider>;
};

// ---------------------------------------------------------------------------
const GantiSandiModal = ({ buka, tutup, onSelesai }) => {
  const [f, setF] = useState({ lama: '', baru: '', ulang: '' });
  const [proses, jalankan] = useAksi();
  const kirim = (e) => {
    e.preventDefault();
    if (f.baru !== f.ulang) return showAlert('Kata sandi baru dan pengulangannya tidak sama.', 'error');
    jalankan(async () => {
      await apiPanggil('gantiSandi', { lama: f.lama, baru: f.baru });
      showAlert('Kata sandi diganti. Silakan login kembali.');
      setF({ lama: '', baru: '', ulang: '' });
      onSelesai();
    });
  };
  const inp = 'w-full border p-2 rounded mt-1 text-sm';
  return (
    <Modal isOpen={buka} onClose={tutup} title="Ganti Kata Sandi">
      <form onSubmit={kirim} className="space-y-3">
        <div><label className="text-xs font-semibold text-gray-600">Kata sandi lama</label><input type="password" required value={f.lama} onChange={(e) => setF({ ...f, lama: e.target.value })} className={inp} autoComplete="current-password" /></div>
        <div><label className="text-xs font-semibold text-gray-600">Kata sandi baru (min. 8 karakter, huruf + angka)</label><input type="password" required value={f.baru} onChange={(e) => setF({ ...f, baru: e.target.value })} className={inp} autoComplete="new-password" /></div>
        <div><label className="text-xs font-semibold text-gray-600">Ulangi kata sandi baru</label><input type="password" required value={f.ulang} onChange={(e) => setF({ ...f, ulang: e.target.value })} className={inp} autoComplete="new-password" /></div>
        <button type="submit" disabled={proses} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white p-2.5 rounded font-bold">Simpan Kata Sandi</button>
      </form>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
const salinTeks = (teks) => {
  try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(teks).then(() => showAlert('Disalin ke papan klip.')); return; } } catch (e) { /* lanjut ke cadangan */ }
  const ta = document.createElement('textarea'); ta.value = teks; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); showAlert('Disalin ke papan klip.'); } catch (e) { showAlert('Salin manual: blok teks lalu Ctrl+C.', 'info'); }
  document.body.removeChild(ta);
};

const ManajemenPengguna = () => {
  const DB = useDB();
  const guruList = DB.rows('Guru');
  const siswaList = DB.rows('Siswa');
  const [daftar, setDaftar] = useState(null);
  const [proses, jalankan] = useAksi();
  const [modal, setModal] = useState(false);
  const KOSONG = { id: '', username: '', nama: '', role: 'guru', guruNama: '', anak: [], aktif: 'Ya', password: '' };
  const [form, setForm] = useState(KOSONG);
  const [cariAnak, setCariAnak] = useState('');
  const [rahasia, setRahasia] = useState(null);       // { judul, baris: [{...}] }  (sandi tampil sekali)

  const muat = () => apiPanggil('listPengguna').then((r) => setDaftar(r.data)).catch((e) => showAlert('Gagal memuat pengguna: ' + e.message, 'error'));
  useEffect(() => { muat(); }, []);

  const namaAnak = (nisns) => (nisns || []).map((n) => { const s = siswaList.find((x) => x.nisn === n); return s ? s.nama : n; }).join(', ');
  const buka = (u) => { setForm(u ? { ...KOSONG, ...u, password: '' } : KOSONG); setCariAnak(''); setModal(true); };
  const ubah = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleAnak = (nisn) => setForm({ ...form, anak: form.anak.includes(nisn) ? form.anak.filter((n) => n !== nisn) : [...form.anak, nisn] });

  const simpan = (e) => {
    e.preventDefault();
    jalankan(async () => {
      const res = await apiPanggil('savePengguna', { data: form });
      setModal(false); await muat();
      if (res.data.sandiBaru) setRahasia({ judul: 'Akun dibuat — catat kata sandi sekarang', baris: [{ username: res.data.pengguna.username, sandi: res.data.sandiBaru, siswa: res.data.pengguna.nama, kelas: NAMA_ROLE[res.data.pengguna.role] }] });
      else showAlert(res.message);
    });
  };
  const reset = (u) => { if (confirm(`Reset kata sandi ${u.username}? Sesi login pengguna ini akan dicabut.`)) jalankan(async () => { const res = await apiPanggil('resetSandi', { id: u.id }); setRahasia({ judul: 'Kata sandi baru — catat sekarang', baris: [{ username: res.data.username, sandi: res.data.sandiBaru, siswa: u.nama, kelas: NAMA_ROLE[u.role] }] }); }); };
  const hapus = (u) => { if (confirm(`Hapus akun ${u.username}?`)) jalankan(async () => { await apiPanggil('hapusPengguna', { id: u.id }); await muat(); showAlert('Akun dihapus.'); }); };
  const massal = () => {
    if (!confirm('Buat akun orang tua otomatis untuk semua siswa aktif yang belum punya akun?\nProses bisa memakan waktu 1–2 menit untuk banyak siswa. Jangan tutup halaman.')) return;
    jalankan(async () => {
      const res = await apiPanggil('buatAkunOrtuMassal');
      await muat();
      if (!res.data.length) return showAlert('Semua siswa aktif sudah memiliki akun orang tua.', 'info');
      setRahasia({ judul: `${res.data.length} akun orang tua dibuat — simpan/cetak daftar ini sekarang`, baris: res.data });
    });
  };

  const teksDaftar = rahasia ? ['Nama Pengguna\tKata Sandi\tNama\tKeterangan'].concat(rahasia.baris.map((b) => `${b.username}\t${b.sandi}\t${b.siswa}\t${b.kelas || ''}`)).join('\n') : '';
  const unduhCSV = () => {
    const csv = ['username,sandi,nama,keterangan'].concat(rahasia.baris.map((b) => [b.username, b.sandi, b.siswa, b.kelas || ''].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'akun-baru.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  const inp = 'w-full border p-2 rounded mt-1 text-sm';
  const anakTersaring = siswaList.filter((s) => !cariAnak || s.nama.toLowerCase().includes(cariAnak.toLowerCase()) || s.nisn.includes(cariAnak)).slice(0, 60);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3 justify-between items-center no-print">
        <div><h3 className="font-bold text-gray-700">Manajemen Pengguna & Hak Akses</h3><p className="text-xs text-gray-500">Admin dan Kepala Sekolah dapat mengelola semua akun.</p></div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={massal} disabled={proses} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-3.5 py-2 rounded text-xs font-bold"><i className="fas fa-users-cog mr-1"></i> Buat Akun Orang Tua Otomatis</button>
          <button onClick={() => buka(null)} className="bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded text-xs font-bold"><i className="fas fa-user-plus mr-1"></i> Tambah Pengguna</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        {!daftar ? <KosongInfo teks="Memuat pengguna…" /> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b"><tr><th className="p-3">Nama Pengguna</th><th className="p-3">Nama</th><th className="p-3">Role</th><th className="p-3">Terkait</th><th className="p-3">Status</th><th className="p-3">Login Terakhir</th><th className="p-3 text-center">Aksi</th></tr></thead>
            <tbody className="divide-y">
              {daftar.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{u.username}</td><td className="p-3 font-semibold">{u.nama}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${WARNA_ROLE[u.role]}`}>{NAMA_ROLE[u.role]}</span></td>
                  <td className="p-3 text-xs text-gray-600 max-w-[220px] truncate" title={u.role === 'guru' ? u.guruNama : namaAnak(u.anak)}>{u.role === 'guru' ? u.guruNama : u.role === 'orangtua' ? namaAnak(u.anak) : '-'}</td>
                  <td className="p-3">{u.aktif === 'Ya' ? <span className="text-xs text-green-700 font-semibold">Aktif</span> : <span className="text-xs text-red-600 font-semibold">Nonaktif</span>}</td>
                  <td className="p-3 text-xs text-gray-500">{u.terakhirLogin || '-'}</td>
                  <td className="p-3"><div className="flex justify-center gap-1.5">
                    <button onClick={() => buka(u)} className="text-yellow-600 border border-yellow-200 px-2 py-1 rounded text-xs hover:bg-yellow-50" title="Ubah"><i className="fas fa-edit"></i></button>
                    <button onClick={() => reset(u)} className="text-blue-600 border border-blue-200 px-2 py-1 rounded text-xs hover:bg-blue-50" title="Reset kata sandi"><i className="fas fa-key"></i></button>
                    <button onClick={() => hapus(u)} className="text-red-600 border border-red-200 px-2 py-1 rounded text-xs hover:bg-red-50" title="Hapus"><i className="fas fa-trash"></i></button>
                  </div></td>
                </tr>
              ))}
              {daftar.length === 0 && <tr><td colSpan="7"><KosongInfo teks="Belum ada pengguna." /></td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={form.id ? 'Ubah Pengguna' : 'Tambah Pengguna'} size="max-w-lg">
        <form onSubmit={simpan} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600">Nama Pengguna</label><input required value={form.username} onChange={ubah('username')} readOnly={!!form.id} placeholder="huruf kecil/angka" className={inp + ' read-only:bg-gray-100'} /></div>
            <div><label className="text-xs font-semibold text-gray-600">Nama Lengkap</label><input required value={form.nama} onChange={ubah('nama')} className={inp} /></div>
            <div><label className="text-xs font-semibold text-gray-600">Role</label>
              <select value={form.role} onChange={ubah('role')} className={inp + ' bg-white'}>{Object.keys(NAMA_ROLE).map((r) => <option key={r} value={r}>{NAMA_ROLE[r]}</option>)}</select></div>
            <div><label className="text-xs font-semibold text-gray-600">Status</label>
              <select value={form.aktif} onChange={ubah('aktif')} className={inp + ' bg-white'}><option value="Ya">Aktif</option><option value="Tidak">Nonaktif</option></select></div>
          </div>
          {form.role === 'guru' && (
            <div><label className="text-xs font-semibold text-gray-600">Tautkan ke Data Guru (menentukan kelas yang diampu sebagai wali kelas)</label>
              <select required value={form.guruNama} onChange={ubah('guruNama')} className={inp + ' bg-white'}><option value="">-- Pilih guru --</option>{guruList.map((g) => <option key={g.id} value={g.nama}>{g.nama}</option>)}</select></div>
          )}
          {form.role === 'orangtua' && (
            <div><label className="text-xs font-semibold text-gray-600">Anak ({form.anak.length} dipilih)</label>
              <input value={cariAnak} onChange={(e) => setCariAnak(e.target.value)} placeholder="Cari nama / NISN…" className={inp} />
              <div className="border rounded mt-1 max-h-40 overflow-y-auto divide-y">
                {anakTersaring.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 p-2 text-sm hover:bg-gray-50 cursor-pointer"><input type="checkbox" checked={form.anak.includes(s.nisn)} onChange={() => toggleAnak(s.nisn)} /><span className="flex-1">{s.nama}</span><span className="text-xs text-gray-400">{s.kelas || '-'}</span></label>
                ))}
              </div></div>
          )}
          <div><label className="text-xs font-semibold text-gray-600">{form.id ? 'Kata sandi baru (kosongkan bila tidak diganti)' : 'Kata sandi (kosongkan = dibuat acak)'}</label>
            <input type="text" value={form.password} onChange={ubah('password')} autoComplete="off" placeholder="min. 8 karakter, huruf + angka" className={inp} /></div>
          <button type="submit" disabled={proses} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white p-2.5 rounded font-bold">{proses ? 'Menyimpan…' : 'Simpan'}</button>
        </form>
      </Modal>

      <Modal isOpen={!!rahasia} onClose={() => setRahasia(null)} title={rahasia ? rahasia.judul : ''} size="max-w-3xl">
        {rahasia && (
          <div className="space-y-3">
            <p className="text-xs text-red-600 font-semibold"><i className="fas fa-exclamation-triangle mr-1"></i>Kata sandi hanya ditampilkan SEKARANG dan tidak tersimpan dalam bentuk terbaca. Salin, unduh, atau cetak sebelum menutup.</p>
            <div id="printable-a4-area" className="max-h-72 overflow-y-auto border rounded">
              <table className="w-full text-xs text-left"><thead className="bg-gray-50 sticky top-0"><tr><th className="p-2">Nama Pengguna</th><th className="p-2">Kata Sandi</th><th className="p-2">Nama</th><th className="p-2">Keterangan</th></tr></thead>
                <tbody className="divide-y">{rahasia.baris.map((b, i) => <tr key={i}><td className="p-2 font-mono">{b.username}</td><td className="p-2 font-mono font-bold">{b.sandi}</td><td className="p-2">{b.siswa}</td><td className="p-2">{b.kelas}</td></tr>)}</tbody></table>
            </div>
            <div className="flex flex-wrap gap-2 justify-end no-print">
              <button onClick={() => salinTeks(teksDaftar)} className="bg-gray-700 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-copy mr-1"></i> Salin</button>
              <button onClick={unduhCSV} className="bg-blue-600 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-file-csv mr-1"></i> Unduh CSV</button>
              <button onClick={() => window.print()} className="bg-green-600 text-white px-3 py-2 rounded text-xs font-bold"><i className="fas fa-print mr-1"></i> Cetak</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
