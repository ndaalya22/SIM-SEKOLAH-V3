// Peran yang boleh membuka tiap menu (dicek juga di server — ini hanya untuk tampilan)
const SEMUA = ['admin', 'kepsek', 'guru', 'bendahara', 'orangtua'];
const PENGELOLA = ['admin', 'kepsek'];

const MENU = [
  { id: 'dashboard', label: 'Dashboard', ikon: 'fa-tachometer-alt', judul: 'Dashboard Utama', Komponen: DashboardUtama, peran: ['admin', 'kepsek', 'guru', 'bendahara'] },
  { id: 'informasi', label: 'Pusat Informasi', ikon: 'fa-bullhorn', judul: 'Pusat Informasi & Pengumuman', Komponen: PusatInformasi, peran: SEMUA },
  { id: 'agenda', label: 'Agenda Kegiatan', ikon: 'fa-calendar-alt', judul: 'Agenda Kegiatan Sekolah', Komponen: AgendaKegiatan, peran: SEMUA },
  { id: 'prestasi', label: 'Prestasi Siswa', ikon: 'fa-trophy', judul: 'Prestasi Siswa', Komponen: PrestasiSiswa, peran: SEMUA },
  { id: 'absensi', label: 'Absensi QR / Manual', ikon: 'fa-camera', judul: 'Absensi Siswa', Komponen: AbsensiWebcam, peran: ['admin', 'kepsek', 'guru', 'bendahara'] },
  { id: 'absensiguru', label: 'Absensi Guru', ikon: 'fa-user-clock', judul: 'Absensi Harian Guru', Komponen: AbsensiGuru, peran: ['admin', 'kepsek', 'guru'] },
  { id: 'kartuqr', label: 'Kartu QR Absensi', ikon: 'fa-qrcode', judul: 'Kartu QR Siswa & Guru', Komponen: KartuQR, peran: PENGELOLA },
  { id: 'surat', label: 'Manajemen Surat', ikon: 'fa-envelope-open-text', judul: 'Manajemen Surat Masuk & Keluar', Komponen: ManajemenSurat, peran: PENGELOLA },
  { id: 'keuangan', label: 'Keuangan Sekolah', ikon: 'fa-money-check-alt', judul: 'Keuangan Sekolah', Komponen: Keuangan, peran: ['admin', 'kepsek', 'bendahara', 'orangtua'] },
  { grup: 'Akademik & Pengguna', peran: PENGELOLA },
  { id: 'datasiswa', label: 'Data Siswa', ikon: 'fa-user-graduate', judul: 'Data Induk Siswa', Komponen: DataSiswa, peran: PENGELOLA },
  { id: 'naikkelas', label: 'Naik Kelas & Kelulusan', ikon: 'fa-stairs', judul: 'Naik Kelas & Kelulusan Siswa', Komponen: NaikKelasKelulusan, peran: PENGELOLA },
  { id: 'dataguru', label: 'Data Guru', ikon: 'fa-chalkboard-teacher', judul: 'Data Pendidik & Tenaga Kependidikan', Komponen: DataGuru, peran: PENGELOLA },
  { grup: 'Penilaian & Kelulusan', peran: SEMUA },
  { id: 'inputnilai', label: 'Input Nilai Akademik', ikon: 'fa-edit', judul: 'Input Nilai Akademik Siswa', Komponen: InputNilai, peran: ['admin', 'kepsek', 'guru'] },
  { id: 'leger', label: 'Leger Nilai', ikon: 'fa-clipboard-list', judul: 'Leger Nilai Akademik', Komponen: Leger, peran: PENGELOLA },
  { id: 'cetakrapor', label: 'Cetak Rapor', ikon: 'fa-file-alt', judul: 'Pusat Cetak Rapor Resmi', Komponen: CetakRapor, peran: ['admin', 'kepsek', 'orangtua'] },
  { id: 'inputnilaiijazah', label: 'Input Nilai Ijazah', ikon: 'fa-file-signature', judul: 'Input Komponen Nilai Ijazah', Komponen: InputNilaiIjazah, peran: PENGELOLA },
  { id: 'arsipberkas', label: 'Arsip Berkas Lulusan', ikon: 'fa-folder-open', judul: 'Arsip Berkas Lulusan (KK, Akte, Ijazah, SKL, Rapor)', Komponen: ArsipBerkasLulusan, peran: ['admin', 'kepsek', 'orangtua'] },
  { id: 'arsiplulusan', label: 'Arsip & Cetak Ijazah', ikon: 'fa-graduation-cap', judul: 'Arsip Lulusan & Transkrip Ijazah', Komponen: ArsipLulusan, peran: ['admin', 'kepsek', 'orangtua'] },
  { grup: 'Laporan', peran: PENGELOLA },
  { id: 'daftarsatu', label: 'Daftar I (Laporan Bulanan)', ikon: 'fa-file-invoice', judul: 'Daftar I — Laporan Bulanan Sekolah', Komponen: DaftarSatu, peran: PENGELOLA },
  { grup: 'Sistem', peran: PENGELOLA },
  { id: 'pengguna', label: 'Manajemen Pengguna', ikon: 'fa-users-cog', judul: 'Manajemen Pengguna & Hak Akses', Komponen: ManajemenPengguna, peran: PENGELOLA },
  { id: 'pengaturan', label: 'Pengaturan Sistem', ikon: 'fa-cog', judul: 'Pengaturan Sistem Sekolah', Komponen: Pengaturan, peran: PENGELOLA }
];

// Halaman yang memakai kamera TIDAK disimpan di latar (kamera harus mati saat berpindah menu)
const TANPA_KEEP_ALIVE = ['absensi', 'absensiguru'];

const App = ({ onKeluar }) => {
  const DB = useDB();
  const sekolah = DB.pengaturan;
  const role = DB.user.role;

  // Mode scanner (?mode=scanner): hanya pemindai absensi layar penuh
  if (window.APP_MODE === 'scanner') return <><ModeScanner onKeluar={onKeluar} /><EfekLatar /></>;

  const menuTampil = MENU.filter((m) => m.peran.includes(role)).filter((m, i, arr) => !m.grup || (arr[i + 1] && !arr[i + 1].grup));
  const [activeMenu, setActiveMenu] = useState(() => (menuTampil.find((m) => m.id) || {}).id);
  const [menuBuka, setMenuBuka] = useState(() => window.innerWidth >= 768);   // terbuka di layar lebar saat awal; tertutup otomatis setelah memilih fitur
  const [menuUser, setMenuUser] = useState(false);
  const [gantiSandi, setGantiSandi] = useState(false);
  const aktif = menuTampil.find((m) => m.id === activeMenu) || menuTampil.find((m) => m.id);
  const [dikunjungi, setDikunjungi] = useState({});     // halaman yang pernah dibuka tetap hidup (disembunyikan) → pindah menu seketika
  useEffect(() => { setDikunjungi((v) => (v[aktif.id] ? v : { ...v, [aktif.id]: true })); }, [aktif.id]);
  const pilih = (id) => { setActiveMenu(id); setMenuBuka(false); };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {menuBuka && <div className="fixed inset-0 bg-black/40 z-20 md:hidden no-print" onClick={() => setMenuBuka(false)}></div>}

      <aside className={`w-64 bg-green-800 text-white flex-col no-print shadow-xl z-30 h-screen fixed md:sticky top-0 ${menuBuka ? 'flex' : 'hidden'}`}>
        <div className="p-5 flex items-center gap-3 border-b border-green-700">
          <img src={sekolah.logoUrl} alt="Logo" className="w-12 h-12 object-contain bg-white rounded-full p-0.5 shadow-sm" />
          <div><h2 className="font-extrabold text-lg tracking-wide leading-tight">SIM {sekolah.namaSekolah}</h2><p className="text-xs text-green-200">Sistem Informasi Sekolah</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuTampil.map((m, i) => m.grup ? (
            <div key={i} className="pt-2 pb-1"><p className="text-[10px] uppercase text-green-300 font-bold px-2">{m.grup}</p></div>
          ) : (
            <button key={m.id} onClick={() => pilih(m.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-left transition-colors font-medium ${aktif.id === m.id ? 'bg-green-900 border-l-4 border-white' : 'hover:bg-green-700'}`}>
              <i className={`fas ${m.ikon} w-5 text-center`}></i> {m.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-green-700 text-xs text-center text-green-200">Versi 3.0 <br /> &copy; {new Date().getFullYear()} {sekolah.namaSekolah}</div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center no-print sticky top-0 z-10 border-b">
          <h2 className="font-bold text-gray-700 text-base md:text-lg flex items-center min-w-0">
            <button onClick={() => setMenuBuka(!menuBuka)} className="mr-4 text-green-700 hover:text-green-900" aria-label={menuBuka ? 'Sembunyikan menu' : 'Tampilkan menu'} title={menuBuka ? 'Sembunyikan menu' : 'Tampilkan menu'}><i className="fas fa-bars"></i></button>
            <span className="truncate text-green-700 uppercase tracking-wider">{aktif.judul}</span>
          </h2>
          <div className="flex items-center gap-3 relative">
            <button onClick={() => DB.muatUlang()} className="text-gray-500 hover:text-green-700 text-sm" title="Muat ulang data dari database"><i className={`fas fa-sync-alt ${DB.menyegarkan ? 'fa-spin text-green-600' : ''}`}></i></button>
            <button onClick={() => setMenuUser(!menuUser)} className="flex items-center gap-3 text-left">
              <div className="text-right hidden sm:block"><p className="text-sm font-bold text-gray-700 leading-tight">{DB.user.nama}</p><p className="text-[10px] text-green-600">{NAMA_ROLE[role]}</p></div>
              <div className="w-10 h-10 bg-green-100 border-2 border-green-600 text-green-700 rounded-full flex items-center justify-center font-bold shadow-sm"><i className="fas fa-user-shield"></i></div>
            </button>
            {menuUser && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuUser(false)}></div>
                <div className="absolute right-0 top-12 w-52 bg-white border rounded-lg shadow-xl z-20 overflow-hidden text-sm">
                  <div className="px-4 py-3 border-b bg-gray-50"><p className="font-bold text-gray-700 truncate">{DB.user.nama}</p><p className="text-xs text-gray-500">@{DB.user.username}</p></div>
                  <button onClick={() => { setMenuUser(false); setGantiSandi(true); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50"><i className="fas fa-key w-5 text-gray-400"></i> Ganti Kata Sandi</button>
                  <button onClick={onKeluar} className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600"><i className="fas fa-sign-out-alt w-5"></i> Keluar</button>
                </div>
              </>
            )}
          </div>
        </header>
        <div className="p-4 md:p-6">
          {menuTampil.filter((m) => m.id && (m.id === aktif.id || (dikunjungi[m.id] && !TANPA_KEEP_ALIVE.includes(m.id)))).map((m) => {
            const Halaman = m.Komponen;
            return <div key={m.id} className={m.id === aktif.id ? 'anim-halaman' : 'hidden'}><Halaman /></div>;
          })}
        </div>
      </main>

      <GantiSandiModal buka={gantiSandi} tutup={() => setGantiSandi(false)} onSelesai={onKeluar} />
      <EfekLatar />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<><ToastHost /><AuthGate /></>);
